"use client";



import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { requireAuth } from "@/lib/auth";



type Task = {

  id?: string;

  title?: string;

  description?: string;

  deadline?: string;

  dueDate?: string;

  priority?: string;

  status?: string;

  completed?: boolean;

  category?: string;

};



type CalendarEvent = {

  id?: string;

  title?: string;

  date?: string;

  startDate?: string;

  time?: string;

  startTime?: string;

  location?: string;

  type?: string;

  description?: string;

};



const TASK_STORAGE_KEY = "campuspilot_tasks";

const EVENT_STORAGE_KEY = "campuspilot_events";



export default function AgentPage() {

  const [tasks, setTasks] = useState<Task[]>([]);

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [loading, setLoading] = useState(true);



  const loadData = useCallback(() => {

    try {

      const storedTasks = localStorage.getItem(TASK_STORAGE_KEY);

      const storedEvents = localStorage.getItem(EVENT_STORAGE_KEY);



      if (storedTasks) {

        const parsedTasks = JSON.parse(storedTasks);

        setTasks(Array.isArray(parsedTasks) ? parsedTasks : []);

      } else {

        setTasks([]);

      }



      if (storedEvents) {

        const parsedEvents = JSON.parse(storedEvents);

        setEvents(Array.isArray(parsedEvents) ? parsedEvents : []);

      } else {

        setEvents([]);

      }

    } catch (error) {

      console.error("Failed to load Agent data:", error);

      setTasks([]);

      setEvents([]);

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    if (!requireAuth()) return;



    loadData();



    const handleStorage = () => loadData();

    const handleFocus = () => loadData();



    window.addEventListener("storage", handleStorage);

    window.addEventListener("focus", handleFocus);



    return () => {

      window.removeEventListener("storage", handleStorage);

      window.removeEventListener("focus", handleFocus);

    };

  }, [loadData]);



  const pendingTasks = useMemo(() => {

    return tasks.filter((task) => {

      const status = String(task.status || "").toLowerCase();



      return (

        task.completed !== true &&

        status !== "completed" &&

        status !== "done"

      );

    });

  }, [tasks]);



  const getTaskDate = (task: Task) => {

    return task.deadline || task.dueDate || "";

  };



  const getEventDate = (event: CalendarEvent) => {

    return event.date || event.startDate || "";

  };



  const parseDate = (value: string) => {

    if (!value) return null;



    const date = new Date(value);



    if (Number.isNaN(date.getTime())) {

      return null;

    }



    return date;

  };



  const today = new Date();



  const getDaysRemaining = (dateString: string) => {

    const date = parseDate(dateString);



    if (!date) return null;



    const now = new Date();



    const startToday = new Date(

      now.getFullYear(),

      now.getMonth(),

      now.getDate()

    );



    const targetDate = new Date(

      date.getFullYear(),

      date.getMonth(),

      date.getDate()

    );



    const difference =

      targetDate.getTime() - startToday.getTime();



    return Math.ceil(

      difference / (1000 * 60 * 60 * 24)

    );

  };



  const priorityValue = (priority?: string) => {

    const value = String(priority || "").toLowerCase();



    if (value.includes("urgent")) return 4;

    if (value.includes("high")) return 3;

    if (value.includes("medium")) return 2;

    if (value.includes("low")) return 1;



    return 0;

  };



  /*

   * Determines the most important task.

   *

   * Priority is checked first.

   * If two tasks have the same priority,

   * the task with the earlier deadline wins.

   */

  const mostImportantTask = useMemo(() => {

    if (pendingTasks.length === 0) return null;



    return [...pendingTasks].sort((a, b) => {

      const priorityDifference =

        priorityValue(b.priority) - priorityValue(a.priority);



      if (priorityDifference !== 0) {

        return priorityDifference;

      }



      const aDate = parseDate(getTaskDate(a));

      const bDate = parseDate(getTaskDate(b));



      if (aDate && bDate) {

        return aDate.getTime() - bDate.getTime();

      }



      if (aDate) return -1;

      if (bDate) return 1;



      return 0;

    })[0];

  }, [pendingTasks]);



  const upcomingTasks = useMemo(() => {

    return [...pendingTasks]

      .filter((task) => parseDate(getTaskDate(task)))

      .sort((a, b) => {

        const aDate = parseDate(getTaskDate(a))!;

        const bDate = parseDate(getTaskDate(b))!;



        return aDate.getTime() - bDate.getTime();

      })

      .slice(0, 5);

  }, [pendingTasks]);



  const upcomingEvents = useMemo(() => {

    return [...events]

      .filter((event) => parseDate(getEventDate(event)))

      .sort((a, b) => {

        const aDate = parseDate(getEventDate(a))!;

        const bDate = parseDate(getEventDate(b))!;



        return aDate.getTime() - bDate.getTime();

      })

      .filter((event) => {

        const date = parseDate(getEventDate(event));



        if (!date) return false;



        return (

          date >=

          new Date(

            today.getFullYear(),

            today.getMonth(),

            today.getDate()

          )

        );

      })

      .slice(0, 5);

  }, [events]);



  const urgentTasks = useMemo(() => {

    return pendingTasks.filter((task) => {

      const days = getDaysRemaining(getTaskDate(task));



      return (

        priorityValue(task.priority) >= 3 ||

        (days !== null && days <= 2)

      );

    });

  }, [pendingTasks]);



  const formatDate = (value: string) => {

    const date = parseDate(value);



    if (!date) return "No deadline";



    return date.toLocaleDateString("en-IN", {

      day: "numeric",

      month: "short",

      year: "numeric",

    });

  };



  const getDeadlineText = (value: string) => {

    const days = getDaysRemaining(value);



    if (days === null) return "No deadline";



    if (days < 0) {

      const overdue = Math.abs(days);



      return overdue === 1

        ? "1 day overdue"

        : `${overdue} days overdue`;

    }



    if (days === 0) return "Due today";



    if (days === 1) return "Due tomorrow";



    return `${days} days remaining`;

  };



  const getPriorityClass = (priority?: string) => {

    const value = String(priority || "").toLowerCase();



    if (value.includes("urgent") || value.includes("high")) {

      return "priority-high";

    }



    if (value.includes("medium")) {

      return "priority-medium";

    }



    return "priority-normal";

  };

    if (loading) {

    return (

      <main className="page">

        <div className="loading-card">

          <div className="spinner"></div>

          <p>Loading CampusPilot Agent...</p>

        </div>



        <style jsx>{styles}</style>

      </main>

    );

  }



  const importantTaskDays = mostImportantTask

    ? getDaysRemaining(getTaskDate(mostImportantTask))

    : null;



  const importantTaskDeadlineMessage =

    importantTaskDays === null

      ? "No deadline"

      : importantTaskDays < 0

        ? Math.abs(importantTaskDays) === 1

          ? "1 day overdue"

          : `${Math.abs(importantTaskDays)} days overdue`

        : importantTaskDays === 0

          ? "today"

          : importantTaskDays === 1

            ? "tomorrow"

            : `in ${importantTaskDays} days`;



  return (

    <main className="page">

      <div className="container">

        {/* HEADER */}

        <header className="header">

          <div>

            <div className="brand">

              <span className="brand-icon">✦</span>

              <span>CampusPilot</span>

            </div>



            <h1>CampusPilot Agent</h1>



            <p className="subtitle">

              Your academic assistant that tells you what to do next.

            </p>

          </div>



          <div className="agent-status">

            <span className="status-dot"></span>

            Agent Active

          </div>

        </header>



        {/* NEXT BEST ACTION */}

        <section className="hero-card">

          <div className="hero-label">

            <span>✦</span>

            NEXT BEST ACTION

          </div>



          {mostImportantTask ? (

            <>

              <h2>

                {mostImportantTask.title ||

                  "Complete your pending task"}

              </h2>



              <p className="hero-description">

                {mostImportantTask.description ||

                  "This is currently your most important pending academic task."}

              </p>



              <div className="hero-details">

                <div>

                  <span className="detail-label">

                    Deadline

                  </span>



                  <strong>

                    {formatDate(

                      getTaskDate(mostImportantTask)

                    )}

                  </strong>

                </div>



                <div>

                  <span className="detail-label">

                    Status

                  </span>



                  <strong>

                    {getDeadlineText(

                      getTaskDate(mostImportantTask)

                    )}

                  </strong>

                </div>



                <div>

                  <span className="detail-label">

                    Priority

                  </span>



                  <strong

                    className={getPriorityClass(

                      mostImportantTask.priority

                    )}

                  >

                    {mostImportantTask.priority || "Normal"}

                  </strong>

                </div>

              </div>



              <div className="hero-actions">

                <Link

                  href="/tasks"

                  className="primary-button"

                >

                  View Task

                </Link>



                <Link

                  href="/calendar"

                  className="secondary-button"

                >

                  View Calendar

                </Link>

              </div>

            </>

          ) : (

            <div className="empty-hero">

              <div className="success-icon">✓</div>



              <h2>You're all caught up!</h2>



              <p>

                There are no pending tasks right now.

                Great job.

              </p>



              <Link

                href="/upload"

                className="primary-button"

              >

                Upload New Notice

              </Link>

            </div>

          )}

        </section>



        {/* QUICK STATS */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon blue">✓</div>



            <div>

              <span>Pending Tasks</span>

              <strong>{pendingTasks.length}</strong>

            </div>

          </div>



          <div className="stat-card">

            <div className="stat-icon red">!</div>



            <div>

              <span>Urgent Tasks</span>

              <strong>{urgentTasks.length}</strong>

            </div>

          </div>



          <div className="stat-card">

            <div className="stat-icon purple">◷</div>



            <div>

              <span>Upcoming Events</span>

              <strong>{upcomingEvents.length}</strong>

            </div>

          </div>

        </section>



        {/* DEADLINE WARNING */}

        {mostImportantTask &&

          importantTaskDays !== null &&

          importantTaskDays <= 2 && (

            <section className="warning-card">

              <div className="warning-icon">⚠</div>



              <div>

                <h3>

                  {importantTaskDays < 0

                    ? "Overdue Task"

                    : "Deadline Alert"}

                </h3>



                <p>

                  <strong>

                    {mostImportantTask.title ||

                      "Your task"}

                  </strong>{" "}



                  {importantTaskDays < 0

                    ? `is ${importantTaskDeadlineMessage}.`

                    : `is due ${importantTaskDeadlineMessage}.`}

                </p>

              </div>

            </section>

          )}



        {/* TWO COLUMN AREA */}

        <div className="content-grid">

          {/* PRIORITY TASKS */}

          <section className="panel">

            <div className="panel-header">

              <div>

                <h2>Priority Tasks</h2>

                <p>What needs your attention first</p>

              </div>



              <Link

                href="/tasks"

                className="view-link"

              >

                View all →

              </Link>

            </div>



            {upcomingTasks.length > 0 ? (

              <div className="task-list">

                {upcomingTasks.map((task, index) => {

                  const days = getDaysRemaining(

                    getTaskDate(task)

                  );



                  return (

                    <div

                      className="task-item"

                      key={task.id || index}

                    >

                      <div className="task-number">

                        {index + 1}

                      </div>



                      <div className="task-content">

                        <h3>

                          {task.title ||

                            "Untitled task"}

                        </h3>



                        <div className="task-meta">

                          <span>

                            📅{" "}

                            {formatDate(

                              getTaskDate(task)

                            )}

                          </span>



                          <span

                            className={

                              days !== null &&

                              days <= 2

                                ? "deadline-danger"

                                : ""

                            }

                          >

                            {getDeadlineText(

                              getTaskDate(task)

                            )}

                          </span>

                        </div>

                      </div>



                      <span

                        className={`priority-badge ${getPriorityClass(

                          task.priority

                        )}`}

                      >

                        {task.priority || "Normal"}

                      </span>

                    </div>

                  );

                })}

              </div>

            ) : (

              <div className="empty-state">

                <span>✓</span>

                <p>No pending tasks.</p>

              </div>

            )}

          </section>



          {/* UPCOMING EVENTS */}

          <section className="panel">

            <div className="panel-header">

              <div>

                <h2>Upcoming Events</h2>

                <p>Your next academic events</p>

              </div>



              <Link

                href="/calendar"

                className="view-link"

              >

                Calendar →

              </Link>

            </div>



            {upcomingEvents.length > 0 ? (

              <div className="event-list">

                {upcomingEvents.map((event, index) => (

                  <div

                    className="event-item"

                    key={event.id || index}

                  >

                    <div className="event-date">

                      <strong>

                        {parseDate(

                          getEventDate(event)

                        )?.getDate() || "--"}

                      </strong>



                      <span>

                        {parseDate(

                          getEventDate(event)

                        )?.toLocaleDateString(

                          "en-IN",

                          { month: "short" }

                        ) || ""}

                      </span>

                    </div>



                    <div className="event-content">

                      <h3>

                        {event.title ||

                          "Academic Event"}

                      </h3>



                      {event.time && (

                        <p>🕐 {event.time}</p>

                      )}



                      {event.startTime &&

                        !event.time && (

                          <p>

                            🕐 {event.startTime}

                          </p>

                        )}



                      {event.location && (

                        <p>

                          📍 {event.location}

                        </p>

                      )}

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              <div className="empty-state">

                <span>◷</span>

                <p>No upcoming events.</p>

              </div>

            )}

          </section>

        </div>



        {/* AGENT INSIGHT */}

        <section className="insight-card">

          <div className="insight-icon">✦</div>



          <div>

            <h2>Agent Insight</h2>



            {mostImportantTask ? (

              <p>

                Based on your current tasks and

                deadlines, your highest-priority action

                is{" "}

                <strong>

                  {mostImportantTask.title ||

                    "your next pending task"}

                </strong>

                . Complete it before{" "}

                <strong>

                  {formatDate(

                    getTaskDate(mostImportantTask)

                  )}

                </strong>

                .

              </p>

            ) : (

              <p>

                Your academic workload is currently

                clear. Upload a new notice whenever you

                receive one and CampusPilot will analyze

                it automatically.

              </p>

            )}

          </div>

        </section>



        {/* QUICK ACTIONS */}

        <section className="quick-actions">

          <h2>Quick Actions</h2>



          <div className="quick-grid">

            <Link

              href="/upload"

              className="quick-card"

            >

              <span>📄</span>



              <div>

                <strong>Analyze Notice</strong>

                <small>

                  Upload a new academic notice

                </small>

              </div>

            </Link>



            <Link

              href="/tasks"

              className="quick-card"

            >

              <span>✓</span>



              <div>

                <strong>Manage Tasks</strong>

                <small>

                  View and complete your tasks

                </small>

              </div>

            </Link>



            <Link

              href="/calendar"

              className="quick-card"

            >

              <span>📅</span>



              <div>

                <strong>Open Calendar</strong>

                <small>

                  See your academic schedule

                </small>

              </div>

            </Link>



            <Link

              href="/reminders"

              className="quick-card"

            >

              <span>🔔</span>



              <div>

                <strong>Reminders</strong>

                <small>

                  Manage your reminders

                </small>

              </div>

            </Link>

          </div>

        </section>



        {/* NAVIGATION */}

        <nav className="bottom-nav">

          <Link href="/dashboard">

            Dashboard

          </Link>



          <Link

            href="/agent"

            className="active"

          >

            Agent

          </Link>



          <Link href="/tasks">

            Tasks

          </Link>



          <Link href="/calendar">

            Calendar

          </Link>



          <Link href="/reminders">

            Reminders

          </Link>

        </nav>

      </div>



      <style jsx>{styles}</style>

    </main>

  );

}

const styles = `

  * {

    box-sizing: border-box;

  }



  .page {

    min-height: 100vh;

    background:

      radial-gradient(

        circle at top left,

        rgba(99, 102, 241, 0.12),

        transparent 35%

      ),

      #f7f8fc;

    color: #111827;

    padding: 32px 20px 80px;

  }



  .container {

    width: min(1180px, 100%);

    margin: 0 auto;

  }



  .header {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    gap: 20px;

    margin-bottom: 30px;

  }



  .brand {

    display: flex;

    align-items: center;

    gap: 8px;

    font-weight: 800;

    font-size: 15px;

    color: #4f46e5;

    margin-bottom: 10px;

  }



  .brand-icon {

    display: grid;

    place-items: center;

    width: 27px;

    height: 27px;

    border-radius: 8px;

    background: #4f46e5;

    color: white;

  }



  .header h1 {

    margin: 0;

    font-size: clamp(28px, 4vw, 42px);

    letter-spacing: -1px;

  }



  .subtitle {

    margin: 8px 0 0;

    color: #6b7280;

    font-size: 15px;

    line-height: 1.5;

  }



  .agent-status {

    display: flex;

    align-items: center;

    gap: 8px;

    background: white;

    border: 1px solid #e5e7eb;

    padding: 10px 14px;

    border-radius: 999px;

    font-size: 13px;

    font-weight: 700;

    color: #374151;

    white-space: nowrap;

  }



  .status-dot {

    width: 9px;

    height: 9px;

    background: #22c55e;

    border-radius: 50%;

    box-shadow: 0 0 0 4px #dcfce7;

  }



  .hero-card {

    background: linear-gradient(

      135deg,

      #312e81,

      #4f46e5

    );

    color: white;

    border-radius: 24px;

    padding: 32px;

    box-shadow: 0 20px 50px rgba(79, 70, 229, 0.22);

    margin-bottom: 20px;

  }



  .hero-label {

    display: flex;

    align-items: center;

    gap: 7px;

    font-size: 12px;

    font-weight: 800;

    letter-spacing: 1.3px;

    opacity: 0.85;

  }



  .hero-card h2 {

    margin: 12px 0 8px;

    font-size: clamp(25px, 4vw, 36px);

    letter-spacing: -0.7px;

    line-height: 1.2;

  }



  .hero-description {

    max-width: 720px;

    margin: 0;

    color: rgba(255, 255, 255, 0.82);

    line-height: 1.6;

  }



  .hero-details {

    display: flex;

    flex-wrap: wrap;

    gap: 34px;

    margin-top: 25px;

  }



  .hero-details > div {

    display: flex;

    flex-direction: column;

    gap: 5px;

  }



  .detail-label {

    font-size: 11px;

    text-transform: uppercase;

    letter-spacing: 0.8px;

    color: rgba(255, 255, 255, 0.6);

  }



  .hero-details strong {

    font-size: 15px;

  }



  .priority-high {

    color: #dc2626;

  }



  .hero-details .priority-high {

    color: #fecaca;

  }



  .hero-details .priority-medium {

    color: #fde68a;

  }



  .hero-actions {

    display: flex;

    flex-wrap: wrap;

    gap: 10px;

    margin-top: 28px;

  }



  .primary-button,

  .secondary-button {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    min-height: 42px;

    padding: 0 17px;

    border-radius: 10px;

    text-decoration: none;

    font-size: 14px;

    font-weight: 700;

    transition:

      transform 0.2s ease,

      background 0.2s ease,

      box-shadow 0.2s ease;

  }



  .primary-button {

    background: white;

    color: #3730a3;

  }



  .primary-button:hover {

    transform: translateY(-1px);

    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);

  }



  .secondary-button {

    color: white;

    border: 1px solid rgba(255, 255, 255, 0.3);

    background: rgba(255, 255, 255, 0.08);

  }



  .secondary-button:hover {

    background: rgba(255, 255, 255, 0.15);

    transform: translateY(-1px);

  }



  .empty-hero {

    padding-top: 15px;

  }



  .success-icon {

    width: 45px;

    height: 45px;

    border-radius: 50%;

    background: #dcfce7;

    color: #16a34a;

    display: grid;

    place-items: center;

    font-size: 23px;

    font-weight: 900;

    margin-bottom: 12px;

  }



  .stats-grid {

    display: grid;

    grid-template-columns: repeat(3, 1fr);

    gap: 16px;

    margin-bottom: 20px;

  }



  .stat-card {

    background: white;

    border: 1px solid #e5e7eb;

    border-radius: 18px;

    padding: 20px;

    display: flex;

    align-items: center;

    gap: 15px;

  }



  .stat-icon {

    width: 43px;

    height: 43px;

    border-radius: 12px;

    display: grid;

    place-items: center;

    font-weight: 900;

    flex-shrink: 0;

  }



  .stat-icon.blue {

    background: #dbeafe;

    color: #2563eb;

  }



  .stat-icon.red {

    background: #fee2e2;

    color: #dc2626;

  }



  .stat-icon.purple {

    background: #ede9fe;

    color: #7c3aed;

  }



  .stat-card span {

    display: block;

    color: #6b7280;

    font-size: 13px;

    margin-bottom: 4px;

  }



  .stat-card strong {

    font-size: 25px;

  }



  .warning-card {

    display: flex;

    align-items: flex-start;

    gap: 14px;

    background: #fff7ed;

    border: 1px solid #fed7aa;

    border-radius: 16px;

    padding: 18px 20px;

    margin-bottom: 20px;

  }



  .warning-icon {

    width: 38px;

    height: 38px;

    flex-shrink: 0;

    display: grid;

    place-items: center;

    background: #ffedd5;

    color: #ea580c;

    border-radius: 10px;

    font-weight: 900;

  }



  .warning-card h3 {

    margin: 0 0 4px;

    font-size: 15px;

  }



  .warning-card p {

    margin: 0;

    color: #7c2d12;

    font-size: 14px;

    line-height: 1.5;

  }



  .content-grid {

    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 20px;

  }



  .panel {

    background: white;

    border: 1px solid #e5e7eb;

    border-radius: 20px;

    overflow: hidden;

  }



  .panel-header {

    display: flex;

    justify-content: space-between;

    gap: 15px;

    padding: 22px 22px 17px;

    border-bottom: 1px solid #f0f0f0;

  }



  .panel-header h2 {

    margin: 0;

    font-size: 18px;

  }



  .panel-header p {

    margin: 4px 0 0;

    color: #9ca3af;

    font-size: 12px;

  }



  .view-link {

    color: #4f46e5;

    text-decoration: none;

    font-size: 12px;

    font-weight: 700;

    white-space: nowrap;

  }



  .view-link:hover {

    text-decoration: underline;

  }



  .task-list,

  .event-list {

    padding: 8px 0;

  }



  .task-item {

    display: flex;

    align-items: center;

    gap: 12px;

    padding: 15px 20px;

    border-bottom: 1px solid #f3f4f6;

  }



  .task-item:last-child,

  .event-item:last-child {

    border-bottom: 0;

  }



  .task-number {

    width: 29px;

    height: 29px;

    border-radius: 9px;

    background: #eef2ff;

    color: #4f46e5;

    display: grid;

    place-items: center;

    font-size: 12px;

    font-weight: 800;

    flex-shrink: 0;

  }



  .task-content {

    min-width: 0;

    flex: 1;

  }



  .task-content h3,

  .event-content h3 {

    margin: 0;

    font-size: 14px;

    line-height: 1.4;

    overflow-wrap: anywhere;

  }



  .task-meta {

    display: flex;

    flex-wrap: wrap;

    gap: 10px;

    margin-top: 5px;

    color: #9ca3af;

    font-size: 11px;

  }



  .deadline-danger {

    color: #dc2626;

    font-weight: 700;

  }



  .priority-badge {

    border-radius: 999px;

    padding: 5px 8px;

    font-size: 10px;

    font-weight: 800;

    background: #f3f4f6;

    color: #6b7280;

    flex-shrink: 0;

  }



  .priority-badge.priority-high {

    background: #fee2e2;

    color: #b91c1c;

  }



  .priority-badge.priority-medium {

    background: #fef3c7;

    color: #92400e;

  }



  .event-item {

    display: flex;

    gap: 14px;

    padding: 15px 20px;

    border-bottom: 1px solid #f3f4f6;

  }



  .event-date {

    width: 45px;

    height: 50px;

    flex-shrink: 0;

    border-radius: 11px;

    background: #eef2ff;

    color: #4338ca;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

  }



  .event-date strong {

    font-size: 18px;

    line-height: 1;

  }



  .event-date span {

    font-size: 9px;

    text-transform: uppercase;

    font-weight: 800;

    margin-top: 4px;

  }



  .event-content {

    padding-top: 2px;

    min-width: 0;

  }



  .event-content p {

    margin: 5px 0 0;

    color: #9ca3af;

    font-size: 11px;

  }



  .empty-state {

    min-height: 150px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    color: #9ca3af;

    gap: 8px;

  }



  .empty-state span {

    font-size: 28px;

  }



  .empty-state p {

    margin: 0;

    font-size: 13px;

  }



  .insight-card {

    display: flex;

    gap: 15px;

    align-items: flex-start;

    margin-top: 20px;

    background: #eef2ff;

    border: 1px solid #c7d2fe;

    border-radius: 18px;

    padding: 20px;

  }



  .insight-icon {

    width: 40px;

    height: 40px;

    border-radius: 11px;

    display: grid;

    place-items: center;

    background: #4f46e5;

    color: white;

    flex-shrink: 0;

  }



  .insight-card h2 {

    margin: 0 0 5px;

    font-size: 15px;

  }



  .insight-card p {

    margin: 0;

    color: #4b5563;

    line-height: 1.6;

    font-size: 13px;

  }



  .quick-actions {

    margin-top: 28px;

  }



  .quick-actions > h2 {

    margin: 0 0 14px;

    font-size: 18px;

  }



  .quick-grid {

    display: grid;

    grid-template-columns: repeat(4, 1fr);

    gap: 12px;

  }



  .quick-card {

    display: flex;

    align-items: center;

    gap: 11px;

    background: white;

    border: 1px solid #e5e7eb;

    border-radius: 15px;

    padding: 15px;

    text-decoration: none;

    color: inherit;

    transition:

      transform 0.2s ease,

      border-color 0.2s ease,

      box-shadow 0.2s ease;

  }



  .quick-card:hover {

    border-color: #c7d2fe;

    transform: translateY(-2px);

    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);

  }



  .quick-card > span {

    font-size: 20px;

    flex-shrink: 0;

  }



  .quick-card strong {

    display: block;

    font-size: 13px;

  }



  .quick-card small {

    display: block;

    margin-top: 3px;

    color: #9ca3af;

    font-size: 10px;

    line-height: 1.4;

  }



  .bottom-nav {

    display: flex;

    justify-content: center;

    flex-wrap: wrap;

    gap: 8px;

    margin-top: 35px;

    padding: 12px;

    background: white;

    border: 1px solid #e5e7eb;

    border-radius: 16px;

  }



  .bottom-nav a {

    padding: 9px 14px;

    border-radius: 9px;

    color: #6b7280;

    text-decoration: none;

    font-size: 12px;

    font-weight: 700;

    transition:

      background 0.2s ease,

      color 0.2s ease;

  }



  .bottom-nav a:hover,

  .bottom-nav a.active {

    background: #eef2ff;

    color: #4f46e5;

  }



  .loading-card {

    width: min(500px, 100%);

    margin: 100px auto;

    background: white;

    border: 1px solid #e5e7eb;

    border-radius: 20px;

    padding: 35px;

    text-align: center;

  }



  .loading-card p {

    color: #6b7280;

    margin: 15px 0 0;

  }



  .spinner {

    width: 35px;

    height: 35px;

    border: 4px solid #e5e7eb;

    border-top-color: #4f46e5;

    border-radius: 50%;

    margin: 0 auto;

    animation: spin 0.8s linear infinite;

  }



  @keyframes spin {

    to {

      transform: rotate(360deg);

    }

  }



  @media (max-width: 850px) {

    .content-grid {

      grid-template-columns: 1fr;

    }



    .quick-grid {

      grid-template-columns: repeat(2, 1fr);

    }

  }



  @media (max-width: 650px) {

    .page {

      padding: 22px 14px 60px;

    }



    .header {

      flex-direction: column;

    }



    .agent-status {

      align-self: flex-start;

    }



    .hero-card {

      padding: 24px;

      border-radius: 20px;

    }



    .stats-grid {

      grid-template-columns: 1fr;

    }



    .hero-details {

      gap: 18px;

    }



    .hero-actions {

      flex-direction: column;

    }



    .primary-button,

    .secondary-button {

      width: 100%;

    }



    .quick-grid {

      grid-template-columns: 1fr;

    }



    .task-item {

      align-items: flex-start;

    }



    .priority-badge {

      display: none;

    }



    .bottom-nav {

      justify-content: flex-start;

      overflow-x: auto;

      flex-wrap: nowrap;

    }



    .bottom-nav a {

      flex-shrink: 0;

    }



    .warning-card {

      padding: 16px;

    }



    .insight-card {

      padding: 17px;

    }

  }

`;