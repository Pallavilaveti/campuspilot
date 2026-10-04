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

export default function CalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EVENT_STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setEvents(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) {
        return dateA - dateB;
      }

      return a.date.localeCompare(b.date);
    });
  }, [events]);

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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">
            CampusPilot
          </p>

          <h1 className="text-4xl font-bold">
            Academic Calendar
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Keep track of examinations, deadlines,
            academic events, and important dates.
          </p>
        </div>

        {/* Statistics */}
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

        {/* Events */}
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
                Analyze an academic notice to
                automatically create events.
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

                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id)}
                      className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}