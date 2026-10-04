"use client";

import { useEffect, useState } from "react";

type TaskStatus = "PENDING" | "COMPLETED";

type CampusTask = {
  id: string;
  title: string;
  deadline: string;
  priority: string;
  reason: string;
  status: TaskStatus;
  createdAt: string;
};

const STORAGE_KEY = "campuspilot_tasks";

export default function TasksPage() {
  const [tasks, setTasks] = useState<CampusTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  function updateTaskStatus(
    taskId: string,
    status: TaskStatus
  ) {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
          }
        : task
    );

    setTasks(updatedTasks);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedTasks)
    );
  }

  function deleteTask(taskId: string) {
    const updatedTasks = tasks.filter(
      (task) => task.id !== taskId
    );

    setTasks(updatedTasks);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedTasks)
    );
  }

  const pendingTasks = tasks.filter(
    (task) => task.status === "PENDING"
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  );

  const getPriorityStyle = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "URGENT":
        return "bg-red-500/10 text-red-300 border-red-500/20";

      case "HIGH":
        return "bg-orange-500/10 text-orange-300 border-orange-500/20";

      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";

      default:
        return "bg-green-500/10 text-green-300 border-green-500/20";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-400">
            Loading tasks...
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
            My Tasks
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Stay on top of your academic responsibilities,
            deadlines, and important actions.
          </p>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Tasks
            </p>

            <p className="mt-2 text-3xl font-bold">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
            <p className="text-sm text-orange-300">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold">
              {pendingTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <p className="text-sm text-green-300">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold">
              {completedTasks.length}
            </p>
          </div>

        </div>

        {/* Pending Tasks */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold">
            ⏳ Pending Tasks
          </h2>

          {pendingTasks.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-950 p-8 text-center">
              <p className="text-slate-400">
                🎉 No pending tasks!
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Analyze an academic notice to create tasks.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">

              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                >

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div className="flex-1">

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-lg font-semibold">
                          {task.title}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                      </div>

                      {task.reason && (
                        <p className="mt-2 text-sm text-slate-400">
                          {task.reason}
                        </p>
                      )}

                      {task.deadline && (
                        <p className="mt-3 text-sm text-blue-400">
                          ⏰ Deadline: {task.deadline}
                        </p>
                      )}

                    </div>

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          updateTaskStatus(
                            task.id,
                            "COMPLETED"
                          )
                        }
                        className="rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/20"
                      >
                        ✓ Complete
                      </button>

                      <button
                        onClick={() =>
                          deleteTask(task.id)
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

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="text-xl font-semibold">
              ✅ Completed Tasks
            </h2>

            <div className="mt-5 space-y-3">

              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl bg-slate-950 p-5"
                >

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>

                      <p className="font-semibold text-slate-400 line-through">
                        {task.title}
                      </p>

                      {task.deadline && (
                        <p className="mt-1 text-sm text-slate-600">
                          Deadline: {task.deadline}
                        </p>
                      )}

                    </div>

                    <button
                      onClick={() =>
                        updateTaskStatus(
                          task.id,
                          "PENDING"
                        )
                      }
                      className="rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
                    >
                      Mark Pending
                    </button>

                  </div>

                </div>
              ))}

            </div>

          </section>
        )}

      </div>
    </main>
  );
}