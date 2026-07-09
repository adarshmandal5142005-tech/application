export type CategoryType = 'study' | 'work' | 'gym' | 'sleep' | 'personal' | 'leisure' | 'chore';

export interface CategoryInfo {
  id: CategoryType;
  label: string;
  color: string; // Tailwind class color
  borderColor: string;
  glowColor: string;
}

export interface TimetableEvent {
  id: string;
  title: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  category: CategoryType;
  notes?: string;
  isRecurring: boolean;
  completed?: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  category: CategoryType;
  completed: boolean;
  createdAt: string;
}

export interface FixedCommitment {
  id: string;
  title: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  category: CategoryType;
}

export interface UserPreferences {
  wakeTime: string; // 'HH:MM'
  sleepTime: string; // 'HH:MM'
  goals: string; // Text list of goals or targets
  fixedCommitments: FixedCommitment[];
  notificationEnabled: boolean;
}

export interface AIInsight {
  id: string;
  type: 'info' | 'warning' | 'success';
  text: string;
}

export const CATEGORIES: Record<CategoryType, CategoryInfo> = {
  sleep: {
    id: 'sleep',
    label: 'Sleep',
    color: 'bg-zinc-900 text-zinc-400',
    borderColor: 'border-zinc-800',
    glowColor: 'shadow-[0_0_8px_rgba(39,39,42,0.3)]',
  },
  study: {
    id: 'study',
    label: 'Study',
    color: 'bg-red-950 text-red-400',
    borderColor: 'border-red-900',
    glowColor: 'shadow-[0_0_8px_rgba(239,68,68,0.2)]',
  },
  work: {
    id: 'work',
    label: 'Work',
    color: 'bg-rose-950 text-rose-300 border-rose-900',
    borderColor: 'border-rose-900',
    glowColor: 'shadow-[0_0_8px_rgba(244,63,94,0.2)]',
  },
  gym: {
    id: 'gym',
    label: 'Gym / Workout',
    color: 'bg-amber-950 text-amber-400 border-amber-900',
    borderColor: 'border-amber-900',
    glowColor: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
  },
  personal: {
    id: 'personal',
    label: 'Personal Care',
    color: 'bg-stone-900 text-stone-300 border-stone-800',
    borderColor: 'border-stone-800',
    glowColor: 'shadow-[0_0_8px_rgba(120,113,108,0.2)]',
  },
  leisure: {
    id: 'leisure',
    label: 'Leisure / Break',
    color: 'bg-zinc-800 text-zinc-200 border-zinc-700',
    borderColor: 'border-zinc-700',
    glowColor: 'shadow-[0_0_8px_rgba(113,113,122,0.2)]',
  },
  chore: {
    id: 'chore',
    label: 'Chores / Commute',
    color: 'bg-neutral-900 text-neutral-400 border-neutral-800',
    borderColor: 'border-neutral-800',
    glowColor: 'shadow-[0_0_8px_rgba(115,115,115,0.2)]',
  },
};

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];
