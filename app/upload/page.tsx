"use client";

import { useState } from "react";

type Analysis = {
  summary: string;
  category: string;

  important_dates: {
    title: string;
    date: string;
    time?: string;
    location?: string;
  }[];

  tasks: {
    title: string;
    deadline?: string;
    priority: string;
    reason: string;
  }[];

  requirements: string[];

  warnings: string[];

  suggested_actions: {
    action: string;
    reason: string;
    requires_approval: boolean;
  }[];
};

type TaskToSave = {
  id: string;
  title: string;
  deadline: string;
  priority: string;
  reason: string;
  status: "PENDING" | "COMPLETED";
  createdAt: string;
};

const TASK_STORAGE_KEY = "campuspilot_tasks";

export default function UploadPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tasksSaved, setTasksSaved] = useState(0);

  async function analyze() {
    if (!text.trim()) {
      setError("Please paste an academic notice first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setTasksSaved(0);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
        }),
      });

      // Read response as text first.
      // This prevents JSON parsing errors when the API returns
      // an empty response or an HTML error page.
      const rawResponse = await response.text();

      console.log("API status:", response.status);
      console.log("API response:", rawResponse);

      if (!rawResponse.trim()) {
        throw new Error(
          `API returned an empty response. HTTP status: ${response.status}`
        );
      }

      let data: {
        success?: boolean;
        analysis?: Analysis;
        error?: string;
      };

      try {
        data = JSON.parse(rawResponse);
      } catch {
        throw new Error(
          `API did not return valid JSON.\n\nServer response:\n${rawResponse.slice(
            0,
            500
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Analysis failed with HTTP status ${response.status}.`
        );
      }

      if (!data.analysis) {
        throw new Error(
          data.error || "API response did not contain analysis."
        );
      }

      // --------------------------------------------------
      // AI ANALYSIS SUCCESS
      // --------------------------------------------------

      setResult(data.analysis);

      // --------------------------------------------------
      // PHASE 2:
      // SAVE EXTRACTED TASKS TO LOCAL STORAGE
      // --------------------------------------------------

      const existingTasks: TaskToSave[] = JSON.parse(
        localStorage.getItem(TASK_STORAGE_KEY) || "[]"
      );

      const tasksFromAI = data.analysis.tasks || [];

      const newTasks: TaskToSave[] = tasksFromAI.map(
        (task, index) => ({
          id: `${Date.now()}-${index}-${Math.random()
            .toString(36)
            .substring(2, 8)}`,

          title: task.title,

          deadline: task.deadline || "",

          priority: task.priority || "MEDIUM",

          reason: task.reason || "",

          status: "PENDING",

          createdAt: new Date().toISOString(),
        })
      );

      // --------------------------------------------------
      // PREVENT EXACT DUPLICATE TASKS
      // --------------------------------------------------

      const uniqueNewTasks = newTasks.filter((newTask) => {
        const alreadyExists = existingTasks.some(
          (existingTask) =>
            existingTask.title.trim().toLowerCase() ===
              newTask.title.trim().toLowerCase() &&
            existingTask.deadline.trim().toLowerCase() ===
              newTask.deadline.trim().toLowerCase()
        );

        return !alreadyExists;
      });

      const updatedTasks = [
        ...existingTasks,
        ...uniqueNewTasks,
      ];

      localStorage.setItem(
        TASK_STORAGE_KEY,
        JSON.stringify(updatedTasks)
      );

      setTasksSaved(uniqueNewTasks.length);

      console.log(
        `CampusPilot saved ${uniqueNewTasks.length} new task(s).`
      );
    } catch (error) {
      console.error("Analysis error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while analyzing the notice."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearNotice() {
    setText("");
    setResult(null);
    setError("");
    setTasksSaved(0);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">
            CampusPilot AI Agent
          </p>

          <h1 className="text-4xl font-bold">
            Analyze Academic Notice
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            CampusPilot understands your notice and identifies
            what you need to do next.
          </p>
        </div>

        {/* Notice Input */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Academic Notice
            </h2>

            {text && (
              <button
                type="button"
                onClick={clearNotice}
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the examination notice, assignment notice, college circular, or announcement here..."
            className="h-72 w-full resize-none rounded-xl border border-slate-800 bg-slate-950 p-5 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
          />

          <button
            type="button"
            onClick={analyze}
            disabled={loading}
            className="mt-5 rounded-xl bg-blue-500 px-7 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "🤖 Analyzing..."
              : "✨ Analyze Notice"}
          </button>

          {/* Tasks Saved Message */}
          {tasksSaved > 0 && (
            <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="font-semibold text-green-300">
                ✓ {tasksSaved} task
                {tasksSaved !== 1 ? "s" : ""} added to
                CampusPilot
              </p>

              <p className="mt-1 text-sm text-green-400">
                Open the Tasks page to manage them.
              </p>

              <a
                href="/tasks"
                className="mt-3 inline-block rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/20"
              >
                View My Tasks →
              </a>
            </div>
          )}

          {/* No new tasks */}
          {!loading &&
            result &&
            result.tasks.length > 0 &&
            tasksSaved === 0 && (
              <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <p className="font-semibold text-yellow-300">
                  ℹ️ No new tasks were added
                </p>

                <p className="mt-1 text-sm text-yellow-400">
                  These tasks may already exist in your
                  Task Management list.
                </p>

                <a
                  href="/tasks"
                  className="mt-3 inline-block rounded-lg bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/20"
                >
                  View My Tasks →
                </a>
              </div>
            )}

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="font-semibold text-red-300">
                Analysis failed
              </p>

              <pre className="mt-2 whitespace-pre-wrap text-sm text-red-400">
                {error}
              </pre>
            </div>
          )}
        </section>

        {/* Results */}
        {result && (
          <div className="mt-10 space-y-6">

            {/* AI Summary */}
            <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                AI Summary
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                {result.summary}
              </h2>

              {result.category && (
                <p className="mt-3 inline-block rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
                  {result.category}
                </p>
              )}

            </section>

            {/* Important Dates */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <h2 className="text-xl font-semibold">
                📅 Important Dates
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                {result.important_dates &&
                result.important_dates.length > 0 ? (
                  result.important_dates.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-slate-950 p-5"
                      >
                        <p className="font-semibold">
                          {item.title}
                        </p>

                        <p className="mt-2 text-blue-400">
                          {item.date}
                        </p>

                        {item.time && (
                          <p className="mt-1 text-sm text-slate-400">
                            🕐 {item.time}
                          </p>
                        )}

                        {item.location && (
                          <p className="mt-1 text-sm text-slate-400">
                            📍 {item.location}
                          </p>
                        )}
                      </div>
                    )
                  )
                ) : (
                  <p className="text-slate-500">
                    No important dates detected.
                  </p>
                )}

              </div>
            </section>

            {/* Tasks */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <h2 className="text-xl font-semibold">
                  ✅ Actionable Tasks
                </h2>

                {result.tasks.length > 0 && (
                  <a
                    href="/tasks"
                    className="text-sm font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Manage all tasks →
                  </a>
                )}

              </div>

              <div className="mt-5 space-y-3">

                {result.tasks &&
                result.tasks.length > 0 ? (
                  result.tasks.map((task, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-slate-950 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">
                          <p className="font-semibold">
                            {task.title}
                          </p>

                          <p className="mt-2 text-sm text-slate-400">
                            {task.reason}
                          </p>

                          {task.deadline && (
                            <p className="mt-3 text-sm text-blue-400">
                              ⏰ Deadline:{" "}
                              {task.deadline}
                            </p>
                          )}
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                            task.priority.toUpperCase() ===
                            "URGENT"
                              ? "bg-red-500/10 text-red-300"
                              : task.priority.toUpperCase() ===
                                "HIGH"
                              ? "bg-orange-500/10 text-orange-300"
                              : task.priority.toUpperCase() ===
                                "MEDIUM"
                              ? "bg-yellow-500/10 text-yellow-300"
                              : "bg-green-500/10 text-green-300"
                          }`}
                        >
                          {task.priority}
                        </span>

                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">
                    No tasks detected.
                  </p>
                )}

              </div>
            </section>

            {/* Requirements */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <h2 className="text-xl font-semibold">
                📋 Requirements
              </h2>

              <div className="mt-4 space-y-3">

                {result.requirements &&
                result.requirements.length > 0 ? (
                  result.requirements.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-slate-950 p-4"
                      >
                        ✓ {item}
                      </div>
                    )
                  )
                ) : (
                  <p className="text-slate-500">
                    No specific requirements detected.
                  </p>
                )}

              </div>
            </section>

            {/* Warnings */}
            {result.warnings &&
              result.warnings.length > 0 && (
                <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6">

                  <h2 className="text-xl font-semibold text-orange-300">
                    ⚠️ Warnings & Conflicts
                  </h2>

                  <div className="mt-4 space-y-3">

                    {result.warnings.map(
                      (warning, index) => (
                        <div
                          key={index}
                          className="rounded-xl bg-slate-950 p-4 text-orange-200"
                        >
                          {warning}
                        </div>
                      )
                    )}

                  </div>
                </section>
              )}

            {/* Suggested Actions */}
            <section className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">

              <h2 className="text-xl font-semibold">
                🤖 Suggested Actions
              </h2>

              <div className="mt-5 space-y-3">

                {result.suggested_actions &&
                result.suggested_actions.length > 0 ? (
                  result.suggested_actions.map(
                    (action, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-slate-950 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">

                          <div>
                            <p className="font-semibold">
                              {action.action}
                            </p>

                            <p className="mt-2 text-sm text-slate-400">
                              {action.reason}
                            </p>
                          </div>

                          {action.requires_approval && (
                            <span className="shrink-0 rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                              🔐 Human approval required
                            </span>
                          )}

                        </div>
                      </div>
                    )
                  )
                ) : (
                  <p className="text-slate-500">
                    No suggested actions detected.
                  </p>
                )}

              </div>
            </section>

          </div>
        )}
      </div>
    </main>
  );
}