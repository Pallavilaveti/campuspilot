"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";

type Reminder = {
  id: string;
  title: string;
  date: string;
  time: string;
  note: string;
  createdAt: string;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  date?: string;
  dueDate?: string;
  priority?: "urgent" | "high" | "medium" | "low";
  status?: "pending" | "completed";
  completed?: boolean;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  createdAt?: string;
};

const REMINDER_STORAGE_KEY = "campuspilot_reminders";
const TASK_STORAGE_KEY = "campuspilot_tasks";
const EVENT_STORAGE_KEY = "campuspilot_events";

function parseDate(dateString: string, timeString = ""): Date | null {
  if (!dateString) return null;

  const date = new Date(`${dateString}T${timeString || "00:00"}`);

  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(dateString);

    if (Number.isNaN(fallback.getTime())) {
      return null;
    }

    return fallback;
  }

  return date;
}

function formatDate(dateString: string): string {
  const date = parseDate(dateString);

  if (!date) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDaysRemaining(dateString: string): number | null {
  const date = parseDate(dateString);

  if (!date) return null;

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getTaskDate(task: Task): string {
  return task.deadline || task.dueDate || task.date || "";
}

function getPriorityScore(priority?: Task["priority"]): number {
  switch (priority) {
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function isTaskCompleted(task: Task): boolean {
  return task.status === "completed" || task.completed === true;
}

function getReminderKey(id: string): string {
  return `campuspilot_notified_${id}`;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    if (!requireAuth()) return;

    try {
      const storedReminders = localStorage.getItem(REMINDER_STORAGE_KEY);
      const storedTasks = localStorage.getItem(TASK_STORAGE_KEY);
      const storedEvents = localStorage.getItem(EVENT_STORAGE_KEY);

      if (storedReminders) {
        try {
          const parsed = JSON.parse(storedReminders);

          if (Array.isArray(parsed)) {
            setReminders(parsed);
          }
        } catch (error) {
          console.error("Failed to parse reminders:", error);
        }
      }

      if (storedTasks) {
        try {
          const parsed = JSON.parse(storedTasks);

          if (Array.isArray(parsed)) {
            setTasks(parsed);
          }
        } catch (error) {
          console.error("Failed to parse tasks:", error);
        }
      }

      if (storedEvents) {
        try {
          const parsed = JSON.parse(storedEvents);

          if (Array.isArray(parsed)) {
            setEvents(parsed);
          }
        } catch (error) {
          console.error("Failed to parse events:", error);
        }
      }

      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
      }
    } catch (error) {
      console.error("Failed to load reminder data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    localStorage.setItem(
      REMINDER_STORAGE_KEY,
      JSON.stringify(reminders)
    );
  }, [reminders, loading]);

  const pendingTasks = useMemo(() => {
    return tasks.filter((task) => !isTaskCompleted(task));
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return pendingTasks
      .filter((task) => {
        const taskDate = getTaskDate(task);

        if (!taskDate) return false;

        const days = getDaysRemaining(taskDate);

        return days !== null && days >= 0;
      })
      .sort((a, b) => {
        const dateA = parseDate(getTaskDate(a));
        const dateB = parseDate(getTaskDate(b));

        if (!dateA || !dateB) return 0;

        const dateDifference =
          dateA.getTime() - dateB.getTime();

        if (dateDifference !== 0) {
          return dateDifference;
        }

        return (
          getPriorityScore(b.priority) -
          getPriorityScore(a.priority)
        );
      });
  }, [pendingTasks]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((event) => {
        const eventDate = parseDate(event.date, event.time || "");

        if (!eventDate) return false;

        return eventDate.getTime() >= Date.now();
      })
      .sort((a, b) => {
        const dateA = parseDate(a.date, a.time || "");
        const dateB = parseDate(b.date, b.time || "");

        if (!dateA || !dateB) return 0;

        return dateA.getTime() - dateB.getTime();
      });
  }, [events]);

  const smartSuggestions = useMemo(() => {
    const suggestions: {
      id: string;
      title: string;
      date: string;
      time: string;
      note: string;
      type: "task" | "event";
      priority?: Task["priority"];
    }[] = [];

    upcomingTasks.slice(0, 5).forEach((task) => {
      const taskDate = getTaskDate(task);

      if (!taskDate) return;

      const days = getDaysRemaining(taskDate);

      if (days === null) return;

      let note = "";

      if (days === 0) {
        note = "This task is due today.";
      } else if (days === 1) {
        note = "This task is due tomorrow.";
      } else {
        note = `This task is due in ${days} days.`;
      }

      suggestions.push({
        id: `task-${task.id}`,
        title: task.title,
        date: taskDate,
        time: "09:00",
        note,
        type: "task",
        priority: task.priority,
      });
    });

    upcomingEvents.slice(0, 5).forEach((event) => {
      const eventDate = parseDate(event.date, event.time || "");

      if (!eventDate) return;

      suggestions.push({
        id: `event-${event.id}`,
        title: event.title,
        date: event.date,
        time: event.time || "09:00",
        note: event.location
          ? `Upcoming academic event at ${event.location}.`
          : "Upcoming academic event.",
        type: "event",
      });
    });

    return suggestions.slice(0, 8);
  }, [upcomingTasks, upcomingEvents]);

  function addReminder() {
    if (!title.trim()) {
      alert("Please enter a reminder title.");
      return;
    }

    if (!date) {
      alert("Please select a date.");
      return;
    }

    const newReminder: Reminder = {
      id: `reminder-${Date.now()}`,
      title: title.trim(),
      date,
      time: time || "09:00",
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    setReminders((current) => {
      return [...current, newReminder].sort((a, b) => {
        const dateA = parseDate(a.date, a.time);
        const dateB = parseDate(b.date, b.time);

        if (!dateA || !dateB) return 0;

        return dateA.getTime() - dateB.getTime();
      });
    });

    setTitle("");
    setDate("");
    setTime("");
    setNote("");

    setNotificationMessage("Reminder created successfully.");

    setTimeout(() => {
      setNotificationMessage("");
    }, 3000);
  }

  function addSuggestedReminder(suggestion: {
    id: string;
    title: string;
    date: string;
    time: string;
    note: string;
  }) {
    const alreadyExists = reminders.some(
      (reminder) =>
        reminder.title.toLowerCase() === suggestion.title.toLowerCase() &&
        reminder.date === suggestion.date
    );

    if (alreadyExists) {
      setNotificationMessage("This reminder already exists.");

      setTimeout(() => {
        setNotificationMessage("");
      }, 2500);

      return;
    }

    const newReminder: Reminder = {
      id: `smart-${Date.now()}-${suggestion.id}`,
      title: suggestion.title,
      date: suggestion.date,
      time: suggestion.time,
      note: suggestion.note,
      createdAt: new Date().toISOString(),
    };

    setReminders((current) => {
      return [...current, newReminder].sort((a, b) => {
        const dateA = parseDate(a.date, a.time);
        const dateB = parseDate(b.date, b.time);

        if (!dateA || !dateB) return 0;

        return dateA.getTime() - dateB.getTime();
      });
    });

    setNotificationMessage("Smart reminder added.");

    setTimeout(() => {
      setNotificationMessage("");
    }, 2500);
  }

  function deleteReminder(id: string) {
    setReminders((current) =>
      current.filter((reminder) => reminder.id !== id)
    );

    localStorage.removeItem(getReminderKey(id));
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setNotificationMessage(
        "Browser notifications are not supported in this browser."
      );

      return;
    }

    try {
      const permission = await Notification.requestPermission();

      setNotificationPermission(permission);

      if (permission === "granted") {
        new Notification("CampusPilot Notifications Enabled", {
          body: "You will receive reminder notifications while CampusPilot is open.",
        });

        setNotificationMessage(
          "Notifications enabled successfully."
        );
      } else if (permission === "denied") {
        setNotificationMessage(
          "Notifications were blocked. Enable them from your browser settings."
        );
      } else {
        setNotificationMessage(
          "Notification permission was not granted."
        );
      }

      setTimeout(() => {
        setNotificationMessage("");
      }, 4000);
    } catch (error) {
      console.error("Notification permission error:", error);

      setNotificationMessage(
        "Unable to enable browser notifications."
      );
    }
  }

  useEffect(() => {
    if (loading) return;

    if (!("Notification" in window)) return;

    const checkReminders = () => {
      if (Notification.permission !== "granted") return;

      const now = new Date();

      reminders.forEach((reminder) => {
        const reminderDate = parseDate(
          reminder.date,
          reminder.time
        );

        if (!reminderDate) return;

        const difference =
          now.getTime() - reminderDate.getTime();

        /*
          Trigger notification if the reminder time is:
          - already reached
          - but not more than 2 minutes old
        */
        if (difference >= 0 && difference <= 2 * 60 * 1000) {
          const notificationKey = getReminderKey(reminder.id);

          const alreadyNotified =
            localStorage.getItem(notificationKey);

          if (alreadyNotified) return;

          new Notification(`CampusPilot Reminder: ${reminder.title}`, {
            body:
              reminder.note ||
              `Reminder scheduled for ${formatDate(
                reminder.date
              )} at ${reminder.time}.`,
          });

          localStorage.setItem(notificationKey, "true");
        }
      });
    };

    checkReminders();

    const interval = window.setInterval(
      checkReminders,
      15 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [reminders, loading]);

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const dateA = parseDate(a.date, a.time);
      const dateB = parseDate(b.date, b.time);

      if (!dateA || !dateB) return 0;

      return dateA.getTime() - dateB.getTime();
    });
  }, [reminders]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="text-slate-300">
            Loading reminders...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-block text-sm text-blue-400 hover:text-blue-300"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold">
              Reminders
            </h1>

            <p className="mt-1 text-slate-400">
              Never miss an important academic deadline or event.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`rounded-full border px-4 py-2 text-sm ${
                notificationPermission === "granted"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-700 bg-slate-900 text-slate-300"
              }`}
            >
              {notificationPermission === "granted"
                ? "🔔 Notifications On"
                : "🔕 Notifications Off"}
            </div>
          </div>
        </header>

        {/* Notification message */}
        {notificationMessage && (
          <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            {notificationMessage}
          </div>
        )}

        {/* Notification setup */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Browser Notifications
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                CampusPilot can notify you when a reminder reaches
                its scheduled time while this page is open.
              </p>
            </div>

            <button
              onClick={enableNotifications}
              disabled={notificationPermission === "granted"}
              className={`rounded-xl px-5 py-3 font-medium transition ${
                notificationPermission === "granted"
                  ? "cursor-not-allowed bg-emerald-500/20 text-emerald-300"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {notificationPermission === "granted"
                ? "Notifications Enabled"
                : "Enable Notifications"}
            </button>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Create reminder */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl lg:col-span-1">
            <h2 className="text-xl font-semibold">
              Create Reminder
            </h2>

            <p className="mt-1 mb-6 text-sm text-slate-400">
              Add a custom reminder for anything important.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Reminder Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Submit assignment"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Time
                </label>

                <input
                  type="time"
                  value={time}
                  onChange={(event) =>
                    setTime(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Note
                </label>

                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  placeholder="Optional note..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <button
                onClick={addReminder}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
              >
                + Create Reminder
              </button>
            </div>
          </section>

          {/* Smart suggestions */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Smart Reminder Suggestions
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                CampusPilot automatically finds upcoming tasks and
                academic events that may need reminders.
              </p>
            </div>

            {smartSuggestions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
                <div className="mb-3 text-4xl">✨</div>

                <h3 className="font-semibold text-slate-200">
                  No suggestions right now
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Add tasks or academic events and CampusPilot
                  will suggest reminders automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {smartSuggestions.map((suggestion) => {
                  const days = getDaysRemaining(
                    suggestion.date
                  );

                  return (
                    <div
                      key={suggestion.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-100">
                            {suggestion.title}
                          </h3>

                          <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-300">
                            {suggestion.type === "task"
                              ? "Task"
                              : "Event"}
                          </span>

                          {suggestion.priority && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs capitalize text-amber-300">
                              {suggestion.priority}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          {formatDate(suggestion.date)} ·{" "}
                          {suggestion.time}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {suggestion.note}
                        </p>

                        {days !== null && (
                          <p
                            className={`mt-2 text-xs font-medium ${
                              days === 0
                                ? "text-red-400"
                                : days === 1
                                ? "text-amber-400"
                                : "text-slate-500"
                            }`}
                          >
                            {days === 0
                              ? "Due today"
                              : days === 1
                              ? "Due tomorrow"
                              : `${days} days remaining`}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          addSuggestedReminder(suggestion)
                        }
                        className="shrink-0 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20"
                      >
                        + Add Reminder
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Existing reminders */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Your Reminders
              </h2>

              <p className="text-sm text-slate-400">
                {sortedReminders.length} reminder
                {sortedReminders.length !== 1 ? "s" : ""} scheduled
              </p>
            </div>
          </div>

          {sortedReminders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-10 text-center">
              <div className="mb-3 text-5xl">⏰</div>

              <h3 className="text-lg font-semibold text-slate-200">
                No reminders yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Create your first reminder or use one of the
                smart suggestions above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedReminders.map((reminder) => {
                const days = getDaysRemaining(reminder.date);

                const isToday = days === 0;
                const isTomorrow = days === 1;
                const isPast =
                  days !== null && days < 0;

                return (
                  <div
                    key={reminder.id}
                    className={`rounded-xl border p-5 ${
                      isPast
                        ? "border-red-500/20 bg-red-500/5"
                        : isToday
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-slate-100">
                          {reminder.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2 text-sm">
                          <span className="rounded-lg bg-slate-800 px-2 py-1 text-slate-300">
                            📅 {formatDate(reminder.date)}
                          </span>

                          <span className="rounded-lg bg-slate-800 px-2 py-1 text-slate-300">
                            🕐 {reminder.time}
                          </span>
                        </div>

                        {reminder.note && (
                          <p className="mt-3 text-sm leading-6 text-slate-400">
                            {reminder.note}
                          </p>
                        )}

                        <div className="mt-3">
                          {isPast ? (
                            <span className="text-xs font-medium text-red-400">
                              Reminder time passed
                            </span>
                          ) : isToday ? (
                            <span className="text-xs font-medium text-amber-400">
                              Today
                            </span>
                          ) : isTomorrow ? (
                            <span className="text-xs font-medium text-blue-400">
                              Tomorrow
                            </span>
                          ) : days !== null ? (
                            <span className="text-xs text-slate-500">
                              {days} days remaining
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          deleteReminder(reminder.id)
                        }
                        className="shrink-0 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                        title="Delete reminder"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Navigation */}
        <nav className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/tasks"
              className="rounded-xl px-4 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Tasks
            </Link>

            <Link
              href="/calendar"
              className="rounded-xl px-4 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Calendar
            </Link>
          </div>
        </nav>

        <footer className="mt-8 pb-6 text-center text-xs text-slate-600">
          CampusPilot · Smart Academic Assistant
        </footer>
      </div>
    </main>
  );
}