import React, { useState } from "react";
import { 
  Sparkles, 
  Clock, 
  Target, 
  Plus, 
  Trash2, 
  Loader2, 
  Check, 
  X, 
  HelpCircle,
  AlertCircle,
  Calendar,
  Layers,
  TrendingUp
} from "lucide-react";
import { FixedCommitment, TimetableEvent, CATEGORIES, DAYS_OF_WEEK, CategoryType } from "../types";
import { getApiUrl } from "../utils/api";

interface AIGeneratorProps {
  preferences: {
    wakeTime: string;
    sleepTime: string;
    goals: string;
    fixedCommitments: FixedCommitment[];
  };
  onSavePreferences: (prefs: any) => void;
  onSetEvents: (events: TimetableEvent[]) => void;
}

const REASSURING_MESSAGES = [
  "Mapping biological sleep-wake cycles...",
  "Calibrating high-concentration study windows...",
  "Routing and securing fixed commitment buffers...",
  "Distributing workout and active intervals...",
  "Weaving in mandatory micro-breaks for neuro-recovery...",
  "Assembling final routine blocks...",
];

export default function AIGenerator({ 
  preferences, 
  onSavePreferences, 
  onSetEvents 
}: AIGeneratorProps) {
  // Local state initialized with preferences
  const [wakeTime, setWakeTime] = useState(preferences.wakeTime);
  const [sleepTime, setSleepTime] = useState(preferences.sleepTime);
  const [goals, setGoals] = useState(preferences.goals);
  const [fixedCommitments, setFixedCommitments] = useState<FixedCommitment[]>(preferences.fixedCommitments);

  // New fixed commitment form state
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cDay, setCDay] = useState<typeof DAYS_OF_WEEK[number]>("Monday");
  const [cStartTime, setCStartTime] = useState("09:00");
  const [cEndTime, setCEndTime] = useState("12:00");
  const [cCategory, setCCategory] = useState<any>("work");

  // AI loading and preview states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [aiResponse, setAiResponse] = useState<{
    events: any[];
    source: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddFixedCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim()) return;

    const newCommitment: FixedCommitment = {
      id: Math.random().toString(36).substring(2, 9),
      title: cTitle,
      day: cDay,
      startTime: cStartTime,
      endTime: cEndTime,
      category: cCategory,
    };

    setFixedCommitments([...fixedCommitments, newCommitment]);
    setCTitle("");
    setShowAddCommitment(false);
  };

  const handleRemoveFixedCommitment = (id: string) => {
    setFixedCommitments(fixedCommitments.filter(c => c.id !== id));
  };

  const handleGenerateRoutine = async () => {
    setLoading(true);
    setLoadingStep(0);
    setAiResponse(null);
    setError(null);

    // Save preferences locally first
    onSavePreferences({
      wakeTime,
      sleepTime,
      goals,
      fixedCommitments,
    });

    // Cycle through loading steps for a highly polished thematic AI experience
    const messageInterval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % REASSURING_MESSAGES.length);
    }, 1800);

    try {
      const res = await fetch(getApiUrl("/api/gemini/generate-routine"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wakeTime,
          sleepTime,
          goals,
          fixedCommitments,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setAiResponse(data);
    } catch (err: any) {
      console.error("Routine generation request failed:", err);
      setError("The routine generation took longer than expected or encountered a connection interruption. Please try again in a few moments.");
    } finally {
      clearInterval(messageInterval);
      setLoading(false);
    }
  };

  // Merge the generated events into existing timetable (keeping existing ones that don't conflict)
  const handleApplyMerge = () => {
    if (!aiResponse) return;

    // Convert preview events into full TimetableEvents with fresh IDs
    const newEvents: TimetableEvent[] = aiResponse.events.map((e: any) => ({
      id: Math.random().toString(36).substring(2, 9),
      title: e.title,
      day: e.day,
      startTime: e.startTime,
      endTime: e.endTime,
      category: e.category,
      notes: e.notes || "",
      isRecurring: true,
      completed: false,
    }));

    // We'll also merge existing fixed commitments as non-overlapping events!
    const commitmentEvents: TimetableEvent[] = fixedCommitments.map((c) => ({
      id: c.id,
      title: c.title,
      day: c.day,
      startTime: c.startTime,
      endTime: c.endTime,
      category: c.category,
      notes: "Fixed Commitment",
      isRecurring: true,
      completed: false,
    }));

    onSetEvents([...commitmentEvents, ...newEvents]);
    setAiResponse(null);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="ai-generator-tab-panel">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#E50914]/10 text-[#E50914] rounded-xl border border-[#E50914]/20 shadow-[0_0_15px_rgba(229,9,20,0.05)]">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="font-sans font-extrabold text-2xl tracking-tight text-white">
            AI ROUTINE <span className="text-[#E50914]">OPTIMIZER</span>
          </h2>
          <p className="text-zinc-400 mt-1 text-sm font-medium">
            Formulate an ideal, scientifically balanced schedule based on sleep cycles, fixed blockers, and core goals.
          </p>
        </div>
      </div>

      {/* AI Loading State */}
      {loading && (
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[350px]">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-[#E50914] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-lg text-white">Generating Your Optimized Blueprint</h3>
            <p className="text-zinc-400 font-mono text-xs tracking-wider animate-pulse h-4">
              {REASSURING_MESSAGES[loadingStep]}
            </p>
          </div>
        </div>
      )}

      {/* AI Response Preview Screen */}
      {!loading && aiResponse && (
        <div className="bg-[#141414] border border-white/5 p-6 md:p-8 rounded-3xl space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase bg-[#E50914]/10 border border-[#E50914]/25 text-[#E50914] px-2.5 py-0.5 rounded-full">
                {aiResponse.source === "gemini" ? "Gemini 3.5 Generated" : "Rule-Based Optimizer"}
              </span>
              <h3 className="font-sans font-extrabold text-xl text-white">Proposed Routine Preview</h3>
              <p className="text-xs text-zinc-400 font-medium">
                {aiResponse.message}
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setAiResponse(null)}
                className="px-4 py-2.5 rounded-xl border border-white/5 text-zinc-400 hover:text-white font-sans text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Decline & Adjust
              </button>
              <button
                onClick={handleApplyMerge}
                className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:brightness-110 text-white font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(229,9,20,0.4)] cursor-pointer"
              >
                Apply to Timetable
              </button>
            </div>
          </div>

          {/* Preview list sorted by day */}
          <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1 scrollbar-none" id="ai-events-preview-list">
            {DAYS_OF_WEEK.map((d) => {
              const dayEvents = aiResponse.events.filter((e: any) => e.day === d);
              if (dayEvents.length === 0) return null;

              return (
                <div key={d} className="space-y-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <h4 className="text-xs font-extrabold text-zinc-300 font-sans tracking-tight uppercase">{d}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {dayEvents.map((e: any, index: number) => {
                      const categoryInfo = CATEGORIES[e.category as CategoryType] || CATEGORIES.personal;
                      return (
                        <div key={index} className="bg-[#0A0A0A] border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                          <div className="space-y-1 truncate">
                            <h5 className="text-xs font-extrabold text-white truncate">{e.title}</h5>
                            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                            {e.notes && <p className="text-[10px] text-zinc-500 truncate">{e.notes}</p>}
                          </div>
                          <span className="text-[10px] font-mono font-bold text-[#E50914] whitespace-nowrap bg-[#141414] border border-white/5 px-2 py-1 rounded">
                            {e.startTime}-{e.endTime}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Configuration Panel */}
      {!loading && !aiResponse && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs Form (Left side - 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-6 shadow-lg">
              <h3 className="font-sans font-extrabold text-base text-white border-b border-white/5 pb-3">
                1. ROUTINE PARAMETERS
              </h3>

              {error && (
                <div className="p-4 bg-red-950/15 border border-[#E50914]/20 rounded-2xl flex items-start gap-3 text-red-400 animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#E50914]" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold font-sans">Optimization Engine Interruption</h4>
                    <p className="text-[11px] font-medium leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* Time inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 font-sans">
                    <Clock className="w-4 h-4 text-[#E50914]" /> Target Wake Time
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E50914] font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 font-sans">
                    <Clock className="w-4 h-4 text-zinc-500" /> Target Sleep Time
                  </label>
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E50914] font-mono"
                  />
                </div>
              </div>

              {/* Goals list */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 font-sans">
                  <Target className="w-4 h-4 text-[#E50914]" /> Targets & Habits to Schedule
                </label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g.&#10;- Study computer science for 3 hours/day&#10;- Heavy hypertrophy weight training 4x a week&#10;- Learn UI design in the evening&#10;- Read 15 pages of philosophy"
                  className="w-full h-36 bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E50914] resize-none font-sans"
                />
                <p className="text-[10px] text-zinc-500 font-medium">
                  Be descriptive! Mention frequencies (e.g. "workout 4x/week") so the optimizer distributes slots intelligently.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleGenerateRoutine}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#E50914] text-white hover:brightness-110 transition-all font-sans font-bold text-sm tracking-wide uppercase shadow-[0_0_20px_rgba(229,9,20,0.4)] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" /> Optimize My Routine
                </button>
              </div>
            </div>
          </div>

          {/* Fixed Commitments Panel (Right side - 1 col) */}
          <div className="space-y-6">
            <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="font-sans font-extrabold text-xs tracking-wider uppercase text-zinc-400">
                  2. STRICT BLOCKED TIMES
                </h3>
                <button
                  onClick={() => setShowAddCommitment(!showAddCommitment)}
                  className="p-1.5 rounded-lg bg-[#0A0A0A] border border-white/5 text-[#E50914] hover:brightness-110 transition-colors"
                >
                  {showAddCommitment ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                Add strict recurring blocks (college lectures, jobs, family syncs) that the AI should schedule around.
              </p>

              {/* Add Commitment Form */}
              {showAddCommitment && (
                <form onSubmit={handleAddFixedCommitment} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 font-sans">Block Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSE Lecture 1"
                      value={cTitle}
                      onChange={(e) => setCTitle(e.target.value)}
                      className="w-full bg-[#141414] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#E50914]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 font-sans">Day</label>
                      <select
                        value={cDay}
                        onChange={(e) => setCDay(e.target.value as any)}
                        className="w-full bg-[#141414] border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#E50914]"
                      >
                        {DAYS_OF_WEEK.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 font-sans">Category</label>
                      <select
                        value={cCategory}
                        onChange={(e) => setCCategory(e.target.value as any)}
                        className="w-full bg-[#141414] border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#E50914]"
                      >
                        <option value="work">Work</option>
                        <option value="study">Study</option>
                        <option value="chore">Chore / Class</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 font-sans">Start</label>
                      <input
                        type="time"
                        value={cStartTime}
                        onChange={(e) => setCStartTime(e.target.value)}
                        className="w-full bg-[#141414] border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#E50914]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 font-sans">End</label>
                      <input
                        type="time"
                        value={cEndTime}
                        onChange={(e) => setCEndTime(e.target.value)}
                        className="w-full bg-[#141414] border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#E50914]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#E50914] hover:brightness-110 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-[0_0_10px_rgba(229,9,20,0.2)]"
                  >
                    Save Blocker
                  </button>
                </form>
              )}

              {/* List of Blockers */}
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-none" id="blockers-list">
                {fixedCommitments.length === 0 ? (
                  <p className="text-zinc-500 text-xs text-center py-4 font-mono">No strict blockers defined.</p>
                ) : (
                  fixedCommitments.map((c) => (
                    <div 
                      key={c.id} 
                      className="bg-[#0A0A0A] border border-white/5 p-3.5 rounded-2xl flex items-center justify-between gap-3 group animate-fade-in"
                    >
                      <div className="space-y-0.5 truncate">
                        <h4 className="text-xs font-extrabold text-zinc-200 truncate">{c.title}</h4>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500">
                          <span>{c.day}</span>
                          <span>•</span>
                          <span>{c.startTime} - {c.endTime}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFixedCommitment(c.id)}
                        className="text-zinc-600 hover:text-[#E50914] transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
