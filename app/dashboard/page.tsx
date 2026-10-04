"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  title: string;
  deadline: string;
  priority: string;
  reason: string;
  status: "PENDING" | "COMPLETED";
  createdAt: string;
};

type CalendarEvent = {
  id?: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  type?: string;
};

const TASK_STORAGE_KEY = "campuspilot_tasks";
const CALENDAR_STORAGE_KEY = "campuspilot_calendar_events";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  function loadDashboardData() {
    try {
      const storedTasks = localStorage.getItem(TASK_STORAGE_KEY);
      const storedEvents = localStorage.getItem(
        CALENDAR_STORAGE_KEY
      );

      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }

      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
    } catch (error) {
      console.error(
        "Failed to load dashboard data:",
        error
      );
    }
  }

  const pendingTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "PENDING"
      ),
    [tasks]
  );

  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "COMPLETED"
      ),
    [tasks]
  );

  const urgentTasks = useMemo(
    () =>
      pendingTasks.filter(
        (task) =>
          task.priority.toUpperCase() === "URGENT"
      ),
    [pendingTasks]
  );

  const highPriorityTasks = useMemo(
    () =>
      pendingTasks.filter(
        (task) =>
          task.priority.toUpperCase() === "HIGH"
      ),
    [pendingTasks]
  );

  const upcomingTasks = useMemo(() => {
    return [...pendingTasks]
      .filter((task) => task.deadline)
      .sort(
        (a, b) =>
          new Date(a.deadline).getTime() -
          new Date(b.deadline).getTime()
      )
      .slice(0, 5);
  }, [pendingTasks]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      )
      .slice(0, 5);
  }, [events]);

  const nextAction = useMemo(() => {
    if (urgentTasks.length > 0) {
      return urgentTasks[0];
    }

    if (highPriorityTasks.length > 0) {
      return highPriorityTasks[0];
    }

    if (upcomingTasks.length > 0) {
      return upcomingTasks[0];
    }

    return null;
  }, [
    urgentTasks,
    highPriorityTasks,
    upcomingTasks,
  ]);

  function getDaysRemaining(date: string) {
    if (!date) return "";

    const today = new Date();
    const deadline = new Date(date);

    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const difference =
      deadline.getTime() - today.getTime();

    const days = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    if (days < 0) {
      return `${Math.abs(days)} day${
        Math.abs(days) === 1 ? "" : "s"
      } overdue`;
    }

    if (days === 0) {
      return "Due today";
    }

    if (days === 1) {
      return "Due tomorrow";
    }

    return `${days} days remaining`;
  }

  function formatDate(date: string) {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function priorityClass(priority: string) {
    switch (priority.toUpperCase()) {
      case "URGENT":
        return "bg-red-500/10 text-red-300";

      case "HIGH":
        return "bg-orange-500/10 text-orange-300";

      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-300";

      default:
        return "bg-green-500/10 text-green-300";
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            CampusPilot
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Student Dashboard
          </h1>

          <p className="mt-3 text-slate-400">
            Your academic tasks, deadlines, events,
            and next best actions in one place.
          </p>
        </div>

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Pending Tasks
            </p>

            <p className="mt-2 text-3xl font-bold">
              {pendingTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-sm text-red-300">
              Urgent Tasks
            </p>

            <p className="mt-2 text-3xl font-bold text-red-300">
              {urgentTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
            <p className="text-sm text-blue-300">
              Upcoming Events
            </p>

            <p className="mt-2 text-3xl font-bold">
              {events.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
            <p className="text-sm text-green-300">
              Completed Tasks
            </p>

            <p className="mt-2 text-3xl font-bold">
              {completedTasks.length}
            </p>
          </div>

        </section>

        {/* Agent Recommendation */}
        <section className="mt-6 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
              🤖
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                CampusPilot Agent
              </p>

              <h2 className="mt-2 text-xl font-bold">
                {nextAction
                  ? "Your next best action"
                  : "You're all caught up!"}
              </h2>

              {nextAction ? (
                <>
                  <p className="mt-2 text-slate-300">
                    I recommend completing:
                  </p>

                  <p className="mt-2 font-semibold text-white">
                    {nextAction.title}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {nextAction.reason}
                  </p>

                  {nextAction.deadline && (
                    <p className="mt-3 text-sm text-purple-300">
                      ⏰ {getDaysRemaining(
                        nextAction.deadline
                      )}
                    </p>
                  )}

                  <a
                    href="/tasks"
                    className="mt-4 inline-block rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold hover:bg-purple-400"
                  >
                    Manage Tasks →
                  </a>
                </>
              ) : (
                <p className="mt-2 text-slate-400">
                  No pending tasks require your attention
                  right now.
                </p>
              )}
            </div>

          </div>
        </section>

        {/* Main Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* Priority Tasks */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center justify-between">

              <h2 className="text-xl font-semibold">
                🎯 Priority Tasks
              </h2>

              <a
                href="/tasks"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View all →
              </a>

            </div>

            <div className="mt-5 space-y-3">

              {pendingTasks.length > 0 ? (
                pendingTasks
                  .slice()
                  .sort((a, b) => {
                    const order: Record<
                      string,
                      number
                    > = {
                      URGENT: 1,
                      HIGH: 2,
                      MEDIUM: 3,
                      LOW: 4,
                    };

                    return (
                      (order[
                        a.priority.toUpperCase()
                      ] || 5) -
                      (order[
                        b.priority.toUpperCase()
                      ] || 5)
                    );
                  })
                  .slice(0, 5)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl bg-slate-950 p-4"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>
                          <p className="font-semibold">
                            {task.title}
                          </p>

                          {task.deadline && (
                            <p className="mt-2 text-sm text-slate-400">
                              ⏰{" "}
                              {formatDate(
                                task.deadline
                              )}
                            </p>
                          )}
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                      </div>

                    </div>
                  ))
              ) : (
                <p className="text-slate-500">
                  No pending tasks.
                </p>
              )}

            </div>
          </section>

          {/* Upcoming Deadlines */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="text-xl font-semibold">
              ⏰ Upcoming Deadlines
            </h2>

            <div className="mt-5 space-y-3">

              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl bg-slate-950 p-4"
                  >

                    <p className="font-semibold">
                      {task.title}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-sm">

                      <span className="text-blue-400">
                        {formatDate(
                          task.deadline
                        )}
                      </span>

                      <span className="text-slate-500">
                        {getDaysRemaining(
                          task.deadline
                        )}
                      </span>

                    </div>

                  </div>
                ))
              ) : (
                <p className="text-slate-500">
                  No upcoming deadlines.
                </p>
              )}

            </div>
          </section>

        </div>

        {/* Upcoming Events */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-semibold">
              📅 Upcoming Academic Events
            </h2>

            <a
              href="/calendar"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View calendar →
            </a>

          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, index) => (
                <div
                  key={event.id || index}
                  className="rounded-xl bg-slate-950 p-5"
                >

                  <p className="font-semibold">
                    {event.title}
                  </p>

                  <p className="mt-2 text-blue-400">
                    📅 {formatDate(event.date)}
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
              ))
            ) : (
              <p className="text-slate-500">
                No upcoming academic events.
              </p>
            )}

          </div>

        </section>

        {/* Navigation */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">

          <a
            href="/upload"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-blue-500"
          >
            <p className="text-lg font-semibold">
              ✨ Analyze Notice
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Extract tasks and events from a new
              academic notice.
            </p>
          </a>

          <a
            href="/tasks"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-blue-500"
          >
            <p className="text-lg font-semibold">
              ✅ Manage Tasks
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Complete and organize your academic
              tasks.
            </p>
          </a>

          <a
            href="/calendar"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-blue-500"
          >
            <p className="text-lg font-semibold">
              📅 Academic Calendar
            </p>

            <p className="mt-2 text-sm text-slate-400">
              View exams, deadlines, and academic
              events.
            </p>
          </a>

        </section>

      </div>
    </main>
  );
}