import { GoogleGenAI, Type } from "@google/genai";
import type { CampusAnalysis } from "./types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    "GEMINI_API_KEY is not configured. CampusPilot AI analysis will not work."
  );
}

const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
    })
  : null;

/* =========================================================
   ANALYZE ACADEMIC NOTICE
========================================================= */

export async function analyzeNotice(
  noticeText: string
): Promise<CampusAnalysis> {
  if (!noticeText || !noticeText.trim()) {
    throw new Error("Notice text cannot be empty.");
  }

  if (!ai) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add GEMINI_API_KEY to .env.local and restart the development server."
    );
  }

  const prompt = `
You are CampusPilot, an intelligent academic assistant for college students.

Read the academic notice below and extract ONLY information actually
present in the notice.

==============================
ACADEMIC NOTICE
==============================

${noticeText}

==============================
STRICT RULES
==============================

1. READ THE COMPLETE NOTICE.

2. NEVER INVENT INFORMATION.

Never invent:
- dates
- deadlines
- times
- locations
- room numbers
- requirements
- policies
- consequences
- tasks
- approvals

If something is not present, return an empty string or empty array.

3. DO NOT CREATE GENERIC TASKS.

NEVER create tasks such as:

- Verify Examination Details
- Verify Exam Details
- Complete All Required Formalities
- Complete Required Formalities
- Check All Details
- Confirm All Details
- Review Examination Details
- Review the Notice
- Prepare for Examination
- Prepare for Exam
- Ensure Everything Is Ready

unless the notice explicitly instructs the student to perform that
specific action.

4. A TASK MUST BE AN ACTUAL ACTION.

Create a task only when the notice explicitly requires the student to:

- submit something
- report something
- register
- complete a specified action
- carry something
- bring something
- obtain something

Do not turn general advice or requirements into tasks.

==============================
IMPORTANT DATES
==============================

Create calendar events for meaningful academic dates such as:

- examination date
- examination form deadline
- registration deadline
- assignment deadline
- scheduling conflict deadline
- academic event

Do NOT create a calendar event for every task.

Example:

Notice:
"Students must submit the examination form by October 7, 2026."

Calendar event:

{
  "title": "End Semester Examination Form Submission Deadline",
  "date": "October 7, 2026"
}

The corresponding task is:

"Submit End Semester Examination Form"

Do not create a second calendar event for that task.

==============================
EXAMINATION EVENT
==============================

If an examination is mentioned, create ONE calendar event.

Include the exact information available:

- examination name
- date
- time
- location

Example:

{
  "title": "Signals and Systems End Semester Examination",
  "date": "October 10, 2026",
  "time": "2:00 PM to 5:00 PM",
  "location": "Room S125"
}

If time or location is missing, use an empty string.

==============================
DUPLICATE EVENTS
==============================

If multiple sentences describe the same deadline or examination,
create only ONE calendar event.

Example:

"Submit form by October 7."

and

"Form submission closes October 7."

These are the SAME event.

==============================
TASKS
==============================

Only create tasks explicitly supported by the notice.

Example:

"Students must submit the examination form by October 7."

Create:

{
  "title": "Submit End Semester Examination Form",
  "deadline": "October 7, 2026",
  "priority": "URGENT",
  "reason": "Mandatory for appearing in the End Semester Examination."
}

Example:

"Students must report scheduling conflicts by October 8."

Create:

{
  "title": "Report Scheduling Conflict",
  "deadline": "October 8, 2026",
  "priority": "HIGH",
  "reason": "Required to resolve any scheduling conflict before the examination."
}

==============================
REQUIREMENTS
==============================

Requirements are things the student must have, carry, or satisfy.

Examples:

- Valid Institute ID Card
- Examination Admit Card
- Required documents
- Completed registration

A requirement is NOT automatically a task.

Only create a task when the notice explicitly instructs the student
to carry, bring, prepare, submit, or obtain that requirement.

==============================
WARNINGS
==============================

Extract only warnings explicitly supported by the notice.

Examples:

- Failure to submit the form may prevent examination eligibility.
- Students without required documents may not be permitted to enter.
- Scheduling conflicts must be reported by the deadline.

Never invent warnings.

==============================
SUGGESTED ACTIONS
==============================

Suggested actions must be based only on the notice.

Good examples:

- Submit End Semester Examination Form
- Report Scheduling Conflict
- Prepare Valid Institute ID Card
- Prepare Examination Admit Card

Do NOT suggest unrelated actions such as:

- Study for the examination
- Revise the syllabus
- Review course material

unless explicitly mentioned.

requires_approval = true ONLY when the action requires contacting
or obtaining approval from:

- professor
- department
- administration
- examination office
- academic authority

Otherwise use false.

==============================
PRIORITY
==============================

Use ONLY:

URGENT
HIGH
MEDIUM
LOW

URGENT:
- Mandatory action
- Very close deadline
- Failure can make student ineligible
- Required for examination entry

HIGH:
- Important mandatory action
- Missing it creates a significant issue

MEDIUM:
- Important but not immediately urgent

LOW:
- Minor reminder

Do not mark every task as URGENT.

==============================
DATE FORMAT
==============================

Use:

Month Day, Year

Example:

October 7, 2026

==============================
TIME FORMAT
==============================

Preserve the exact time from the notice.

==============================
LOCATION
==============================

Preserve the exact location or room number.

==============================
SUMMARY
==============================

Provide a concise student-friendly summary.

==============================
CATEGORY
==============================

Use one of:

- Examination
- Registration
- Assignment
- Academic Event
- Department Notice
- General Academic
- Deadline

==============================
FINAL CHECK
==============================

Before returning the JSON, verify:

- No invented information
- No generic tasks
- No duplicate tasks
- No duplicate calendar events
- Every task is explicitly supported by the notice
- Every requirement is supported by the notice
- Every warning is supported by the notice

Return ONLY valid JSON.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",

      contents: prompt,

      config: {
        temperature: 0.1,

        responseMimeType: "application/json",

        responseSchema: {
          type: Type.OBJECT,

          properties: {
            summary: {
              type: Type.STRING,
            },

            category: {
              type: Type.STRING,
            },

            important_dates: {
              type: Type.ARRAY,

              items: {
                type: Type.OBJECT,

                properties: {
                  title: {
                    type: Type.STRING,
                  },

                  date: {
                    type: Type.STRING,
                  },

                  time: {
                    type: Type.STRING,
                  },

                  location: {
                    type: Type.STRING,
                  },
                },

                required: [
                  "title",
                  "date",
                ],
              },
            },

            tasks: {
              type: Type.ARRAY,

              items: {
                type: Type.OBJECT,

                properties: {
                  title: {
                    type: Type.STRING,
                  },

                  deadline: {
                    type: Type.STRING,
                  },

                  priority: {
                    type: Type.STRING,
                  },

                  reason: {
                    type: Type.STRING,
                  },
                },

                required: [
                  "title",
                  "priority",
                  "reason",
                ],
              },
            },

            requirements: {
              type: Type.ARRAY,

              items: {
                type: Type.STRING,
              },
            },

            warnings: {
              type: Type.ARRAY,

              items: {
                type: Type.STRING,
              },
            },

            suggested_actions: {
              type: Type.ARRAY,

              items: {
                type: Type.OBJECT,

                properties: {
                  action: {
                    type: Type.STRING,
                  },

                  reason: {
                    type: Type.STRING,
                  },

                  requires_approval: {
                    type: Type.BOOLEAN,
                  },
                },

                required: [
                  "action",
                  "reason",
                  "requires_approval",
                ],
              },
            },
          },

          required: [
            "summary",
            "category",
            "important_dates",
            "tasks",
            "requirements",
            "warnings",
            "suggested_actions",
          ],
        },
      },
    });

    const rawText = response.text;

    if (!rawText) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    console.log(
      "CampusPilot Gemini analysis:",
      rawText
    );

    let parsed: CampusAnalysis;

    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      console.error(
        "Failed to parse Gemini JSON:",
        error
      );

      throw new Error(
        "Gemini returned invalid JSON."
      );
    }

    /* =====================================================
       NORMALIZE RESPONSE
    ===================================================== */

    const analysis: CampusAnalysis = {
      summary:
        typeof parsed.summary === "string" &&
        parsed.summary.trim()
          ? parsed.summary.trim()
          : "Academic notice analyzed.",

      category:
        typeof parsed.category === "string" &&
        parsed.category.trim()
          ? parsed.category.trim()
          : "Academic Notice",

      important_dates:
        Array.isArray(
          parsed.important_dates
        )
          ? parsed.important_dates
              .filter(
                (event) =>
                  event &&
                  typeof event === "object"
              )
              .map((event) => ({
                title:
                  typeof event.title === "string" &&
                  event.title.trim()
                    ? event.title.trim()
                    : "Academic Event",

                date:
                  typeof event.date === "string"
                    ? event.date.trim()
                    : "",

                time:
                  typeof event.time === "string"
                    ? event.time.trim()
                    : "",

                location:
                  typeof event.location === "string"
                    ? event.location.trim()
                    : "",
              }))
              .filter(
                (event) =>
                  event.date.length > 0
              )
          : [],

      tasks:
        Array.isArray(parsed.tasks)
          ? parsed.tasks
              .filter(
                (task) =>
                  task &&
                  typeof task === "object"
              )
              .map((task) => ({
                title:
                  typeof task.title === "string" &&
                  task.title.trim()
                    ? task.title.trim()
                    : "Academic Task",

                deadline:
                  typeof task.deadline === "string"
                    ? task.deadline.trim()
                    : "",

                priority:
                  normalizePriority(
                    task.priority
                  ),

                reason:
                  typeof task.reason === "string" &&
                  task.reason.trim()
                    ? task.reason.trim()
                    : "This task was identified from the academic notice.",
              }))
              .filter(
                (task) =>
                  task.title.length > 0
              )
          : [],

      requirements:
        Array.isArray(parsed.requirements)
          ? parsed.requirements
              .filter(
                (item) =>
                  typeof item === "string"
              )
              .map((item) =>
                item.trim()
              )
              .filter(Boolean)
          : [],

      warnings:
        Array.isArray(parsed.warnings)
          ? parsed.warnings
              .filter(
                (item) =>
                  typeof item === "string"
              )
              .map((item) =>
                item.trim()
              )
              .filter(Boolean)
          : [],

      suggested_actions:
        Array.isArray(
          parsed.suggested_actions
        )
          ? parsed.suggested_actions
              .filter(
                (action) =>
                  action &&
                  typeof action === "object"
              )
              .map((action) => ({
                action:
                  typeof action.action === "string" &&
                  action.action.trim()
                    ? action.action.trim()
                    : "Review the notice",

                reason:
                  typeof action.reason === "string" &&
                  action.reason.trim()
                    ? action.reason.trim()
                    : "This action is based on the academic notice.",

                requires_approval:
                  Boolean(
                    action.requires_approval
                  ),
              }))
          : [],
    };

    /* =====================================================
       REMOVE GENERIC / UNSUPPORTED TASKS
    ===================================================== */

    analysis.tasks =
      removeGenericTasks(
        analysis.tasks
      );

    /* =====================================================
       REMOVE DUPLICATE TASKS
    ===================================================== */

    analysis.tasks =
      deduplicateTasks(
        analysis.tasks
      );

    /* =====================================================
       REMOVE DUPLICATE EVENTS
    ===================================================== */

    analysis.important_dates =
      deduplicateEvents(
        analysis.important_dates
      );

    /* =====================================================
       REMOVE DUPLICATE SUGGESTED ACTIONS
    ===================================================== */

    analysis.suggested_actions =
      deduplicateSuggestedActions(
        analysis.suggested_actions
      );

    return analysis;
  } catch (error) {
    console.error(
      "CampusPilot AI analysis failed:",
      error
    );

    if (error instanceof Error) {
      throw new Error(
        `AI analysis failed: ${error.message}`
      );
    }

    throw new Error(
      "AI analysis failed unexpectedly."
    );
  }
}

/* =========================================================
   PRIORITY NORMALIZATION
========================================================= */

function normalizePriority(
  priority?: string
): string {
  const value =
    typeof priority === "string"
      ? priority.toUpperCase().trim()
      : "";

  switch (value) {
    case "URGENT":
      return "URGENT";

    case "HIGH":
      return "HIGH";

    case "MEDIUM":
      return "MEDIUM";

    case "LOW":
      return "LOW";

    default:
      return "MEDIUM";
  }
}

/* =========================================================
   GENERIC TASK FILTER
========================================================= */

function isGenericTask(
  title: string
): boolean {
  const value = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");

  const genericPatterns = [
    "verify examination details",
    "verify exam details",
    "check examination details",
    "check exam details",
    "confirm examination details",
    "confirm exam details",
    "complete all required formalities",
    "complete required formalities",
    "complete all formalities",
    "complete formalities",
    "review examination details",
    "review exam details",
    "review the notice",
    "check the notice",
    "read the notice",
    "prepare for examination",
    "prepare for exam",
    "get ready for examination",
    "get ready for exam",
    "ensure everything is ready",
    "ensure all requirements",
    "verify all details",
    "check all details",
    "confirm all details",
  ];

  return genericPatterns.some(
    (pattern) =>
      value === pattern ||
      value.includes(pattern)
  );
}

function removeGenericTasks(
  tasks: CampusAnalysis["tasks"]
) {
  return tasks.filter(
    (task) =>
      !isGenericTask(task.title)
  );
}

/* =========================================================
   TASK TITLE NORMALIZATION
========================================================= */

function normalizeTaskTitle(
  title: string
): string {
  let value = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");

  /* Scheduling conflict */

  if (
    value.includes("scheduling conflict") ||
    value.includes("schedule conflict")
  ) {
    return "scheduling conflict";
  }

  /* Examination form */

  if (
    value.includes("examination form") ||
    value.includes("exam form") ||
    (
      value.includes("submit") &&
      value.includes("form")
    )
  ) {
    return "examination form submission";
  }

  /* Admit card */

  if (
    value.includes("admit card") ||
    value.includes("examination admit")
  ) {
    return "examination admit card";
  }

  /* Institute ID */

  if (
    value.includes("institute id") ||
    value.includes("institute identity") ||
    value.includes("id card")
  ) {
    return "institute id card";
  }

  /* Generic normalization */

  value = value
    .replace(
      /\b(ensure|carry|bring|have|keep|confirm|verify|check|report|submit|complete)\b/g,
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
    .replace(
      /\bexamination\b/g,
      "exam"
    )
    .replace(/\s+/g, " ")
    .trim();

  return value;
}

/* =========================================================
   TASK DEDUPLICATION
========================================================= */

function deduplicateTasks(
  tasks: CampusAnalysis["tasks"]
) {
  const groups =
    new Map<
      string,
      CampusAnalysis["tasks"]
    >();

  for (const task of tasks) {
    const key =
      normalizeTaskTitle(
        task.title
      );

    if (!key) {
      continue;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups
      .get(key)!
      .push(task);
  }

  const cleaned:
    CampusAnalysis["tasks"] = [];

  for (
    const group of groups.values()
  ) {
    if (group.length === 1) {
      cleaned.push(group[0]);
      continue;
    }

    const sorted = [
      ...group,
    ].sort((a, b) => {
      /* Prefer tasks with deadlines */

      if (
        Boolean(a.deadline) !==
        Boolean(b.deadline)
      ) {
        return a.deadline
          ? -1
          : 1;
      }

      /* Earlier deadline wins */

      const dateA =
        parseNoticeDate(
          a.deadline
        );

      const dateB =
        parseNoticeDate(
          b.deadline
        );

      if (dateA && dateB) {
        const difference =
          dateA.getTime() -
          dateB.getTime();

        if (difference !== 0) {
          return difference;
        }
      }

      /* Higher priority wins */

      return (
        getPriorityScore(
          b.priority
        ) -
        getPriorityScore(
          a.priority
        )
      );
    });

    const best = sorted[0];

    const strongestPriority =
      sorted.reduce(
        (
          highest,
          task
        ) =>
          getPriorityScore(
            task.priority
          ) >
          getPriorityScore(
            highest
          )
            ? task.priority
            : highest,
        best.priority
      );

    cleaned.push({
      ...best,
      priority:
        strongestPriority,
    });
  }

  return cleaned;
}

/* =========================================================
   EVENT TITLE NORMALIZATION
========================================================= */

function normalizeEventTitle(
  title: string
): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");
}

/* =========================================================
   EVENT DEDUPLICATION
========================================================= */

function deduplicateEvents(
  events: CampusAnalysis["important_dates"]
) {
  const groups =
    new Map<
      string,
      CampusAnalysis["important_dates"]
    >();

  for (const event of events) {
    const title =
      normalizeEventTitle(
        event.title
      );

    const date =
      event.date
        .toLowerCase()
        .trim();

    const time =
      (event.time || "")
        .toLowerCase()
        .trim();

    const location =
      (event.location || "")
        .toLowerCase()
        .trim();

    const key =
      `${title}|${date}|${time}|${location}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups
      .get(key)!
      .push(event);
  }

  const cleaned:
    CampusAnalysis["important_dates"] =
    [];

  for (
    const group of groups.values()
  ) {
    cleaned.push(group[0]);
  }

  return cleaned;
}

/* =========================================================
   SUGGESTED ACTION DEDUPLICATION
========================================================= */

function normalizeActionTitle(
  action: string
): string {
  return action
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");
}

function deduplicateSuggestedActions(
  actions: CampusAnalysis["suggested_actions"]
) {
  const seen =
    new Set<string>();

  const cleaned:
    CampusAnalysis["suggested_actions"] =
    [];

  for (const action of actions) {
    const key =
      normalizeActionTitle(
        action.action
      );

    if (!key) {
      continue;
    }

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    cleaned.push(action);
  }

  return cleaned;
}

/* =========================================================
   DATE PARSER
========================================================= */

function parseNoticeDate(
  dateString?: string
): Date | null {
  if (!dateString) {
    return null;
  }

  const cleaned =
    dateString
      .replace(
        /(\d+)(st|nd|rd|th)/gi,
        "$1"
      )
      .trim();

  const date =
    new Date(cleaned);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

/* =========================================================
   PRIORITY SCORE
========================================================= */

function getPriorityScore(
  priority: string
): number {
  switch (
    priority.toUpperCase()
  ) {
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