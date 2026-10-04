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

type EventToSave = {
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeTaskTitle(title: string) {
  let value = normalizeText(title);

  /* Scheduling conflict */
  if (
    value.includes("scheduling conflict") ||
    value.includes("schedule conflict")
  ) {
    return "scheduling conflict";
  }

  /* Institute ID */
  if (
    value.includes("institute id") ||
    value.includes("institute identity") ||
    value.includes("id card")
  ) {
    return "institute id card";
  }

  /* Admit card */
  if (
    value.includes("admit card") ||
    value.includes("examination admit")
  ) {
    return "examination admit card";
  }

  /* Examination form */
  if (
    value.includes("examination form") ||
    value.includes("exam form") ||
    (value.includes("submit") && value.includes("form"))
  ) {
    return "examination form submission";
  }

  value = value
    .replace(
      /\b(ensure|carry|bring|have|keep|confirm|verify|check|report|submit|complete|prepare)\b/g,
      ""
    )
    .replace(
      /\b(possession of|physical possession and validity of)\b/g,
      ""
    )
    .replace(
      /\b(the|your|my|any|all|required|valid)\b/g,
      ""
    )
    .replace(/\b(examination)\b/g, "exam")
    .replace(/\s+/g, " ")
    .trim();

  return value;
}

function normalizeDate(value: string) {
  return normalizeText(value);
}

function normalizePriority(priority: string) {
  const value = priority?.toUpperCase().trim();

  if (value === "URGENT") return "URGENT";
  if (value === "HIGH") return "HIGH";
  if (value === "MEDIUM") return "MEDIUM";
  if (value === "LOW") return "LOW";

  return "MEDIUM";
}

function generateId(prefix: string) {
  return `${Date.now()}-${prefix}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function UploadPage() {
  const [text, setText] = useState("");

  const [result, setResult] =
    useState<Analysis | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [tasksSaved, setTasksSaved] =
    useState(0);

  const [eventsSaved, setEventsSaved] =
    useState(0);

  /* =======================================================
     ANALYZE NOTICE
  ======================================================= */

  async function analyze() {
    if (!text.trim()) {
      setError(
        "Please paste an academic notice first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setTasksSaved(0);
    setEventsSaved(0);

    try {
      /* ===================================================
         CALL BACKEND
      =================================================== */

      const response = await fetch(
        "/api/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            text: text.trim(),
          }),
        }
      );

      /* ===================================================
         READ RESPONSE
      =================================================== */

      const rawResponse =
        await response.text();

      console.log(
        "CampusPilot API status:",
        response.status
      );

      console.log(
        "CampusPilot API response:",
        rawResponse
      );

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
        data = JSON.parse(
          rawResponse
        );
      } catch {
        throw new Error(
          `API did not return valid JSON.

Server response:
${rawResponse.slice(0, 1000)}`
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
          data.error ||
            "API response did not contain analysis."
        );
      }

      const analysis =
        data.analysis;

      setResult(analysis);

      /* ===================================================
         SAVE TASKS
      =================================================== */

      let existingTasks: TaskToSave[] = [];

      try {
        existingTasks =
          JSON.parse(
            localStorage.getItem(
              TASK_STORAGE_KEY
            ) || "[]"
          );
      } catch {
        existingTasks = [];
      }

      const tasksFromAI =
        Array.isArray(
          analysis.tasks
        )
          ? analysis.tasks
          : [];

      const newTasks: TaskToSave[] =
        tasksFromAI
          .filter(
            (task) =>
              task &&
              typeof task.title === "string" &&
              task.title.trim()
          )
          .map((task) => ({
            id: generateId("task"),

            title:
              task.title.trim(),

            deadline:
              task.deadline?.trim() || "",

            priority:
              normalizePriority(
                task.priority
              ),

            reason:
              task.reason?.trim() ||
              "This task was identified from the academic notice.",

            status: "PENDING",

            createdAt:
              new Date().toISOString(),
          }));

      /* ===================================================
         REMOVE DUPLICATE TASKS
      =================================================== */

      const uniqueNewTasks =
        newTasks.filter(
          (newTask, index, array) => {
            const key =
              `${normalizeTaskTitle(
                newTask.title
              )}|${normalizeDate(
                newTask.deadline
              )}`;

            /* Duplicate inside current AI response */

            const firstIndex =
              array.findIndex(
                (task) => {
                  const taskKey =
                    `${normalizeTaskTitle(
                      task.title
                    )}|${normalizeDate(
                      task.deadline
                    )}`;

                  return (
                    taskKey === key
                  );
                }
              );

            if (
              firstIndex !== index
            ) {
              return false;
            }

            /* Duplicate already saved */

            return !existingTasks.some(
              (existingTask) => {
                const existingKey =
                  `${normalizeTaskTitle(
                    existingTask.title
                  )}|${normalizeDate(
                    existingTask.deadline
                  )}`;

                return (
                  existingKey === key
                );
              }
            );
          }
        );

      const updatedTasks = [
        ...existingTasks,
        ...uniqueNewTasks,
      ];

      localStorage.setItem(
        TASK_STORAGE_KEY,
        JSON.stringify(
          updatedTasks
        )
      );

      setTasksSaved(
        uniqueNewTasks.length
      );

      console.log(
        `CampusPilot saved ${uniqueNewTasks.length} task(s).`
      );

      /* ===================================================
         SAVE CALENDAR EVENTS
      =================================================== */

      let existingEvents: EventToSave[] =
        [];

      try {
        existingEvents =
          JSON.parse(
            localStorage.getItem(
              EVENT_STORAGE_KEY
            ) || "[]"
          );
      } catch {
        existingEvents = [];
      }

      const datesFromAI =
        Array.isArray(
          analysis.important_dates
        )
          ? analysis.important_dates
          : [];

      const newEvents: EventToSave[] =
        datesFromAI
          .filter(
            (event) =>
              event &&
              typeof event.date === "string" &&
              event.date.trim()
          )
          .map((event) => ({
            id: generateId("event"),

            title:
              event.title?.trim() ||
              "Academic Event",

            date:
              event.date?.trim() || "",

            time:
              event.time?.trim() || "",

            location:
              event.location?.trim() || "",

            createdAt:
              new Date().toISOString(),
          }));

      /* ===================================================
         REMOVE DUPLICATE EVENTS
      =================================================== */

      const uniqueNewEvents =
        newEvents.filter(
          (newEvent, index, array) => {
            const key =
              `${normalizeText(
                newEvent.title
              )}|${normalizeDate(
                newEvent.date
              )}|${normalizeDate(
                newEvent.time
              )}|${normalizeText(
                newEvent.location
              )}`;

            /* Duplicate inside current AI response */

            const firstIndex =
              array.findIndex(
                (event) => {
                  const eventKey =
                    `${normalizeText(
                      event.title
                    )}|${normalizeDate(
                      event.date
                    )}|${normalizeDate(
                      event.time
                    )}|${normalizeText(
                      event.location
                    )}`;

                  return (
                    eventKey === key
                  );
                }
              );

            if (
              firstIndex !== index
            ) {
              return false;
            }

            /* Duplicate already in calendar */

            return !existingEvents.some(
              (existingEvent) => {
                const existingKey =
                  `${normalizeText(
                    existingEvent.title
                  )}|${normalizeDate(
                    existingEvent.date
                  )}|${normalizeDate(
                    existingEvent.time
                  )}|${normalizeText(
                    existingEvent.location
                  )}`;

                return (
                  existingKey === key
                );
              }
            );
          }
        );

      const updatedEvents = [
        ...existingEvents,
        ...uniqueNewEvents,
      ];

      localStorage.setItem(
        EVENT_STORAGE_KEY,
        JSON.stringify(
          updatedEvents
        )
      );

      setEventsSaved(
        uniqueNewEvents.length
      );

      console.log(
        `CampusPilot saved ${uniqueNewEvents.length} calendar event(s).`
      );
    } catch (err) {
      console.error(
        "CampusPilot analysis error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the notice."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     CLEAR
  ======================================================= */

  function clearNotice() {
    setText("");
    setResult(null);
    setError("");
    setTasksSaved(0);
    setEventsSaved(0);
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white md:px-8 md:py-12">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-10">

          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-400">
            CAMPUSPILOT AI AGENT
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Analyze Academic Notice
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">
            CampusPilot reads academic notices,
            extracts deadlines and requirements,
            creates actionable tasks, and decides
            what you should focus on next.
          </p>

        </header>

        {/* =================================================
            HOW IT WORKS
        ================================================= */}

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-5 text-3xl">
              📄
            </div>

            <h2 className="text-lg font-bold">
              Read Notice
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Understand the academic announcement.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-5 text-3xl">
              🤖
            </div>

            <h2 className="text-lg font-bold">
              AI Analysis
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Extract dates, tasks and requirements.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-5 text-3xl">
              🎯
            </div>

            <h2 className="text-lg font-bold">
              Prioritize
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Determine what needs attention first.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-5 text-3xl">
              ✅
            </div>

            <h2 className="text-lg font-bold">
              Take Action
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Save tasks and calendar events.
            </p>

          </div>

        </section>

        {/* =================================================
            NOTICE INPUT
        ================================================= */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-7">

          <div className="mb-5 flex items-center justify-between gap-4">

            <div>

              <h2 className="text-xl font-bold">
                Academic Notice
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Paste the content of your academic notice below.
              </p>

            </div>

            {text && (
              <button
                type="button"
                onClick={clearNotice}
                className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                Clear
              </button>
            )}

          </div>

          <textarea
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            placeholder="Paste the examination notice, assignment notice, college circular, or announcement here..."
            className="h-72 w-full resize-none rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          <div className="mt-5 flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={analyze}
              disabled={loading}
              className="rounded-xl bg-blue-500 px-7 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "🤖 Analyzing..."
                : "✨ Analyze Notice"}
            </button>

            {loading && (
              <span className="text-sm text-slate-500">
                CampusPilot AI is reading your notice...
              </span>
            )}

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-5">

              <p className="font-semibold text-red-300">
                Analysis failed
              </p>

              <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-400">
                {error}
              </pre>

            </div>
          )}

          {/* =================================================
              TASK SUCCESS
          ================================================= */}

          {tasksSaved > 0 && (
            <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 p-5">

              <p className="font-semibold text-green-300">
                ✓ {tasksSaved} task
                {tasksSaved !== 1 ? "s" : ""} added to CampusPilot
              </p>

              <p className="mt-1 text-sm text-green-400">
                Your actionable tasks are now available in Task Management.
              </p>

              <a
                href="/tasks"
                className="mt-3 inline-block rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/20"
              >
                View My Tasks →
              </a>

            </div>
          )}

          {/* =================================================
              EVENT SUCCESS
          ================================================= */}

          {eventsSaved > 0 && (
            <div className="mt-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">

              <p className="font-semibold text-blue-300">
                📅 {eventsSaved} calendar event
                {eventsSaved !== 1 ? "s" : ""} added
              </p>

              <p className="mt-1 text-sm text-blue-400">
                Important dates from the notice were added to your academic calendar.
              </p>

              <a
                href="/calendar"
                className="mt-3 inline-block rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
              >
                View Academic Calendar →
              </a>

            </div>
          )}

          {/* =================================================
              NOTHING NEW
          ================================================= */}

          {!loading &&
            result &&
            tasksSaved === 0 &&
            eventsSaved === 0 && (
              <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">

                <p className="font-semibold text-yellow-300">
                  ✓ Notice analyzed
                </p>

                <p className="mt-1 text-sm text-yellow-400">
                  No new tasks or calendar events were added.
                  They may already exist in CampusPilot.
                </p>

              </div>
            )}

        </section>

        {/* =================================================
            RESULTS
        ================================================= */}

        {result && (
          <div className="mt-10 space-y-6">

            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">

              <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                AI Summary
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                {result.summary}
              </h2>

              {result.category && (
                <span className="mt-4 inline-block rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
                  {result.category}
                </span>
              )}

            </section>

            {/* =================================================
                IMPORTANT DATES
            ================================================= */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <h2 className="text-xl font-bold">
                  📅 Important Dates
                </h2>

                {result.important_dates?.length > 0 && (
                  <a
                    href="/calendar"
                    className="text-sm font-semibold text-blue-400 hover:text-blue-300"
                  >
                    View Calendar →
                  </a>
                )}

              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                {result.important_dates?.length > 0 ? (
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
                          <p className="mt-2 text-sm text-slate-400">
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

            {/* =================================================
                TASKS
            ================================================= */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <h2 className="text-xl font-bold">
                  ✅ Actionable Tasks
                </h2>

                {result.tasks?.length > 0 && (
                  <a
                    href="/tasks"
                    className="text-sm font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Manage all tasks →
                  </a>
                )}

              </div>

              <div className="mt-5 space-y-3">

                {result.tasks?.length > 0 ? (
                  result.tasks.map(
                    (task, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-slate-950 p-5"
                      >

                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                          <div className="min-w-0">

                            <p className="font-semibold">
                              {task.title}
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {task.reason}
                            </p>

                            {task.deadline && (
                              <p className="mt-3 text-sm text-blue-400">
                                ⏰ Deadline: {task.deadline}
                              </p>
                            )}

                          </div>

                          <span
                            className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                              task.priority?.toUpperCase() ===
                              "URGENT"
                                ? "bg-red-500/10 text-red-300"
                                : task.priority?.toUpperCase() ===
                                  "HIGH"
                                ? "bg-orange-500/10 text-orange-300"
                                : task.priority?.toUpperCase() ===
                                  "MEDIUM"
                                ? "bg-yellow-500/10 text-yellow-300"
                                : "bg-green-500/10 text-green-300"
                            }`}
                          >
                            {task.priority || "MEDIUM"}
                          </span>

                        </div>

                      </div>
                    )
                  )
                ) : (
                  <p className="text-slate-500">
                    No tasks detected.
                  </p>
                )}

              </div>

            </section>

            {/* =================================================
                REQUIREMENTS
            ================================================= */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <h2 className="text-xl font-bold">
                📋 Requirements
              </h2>

              <div className="mt-5 space-y-3">

                {result.requirements?.length > 0 ? (
                  result.requirements.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-slate-950 p-4 text-sm text-slate-300"
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

            {/* =================================================
                WARNINGS
            ================================================= */}

            {result.warnings?.length > 0 && (
              <section className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6">

                <h2 className="text-xl font-bold text-orange-300">
                  ⚠️ Warnings & Conflicts
                </h2>

                <div className="mt-5 space-y-3">

                  {result.warnings.map(
                    (warning, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-slate-950 p-4 text-sm leading-6 text-orange-200"
                      >
                        {warning}
                      </div>
                    )
                  )}

                </div>

              </section>
            )}

            {/* =================================================
                SUGGESTED ACTIONS
            ================================================= */}

            <section className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">

              <h2 className="text-xl font-bold">
                🤖 Suggested Actions
              </h2>

              <div className="mt-5 space-y-3">

                {result.suggested_actions?.length > 0 ? (
                  result.suggested_actions.map(
                    (action, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-slate-950 p-5"
                      >

                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                          <div>

                            <p className="font-semibold">
                              {action.action}
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {action.reason}
                            </p>

                          </div>

                          {action.requires_approval && (
                            <span className="w-fit shrink-0 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
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

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="mt-10 flex flex-wrap gap-3">

          <a
            href="/"
            className="rounded-xl border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            ← Dashboard
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

      </div>
    </main>
  );
}