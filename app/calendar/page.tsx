"use client";

import { useEffect, useMemo, useState } from "react";

type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  createdAt: string;
};

const EVENT_STORAGE_KEY = "campuspilot_events";

/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

/* =========================================================
   DATE NORMALIZATION
========================================================= */

function normalizeDate(dateString: string) {
  if (!dateString) return "";

  const cleaned = dateString
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .trim();

  const date = new Date(cleaned);

  if (!Number.isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  }

  return normalizeText(dateString);
}

/* =========================================================
   EVENT TYPE DETECTION
========================================================= */

function getEventType(title: string) {
  const value = normalizeText(title);

  /* Examination */
  if (
    value.includes("examination") ||
    value.includes("exam") ||
    value.includes("end semester")
  ) {
    return "EXAM";
  }

  /* Form */
  if (
    value.includes("form") &&
    (value.includes("submit") ||
      value.includes("submission") ||
      value.includes("deadline"))
  ) {
    return "FORM";
  }

  /* Scheduling conflict */
  if (
    value.includes("scheduling conflict") ||
    value.includes("schedule conflict") ||
    value.includes("conflict reporting")
  ) {
    return "CONFLICT";
  }

  /* Generic deadline */
  if (value.includes("deadline")) {
    return "DEADLINE";
  }

  return "OTHER";
}

/* =========================================================
   SEMANTIC EVENT KEY
========================================================= */

function getEventGroupKey(event: EventItem) {
  const date = normalizeDate(event.date);
  const type = getEventType(event.title);

  /*
   * Events with the same date and semantic type
   * are considered candidates for merging.
   */

  return `${date}::${type}`;
}

/* =========================================================
   INFORMATION SCORE
========================================================= */

function getInformationScore(event: EventItem) {
  let score = 0;

  const title = normalizeText(event.title);

  /* More descriptive titles are preferred */
  score += Math.min(title.length, 60) / 10;

  /* Time is valuable */
  if (event.time?.trim()) {
    score += 20;
  }

  /* Location is valuable */
  if (event.location?.trim()) {
    score += 20;
  }

  /* Specific exam information */
  if (
    title.includes("signals and systems") ||
    title.includes("machine learning") ||
    title.includes("artificial intelligence") ||
    title.includes("end semester")
  ) {
    score += 15;
  }

  return score;
}

/* =========================================================
   MERGE TWO EVENTS
========================================================= */

function mergeEvents(
  first: EventItem,
  second: EventItem
): EventItem {
  const firstScore =
    getInformationScore(first);

  const secondScore =
    getInformationScore(second);

  const preferred =
    secondScore > firstScore
      ? second
      : first;

  const other =
    preferred.id === first.id
      ? second
      : first;

  return {
    ...preferred,

    /*
     * Preserve useful information even if
     * the preferred event didn't have it.
     */

    time:
      preferred.time?.trim() ||
      other.time?.trim() ||
      "",

    location:
      preferred.location?.trim() ||
      other.location?.trim() ||
      "",

    createdAt:
      preferred.createdAt ||
      other.createdAt,
  };
}

/* =========================================================
   DEDUPLICATE EVENTS
========================================================= */

function deduplicateEvents(
  events: EventItem[]
) {
  const groups =
    new Map<string, EventItem[]>();

  for (const event of events) {
    const key =
      getEventGroupKey(event);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(event);
  }

  const cleaned: EventItem[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      cleaned.push(group[0]);
      continue;
    }

    /*
     * Merge all semantically similar events.
     */

    let merged = group[0];

    for (let i = 1; i < group.length; i++) {
      merged = mergeEvents(
        merged,
        group[i]
      );
    }

    cleaned.push(merged);
  }

  /*
   * Second pass:
   *
   * Remove generic "Examination Day"
   * if a specific examination event
   * already exists on the same date.
   */

  const finalEvents =
    cleaned.filter((event) => {
      const type =
        getEventType(event.title);

      if (type !== "OTHER") {
        return true;
      }

      const sameDateEvents =
        cleaned.filter(
          (other) =>
            other.id !== event.id &&
            normalizeDate(
              other.date
            ) ===
              normalizeDate(
                event.date
              )
        );

      const hasSpecificExam =
        sameDateEvents.some(
          (other) =>
            getEventType(
              other.title
            ) === "EXAM"
        );

      const normalizedTitle =
        normalizeText(
          event.title
        );

      /*
       * Generic examination day is
       * unnecessary when a specific
       * examination exists.
       */

      if (
        hasSpecificExam &&
        (normalizedTitle.includes(
          "examination day"
        ) ||
          normalizedTitle ===
            "exam day")
      ) {
        return false;
      }

      return true;
    });

  return finalEvents;
}

/* =========================================================
   DATE SORTING
========================================================= */

function getDateValue(
  dateString: string
) {
  const cleaned = dateString
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .trim();

  const date =
    new Date(cleaned);

  if (!Number.isNaN(date.getTime())) {
    return date.getTime();
  }

  return Number.MAX_SAFE_INTEGER;
}

/* =========================================================
   CALENDAR PAGE
========================================================= */

export default function CalendarPage() {
  const [events, setEvents] =
    useState<EventItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [cleanedCount, setCleanedCount] =
    useState(0);

  /* =======================================================
     LOAD + CLEAN EVENTS
  ======================================================= */

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          EVENT_STORAGE_KEY
        );

      if (!stored) {
        setEvents([]);
        return;
      }

      const parsed =
        JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        setEvents([]);
        return;
      }

      /*
       * Automatically clean duplicate
       * and semantically similar events.
       */

      const cleaned =
        deduplicateEvents(parsed);

      const removed =
        parsed.length -
        cleaned.length;

      if (removed > 0) {
        console.log(
          `CampusPilot cleaned ${removed} duplicate calendar event(s).`
        );

        localStorage.setItem(
          EVENT_STORAGE_KEY,
          JSON.stringify(cleaned)
        );

        setCleanedCount(removed);
      }

      setEvents(cleaned);
    } catch (error) {
      console.error(
        "Failed to load events:",
        error
      );

      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================================================
     DELETE EVENT
  ======================================================= */

  function deleteEvent(id: string) {
    const updatedEvents =
      events.filter(
        (event) =>
          event.id !== id
      );

    setEvents(updatedEvents);

    localStorage.setItem(
      EVENT_STORAGE_KEY,
      JSON.stringify(
        updatedEvents
      )
    );
  }

  /* =======================================================
     SORT EVENTS
  ======================================================= */

  const sortedEvents =
    useMemo(() => {
      return [...events].sort(
        (a, b) => {
          const dateA =
            getDateValue(a.date);

          const dateB =
            getDateValue(b.date);

          if (
            dateA !==
            Number.MAX_SAFE_INTEGER &&
            dateB !==
            Number.MAX_SAFE_INTEGER
          ) {
            return dateA - dateB;
          }

          return a.date.localeCompare(
            b.date
          );
        }
      );
    }, [events]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-400">
            Loading calendar...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">

      <div className="mx-auto max-w-6xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-10">

          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">
            CampusPilot
          </p>

          <h1 className="text-4xl font-bold">
            Academic Calendar
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Keep track of examinations,
            deadlines, academic events,
            and important dates.
          </p>

        </div>

        {/* =================================================
            CLEANUP MESSAGE
        ================================================= */}

        {cleanedCount > 0 && (
          <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">

            <p className="text-sm font-semibold text-blue-300">
              🧹 CampusPilot cleaned{" "}
              {cleanedCount} duplicate{" "}
              {cleanedCount === 1
                ? "event"
                : "events"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Similar academic events were
              automatically merged to keep
              your calendar organized.
            </p>

          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-8 grid gap-4 md:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <p className="text-sm text-slate-400">
              Total Events
            </p>

            <p className="mt-2 text-3xl font-bold">
              {events.length}
            </p>

          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

            <p className="text-sm text-blue-300">
              Academic Events
            </p>

            <p className="mt-2 text-3xl font-bold">
              {events.length}
            </p>

          </div>

        </div>

        {/* =================================================
            EVENTS
        ================================================= */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <h2 className="text-xl font-semibold">
              📅 Upcoming Academic Events
            </h2>

            <a
              href="/upload"
              className="text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              Analyze another notice →
            </a>

          </div>

          {sortedEvents.length === 0 ? (

            <div className="mt-5 rounded-xl bg-slate-950 p-10 text-center">

              <p className="text-slate-400">
                📅 No events yet.
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Analyze an academic notice
                to automatically create
                events.
              </p>

              <a
                href="/upload"
                className="mt-5 inline-block rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Analyze Notice
              </a>

            </div>

          ) : (

            <div className="mt-5 space-y-4">

              {sortedEvents.map(
                (event) => (

                  <div
                    key={event.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                  >

                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                      <div className="flex gap-4">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                          📅
                        </div>

                        <div>

                          <h3 className="text-lg font-semibold">
                            {event.title}
                          </h3>

                          <p className="mt-2 text-blue-400">
                            {event.date}
                          </p>

                          {event.time && (
                            <p className="mt-1 text-sm text-slate-400">
                              🕐 {event.time}
                            </p>
                          )}

                          {event.location && (
                            <p className="mt-1 text-sm text-slate-400">
                              📍 {event.location}
                            </p>
                          )}

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteEvent(
                            event.id
                          )
                        }
                        className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}