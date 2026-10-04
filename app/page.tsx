"use client";

import { useEffect, useMemo, useState } from "react";

type TaskStatus = "PENDING" | "COMPLETED";

type Task = {
  id: string;
  title: string;
  deadline: string;
  priority: string;
  reason: string;
  status: TaskStatus;
  createdAt: string;
};

type AcademicEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  createdAt: string;
};

const TASK_STORAGE_KEY = "campuspilot_tasks";
const EVENT_STORAGE_KEY = "campuspilot_events";

/* =========================================================
   HELPERS
========================================================= */

function getPriorityScore(priority: string) {
  switch (priority?.toUpperCase()) {
    case "URGENT":
      return 4;
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 2;
  }
}

function parseDate(dateString: string) {
  if (!dateString) return null;

  const cleaned = dateString
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .trim();

  const date = new Date(cleaned);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getDaysRemaining(deadline: string) {
  const date = parseDate(deadline);

  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  date.setHours(0, 0, 0, 0);

  return Math.ceil(
    (date.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function daysLabel(days: number) {
  if (days < 0) {
    const count = Math.abs(days);

    return `${count} day${
      count === 1 ? "" : "s"
    } overdue`;
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "1 day remaining";
  }

  return `${days} days remaining`;
}

function priorityClass(priority: string) {
  switch (priority?.toUpperCase()) {
    case "URGENT":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    case "HIGH":
      return "border-orange-500/20 bg-orange-500/10 text-orange-300";

    case "MEDIUM":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

    case "LOW":
      return "border-green-500/20 bg-green-500/10 text-green-300";

    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  function loadDashboardData() {
    try {
      const storedTasks = localStorage.getItem(
        TASK_STORAGE_KEY
      );

      const storedEvents = localStorage.getItem(
        EVENT_STORAGE_KEY
      );

      const parsedTasks: Task[] = storedTasks
        ? JSON.parse(storedTasks)
        : [];

      const parsedEvents: AcademicEvent[] =
        storedEvents
          ? JSON.parse(storedEvents)
          : [];

      setTasks(
        Array.isArray(parsedTasks)
          ? parsedTasks
          : []
      );

      setEvents(
        Array.isArray(parsedEvents)
          ? parsedEvents
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load CampusPilot dashboard data:",
        error
      );

      setTasks([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();

    const handleStorage = () => {
      loadDashboardData();
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "focus",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "focus",
        handleStorage
      );
    };
  }, []);

  /* =========================================================
     TASK ANALYTICS
  ========================================================= */

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
          task.priority?.toUpperCase() ===
          "URGENT"
      ),
    [pendingTasks]
  );

  const overdueTasks = useMemo(
    () =>
      pendingTasks.filter((task) => {
        const days = getDaysRemaining(
          task.deadline
        );

        return (
          days !== null &&
          days < 0
        );
      }),
    [pendingTasks]
  );

  /* =========================================================
     NEXT BEST TASK
  ========================================================= */

  const nextBestTask = useMemo(() => {
    if (pendingTasks.length === 0) {
      return null;
    }

    return [...pendingTasks].sort(
      (a, b) => {
        const daysA = getDaysRemaining(
          a.deadline
        );

        const daysB = getDaysRemaining(
          b.deadline
        );

        const overdueA =
          daysA !== null &&
          daysA < 0;

        const overdueB =
          daysB !== null &&
          daysB < 0;

        /* Overdue tasks first */
        if (overdueA !== overdueB) {
          return overdueA ? -1 : 1;
        }

        /* Closest deadline */
        const safeA =
          daysA === null
            ? Number.MAX_SAFE_INTEGER
            : daysA;

        const safeB =
          daysB === null
            ? Number.MAX_SAFE_INTEGER
            : daysB;

        if (safeA !== safeB) {
          return safeA - safeB;
        }

        /* Higher priority */
        return (
          getPriorityScore(b.priority) -
          getPriorityScore(a.priority)
        );
      }
    )[0];
  }, [pendingTasks]);

  /* =========================================================
     AGENT MESSAGE
  ========================================================= */

  const agentMessage = useMemo(() => {
    if (!nextBestTask) {
      return "You have no pending tasks. Great job! 🎉";
    }

    const days = getDaysRemaining(
      nextBestTask.deadline
    );

    if (days !== null && days < 0) {
      const count = Math.abs(days);

      return `This task is overdue by ${count} day${
        count === 1 ? "" : "s"
      }. Handle it immediately.`;
    }

    if (days === 0) {
      return "This task is due today. Complete it first.";
    }

    if (days === 1) {
      return "This task is due tomorrow. Prioritize it.";
    }

    if (days !== null) {
      return `This task has the closest deadline with ${days} days remaining.`;
    }

    return "This task currently has the highest priority among your pending tasks.";
  }, [nextBestTask]);

  /* =========================================================
     UPCOMING EVENTS
  ========================================================= */

  const upcomingEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);

        if (!dateA && !dateB) {
          return 0;
        }

        if (!dateA) {
          return 1;
        }

        if (!dateB) {
          return -1;
        }

        return (
          dateA.getTime() -
          dateB.getTime()
        );
      })
      .slice(0, 4);
  }, [events]);

  /* =========================================================
     COMPLETE NEXT TASK
  ========================================================= */

  function completeTask(id: string) {
    const updatedTasks = tasks.map(
      (task) =>
        task.id === id
          ? {
              ...task,
              status:
                task.status ===
                "COMPLETED"
                  ? "PENDING"
                  : "COMPLETED",
            }
          : task
    );

    setTasks(updatedTasks);

    localStorage.setItem(
      TASK_STORAGE_KEY,
      JSON.stringify(updatedTasks)
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-400">
                CAMPUSPILOT AI AGENT
              </p>

              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Academic Command Center
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">
                Your AI-powered academic assistant for
                notices, deadlines, tasks, examinations,
                and important campus events.
              </p>
            </div>

            <a
              href="/upload"
              className="w-fit rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400"
            >
              ✨ Analyze Notice
            </a>

          </div>
        </header>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="text-3xl">🤖</div>

            <p className="mt-3 text-slate-400">
              Loading CampusPilot...
            </p>
          </div>
        ) : (
          <>
            {/* =============================================
                STATISTICS
            ============================================= */}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-sm text-slate-400">
                  Pending Tasks
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {pendingTasks.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Tasks requiring action
                </p>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <p className="text-sm text-red-300">
                  Urgent Tasks
                </p>

                <p className="mt-2 text-4xl font-bold text-red-300">
                  {urgentTasks.length}
                </p>

                <p className="mt-2 text-xs text-red-400/70">
                  Highest priority
                </p>
              </div>

              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
                <p className="text-sm text-orange-300">
                  Overdue
                </p>

                <p className="mt-2 text-4xl font-bold text-orange-300">
                  {overdueTasks.length}
                </p>

                <p className="mt-2 text-xs text-orange-400/70">
                  Need immediate attention
                </p>
              </div>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                <p className="text-sm text-green-300">
                  Completed
                </p>

                <p className="mt-2 text-4xl font-bold text-green-300">
                  {completedTasks.length}
                </p>

                <p className="mt-2 text-xs text-green-400/70">
                  Tasks finished
                </p>
              </div>

            </section>

            {/* =============================================
                AI AGENT
            ============================================= */}

            <section className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 md:p-7">

              <div className="flex flex-col gap-6 md:flex-row">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  🤖
                </div>

                <div className="flex-1">

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    CampusPilot Agent
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Your next best action
                  </h2>

                  {nextBestTask ? (
                    <>
                      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-5">

                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                          <div>
                            <p className="text-lg font-semibold">
                              {nextBestTask.title}
                            </p>

                            {nextBestTask.reason && (
                              <p className="mt-2 text-sm leading-6 text-slate-400">
                                {nextBestTask.reason}
                              </p>
                            )}
                          </div>

                          <span
                            className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${priorityClass(
                              nextBestTask.priority
                            )}`}
                          >
                            {nextBestTask.priority}
                          </span>

                        </div>

                        {nextBestTask.deadline && (
                          <div className="mt-4 flex flex-wrap gap-3">

                            <span className="text-sm text-blue-400">
                              ⏰ {nextBestTask.deadline}
                            </span>

                            {(() => {
                              const days =
                                getDaysRemaining(
                                  nextBestTask.deadline
                                );

                              if (days === null) {
                                return null;
                              }

                              return (
                                <span
                                  className={`text-sm ${
                                    days < 0
                                      ? "text-red-400"
                                      : days <= 2
                                      ? "text-orange-400"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {daysLabel(days)}
                                </span>
                              );
                            })()}

                          </div>
                        )}

                      </div>

                      <div className="mt-4 rounded-xl bg-slate-950/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                          💡 Agent reasoning
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {agentMessage}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">

                        <button
                          onClick={() =>
                            completeTask(
                              nextBestTask.id
                            )
                          }
                          className="rounded-xl bg-green-500 px-5 py-3 font-semibold transition hover:bg-green-400"
                        >
                          ✓ Mark Complete
                        </button>

                        <a
                          href="/tasks"
                          className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        >
                          Manage Tasks
                        </a>

                      </div>
                    </>
                  ) : (
                    <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/5 p-5">

                      <p className="text-lg font-semibold text-green-300">
                        🎉 You're all caught up!
                      </p>

                      <p className="mt-2 text-sm text-slate-400">
                        {agentMessage}
                      </p>

                      <a
                        href="/upload"
                        className="mt-5 inline-block rounded-xl bg-blue-500 px-5 py-3 font-semibold hover:bg-blue-400"
                      >
                        Analyze New Notice
                      </a>

                    </div>
                  )}

                </div>
              </div>
            </section>

            {/* =============================================
                QUICK ACTIONS
            ============================================= */}

            <section className="mt-8">

              <div className="mb-4">
                <h2 className="text-2xl font-bold">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Access the main CampusPilot features.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">

                <a
                  href="/upload"
                  className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500/40 hover:bg-slate-900/80"
                >
                  <div className="text-3xl">
                    📄
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    Analyze Notice
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Upload or paste an academic notice
                    and let AI extract important information.
                  </p>

                  <p className="mt-4 text-sm font-semibold text-blue-400 group-hover:text-blue-300">
                    Analyze now →
                  </p>
                </a>

                <a
                  href="/tasks"
                  className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500/40 hover:bg-slate-900/80"
                >
                  <div className="text-3xl">
                    🎯
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    Task Management
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Manage deadlines, priorities,
                    completed tasks, and your next action.
                  </p>

                  <p className="mt-4 text-sm font-semibold text-blue-400 group-hover:text-blue-300">
                    Manage tasks →
                  </p>
                </a>

                <a
                  href="/calendar"
                  className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500/40 hover:bg-slate-900/80"
                >
                  <div className="text-3xl">
                    📅
                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    Academic Calendar
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Keep track of examinations,
                    deadlines, and academic events.
                  </p>

                  <p className="mt-4 text-sm font-semibold text-blue-400 group-hover:text-blue-300">
                    View calendar →
                  </p>
                </a>

              </div>
            </section>

            {/* =============================================
                PRIORITY TASKS + CALENDAR
            ============================================= */}

            <section className="mt-10 grid gap-6 lg:grid-cols-2">

              {/* PRIORITY TASKS */}

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                <div className="flex items-center justify-between gap-4">

                  <div>
                    <h2 className="text-xl font-bold">
                      🎯 Priority Tasks
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      What needs your attention.
                    </p>
                  </div>

                  <a
                    href="/tasks"
                    className="text-sm font-semibold text-blue-400 hover:text-blue-300"
                  >
                    View all →
                  </a>

                </div>

                <div className="mt-5 space-y-3">

                  {pendingTasks.length === 0 ? (
                    <div className="rounded-xl bg-slate-950 p-6 text-center">
                      <div className="text-3xl">
                        🎉
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        No pending tasks.
                      </p>
                    </div>
                  ) : (
                    [...pendingTasks]
                      .sort(
                        (a, b) => {
                          const daysA =
                            getDaysRemaining(
                              a.deadline
                            );

                          const daysB =
                            getDaysRemaining(
                              b.deadline
                            );

                          const safeA =
                            daysA === null
                              ? 999999
                              : daysA;

                          const safeB =
                            daysB === null
                              ? 999999
                              : daysB;

                          if (
                            safeA !== safeB
                          ) {
                            return (
                              safeA - safeB
                            );
                          }

                          return (
                            getPriorityScore(
                              b.priority
                            ) -
                            getPriorityScore(
                              a.priority
                            )
                          );
                        }
                      )
                      .slice(0, 5)
                      .map((task) => {

                        const days =
                          getDaysRemaining(
                            task.deadline
                          );

                        return (
                          <div
                            key={task.id}
                            className="rounded-xl bg-slate-950 p-4"
                          >

                            <div className="flex items-start gap-3">

                              <button
                                onClick={() =>
                                  completeTask(
                                    task.id
                                  )
                                }
                                className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-600 text-xs transition hover:border-green-400 hover:bg-green-500/10"
                                title="Mark complete"
                              >
                                ✓
                              </button>

                              <div className="min-w-0 flex-1">

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                                  <p className="font-semibold">
                                    {task.title}
                                  </p>

                                  <span
                                    className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${priorityClass(
                                      task.priority
                                    )}`}
                                  >
                                    {task.priority}
                                  </span>

                                </div>

                                {task.deadline && (
                                  <div className="mt-2 flex flex-wrap gap-3 text-xs">

                                    <span className="text-blue-400">
                                      ⏰{" "}
                                      {
                                        task.deadline
                                      }
                                    </span>

                                    {days !==
                                      null && (
                                      <span
                                        className={
                                          days <
                                          0
                                            ? "text-red-400"
                                            : days <=
                                              2
                                            ? "text-orange-400"
                                            : "text-slate-500"
                                        }
                                      >
                                        {
                                          daysLabel(
                                            days
                                          )
                                        }
                                      </span>
                                    )}

                                  </div>
                                )}

                              </div>
                            </div>

                          </div>
                        );
                      })
                  )}

                </div>
              </div>

              {/* UPCOMING EVENTS */}

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                <div className="flex items-center justify-between gap-4">

                  <div>
                    <h2 className="text-xl font-bold">
                      📅 Upcoming Academic Events
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Important dates extracted by AI.
                    </p>
                  </div>

                  <a
                    href="/calendar"
                    className="text-sm font-semibold text-blue-400 hover:text-blue-300"
                  >
                    View all →
                  </a>

                </div>

                <div className="mt-5 space-y-3">

                  {upcomingEvents.length ===
                  0 ? (
                    <div className="rounded-xl bg-slate-950 p-6 text-center">
                      <div className="text-3xl">
                        📅
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        No academic events yet.
                      </p>

                      <a
                        href="/upload"
                        className="mt-4 inline-block text-sm font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Analyze a notice →
                      </a>
                    </div>
                  ) : (
                    upcomingEvents.map(
                      (event) => (
                        <div
                          key={event.id}
                          className="rounded-xl bg-slate-950 p-4"
                        >

                          <div className="flex gap-4">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                              📅
                            </div>

                            <div className="min-w-0">

                              <p className="font-semibold">
                                {event.title}
                              </p>

                              <p className="mt-1 text-sm text-blue-400">
                                {event.date}
                              </p>

                              {event.time && (
                                <p className="mt-1 text-xs text-slate-500">
                                  🕐{" "}
                                  {event.time}
                                </p>
                              )}

                              {event.location && (
                                <p className="mt-1 text-xs text-slate-500">
                                  📍{" "}
                                  {
                                    event.location
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                        </div>
                      )
                    )
                  )}

                </div>
              </div>

            </section>

            {/* =============================================
                HOW CAMPUSPILOT WORKS
            ============================================= */}

            <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">

              <div className="text-center">

                <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  INTELLIGENT WORKFLOW
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  From Notice to Action
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  CampusPilot transforms unstructured academic
                  notices into structured, prioritized actions.
                </p>

              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-4">

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                    📄
                  </div>

                  <h3 className="mt-4 font-semibold">
                    1. Read
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Understand the academic notice.
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-2xl">
                    🤖
                  </div>

                  <h3 className="mt-4 font-semibold">
                    2. Analyze
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Extract dates, tasks and requirements.
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-2xl">
                    🎯
                  </div>

                  <h3 className="mt-4 font-semibold">
                    3. Prioritize
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Rank actions by urgency and deadline.
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 text-2xl">
                    ✅
                  </div>

                  <h3 className="mt-4 font-semibold">
                    4. Act
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Complete the most important task first.
                  </p>
                </div>

              </div>
            </section>

            {/* =============================================
                FOOTER NAVIGATION
            ============================================= */}

            <div className="mt-10 flex flex-wrap gap-3">

              <a
                href="/upload"
                className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold hover:bg-blue-400"
              >
                ✨ Analyze Notice
              </a>

              <a
                href="/tasks"
                className="rounded-xl border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                🎯 Task Management
              </a>

              <a
                href="/calendar"
                className="rounded-xl border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                📅 Academic Calendar
              </a>

            </div>
          </>
        )}

      </div>
    </main>
  );
}