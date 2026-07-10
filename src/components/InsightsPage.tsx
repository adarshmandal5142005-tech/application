import React, { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  PieChart as PieIcon, 
  Flame, 
  Lightbulb, 
  RefreshCw, 
  HelpCircle,
  Clock,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  Activity
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { TimetableEvent, Task, CATEGORIES, AIInsight, DAYS_OF_WEEK } from "../types";
import { timeToMinutes } from "../utils";
import { getApiUrl } from "../utils/api";

interface InsightsPageProps {
  events: TimetableEvent[];
  tasks: Task[];
}

const CATEGORY_THEME_COLORS = {
  sleep: "#000000",    // Black
  study: "#ffffff",    // White
  work: "#3b82f6",     // Blue
  gym: "#22c55e",      // Green
  personal: "#eab308", // Yellow
  leisure: "#ec4899",  // Pink
  chore: "#a855f7",    // Purple
};

export default function InsightsPage({ events, tasks }: InsightsPageProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Fetch AI Insights dynamically from Gemini
  const fetchAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch(getApiUrl("/api/gemini/generate-insights"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events, tasks }),
      });
      const data = await res.json();
      setInsights(data.insights || []);
    } catch (err) {
      console.error("Failed to fetch AI insights:", err);
      // Backend automatically serves fallback on failure
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchAIInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Calculate category distribution for Pie Chart
  const categoryChartData = useMemo(() => {
    const totals: Record<string, number> = {};
    
    // Initialize
    Object.keys(CATEGORIES).forEach(k => {
      totals[k] = 0;
    });

    events.forEach(e => {
      const start = timeToMinutes(e.startTime);
      const end = timeToMinutes(e.endTime);
      if (end > start) {
        const hrs = (end - start) / 60;
        totals[e.category] = (totals[e.category] || 0) + hrs;
      }
    });

    return Object.keys(totals)
      .map(cat => ({
        name: CATEGORIES[cat as any]?.label || cat,
        value: Math.round(totals[cat] * 10) / 10,
        color: CATEGORY_THEME_COLORS[cat as keyof typeof CATEGORY_THEME_COLORS] || "#e4e4e7"
      }))
      .filter(item => item.value > 0);
  }, [events]);

  // 2. Calculate daily density for Bar Chart
  const dailyChartData = useMemo(() => {
    return DAYS_OF_WEEK.map(day => {
      let totalHrs = 0;
      events.filter(e => e.day === day).forEach(e => {
        const start = timeToMinutes(e.startTime);
        const end = timeToMinutes(e.endTime);
        if (end > start) {
          totalHrs += (end - start) / 60;
        }
      });

      return {
        name: day.slice(0, 3),
        hours: Math.round(totalHrs * 10) / 10,
      };
    });
  }, [events]);

  // Overall calculations
  const summaryMetrics = useMemo(() => {
    let totalScheduledMins = 0;
    let gymCount = 0;
    let studyHours = 0;

    events.forEach(e => {
      const start = timeToMinutes(e.startTime);
      const end = timeToMinutes(e.endTime);
      const diff = end - start;
      if (diff > 0) {
        totalScheduledMins += diff;
        if (e.category === "gym") gymCount++;
        if (e.category === "study") studyHours += (diff / 60);
      }
    });

    const completionRate = tasks.length > 0 
      ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
      : 100;

    return {
      weeklyHours: Math.round((totalScheduledMins / 60) * 10) / 10,
      gymSessions: gymCount,
      studyHours: Math.round(studyHours * 10) / 10,
      taskCompletionRate: completionRate,
    };
  }, [events, tasks]);

  return (
    <div className="space-y-8 animate-fade-in" id="insights-tab-panel">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-extrabold text-2xl tracking-tight text-white flex items-center gap-2.5">
            PRODUCTIVITY <span className="text-[#E50914]">INSIGHTS</span>
          </h2>
          <p className="text-zinc-400 mt-1 text-sm font-medium">
            Analyze time-budget allocations, weekly density peaks, and personalized optimization advice.
          </p>
        </div>

        <button
          onClick={fetchAIInsights}
          disabled={loadingInsights}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] border border-white/5 text-zinc-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-55 cursor-pointer"
        >
          {loadingInsights ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" /> Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 text-[#E50914]" /> Refresh AI Insights
            </>
          )}
        </button>
      </div>

      {/* AI Smart Tips Section */}
      <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-4 shadow-lg">
        <h3 className="font-sans font-extrabold text-base text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#E50914] animate-pulse" /> Live Gemini Routines Audit
        </h3>

        {loadingInsights ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500 font-mono text-xs">
            <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
            <span>Consulting Gemini Core Models...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="ai-insights-cards">
            {insights.map((insight) => (
              <div 
                key={insight.id}
                className={`
                  p-5 rounded-2xl border flex flex-col justify-between gap-3 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]
                  ${insight.type === "success" ? "bg-[#E50914]/5 border-[#E50914]/20" :
                    insight.type === "warning" ? "bg-amber-950/10 border-amber-900/20" :
                    "bg-[#0A0A0A] border-white/5"
                  }
                `}
              >
                {/* Visual Accent Tag */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                  insight.type === "success" ? "bg-[#E50914]" :
                  insight.type === "warning" ? "bg-amber-500" :
                  "bg-zinc-700"
                }`} />

                <div className="space-y-1.5 pl-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider uppercase">
                    <Lightbulb className={`w-3.5 h-3.5 ${
                      insight.type === "success" ? "text-red-400" :
                      insight.type === "warning" ? "text-amber-400" :
                      "text-zinc-500"
                    }`} />
                    <span className={
                      insight.type === "success" ? "text-[#E50914]" :
                      insight.type === "warning" ? "text-amber-400" :
                      "text-zinc-400"
                    }>
                      {insight.type === "success" ? "Streak Alert" :
                       insight.type === "warning" ? "Routine Warning" :
                       "Recommendation"
                      }
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Analytics Row (Charts & Progress Indicators) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Time Distribution Pie Chart */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[380px] shadow-lg">
          <div className="space-y-1 pb-3 border-b border-white/5">
            <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-[#E50914]" /> Category Allocation
            </h3>
            <p className="text-xs text-zinc-500 font-medium">Hours per week spent on core categories.</p>
          </div>

          <div className="flex-1 min-h-[220px] flex items-center justify-center mt-4">
            {categoryChartData.length === 0 ? (
              <p className="text-xs text-zinc-600 font-mono">No events scheduled. Map some slots to see allocation charts.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0A0A0A", borderColor: "rgba(255,255,255,0.05)", borderRadius: "12px" }}
                    itemStyle={{ color: "#ffffff", fontFamily: "monospace", fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Inline Legend List */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-400 border-t border-white/5 pt-4">
            {categoryChartData.slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate" title={item.name}>
                <div className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}: {item.value}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Daily Hours Stack Bar Chart */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[380px] shadow-lg">
          <div className="space-y-1 pb-3 border-b border-white/5">
            <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E50914]" /> Daily Density
            </h3>
            <p className="text-xs text-zinc-500 font-medium">Total scheduled routine hours by weekday.</p>
          </div>

          <div className="flex-1 min-h-[220px] mt-4 flex items-center justify-center">
            {events.length === 0 ? (
              <p className="text-xs text-zinc-600 font-mono">No data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyChartData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#52525b" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(229, 9, 20, 0.05)" }}
                    contentStyle={{ backgroundColor: "#0A0A0A", borderColor: "rgba(255,255,255,0.05)", borderRadius: "12px" }}
                    labelStyle={{ color: "#a1a1aa", fontFamily: "sans-serif", fontSize: "11px", fontWeight: "bold" }}
                    itemStyle={{ color: "#E50914", fontFamily: "monospace", fontSize: "11px" }}
                  />
                  <Bar dataKey="hours" fill="#E50914" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* High-level Achievements Widget */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[380px] shadow-lg">
          <div className="space-y-1 pb-3 border-b border-white/5">
            <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#E50914]" /> Routine Achievements
            </h3>
            <p className="text-xs text-zinc-500 font-medium">Calculated weekly milestones.</p>
          </div>

          <div className="space-y-3 flex-1 py-4 justify-center flex flex-col">
            <div className="flex items-center gap-3.5 bg-[#0A0A0A] border border-white/5 p-3.5 rounded-2xl">
              <div className="p-2.5 rounded-xl bg-[#141414] border border-white/5 text-[#E50914]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Total Scheduled Time</p>
                <h4 className="font-sans font-extrabold text-base text-white">{summaryMetrics.weeklyHours} Hours</h4>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-[#0A0A0A] border border-white/5 p-3.5 rounded-2xl">
              <div className="p-2.5 rounded-xl bg-[#141414] border border-white/5 text-amber-500">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Gym/Workouts Logged</p>
                <h4 className="font-sans font-extrabold text-base text-white">{summaryMetrics.gymSessions} Sessions</h4>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-[#0A0A0A] border border-white/5 p-3.5 rounded-2xl">
              <div className="p-2.5 rounded-xl bg-[#141414] border border-white/5 text-rose-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Study Duration</p>
                <h4 className="font-sans font-extrabold text-base text-white">{summaryMetrics.studyHours} Hours</h4>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-[#0A0A0A] border border-white/5 p-3.5 rounded-2xl">
              <div className="p-2.5 rounded-xl bg-[#141414] border border-white/5 text-emerald-500">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Task Success Rate</p>
                <h4 className="font-sans font-extrabold text-base text-white">{summaryMetrics.taskCompletionRate}% Rate</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
