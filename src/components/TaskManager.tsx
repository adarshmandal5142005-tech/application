import React, { useState, useMemo } from "react";
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Grid, 
  Activity,
  PlusSquare,
  Search,
  SlidersHorizontal,
  FolderDot
} from "lucide-react";
import { Task, CATEGORIES, CategoryType } from "../types";

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  onToggleTaskComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskManager({ 
  tasks, 
  onAddTask, 
  onToggleTaskComplete, 
  onDeleteTask 
}: TaskManagerProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [category, setCategory] = useState<CategoryType>("study");
  const [dueDate, setDueDate] = useState("");
  
  // Filtering and Searching
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title,
      priority,
      category,
      dueDate: dueDate || undefined,
    });

    setTitle("");
    setDueDate("");
  };

  // Filter tasks based on filters and search
  const processedTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
        const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
        const matchesCategory = filterCategory === "all" || t.category === filterCategory;
        return matchesSearch && matchesPriority && matchesCategory;
      })
      .sort((a, b) => {
        // High -> Medium -> Low priority
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (diff !== 0) return diff;
        
        // Sort by completed (active first)
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, search, filterPriority, filterCategory]);

  // Task metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const highPriorityCount = tasks.filter((t) => !t.completed && t.priority === "high").length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      highPriorityCount,
      percentage,
    };
  }, [tasks]);

  return (
    <div className="space-y-8 animate-fade-in" id="tasks-tab-panel">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-extrabold text-2xl tracking-tight text-white flex items-center gap-2.5">
            TASKS & <span className="text-[#E50914]">FOCUS DECK</span>
          </h2>
          <p className="text-zinc-400 mt-1 text-sm font-medium">
            Review critical priorities, filter across core categories, and complete goals with satisfying check feedback.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="task-metrics-grid">
        <div className="bg-[#141414] p-5 rounded-2xl border border-white/5">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">Completion Ratio</span>
          <div className="flex items-center gap-3 mt-1.5">
            <h3 className="font-sans font-extrabold text-2xl text-white">{metrics.percentage}%</h3>
            <div className="flex-1 bg-[#0A0A0A] h-2.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-[#E50914] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(229,9,20,0.5)]" 
                style={{ width: `${metrics.percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-[#141414] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">Active Tasks</span>
            <h3 className="font-sans font-extrabold text-2xl text-white mt-1">{metrics.pending}</h3>
          </div>
          <CheckSquare className="w-8 h-8 text-[#E50914] opacity-80" />
        </div>

        <div className="bg-[#141414] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">Completed Objectives</span>
            <h3 className="font-sans font-extrabold text-2xl text-white mt-1">{metrics.completed}</h3>
          </div>
          <CheckCircle2 className="w-8 h-8 text-zinc-500" />
        </div>

        <div className="bg-[#141414] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">Critical Priority</span>
            <h3 className="font-sans font-extrabold text-2xl text-[#E50914] mt-1">{metrics.highPriorityCount}</h3>
          </div>
          <AlertCircle className="w-8 h-8 text-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.2)] animate-pulse" />
        </div>
      </div>

      {/* Main Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left add form (1 col) */}
        <div>
          <div className="bg-[#141414] border border-white/5 p-6 rounded-3xl space-y-4 shadow-lg sticky top-6">
            <h3 className="font-sans font-extrabold text-base text-white flex items-center gap-2">
              <PlusSquare className="w-5 h-5 text-[#E50914]" /> Quick Add Task
            </h3>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Task Title / Spec</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS201 Assignment 2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="high">🔥 High</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="low">💤 Low</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#E50914]"
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
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Due Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-[#E50914] hover:brightness-110 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(229,9,20,0.3)] cursor-pointer"
              >
                Insert to Deck
              </button>
            </form>
          </div>
        </div>

        {/* Right list filter & results (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar */}
          <div className="bg-[#141414] p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E50914] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              {/* Priority filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-[#0A0A0A] border border-white/5 text-zinc-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none w-full md:w-auto"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              {/* Category filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#0A0A0A] border border-white/5 text-zinc-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none w-full md:w-auto"
              >
                <option value="all">All Categories</option>
                {Object.keys(CATEGORIES).map((key) => (
                  <option key={key} value={key}>
                    {CATEGORIES[key as any].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tasks Stack */}
          <div className="space-y-2.5" id="task-items-container">
            {processedTasks.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center text-zinc-500 space-y-1">
                <p className="font-sans font-bold text-sm">No tasks meet your filters</p>
                <p className="text-xs">Adjust your search parameters or write a new task.</p>
              </div>
            ) : (
              processedTasks.map((task) => {
                const categoryInfo = CATEGORIES[task.category] || CATEGORIES.personal;
                return (
                  <div
                    key={task.id}
                    id={`task-item-card-${task.id}`}
                    className={`
                      p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-200 group/task
                      ${task.completed 
                        ? "bg-[#141414]/30 border-white/5 opacity-55" 
                        : "bg-[#141414] hover:bg-[#141414]/90 border-white/5 hover:border-[#E50914]/20"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3.5 truncate">
                      {/* Animated Checkbox */}
                      <button
                        onClick={() => onToggleTaskComplete(task.id)}
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer
                          ${task.completed 
                            ? "bg-[#E50914] border-[#E50914] text-white" 
                            : "bg-[#0A0A0A] border-white/10 hover:border-[#E50914]"
                          }
                        `}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>

                      <div className="space-y-1 truncate">
                        <p className={`font-sans font-bold text-sm leading-snug ${task.completed ? "line-through text-zinc-500" : "text-white"}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded ${categoryInfo.color} border border-transparent`}>
                            {categoryInfo.label}
                          </span>
                          <span className={`text-[8px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            task.priority === "high" ? "bg-[#E50914]/10 text-[#E50914] border border-[#E50914]/10" :
                            task.priority === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {task.priority} Priority
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {task.dueDate && (
                        <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-semibold text-zinc-500">
                          <Clock className="w-3 h-3 text-zinc-600" />
                          <span>Due: {task.dueDate}</span>
                        </span>
                      )}
                      
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-zinc-600 hover:text-[#E50914] p-1.5 rounded hover:bg-white/5 opacity-0 group-hover/task:opacity-100 transition-all cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
