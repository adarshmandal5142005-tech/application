import { TimetableEvent, Task, CategoryType, FixedCommitment } from "./types";

// Helper to convert time "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper to convert minutes from midnight to "HH:MM"
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Conflict detection: returns true if two events on the same day overlap
export function checkOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

// Find all overlapping events in a schedule
export function detectAllConflicts(events: TimetableEvent[]): { eventId1: string; eventId2: string; message: string }[] {
  const conflicts: { eventId1: string; eventId2: string; message: string }[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const e1 = events[i];
      const e2 = events[j];

      if (e1.day === e2.day && checkOverlap(e1.startTime, e1.endTime, e2.startTime, e2.endTime)) {
        conflicts.push({
          eventId1: e1.id,
          eventId2: e2.id,
          message: `Overlap on ${e1.day}: "${e1.title}" (${e1.startTime}-${e1.endTime}) conflicts with "${e2.title}" (${e2.startTime}-${e2.endTime})`,
        });
      }
    }
  }

  return conflicts;
}

// Export a timetable as CSV
export function exportToCSV(events: TimetableEvent[]) {
  const headers = ["Title", "Day", "Start Time", "End Time", "Category", "Notes", "Recurring"];
  const rows = events.map(e => [
    e.title.replace(/"/g, '""'),
    e.day,
    e.startTime,
    e.endTime,
    e.category,
    (e.notes || "").replace(/"/g, '""'),
    e.isRecurring ? "Yes" : "No"
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(val => `"${val}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "my_weekly_timetable.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Mock initial data for immediate premium visualization
export const INITIAL_EVENTS: TimetableEvent[] = [
  // Monday
  {
    id: "m1",
    title: "Morning Run & Stretch",
    day: "Monday",
    startTime: "07:30",
    endTime: "08:30",
    category: "gym",
    notes: "Outdoor jog followed by core stretches.",
    isRecurring: true,
    completed: true,
  },
  {
    id: "m2",
    title: "Velo App Architecture Design",
    day: "Monday",
    startTime: "09:00",
    endTime: "12:00",
    category: "work",
    notes: "Deep focus. Outline schema and server handlers.",
    isRecurring: true,
    completed: true,
  },
  {
    id: "m3",
    title: "Quick Lunch & Walk",
    day: "Monday",
    startTime: "12:15",
    endTime: "13:00",
    category: "personal",
    notes: "Get sunshine and stretch eyes.",
    isRecurring: true,
  },
  {
    id: "m4",
    title: "Study UI/UX & Motion Guides",
    day: "Monday",
    startTime: "13:30",
    endTime: "15:30",
    category: "study",
    notes: "Learn framer motion spring physics and layout animations.",
    isRecurring: true,
  },
  {
    id: "m5",
    title: "Chore: Groceries & Prep",
    day: "Monday",
    startTime: "17:30",
    endTime: "18:45",
    category: "chore",
    notes: "Prep meals for Tuesday and Wednesday.",
    isRecurring: false,
  },
  // Tuesday
  {
    id: "t1",
    title: "Heavy Push Workout",
    day: "Tuesday",
    startTime: "07:15",
    endTime: "08:45",
    category: "gym",
    notes: "Chest, shoulders, and triceps focus.",
    isRecurring: true,
    completed: true,
  },
  {
    id: "t2",
    title: "Frontend Engineering Sprint",
    day: "Tuesday",
    startTime: "09:30",
    endTime: "12:30",
    category: "work",
    notes: "Code high contrast dark views.",
    isRecurring: true,
    completed: true,
  },
  // Wednesday
  {
    id: "w1",
    title: "AI Integration Session",
    day: "Wednesday",
    startTime: "10:00",
    endTime: "13:00",
    category: "study",
    notes: "Connect Express with GoogleGenAI SDK.",
    isRecurring: true,
  },
  {
    id: "w2",
    title: "Power Yoga & Breathwork",
    day: "Wednesday",
    startTime: "17:00",
    endTime: "18:00",
    category: "gym",
    notes: "Mental recovery and mobility flow.",
    isRecurring: true,
  },
  // Thursday
  {
    id: "th1",
    title: "System Maintenance & Backup",
    day: "Thursday",
    startTime: "09:00",
    endTime: "11:00",
    category: "work",
    notes: "Optimize database indexes and clear server logs.",
    isRecurring: true,
  },
  {
    id: "th2",
    title: "Independent Research",
    day: "Thursday",
    startTime: "14:00",
    endTime: "16:30",
    category: "study",
    notes: "Read scientific papers on chronotypes and routine efficacy.",
    isRecurring: false,
  },
  // Friday
  {
    id: "f1",
    title: "Full Body Blast Workout",
    day: "Friday",
    startTime: "08:00",
    endTime: "09:30",
    category: "gym",
    notes: "Squats, deadlifts, and pull-ups.",
    isRecurring: true,
  },
  {
    id: "f2",
    title: "Weekly Review & Retrospective",
    day: "Friday",
    startTime: "15:00",
    endTime: "17:00",
    category: "personal",
    notes: "Review logs, check budgets, and plan the upcoming week.",
    isRecurring: true,
  },
  // Saturday
  {
    id: "sa1",
    title: "Long Sleep Rest",
    day: "Saturday",
    startTime: "00:00",
    endTime: "09:00",
    category: "sleep",
    notes: "Extended weekend sleep cycle.",
    isRecurring: true,
  },
  {
    id: "sa2",
    title: "Hike & Nature Exploration",
    day: "Saturday",
    startTime: "10:00",
    endTime: "14:00",
    category: "leisure",
    notes: "Unplug, take water, and climb local peak.",
    isRecurring: false,
  },
  // Sunday
  {
    id: "su1",
    title: "Meal Prep & Planning",
    day: "Sunday",
    startTime: "13:00",
    endTime: "16:00",
    category: "chore",
    notes: "Cook healthy meals for the workweek.",
    isRecurring: true,
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "task1",
    title: "Submit UI architecture proposal",
    dueDate: "2026-07-12",
    priority: "high",
    category: "work",
    completed: false,
    createdAt: "2026-07-09T01:00:00Z"
  },
  {
    id: "task2",
    title: "Complete gym session (Leg day focus)",
    dueDate: "2026-07-10",
    priority: "medium",
    category: "gym",
    completed: true,
    createdAt: "2026-07-08T18:00:00Z"
  },
  {
    id: "task3",
    title: "Finish reading Chapter 6 of Cognitive Routines",
    dueDate: "2026-07-11",
    priority: "low",
    category: "study",
    completed: false,
    createdAt: "2026-07-09T01:30:00Z"
  },
  {
    id: "task4",
    title: "Renew subscription & clean digital workspace",
    dueDate: "2026-07-15",
    priority: "low",
    category: "chore",
    completed: false,
    createdAt: "2026-07-09T01:10:00Z"
  }
];
