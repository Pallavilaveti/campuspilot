import { GoogleGenAI } from "@google/genai";
import { CampusAnalysis } from "./types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is missing. Add it to .env.local and restart the server."
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function analyzeNotice(
  notice: string
): Promise<CampusAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",

    contents: `
You are CampusPilot, an Agentic AI assistant for college students.

Analyze the following academic notice and determine what the
student needs to do next.

Do NOT merely summarize it.

Identify:
- important dates
- examinations and events
- tasks
- deadlines
- task priorities
- requirements
- warnings or possible conflicts
- suggested next actions

Rules:
1. Never invent information.
2. Preserve dates accurately.
3. Distinguish events from tasks.
4. Mandatory tasks should have HIGH or URGENT priority.
5. Potentially consequential actions must require human approval.
6. If information is missing, use an empty string or empty array.
7. Return ONLY valid JSON.

Academic notice:

${notice}
`,

    config: {
      responseMimeType: "application/json",

      responseSchema: {
        type: "object",
        properties: {
          summary: {
            type: "string",
          },

          category: {
            type: "string",
          },

          important_dates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                date: { type: "string" },
                time: { type: "string" },
                location: { type: "string" },
              },
              required: ["title", "date"],
            },
          },

          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                deadline: { type: "string" },
                priority: { type: "string" },
                reason: { type: "string" },
              },
              required: [
                "title",
                "priority",
                "reason",
              ],
            },
          },

          requirements: {
            type: "array",
            items: {
              type: "string",
            },
          },

          warnings: {
            type: "array",
            items: {
              type: "string",
            },
          },

          suggested_actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                reason: { type: "string" },
                requires_approval: { type: "boolean" },
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

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return JSON.parse(text) as CampusAnalysis;
}