import React, { useState, useMemo } from "react";
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Award, 
  Calendar, 
  TrendingUp, 
  Zap,
  BookOpen,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import { TimetableEvent, Task, CATEGORIES, DAYS_OF_WEEK } from "../types";
import { timeToMinutes, minutesToTime } from "../utils";

interface DashboardProps {
  events: TimetableEvent[];
  tasks: Task[];
  onAddEvent: (event: Omit<TimetableEvent, "id">) => void;
  onToggleEventComplete: (id: string) => void;
  onAddTask: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ 
  events, 
  tasks, 
  onAddEvent, 
  onToggleEventComplete, 
  onAddTask,
  setActiveTab 
}: DashboardProps) {
  // Determine current day of the week
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const systemDay = weekdayNames[new Date().getDay()] as any;
  const initialDay = DAYS_OF_WEEK.includes(systemDay) ? systemDay : "Monday";
  
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>(initialDay);
  const [showQuickEventModal, setShowQuickEventModal] = useState(false);
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);

  // Quick form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventCategory, setNewEventCategory] = useState<any>("study");
  const [newEventStartTime, setNewEventStartTime] = useState("09:00");
  const [newEventEndTime, setNewEventEndTime] = useState("10:30");
  const [newEventNotes, setNewEventNotes] = useState("");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskCategory, setNewTaskCategory] = useState<any>("study");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Filter and sort events for selected day
  const dailyEvents = useMemo(() => {
    return events
      .filter((e) => e.day === selectedDay)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [events, selectedDay]);

  // Statistics calculations
  const stats = useMemo(() => {
    const todayEvents = events.filter(e => e.day === selectedDay);
    const completedEvents = todayEvents.filter(e => e.completed).length;
    const totalEventsCount = todayEvents.length;

    // Next upcoming event
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    let upcoming = null;
    let minDiff = Infinity;

    // Filter events for current day that start after now
    const todayFutureEvents = events.filter(e => e.day === initialDay && timeToMinutes(e.startTime) > currentMin);
    
    if (todayFutureEvents.length > 0) {
      todayFutureEvents.forEach(e => {
        const diff = timeToMinutes(e.startTime) - currentMin;
        if (diff < minDiff) {
          minDiff = diff;
          upcoming = e;
        }
      });
    }

    // Free time estimate: assume wake window 07:00 - 23:00 (16 hours = 960 mins)
    // Calculate total minutes scheduled on this day during wake window
    let scheduledMins = 0;
    todayEvents.forEach(e => {
      const start = Math.max(timeToMinutes(e.startTime), 7 * 60);
      const end = Math.min(timeToMinutes(e.endTime), 23 * 60);
      if (end > start) {
        scheduledMins += (end - start);
      }
    });

    const freeMin = Math.max(0, 960 - scheduledMins);
    const freeHours = (freeMin / 60).toFixed(1);

    // Productivity streak
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const streak = Math.min(7, Math.floor((completedEvents + completedTasks) / 2) + 2); // mockup streak helper

    // Today's Task Progress
    const todayDateStr = now.toISOString().split("T")[0];
    const todayTasks = tasks.filter(t => !t.dueDate || t.dueDate <= todayDateStr);
    const completedTodayTasks = todayTasks.filter(t => t.completed).length;
    const totalTodayTasks = todayTasks.length;
    const taskProgressPercentage = totalTodayTasks === 0 ? 0 : Math.round((completedTodayTasks / totalTodayTasks) * 100);

    return {
      completedEvents,
      totalEventsCount,
      upcoming,
      freeHours,
      streak,
      completedTodayTasks,
      totalTodayTasks,
      taskProgressPercentage
    };
  }, [events, tasks, selectedDay, initialDay]);

  const handleCreateQuickEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    onAddEvent({
      title: newEventTitle,
      day: selectedDay,
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      category: newEventCategory,
      notes: newEventNotes,
      isRecurring: true,
    });

    // Reset
    setNewEventTitle("");
    setNewEventNotes("");
    setShowQuickEventModal(false);
  };

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      title: newTaskTitle,
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: newTaskDueDate || undefined,
    });

    // Reset
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setShowQuickTaskModal(false);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-tab-panel">
      {/* Top Banner Greetings */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-[0_0_20px_rgba(229,9,20,0.01)]">
        <div>
          <h2 className="font-sans font-extrabold text-2xl md:text-3xl tracking-tight text-white flex items-center gap-2.5">
            YOUR DAY AT <span className="text-[#E50914]">REDLINE</span>
          </h2>
          <p className="text-zinc-400 mt-1.5 text-sm md:text-base font-medium max-w-xl">
            Optimized, clean scheduling powered by rule-based algorithms & Gemini artificial intelligence. Keep crushing goals.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowQuickEventModal(true)}
            id="quick-add-event-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] text-white hover:brightness-110 transition-all font-sans font-bold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(229,9,20,0.3)] hover:shadow-[0_0_20px_rgba(229,9,20,0.5)] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
          <button
            onClick={() => setShowQuickTaskModal(true)}
            id="quick-add-task-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all font-sans font-bold text-xs tracking-wider uppercase cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#E50914]" /> New Task
          </button>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-dashboard-grid">
        {/* Streak card */}
        <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 hover:border-[#E50914]/20 transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-mono text-zinc-500 tracking-wider font-semibold uppercase">Focus Streak</span>
            <h3 className="font-sans font-extrabold text-2xl text-white group-hover:text-[#E50914] transition-colors">
              {stats.streak} Days
            </h3>
            <p className="text-[10px] text-zinc-400 font-medium">Keep completing tasks daily!</p>
          </div>
          <div className="p-3 rounded-xl bg-[#E50914]/10 text-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.05)] border border-[#E50914]/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Blocks */}
        <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 hover:border-[#E50914]/20 transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-mono text-zinc-500 tracking-wider font-semibold uppercase">Daily Progress</span>
            <h3 className="font-sans font-extrabold text-2xl text-white group-hover:text-[#E50914] transition-colors">
              {stats.completedEvents} / {stats.totalEventsCount}
            </h3>
            <p className="text-[10px] text-zinc-400 font-medium">Routine blocks checked today.</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 text-gray-400 border border-white/5">
            <CheckCircle2 className="w-6 h-6 text-[#E50914]" />
          </div>
        </div>

        {/* Next Scheduled */}
        <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 hover:border-[#E50914]/20 transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1 max-w-[70%]">
            <span className="text-xs font-mono text-zinc-500 tracking-wider font-semibold uppercase">Upcoming Event</span>
            <h3 className="font-sans font-bold text-base text-white truncate group-hover:text-[#E50914] transition-colors">
              {stats.upcoming ? (stats.upcoming as any).title : "No future events today"}
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono">
              {stats.upcoming ? `${(stats.upcoming as any).startTime} - ${(stats.upcoming as any).endTime}` : "Time to unwind!"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 text-gray-400 border border-white/5">
            <Clock className="w-6 h-6 text-[#E50914]" />
          </div>
        </div>

        {/* Free Hours Today */}
        <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 hover:border-[#E50914]/20 transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-mono text-zinc-500 tracking-wider font-semibold uppercase">Available Free Time</span>
            <h3 className="font-sans font-extrabold text-2xl text-white group-hover:text-[#E50914] transition-colors">
              {stats.freeHours} hrs
            </h3>
            <p className="text-[10px] text-zinc-400 font-medium">Unscheduled active hours.</p>
          </div>
          <div className="p-3 rounded-xl bg-[#E50914]/10 text-[#E50914] border border-[#E50914]/20">
            <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content Layout - Timeline & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline View (Left side - 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-lg tracking-tight text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E50914]" /> Timeline Overview
            </h3>

            {/* Day selector carousel */}
            <div className="flex gap-1 overflow-x-auto pb-1 max-w-[60%] sm:max-w-full scrollbar-none" id="day-carousel">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  id={`day-select-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    px-3 py-1.5 rounded-lg font-sans text-xs font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer
                    ${selectedDay === day 
                      ? "bg-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.3)] hover:brightness-110" 
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }
                  `}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Cards */}
          <div className="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5" id="timeline-list">
            {dailyEvents.length === 0 ? (
              <div className="bg-[#141414]/40 border border-dashed border-white/10 p-10 rounded-3xl text-center space-y-3">
                <p className="text-zinc-500 text-sm font-medium">No routine events found on {selectedDay}.</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setActiveTab("ai-generator")}
                    className="text-xs font-bold font-sans text-[#E50914] hover:text-[#E50914]/80 underline"
                  >
                    Generate with AI
                  </button>
                  <span className="text-zinc-700">or</span>
                  <button
                    onClick={() => setShowQuickEventModal(true)}
                    className="text-xs font-bold font-sans text-white hover:text-zinc-200 underline"
                  >
                    Create Manual Event
                  </button>
                </div>
              </div>
            ) : (
              dailyEvents.map((event) => {
                const categoryColor = CATEGORIES[event.category] || CATEGORIES.personal;
                return (
                  <div 
                    key={event.id} 
                    id={`timeline-event-${event.id}`}
                    className="flex items-start gap-4 group pl-1.5 transition-all"
                  >
                    {/* Time dot & label */}
                    <div className="flex flex-col items-center z-10">
                      <button
                        onClick={() => onToggleEventComplete(event.id)}
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer
                          ${event.completed 
                            ? "bg-[#E50914] border-[#E50914] text-white shadow-[0_0_8px_rgba(229,9,20,0.4)]" 
                            : "bg-[#0A0A0A] border-white/10 text-gray-500 hover:border-[#E50914] hover:text-[#E50914]"
                          }
                        `}
                      >
                        {event.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-[10px] font-mono font-bold">{event.startTime.split(":")[0]}</span>
                        )}
                      </button>
                      <span className="text-[10px] font-mono text-zinc-500 mt-1 font-semibold">
                        {event.startTime}
                      </span>
                    </div>

                    {/* Event main card */}
                    <div className={`
                      flex-1 bg-[#141414] hover:bg-[#141414]/90 border ${event.completed ? "border-white/5 bg-white/2" : "border-white/5"} p-4 rounded-2xl transition-all duration-200 flex flex-col md:flex-row justify-between md:items-center gap-3 relative overflow-hidden group-hover:translate-x-1
                    `}>
                      {/* Left glowing border tag */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.completed ? "bg-white/10" : "bg-[#E50914]"}`} />

                      <div className="space-y-1 pl-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-sans font-bold text-sm md:text-base ${event.completed ? "line-through text-zinc-500" : "text-white"}`}>
                            {event.title}
                          </h4>
                          <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full ${categoryColor.color} border ${categoryColor.borderColor}`}>
                            {categoryColor.label}
                          </span>
                        </div>
                        {event.notes && (
                          <p className="text-xs text-zinc-400 font-medium">
                            {event.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 font-mono text-xs text-zinc-400 font-semibold self-end md:self-center">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right side panel (Upcoming Tasks & Daily Motivation) */}
        <div className="space-y-6">
          {/* Today's Tasks Progress */}
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E50914]" /> Today's Task Progress
              </h3>
              <span className="text-xs font-mono font-bold text-zinc-400">
                {stats.completedTodayTasks} / {stats.totalTodayTasks} completed
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
              <div 
                className="h-full bg-[#E50914] transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(229,9,20,0.5)] relative" 
                style={{ width: `${stats.taskProgressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium text-right">
              {stats.taskProgressPercentage}% of today's tasks completed
            </p>
          </div>

          {/* Quick Tasks List */}
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-base text-white">
                Upcoming Priority Tasks
              </h3>
              <button
                onClick={() => setActiveTab("tasks")}
                className="text-xs font-bold text-[#E50914] hover:text-[#E50914]/80 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5" id="dashboard-task-list">
              {tasks.filter(t => !t.completed).slice(0, 4).length === 0 ? (
                <p className="text-zinc-500 text-xs py-2 text-center font-medium">All caught up! No active tasks.</p>
              ) : (
                tasks.filter(t => !t.completed).slice(0, 4).map(task => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        task.priority === "high" ? "bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.5)]" :
                        task.priority === "medium" ? "bg-amber-500" : "bg-zinc-500"
                      }`} />
                      <span className="text-xs font-sans font-medium text-zinc-300 truncate group-hover:text-white transition-colors">
                        {task.title}
                      </span>
                    </div>
                    {task.dueDate && (
                      <span className="text-[9px] font-mono font-bold bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800 whitespace-nowrap">
                        {task.dueDate.split("-").slice(1).join("/")}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Productivity Tip Card */}
          <div className="bg-[#E50914]/5 p-6 rounded-3xl border border-[#E50914]/20 space-y-4 relative overflow-hidden">
            <div className="absolute right-[-10px] bottom-[-10px] text-[#E50914]/10 opacity-60">
              <Award className="w-28 h-28" />
            </div>
            <div className="flex items-center gap-2 text-[#E50914]">
              <Award className="w-5 h-5 animate-bounce" />
              <span className="text-xs font-bold font-sans tracking-wider uppercase">REDLINE COGNITIVE RHYTHM</span>
            </div>
            <h4 className="font-sans font-bold text-sm text-white leading-relaxed">
              "Focus is a muscle that fatigues without periodic decompression."
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Use a structured routine to lock in deep work blocks of 90 minutes. After every block, take a mandatory 15-minute screen-free break. Your neurological recovery rates will skyrocket.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Event Modal */}
      {showQuickEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-white/10 max-w-md w-full rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#0A0A0A] border-b border-white/5 flex items-center justify-between">
              <h3 className="font-sans font-bold text-lg text-white">Add Timetable Event</h3>
              <button 
                onClick={() => setShowQuickEventModal(false)}
                className="text-zinc-500 hover:text-white font-semibold transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateQuickEvent} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-sans">Day of Week</label>
                <div className="bg-[#0A0A0A] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm font-semibold">
                  {selectedDay}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-sans">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Deep Work Session"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 font-sans">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 font-sans">End Time</label>
                  <input
                    type="time"
                    required
                    value={newEventEndTime}
                    onChange={(e) => setNewEventEndTime(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-sans">Category</label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                >
                  {Object.keys(CATEGORIES).map((key) => (
                    <option key={key} value={key}>
                      {CATEGORIES[key as any].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-sans">Notes / Motivation</label>
                <textarea
                  placeholder="Focus triggers, tags, or links..."
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors h-20 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowQuickEventModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/5 text-zinc-400 hover:text-white transition-colors text-xs font-semibold tracking-wider uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:brightness-110 text-white transition-colors text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(229,9,20,0.3)] cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Task Modal */}
      {showQuickTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-white/10 max-w-md w-full rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#0A0A0A] border-b border-white/5 flex items-center justify-between">
              <h3 className="font-sans font-bold text-lg text-white">Create New Task</h3>
              <button 
                onClick={() => setShowQuickTaskModal(false)}
                className="text-zinc-500 hover:text-white font-semibold transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateQuickTask} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-sans">Task Name / Objective</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Deliver final specs to client"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 font-sans">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 font-sans">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                  >
                    {Object.keys(CATEGORIES).map((key) => (
                      <option key={key} value={key}>
                        {CATEGORIES[key as any].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-sans">Due Date (Optional)</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowQuickTaskModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/5 text-zinc-400 hover:text-white transition-colors text-xs font-semibold tracking-wider uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:brightness-110 text-white transition-colors text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(229,9,20,0.3)] cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
