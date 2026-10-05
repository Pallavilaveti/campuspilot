"use client";

import { useEffect, useMemo, useState } from "react";
import { requireAuth } from "@/lib/auth";

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
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  return normalizeText(dateString);
}

/* =========================================================
   EVENT TYPE DETECTION
========================================================= */

function getEventType(title: string) {
  const value = normalizeText(title);

  if (
    value.includes("examination") ||
    value.includes("exam") ||
    value.includes("end semester")
  ) {
    return "EXAM";
  }

  if (
    value.includes("form") &&
    (value.includes("submit") ||
      value.includes("submission") ||
      value.includes("deadline"))
  ) {
    return "FORM";
  }

  if (
    value.includes("scheduling conflict") ||
    value.includes("schedule conflict") ||
    value.includes("conflict reporting")
  ) {
    return "CONFLICT";
  }

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

  return `${date}::${type}`;
}

/* =========================================================
   INFORMATION SCORE
========================================================= */

function getInformationScore(event: EventItem) {
  let score = 0;

  const title = normalizeText(event.title);

  score += Math.min(title.length, 60) / 10;

  if (event.time?.trim()) {
    score += 20;
  }

  if (event.location?.trim()) {
    score += 20;
  }

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

function mergeEvents(first: EventItem, second: EventItem): EventItem {
  const firstScore = getInformationScore(first);
  const secondScore = getInformationScore(second);

  const preferred = secondScore > firstScore ? second : first;

  const other = preferred.id === first.id ? second : first;

  return {
    ...preferred,
    time: preferred.time?.trim() || other.time?.trim() || "",
    location:
      preferred.location?.trim() || other.location?.trim() || "",
    createdAt: preferred.createdAt || other.createdAt,
  };
}

/* =========================================================
   DEDUPLICATE EVENTS
========================================================= */

function deduplicateEvents(events: EventItem[]) {
  const groups = new Map<string, EventItem[]>();

  for (const event of events) {
    const key = getEventGroupKey(event);

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

    let merged = group[0];

    for (let i = 1; i < group.length; i++) {
      merged = mergeEvents(merged, group[i]);
    }

    cleaned.push(merged);
  }

  const finalEvents = cleaned.filter((event) => {
    const type = getEventType(event.title);

    if (type !== "OTHER") {
      return true;
    }

    const sameDateEvents = cleaned.filter(
      (other) =>
        other.id !== event.id &&
        normalizeDate(other.date) === normalizeDate(event.date)
    );

    const hasSpecificExam = sameDateEvents.some(
      (other) => getEventType(other.title) === "EXAM"
    );

    const normalizedTitle = normalizeText(event.title);

    if (
      hasSpecificExam &&
      (normalizedTitle.includes("examination day") ||
        normalizedTitle === "exam day")
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

function getDateValue(dateString: string) {
  const cleaned = dateString
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .trim();

  const date = new Date(cleaned);

  if (!Number.isNaN(date.getTime())) {
    return date.getTime();
  }

  return Number.MAX_SAFE_INTEGER;
}

/* =========================================================
   ICS / ADD TO CALENDAR
========================================================= */

function escapeICS(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function parseTimeTo24Hour(time: string) {
  const match = time.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)/i
  );

  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return { hour, minute };
}

function formatICSDate(dateString: string) {
  const cleaned = dateString
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .trim();

  const date = new Date(cleaned);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function toICSDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
) {
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(
    2,
    "0"
  )}T${String(hour).padStart(2, "0")}${String(minute).padStart(
    2,
    "0"
  )}00`;
}

function createCalendarFile(event: EventItem) {
  const parsedDate = formatICSDate(event.date);

  if (!parsedDate) {
    alert("Unable to understand this event date.");
    return;
  }

  const { year, month, day } = parsedDate;
  const datePart = `${year}${String(month).padStart(2, "0")}${String(
    day
  ).padStart(2, "0")}`;

  const parsedStartTime = parseTimeTo24Hour(event.time || "");

  let startLine: string;
  let endLine: string;

  if (parsedStartTime) {
    startLine = `DTSTART:${toICSDateTime(
      year,
      month,
      day,
      parsedStartTime.hour,
      parsedStartTime.minute
    )}`;

    const endMatch = (event.time || "").match(
      /(?:to|-|–|—)\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );

    if (endMatch) {
      let endHour = Number(endMatch[1]);
      const endMinute = Number(endMatch[2]);
      const endPeriod = endMatch[3].toUpperCase();

      if (endPeriod === "PM" && endHour !== 12) {
        endHour += 12;
      }

      if (endPeriod === "AM" && endHour === 12) {
        endHour = 0;
      }

      endLine = `DTEND:${toICSDateTime(
        year,
        month,
        day,
        endHour,
        endMinute
      )}`;
    } else {
      const endDate = new Date(
        year,
        month - 1,
        day,
        parsedStartTime.hour,
        parsedStartTime.minute
      );

      endDate.setHours(endDate.getHours() + 1);

      endLine = `DTEND:${toICSDateTime(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes()
      )}`;
    }
  } else {
    startLine = `DTSTART;VALUE=DATE:${datePart}`;

    const nextDay = new Date(year, month - 1, day);
    nextDay.setDate(nextDay.getDate() + 1);

    const endDatePart = `${nextDay.getFullYear()}${String(
      nextDay.getMonth() + 1
    ).padStart(2, "0")}${String(nextDay.getDate()).padStart(2, "0")}`;

    endLine = `DTEND;VALUE=DATE:${endDatePart}`;
  }

  const now = new Date();
  const dtstamp =
    now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const uid = `${event.id}@campuspilot`;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusPilot//Academic Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeICS(uid)}`,
    `DTSTAMP:${dtstamp}`,
    startLine,
    endLine,
    `SUMMARY:${escapeICS(event.title)}`,
    event.location
      ? `LOCATION:${escapeICS(event.location)}`
      : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([icsContent], {
    type: "text/calendar;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${event.title
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")}.ics`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* =========================================================
   CALENDAR PAGE
========================================================= */

export default function CalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanedCount, setCleanedCount] = useState(0);

  /* =======================================================
     LOAD + CLEAN EVENTS
  ======================================================= */

  useEffect(() => {
    if (!requireAuth()) return;

    try {
      const stored = localStorage.getItem(EVENT_STORAGE_KEY);

      if (!stored) {
        setEvents([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        setEvents([]);
        return;
      }

      const cleaned = deduplicateEvents(parsed);
      const removed = parsed.length - cleaned.length;

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
      console.error("Failed to load events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================================================
     DELETE EVENT
  ======================================================= */

  function deleteEvent(id: string) {
    const updatedEvents = events.filter(
      (event) => event.id !== id
    );

    setEvents(updatedEvents);

    localStorage.setItem(
      EVENT_STORAGE_KEY,
      JSON.stringify(updatedEvents)
    );
  }

  /* =======================================================
     SORT EVENTS
  ======================================================= */

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = getDateValue(a.date);
      const dateB = getDateValue(b.date);

      if (
        dateA !== Number.MAX_SAFE_INTEGER &&
        dateB !== Number.MAX_SAFE_INTEGER
      ) {
        return dateA - dateB;
      }

      return a.date.localeCompare(b.date);
    });
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
        {/* HEADER */}

        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">
            CampusPilot
          </p>

          <h1 className="text-4xl font-bold">
            Academic Calendar
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Keep track of examinations, deadlines, academic
            events, and important dates.
          </p>
        </div>

        {/* CLEANUP MESSAGE */}

        {cleanedCount > 0 && (
          <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-semibold text-blue-300">
              🧹 CampusPilot cleaned {cleanedCount} duplicate{" "}
              {cleanedCount === 1 ? "event" : "events"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Similar academic events were automatically merged
              to keep your calendar organized.
            </p>
          </div>
        )}

        {/* STATISTICS */}

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

        {/* EVENTS */}

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
                Analyze an academic notice to automatically
                create events.
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
              {sortedEvents.map((event) => (
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

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          createCalendarFile(event)
                        }
                        className="rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
                      >
                        📅 Add to Calendar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteEvent(event.id)
                        }
                        className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER NAVIGATION */}

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900"
          >
            ← Dashboard
          </a>

          <a
            href="/tasks"
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900"
          >
            🎯 Task Management
          </a>

          <a
            href="/reminders"
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900"
          >
            🔔 Reminders
          </a>
        </div>
      </div>
    </main>
  );
}
