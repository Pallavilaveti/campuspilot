"use client";

import { useEffect, useState } from "react";

type Reminder = {
  id: string;
  title: string;
  date: string;
  time: string;
  note: string;
  createdAt: string;
};

const REMINDER_STORAGE_KEY = "campuspilot_reminders";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        REMINDER_STORAGE_KEY
      );

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setReminders(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load reminders:",
        error
      );
    }
  }, []);

  function saveReminders(updated: Reminder[]) {
    setReminders(updated);

    localStorage.setItem(
      REMINDER_STORAGE_KEY,
      JSON.stringify(updated)
    );
  }

  function addReminder() {
    if (!title.trim() || !date || !time) {
      alert(
        "Please enter reminder title, date and time."
      );
      return;
    }

    const reminder: Reminder = {
      id: crypto.randomUUID(),
      title: title.trim(),
      date,
      time,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    saveReminders([
      ...reminders,
      reminder,
    ]);

    setTitle("");
    setDate("");
    setTime("");
    setNote("");
    setShowForm(false);
  }

  function deleteReminder(id: string) {
    const updated = reminders.filter(
      (reminder) => reminder.id !== id
    );

    saveReminders(updated);
  }

  const sortedReminders = [...reminders].sort(
    (a, b) => {
      const dateA = new Date(
        `${a.date}T${a.time}`
      ).getTime();

      const dateB = new Date(
        `${b.date}T${b.time}`
      ).getTime();

      return dateA - dateB;
    }
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">
            CampusPilot
          </p>

          <h1 className="text-4xl font-bold">
            Reminders
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Create and manage reminders for important
            academic activities.
          </p>
        </div>

        {/* Create Reminder */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                🔔 Create Reminder
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Never forget an important academic deadline.
              </p>
            </div>

            <button
              onClick={() =>
                setShowForm(!showForm)
              }
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold hover:bg-blue-400"
            >
              {showForm
                ? "Cancel"
                : "+ Add Reminder"}
            </button>
          </div>

          {showForm && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">

              <div className="space-y-4">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Reminder Title
                  </label>

                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    placeholder="e.g. Revise Signals and Systems"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Date
                    </label>

                    <input
                      type="date"
                      value={date}
                      onChange={(e) =>
                        setDate(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Time
                    </label>

                    <input
                      type="time"
                      value={time}
                      onChange={(e) =>
                        setTime(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Note
                  </label>

                  <textarea
                    value={note}
                    onChange={(e) =>
                      setNote(e.target.value)
                    }
                    placeholder="Optional note..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={addReminder}
                  className="w-full rounded-xl bg-blue-500 px-5 py-3 font-semibold hover:bg-blue-400"
                >
                  🔔 Save Reminder
                </button>

              </div>
            </div>
          )}
        </section>

        {/* Reminders */}
        <section className="mt-8">

          <h2 className="mb-4 text-xl font-semibold">
            📋 Your Reminders
          </h2>

          {sortedReminders.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">

              <div className="text-4xl">
                🔔
              </div>

              <h3 className="mt-3 text-lg font-semibold">
                No reminders yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Create a reminder for an upcoming
                academic task.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {sortedReminders.map(
                (reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                          🔔
                        </div>

                        <div>
                          <h3 className="font-semibold">
                            {reminder.title}
                          </h3>

                          <p className="mt-2 text-sm text-blue-400">
                            📅 {reminder.date}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            🕐 {reminder.time}
                          </p>

                          {reminder.note && (
                            <p className="mt-2 text-sm text-slate-500">
                              {reminder.note}
                            </p>
                          )}
                        </div>

                      </div>

                      <button
                        onClick={() =>
                          deleteReminder(
                            reminder.id
                          )
                        }
                        className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20"
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

        {/* Navigation */}
        <div className="mt-10 flex flex-wrap gap-3">

          <a
            href="/"
            className="rounded-xl border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            ← Dashboard
          </a>

          <a
            href="/tasks"
            className="rounded-xl border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            🎯 Tasks
          </a>

          <a
            href="/calendar"
            className="rounded-xl border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            📅 Calendar
          </a>

        </div>

      </div>
    </main>
  );
}