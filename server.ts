import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely (with fallback handling)
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("GEMINI_API_KEY is not defined. The app will run in robust rule-based fallback mode.");
}

// Quick Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiActive: !!ai });
});

// Intelligent Rule-Based Routine Generator (Fallback)
function generateRuleBasedRoutine(
  wakeTime: string,
  sleepTime: string,
  goals: string,
  fixedCommitments: any[]
) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const events: any[] = [];

  // Parse hours to numbers
  const [wakeHour, wakeMin] = wakeTime.split(":").map(Number);
  const [sleepHour, sleepMin] = sleepTime.split(":").map(Number);

  // Helper to construct HH:MM string
  const toTimeStr = (h: number, m: number) => {
    return `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor(m)).padStart(2, "0")}`;
  };

  // Convert time to minutes from midnight
  const toMin = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const wakeMinutes = wakeHour * 60 + wakeMin;
  let sleepMinutes = sleepHour * 60 + sleepMin;
  if (sleepMinutes < wakeMinutes) {
    sleepMinutes += 24 * 60; // sleep overflows to next day
  }

  // Parse goals to look for key matches
  const goalsLower = goals.toLowerCase();
  const hasWorkout = goalsLower.includes("workout") || goalsLower.includes("gym") || goalsLower.includes("fit") || goalsLower.includes("exercise");
  const hasStudy = goalsLower.includes("study") || goalsLower.includes("learn") || goalsLower.includes("read") || goalsLower.includes("class");
  const hasWork = goalsLower.includes("work") || goalsLower.includes("job") || goalsLower.includes("code") || goalsLower.includes("project");

  for (const day of days) {
    // 1. Add Sleep Event (from sleepTime to wakeTime)
    // For sleep event, since it repeats, we can set sleep to wake
    const sleepEndStr = wakeTime;
    const sleepStartHour = sleepHour;
    const sleepStartMin = sleepMin;
    events.push({
      title: "Night Sleep",
      day,
      startTime: toTimeStr(sleepStartHour, sleepStartMin),
      endTime: sleepMinutes < 1440 ? toTimeStr(sleepStartHour, sleepStartMin) : "23:59",
      category: "sleep",
      notes: "Rest and recover for a productive day.",
    });

    if (sleepMinutes > 1440) {
      // sleep overflow covers early morning 00:00 to wakeTime
      events.push({
        title: "Morning Sleep Recovery",
        day,
        startTime: "00:00",
        endTime: wakeTime,
        category: "sleep",
        notes: "Sleeping cycle completion.",
      });
    }

    // Identify fixed commitments on this day to avoid overlapping
    const dayFixed = fixedCommitments.filter((c) => c.day === day);

    // We have active hours from wakeTime to sleepTime (normalized in minutes)
    // Let's divide active hours into slots and schedule events if no overlap with fixed commitments
    let currentMin = wakeMinutes;
    const endLimit = Math.min(sleepMinutes, 24 * 60);

    // Add Morning Routine right after waking
    const morningEnd = currentMin + 60; // 1 hour
    if (morningEnd <= endLimit) {
      const startStr = toTimeStr(currentMin / 60, currentMin % 60);
      const endStr = toTimeStr(morningEnd / 60, morningEnd % 60);

      // Check overlap
      const overlap = dayFixed.some((c) => {
        const cStart = toMin(c.startTime);
        const cEnd = toMin(c.endTime);
        return (currentMin < cEnd && morningEnd > cStart);
      });

      if (!overlap) {
        events.push({
          title: "Morning Routine",
          day,
          startTime: startStr,
          endTime: endStr,
          category: "personal",
          notes: "Breakfast, hydration, and mental preparation.",
        });
      }
      currentMin = morningEnd;
    }

    // Schedule study/work slots
    let studyWorkCount = 0;
    while (currentMin + 120 <= endLimit) {
      const slotStart = currentMin;
      const slotEnd = currentMin + 120; // 2 hour slots
      const startStr = toTimeStr(slotStart / 60, slotStart % 60);
      const endStr = toTimeStr(slotEnd / 60, slotEnd % 60);

      // Check overlap with fixed commitments
      const overlap = dayFixed.some((c) => {
        const cStart = toMin(c.startTime);
        const cEnd = toMin(c.endTime);
        return (slotStart < cEnd && slotEnd > cStart);
      });

      if (!overlap) {
        if (studyWorkCount === 0 && (hasStudy || hasWork)) {
          events.push({
            title: hasStudy ? "Focused Study Block" : "Deep Work Session",
            day,
            startTime: startStr,
            endTime: endStr,
            category: hasStudy ? "study" : "work",
            notes: "High concentration tasks. Eliminate distractions.",
          });
        } else if (studyWorkCount === 1 && hasWorkout && ["Monday", "Wednesday", "Friday", "Sunday"].includes(day)) {
          events.push({
            title: "Gym Workout",
            day,
            startTime: startStr,
            endTime: toTimeStr((slotStart + 90) / 60, (slotStart + 90) % 60), // 1.5 hr workout
            category: "gym",
            notes: "Strength training or cardio session. Keep active!",
          });
        } else {
          events.push({
            title: "Leisure & Personal Growth",
            day,
            startTime: startStr,
            endTime: endStr,
            category: "leisure",
            notes: "Relax, catch up on hobbies, or walk outside.",
          });
        }
        studyWorkCount++;
      } else {
        // Just skip past the fixed commitment to resume scheduling
        const overlapCommitment = dayFixed.find((c) => {
          const cStart = toMin(c.startTime);
          const cEnd = toMin(c.endTime);
          return (slotStart < cEnd && slotEnd > cStart);
        });
        if (overlapCommitment) {
          const cEnd = toMin(overlapCommitment.endTime);
          currentMin = cEnd - 120; // reset iterator to run right after it
        }
      }
      currentMin += 120;
    }

    // Evening wind down
    if (currentMin < endLimit) {
      const startStr = toTimeStr(currentMin / 60, currentMin % 60);
      const endStr = toTimeStr(endLimit / 60, endLimit % 60);
      events.push({
        title: "Evening Wind Down",
        day,
        startTime: startStr,
        endTime: endStr,
        category: "personal",
        notes: "Disconnect from screens, prep for sleep.",
      });
    }
  }

  return events;
}

// Helper to enforce a strict timeout on async operations (e.g., Gemini API calls)
function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutErrorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutErrorMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// 1. AI Routine Generator Endpoint
app.post("/api/gemini/generate-routine", async (req, res) => {
  const { wakeTime, sleepTime, goals, fixedCommitments } = req.body;

  if (!wakeTime || !sleepTime) {
    return res.status(400).json({ error: "wakeTime and sleepTime are required." });
  }

  // If Gemini is not active or fails, use rules-based fallback
  if (!ai) {
    console.log("No Gemini API key. Generating rules-based routine...");
    const events = generateRuleBasedRoutine(wakeTime, sleepTime, goals || "", fixedCommitments || []);
    return res.json({
      events,
      source: "rule-based",
      message: "Generated optimal routine using built-in intelligence (Gemini API key not configured).",
    });
  }

  try {
    const fixedInfoStr = (fixedCommitments || [])
      .map((c: any) => `- ${c.title} (${c.category}) on ${c.day} from ${c.startTime} to ${c.endTime}`)
      .join("\n");

    const prompt = `Generate a highly optimized, fully scheduled weekly routine (Monday to Sunday) based on the following user details:
- **Wake Time**: ${wakeTime}
- **Sleep Time**: ${sleepTime}
- **Goals / Targets**: ${goals || "None specified, generate a balanced self-improvement schedule"}
- **Fixed Commitments (Strictly DO NOT schedule anything over these blocks)**:
${fixedInfoStr || "No fixed commitments specified."}

**Schedule Constraints**:
1. Sleep block MUST cover the period between Sleep Time and Wake Time for each day.
2. Fill the active hours (between Wake Time and Sleep Time) with high-value blocks that target the user's goals.
3. Every scheduled event must belong to one of these exact categories: 'study', 'work', 'gym', 'sleep', 'personal', 'leisure', 'chore'.
4. Ensure no time overlaps between generated events, and absolutely no overlap with the listed fixed commitments.
5. Provide structured events. Keep individual slots between 45 minutes and 3 hours (ideal focusing duration).
6. Give events motivating and descriptive titles and short helpful notes.

**Response Schema Requirements**:
Your output must be a valid JSON object matching this schema exactly:
{
  "events": [
    {
      "title": "Deep Work / Study Chemistry / Morning Jog / etc",
      "day": "Monday / Tuesday / etc",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "category": "study / work / gym / sleep / personal / leisure / chore",
      "notes": "Short motivation or instruction"
    }
  ]
}`;

    const response = await promiseWithTimeout(
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["events"],
            properties: {
              events: {
                type: Type.ARRAY,
                description: "The list of scheduled routine blocks.",
                items: {
                  type: Type.OBJECT,
                  required: ["title", "day", "startTime", "endTime", "category"],
                  properties: {
                    title: { type: Type.STRING },
                    day: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    category: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      }),
      40000, // 40 seconds timeout
      "Gemini routine generation request timed out."
    );

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText);

    return res.json({
      events: resultJson.events || [],
      source: "gemini",
      message: "Routine intelligently generated by Gemini 3.5!",
    });
  } catch (error: any) {
    console.warn(`Gemini API fallback triggered for routine generation: ${error.message || "Unknown error"}`);
    const events = generateRuleBasedRoutine(wakeTime, sleepTime, goals || "", fixedCommitments || []);
    return res.json({
      events,
      source: "fallback",
      message: `Failed to invoke Gemini (${error.message || "Unknown error"}). Generated using local intelligent scheduler.`,
    });
  }
});

// 2. AI Insights & Suggestions Endpoint
app.post("/api/gemini/generate-insights", async (req, res) => {
  const { events, tasks } = req.body;

  if (!ai) {
    // Generate static helpful default insights
    const fallbackInsights = [
      { id: "1", type: "info", text: "Pro tip: Try scheduling difficult study or work blocks within 3 hours after waking up, when dopamine levels are naturally highest." },
      { id: "2", type: "success", text: "Routine streak tracker is ready. Mark tasks complete to start stacking high-productivity days." },
      { id: "3", type: "warning", text: "Balanced routine detected. Ensure you schedule at least 1.5 hours of pure leisure or offline relaxation daily." }
    ];
    return res.json({ insights: fallbackInsights, source: "fallback" });
  }

  try {
    const eventsSummary = (events || [])
      .slice(0, 30) // limit to avoid token clutter
      .map((e: any) => `- ${e.day}: ${e.title} (${e.startTime}-${e.endTime}) [${e.category}]`)
      .join("\n");

    const tasksSummary = (tasks || [])
      .map((t: any) => `- Task: ${t.title} (Priority: ${t.priority}, Done: ${t.completed})`)
      .join("\n");

    const prompt = `Analyze this user's current weekly schedule and tasks, and generate 3 personalized, highly actionable productivity insights, recommendations, or words of encouragement.

**Current Schedule Summary**:
${eventsSummary || "No scheduled events yet."}

**Active Tasks**:
${tasksSummary || "No active tasks."}

**Formatting**:
Provide your response strictly in JSON format as a list of insights. Each insight must contain an id, type (must be one of 'info', 'warning', 'success'), and text. Keep each insight text to 1-2 punchy, highly actionable sentences.

**Response Schema Requirements**:
Your output must be a valid JSON object matching this schema exactly:
{
  "insights": [
    {
      "id": "1",
      "type": "info / warning / success",
      "text": "The personalized advice or warning text"
    }
  ]
}`;

    const response = await promiseWithTimeout(
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["insights"],
            properties: {
              insights: {
                type: Type.ARRAY,
                description: "Personalized schedule analysis insights.",
                items: {
                  type: Type.OBJECT,
                  required: ["id", "type", "text"],
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      }),
      40000, // 40 seconds timeout
      "Gemini insights generation request timed out."
    );

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText);

    return res.json({
      insights: resultJson.insights || [],
      source: "gemini",
    });
  } catch (error: any) {
    console.warn(`Gemini API fallback triggered: ${error.message || "Unknown error"}`);
    const fallbackInsights = [
      { id: "1", type: "info", text: "Pro tip: Try scheduling difficult study or work blocks within 3 hours after waking up, when focus is naturally highest." },
      { id: "2", type: "success", text: "Routine streak tracker is ready. Mark tasks complete to start stacking high-productivity days." },
      { id: "3", type: "warning", text: "Balanced routine detected. Ensure you schedule at least 1.5 hours of pure leisure or offline relaxation daily." }
    ];
    return res.json({
      insights: fallbackInsights,
      source: "fallback",
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode: integration with Vite Dev Server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    // Production mode: serve static files compiled inside /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
