/* CampusPilot — Task Management page
 *
 * Drop this file into:
 * app/tasks/page.tsx
 *
 * It includes:
 * - Task persistence with localStorage
 * - Duplicate-task cleanup
 * - Deadline/priority based agent ranking
 * - Pending/completed filters
 * - Task completion, deletion, and priority editing
 */

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

const TASK_STORAGE_KEY = "campuspilot_tasks";

function getPriorityScore(priority: string) {
  switch (priority.toUpperCase()) {
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

  return Number.isNaN(date.getTime()) ? null : date;
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

/* Converts semantically equivalent task titles into one key. */
function normalizeTaskTitle(title: string) {
  let value = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");

  if (
    value.includes("scheduling conflict") ||
    value.includes("schedule conflict")
  ) {
    return "scheduling conflict";
  }

  if (
    value.includes("institute id") ||
    value.includes("institute identity") ||
    value.includes("institute id card")
  ) {
    return "institute id card";
  }

  if (
    value.includes("admit card") ||
    value.includes("examination admit")
  ) {
    return "examination admit card";
  }

  if (
    value.includes("submit") &&
    value.includes("form")
  ) {
    return "examination form submission";
  }

  value = value
    .replace(
      /\b(ensure|carry|bring|have|keep|confirm|verify|check|report|submit)\b/g,
      ""
    )
    .replace(
      /\b(possession of|physical possession and validity of)\b/g,
      ""
    )
    .replace(/\b(the|your|my|any)\b/g, "")
    .replace(/examination/g, "exam")
    .replace(/exam\s+form/g, "form")
    .replace(/\s+/g, " ")
    .trim();

  return value;
}

function deduplicateTasks(tasks: Task[]) {
  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    const key = normalizeTaskTitle(task.title);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(task);
  }

  const cleaned: Task[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      cleaned.push(group[0]);
      continue;
    }

    const sorted = [...group].sort((a, b) => {
      // Pending task wins over an already completed duplicate.
      if (a.status !== b.status) {
        return a.status === "PENDING" ? -1 : 1;
      }

      const dateA = parseDate(a.deadline);
      const dateB = parseDate(b.deadline);

      if (dateA && dateB) {
        const difference =
          dateA.getTime() - dateB.getTime();

        if (difference !== 0) {
          return difference;
        }
      }

      return (
        getPriorityScore(b.priority) -
        getPriorityScore(a.priority)
      );
    });

    const best = sorted[0];

    const reasonTask = sorted.find(
      (task) => task.reason?.trim()
    );

    const strongestPriority = sorted.reduce(
      (highest, task) =>
        getPriorityScore(task.priority) >
        getPriorityScore(highest)
          ? task.priority
          : highest,
      best.priority
    );

    cleaned.push({
      ...best,
      reason: best.reason || reasonTask?.reason || "",
      deadline:
        best.deadline ||
        sorted.find((task) => task.deadline)?.deadline ||
        "",
      priority: strongestPriority,
    });
  }

  return cleaned;
}

function priorityClass(priority: string) {
  switch (priority.toUpperCase()) {
    case "URGENT":
      return "bg-red-500/10 text-red-300 border-red-500/20";
    case "HIGH":
      return "bg-orange-500/10 text-orange-300 border-orange-500/20";
    case "MEDIUM":
      return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
    case "LOW":
      return "bg-green-500/10 text-green-300 border-green-500/20";
    default:
      return "bg-slate-500/10 text-slate-300 border-slate-500/20";
  }
}

function daysLabel(days: number) {
  if (days < 0) {
    const count = Math.abs(days);
    return `${count} day${count === 1 ? "" : "s"} overdue`;
  }

  if (days === 0) return "Due today";
  if (days === 1) return "1 day remaining";

  return `${days} days remaining`;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] =
    useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [agentMessage, setAgentMessage] = useState("");
  const [cleanedDuplicates, setCleanedDuplicates] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TASK_STORAGE_KEY);

      if (!stored) {
        setTasks([]);
        return;
      }

      const parsed: Task[] = JSON.parse(stored);
      const cleaned = deduplicateTasks(parsed);

      if (cleaned.length !== parsed.length) {
        setCleanedDuplicates(parsed.length - cleaned.length);
        localStorage.setItem(
          TASK_STORAGE_KEY,
          JSON.stringify(cleaned)
        );
      }

      setTasks(cleaned);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setTasks([]);
    }
  }, []);

  function saveTasks(updatedTasks: Task[]) {
    const cleaned = deduplicateTasks(updatedTasks);

    setTasks(cleaned);
    localStorage.setItem(
      TASK_STORAGE_KEY,
      JSON.stringify(cleaned)
    );
  }

  function completeTask(id: string) {
    saveTasks(
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status:
                task.status === "COMPLETED"
                  ? "PENDING"
                  : "COMPLETED",
            }
          : task
      )
    );
  }

  function deleteTask(id: string) {
    if (
      !window.confirm(
        "Are you sure you want to delete this task?"
      )
    ) {
      return;
    }

    saveTasks(tasks.filter((task) => task.id !== id));
  }

  function updatePriority(id: string, priority: string) {
    saveTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, priority } : task
      )
    );
  }

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status === "PENDING"),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "COMPLETED"),
    [tasks]
  );

  const urgentTasks = useMemo(
    () =>
      pendingTasks.filter(
        (task) => task.priority.toUpperCase() === "URGENT"
      ),
    [pendingTasks]
  );

  const overdueTasks = useMemo(
    () =>
      pendingTasks.filter((task) => {
        const days = getDaysRemaining(task.deadline);
        return days !== null && days < 0;
      }),
    [pendingTasks]
  );

  const upcomingTasks = useMemo(() => {
    return [...pendingTasks].sort((a, b) => {
      const daysA = getDaysRemaining(a.deadline);
      const daysB = getDaysRemaining(b.deadline);

      const safeA =
        daysA === null ? Number.MAX_SAFE_INTEGER : daysA;
      const safeB =
        daysB === null ? Number.MAX_SAFE_INTEGER : daysB;

      if (safeA !== safeB) {
        return safeA - safeB;
      }

      return (
        getPriorityScore(b.priority) -
        getPriorityScore(a.priority)
      );
    });
  }, [pendingTasks]);

  /*
   * CampusPilot agent:
   * 1. Overdue
   * 2. Closest deadline
   * 3. Higher priority
   */
  const nextBestTask = useMemo(() => {
    if (pendingTasks.length === 0) return null;

    return [...pendingTasks].sort((a, b) => {
      const daysA = getDaysRemaining(a.deadline);
      const daysB = getDaysRemaining(b.deadline);

      const overdueA = daysA !== null && daysA < 0;
      const overdueB = daysB !== null && daysB < 0;

      if (overdueA !== overdueB) {
        return overdueA ? -1 : 1;
      }

      const safeA = daysA === null ? 999999 : daysA;
      const safeB = daysB === null ? 999999 : daysB;

      if (safeA !== safeB) {
        return safeA - safeB;
      }

      return (
        getPriorityScore(b.priority) -
        getPriorityScore(a.priority)
      );
    })[0];
  }, [pendingTasks]);

  useEffect(() => {
    if (!nextBestTask) {
      setAgentMessage(
        "You have no pending tasks. Great job! 🎉"
      );
      return;
    }

    const days = getDaysRemaining(nextBestTask.deadline);

    if (days !== null && days < 0) {
      const count = Math.abs(days);
      setAgentMessage(
        `This task is overdue by ${count} day${
          count === 1 ? "" : "s"
        }. It should be handled immediately.`
      );
      return;
    }

    if (days === 0) {
      setAgentMessage(
        "This task is due today. I recommend completing it first."
      );
      return;
    }

    if (days === 1) {
      setAgentMessage(
        "This task is due tomorrow, so I recommend prioritizing it."
      );
      return;
    }

    if (days !== null) {
      setAgentMessage(
        `This task has the closest deadline (${days} days remaining), so it is your next best action.`
      );
      return;
    }

    setAgentMessage(
      "This task currently has the highest priority among your pending tasks."
    );
  }, [nextBestTask]);

  const visibleTasks = useMemo(() => {
    if (filter === "PENDING") return upcomingTasks;
    if (filter === "COMPLETED") return completedTasks;

    return [...upcomingTasks, ...completedTasks];
  }, [filter, upcomingTasks, completedTasks]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">
            CampusPilot
          </p>

          <h1 className="text-4xl font-bold">
            Task Management
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Manage your academic tasks and let CampusPilot
            decide what you should focus on next.
          </p>
        </div>

        {cleanedDuplicates > 0 && (
          <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-semibold text-blue-300">
              🧹 CampusPilot cleaned {cleanedDuplicates} duplicate{" "}
              {cleanedDuplicates === 1 ? "task" : "tasks"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Similar tasks from previous notices were
              automatically merged.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Pending Tasks</p>
            <p className="mt-2 text-3xl font-bold">
              {pendingTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <p className="text-sm text-red-300">Urgent Tasks</p>
            <p className="mt-2 text-3xl font-bold text-red-300">
              {urgentTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
            <p className="text-sm text-orange-300">Overdue</p>
            <p className="mt-2 text-3xl font-bold text-orange-300">
              {overdueTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <p className="text-sm text-green-300">Completed</p>
            <p className="mt-2 text-3xl font-bold text-green-300">
              {completedTasks.length}
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
              🤖
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                CampusPilot Agent
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Your next best action
              </h2>

              {nextBestTask ? (
                <>
                  <p className="mt-4 text-lg font-semibold">
                    {nextBestTask.title}
                  </p>

                  <p className="mt-2 text-slate-400">
                    {nextBestTask.reason}
                  </p>

                  <div className="mt-4 rounded-xl bg-slate-950 p-4">
                    <p className="text-sm text-blue-300">
                      💡 Agent reasoning
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
                      {agentMessage}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => completeTask(nextBestTask.id)}
                      className="rounded-xl bg-green-500 px-5 py-2.5 font-semibold text-white transition hover:bg-green-400"
                    >
                      ✓ Mark Complete
                    </button>

                    <a
                      href="#task-list"
                      className="rounded-xl border border-slate-700 px-5 py-2.5 font-semibold text-slate-300 transition hover:bg-slate-800"
                    >
                      Manage Tasks
                    </a>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-slate-400">
                  {agentMessage}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                🎯 Priority Tasks
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tasks ordered by deadline and priority.
              </p>
            </div>

            <a
              href="/upload"
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold hover:bg-blue-400"
            >
              + Analyze Notice
            </a>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
              <div className="text-4xl">🎉</div>

              <h3 className="mt-3 text-xl font-semibold">
                No pending tasks
              </h3>

              <p className="mt-2 text-slate-500">
                Analyze an academic notice to create new tasks.
              </p>

              <a
                href="/upload"
                className="mt-5 inline-block rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold hover:bg-blue-400"
              >
                ✨ Analyze Notice
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 5).map((task) => {
                const days = getDaysRemaining(task.deadline);

                return (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => completeTask(task.id)}
                          className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-600 text-xs transition hover:border-green-400 hover:bg-green-500/10"
                          title="Mark complete"
                        >
                          ✓
                        </button>

                        <div>
                          <h3 className="font-semibold">
                            {task.title}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {task.reason}
                          </p>

                          {task.deadline && (
                            <p className="mt-3 text-sm text-blue-400">
                              ⏰ {task.deadline}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {days !== null && (
                          <span
                            className={`text-sm font-medium ${
                              days < 0
                                ? "text-red-400"
                                : days <= 2
                                ? "text-orange-400"
                                : "text-slate-400"
                            }`}
                          >
                            {daysLabel(days)}
                          </span>
                        )}

                        <select
                          value={task.priority}
                          onChange={(e) =>
                            updatePriority(
                              task.id,
                              e.target.value
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none ${priorityClass(
                            task.priority
                          )}`}
                        >
                          <option value="URGENT">URGENT</option>
                          <option value="HIGH">HIGH</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LOW">LOW</option>
                        </select>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                          title="Delete task"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section id="task-list" className="mt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold">
              📋 All Tasks
            </h2>

            <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
              {(["ALL", "PENDING", "COMPLETED"] as const).map(
                (value) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`rounded-lg px-4 py-2 text-sm ${
                      filter === value
                        ? "bg-blue-500 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {value.charAt(0) + value.slice(1).toLowerCase()}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {visibleTasks.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
                No tasks in this category.
              </div>
            ) : (
              visibleTasks.map((task) => {
                const days = getDaysRemaining(task.deadline);
                const completed = task.status === "COMPLETED";

                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl border p-5 ${
                      completed
                        ? "border-green-500/10 bg-green-500/5"
                        : "border-slate-800 bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => completeTask(task.id)}
                        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          completed
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-slate-600 hover:border-green-400"
                        }`}
                        title={
                          completed
                            ? "Mark pending"
                            : "Mark complete"
                        }
                      >
                        {completed ? "✓" : ""}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <h3
                            className={`font-semibold ${
                              completed
                                ? "text-slate-500 line-through"
                                : ""
                            }`}
                          >
                            {task.title}
                          </h3>

                          <span
                            className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${priorityClass(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          {task.reason}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          {task.deadline && (
                            <span className="text-blue-400">
                              ⏰ {task.deadline}
                            </span>
                          )}

                          {!completed && days !== null && (
                            <span
                              className={
                                days < 0
                                  ? "text-red-400"
                                  : days <= 2
                                  ? "text-orange-400"
                                  : "text-slate-500"
                              }
                            >
                              {daysLabel(days)}
                            </span>
                          )}

                          {completed && (
                            <span className="text-green-400">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-slate-600 hover:text-red-400"
                        title="Delete task"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-xl border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            ← Dashboard
          </a>

          <a
            href="/calendar"
            className="rounded-xl border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            📅 Academic Calendar
          </a>

          <a
            href="/upload"
            className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold hover:bg-blue-400"
          >
            ✨ Analyze New Notice
          </a>
        </div>
      </div>
    </main>
  );
}
