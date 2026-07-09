import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  CheckCircle,
  X,
  PlusCircle,
  Copy
} from "lucide-react";
import { TimetableEvent, CATEGORIES, DAYS_OF_WEEK, CategoryType } from "../types";
import { timeToMinutes, detectAllConflicts } from "../utils";

interface TimetableBuilderProps {
  events: TimetableEvent[];
  onAddEvent: (event: Omit<TimetableEvent, "id">) => void;
  onUpdateEvent: (id: string, updated: Partial<TimetableEvent>) => void;
  onDeleteEvent: (id: string) => void;
}

export default function TimetableBuilder({ 
  events, 
  onAddEvent, 
  onUpdateEvent, 
  onDeleteEvent 
}: TimetableBuilderProps) {
  const [editingEvent, setEditingEvent] = useState<TimetableEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mobileActiveDay, setMobileActiveDay] = useState<typeof DAYS_OF_WEEK[number]>("Monday");

  // Form states for New / Editing
  const [title, setTitle] = useState("");
  const [day, setDay] = useState<typeof DAYS_OF_WEEK[number]>("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [category, setCategory] = useState<CategoryType>("study");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);

  // Drag and Drop State
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  // Pre-calculate conflicts
  const conflicts = useMemo(() => {
    return detectAllConflicts(events);
  }, [events]);

  const conflictingIds = useMemo(() => {
    const ids = new Set<string>();
    conflicts.forEach(c => {
      ids.add(c.eventId1);
      ids.add(c.eventId2);
    });
    return ids;
  }, [conflicts]);

  // Open add modal
  const handleOpenAdd = (targetDay?: typeof DAYS_OF_WEEK[number]) => {
    setTitle("");
    setDay(targetDay || mobileActiveDay);
    setStartTime("10:00");
    setEndTime("11:30");
    setCategory("study");
    setNotes("");
    setIsRecurring(true);
    setEditingEvent(null);
    setShowAddModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (event: TimetableEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDay(event.day);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setCategory(event.category);
    setNotes(event.notes || "");
    setIsRecurring(event.isRecurring);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingEvent) {
      onUpdateEvent(editingEvent.id, {
        title,
        day,
        startTime,
        endTime,
        category,
        notes,
        isRecurring,
      });
    } else {
      onAddEvent({
        title,
        day,
        startTime,
        endTime,
        category,
        notes,
        isRecurring,
      });
    }

    setShowAddModal(false);
    setEditingEvent(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedEventId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDay: typeof DAYS_OF_WEEK[number]) => {
    e.preventDefault();
    const id = draggedEventId || e.dataTransfer.getData("text/plain");
    if (id) {
      onUpdateEvent(id, { day: targetDay });
    }
    setDraggedEventId(null);
  };

  // Duplicate an event easily to another day
  const handleDuplicate = (event: TimetableEvent) => {
    // find next day of week
    const currentIdx = DAYS_OF_WEEK.indexOf(event.day);
    const nextIdx = (currentIdx + 1) % 7;
    const nextDay = DAYS_OF_WEEK[nextIdx];

    onAddEvent({
      title: `${event.title} (Copy)`,
      day: nextDay,
      startTime: event.startTime,
      endTime: event.endTime,
      category: event.category,
      notes: event.notes,
      isRecurring: event.isRecurring,
    });
  };

  // Sort events by starting time
  const getSortedEventsForDay = (targetDay: typeof DAYS_OF_WEEK[number]) => {
    return events
      .filter(e => e.day === targetDay)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  return (
    <div className="space-y-8 animate-fade-in" id="timetable-tab-panel">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans font-extrabold text-2xl tracking-tight text-white flex items-center gap-2.5">
            WEEKLY <span className="text-[#E50914] font-extrabold">TIMETABLE GRID</span>
          </h2>
          <p className="text-zinc-400 mt-1 text-sm font-medium">
            Plan, drag-and-drop, and organize your routine blocks. Conflict alerts will trigger on overlapping slots.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E50914] text-white hover:brightness-110 transition-all font-sans font-bold text-sm tracking-wider uppercase shadow-[0_0_15px_rgba(229,9,20,0.4)] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Routine Block
        </button>
      </div>

      {/* Conflict Bar Alert if any exists */}
      {conflicts.length > 0 && (
        <div className="bg-[#E50914]/5 border border-[#E50914]/20 p-4 rounded-xl flex items-start gap-3 shadow-[0_0_15px_rgba(229,9,20,0.02)]">
          <AlertTriangle className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-400 font-sans">Scheduling Conflicts Detected ({conflicts.length})</h4>
            <div className="max-h-24 overflow-y-auto space-y-1 text-xs text-zinc-400 font-mono scrollbar-thin">
              {conflicts.map((c, index) => (
                <p key={index}>• {c.message}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Day Selector Tabs */}
      <div className="md:hidden flex gap-1 overflow-x-auto pb-2 scrollbar-none" id="grid-mobile-tabs">
        {DAYS_OF_WEEK.map((d) => (
          <button
            key={d}
            onClick={() => setMobileActiveDay(d)}
            className={`
              px-4 py-2.5 rounded-xl text-xs font-bold font-sans tracking-wide transition-all whitespace-nowrap cursor-pointer
              ${mobileActiveDay === d 
                ? "bg-[#E50914] text-white shadow-[0_0_12px_rgba(229,9,20,0.4)]" 
                : "bg-white/5 text-gray-400 hover:text-white"
              }
            `}
          >
            {d}
          </button>
        ))}
      </div>

      {/* TIMETABLE GRID (Desktop - 7 columns, Mobile - 1 column) */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 lg:gap-3" id="timetable-grid-columns">
        {DAYS_OF_WEEK.map((d) => {
          const isMobileHidden = mobileActiveDay !== d;
          const dayEvents = getSortedEventsForDay(d);

          return (
            <div
              key={d}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, d)}
              className={`
                bg-[#141414] rounded-3xl border border-white/5 p-3 flex flex-col min-h-[480px] transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.2)]
                ${isMobileHidden ? "hidden md:flex" : "flex"}
                ${draggedEventId ? "border-[#E50914]/30 bg-[#E50914]/5" : ""}
                hover:border-white/10
              `}
              id={`grid-column-${d}`}
            >
              {/* Day title header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <div className="space-y-0.5">
                  <h3 className="font-sans font-extrabold text-sm text-white tracking-tight">{d}</h3>
                  <span className="text-[10px] font-mono text-zinc-500 font-semibold">{dayEvents.length} blocks</span>
                </div>
                <button
                  onClick={() => handleOpenAdd(d)}
                  className="p-1 text-zinc-500 hover:text-[#E50914] rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Day events stack */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] scrollbar-none">
                {dayEvents.length === 0 ? (
                  <div 
                    onClick={() => handleOpenAdd(d)}
                    className="h-32 border border-dashed border-white/10 hover:border-[#E50914]/20 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl flex flex-col items-center justify-center text-zinc-600 hover:text-zinc-400 p-4 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-5 h-5 mb-1 text-zinc-700 hover:text-[#E50914]" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-center">Empty Slot</span>
                  </div>
                ) : (
                  dayEvents.map((event) => {
                    const categoryInfo = CATEGORIES[event.category] || CATEGORIES.personal;
                    const isConflicting = conflictingIds.has(event.id);

                    return (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, event.id)}
                        className={`
                          p-3 rounded-2xl bg-[#0A0A0A] hover:bg-[#0A0A0A]/85 border transition-all duration-200 cursor-grab active:cursor-grabbing relative overflow-hidden group/card
                          ${isConflicting 
                            ? "border-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.3)]" 
                            : "border-white/5 hover:border-[#E50914]/20"
                          }
                        `}
                        id={`event-card-${event.id}`}
                      >
                        {/* Glow and Category indicator bar */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1 ${isConflicting ? "bg-[#E50914] animate-pulse" : "bg-[#E50914]"}`} />

                        {/* Title and Badge */}
                        <div className="space-y-1 pl-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-sans font-extrabold text-xs text-white leading-tight truncate group-hover/card:text-[#E50914] transition-colors">
                              {event.title}
                            </h4>
                          </div>

                          <span className={`inline-block text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded ${categoryInfo.color} border ${categoryInfo.borderColor}`}>
                            {categoryInfo.label}
                          </span>

                          {event.notes && (
                            <p className="text-[10px] text-zinc-400 font-medium line-clamp-1">
                              {event.notes}
                            </p>
                          )}
                        </div>

                        {/* Time label and actions bar */}
                        <div className="mt-3.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <div className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-zinc-600" />
                            <span>{event.startTime}-{event.endTime}</span>
                          </div>

                          {/* Quick action triggers */}
                          <div className="flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDuplicate(event)}
                              title="Duplicate to next day"
                              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(event)}
                              title="Edit"
                              className="p-1 text-zinc-400 hover:text-[#E50914] transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteEvent(event.id)}
                              title="Delete"
                              className="p-1 text-zinc-400 hover:text-[#E50914] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-white/10 max-w-md w-full rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#0A0A0A] border-b border-white/5 flex items-center justify-between">
              <h3 className="font-sans font-bold text-lg text-white">
                {editingEvent ? "Edit Routine Block" : "Add Routine Block"}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEvent(null);
                }}
                className="text-zinc-500 hover:text-white font-semibold transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-sans">Block Name / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Deep Focus Architecture Sprint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-sans">Day of Week</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value as any)}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 font-sans">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 font-sans">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 font-sans">Category Classification</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
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
                <label className="text-xs font-semibold text-zinc-400 font-sans">Context Notes (Optional)</label>
                <textarea
                  placeholder="e.g., focused studying, prep materials, playlist link..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition-colors h-20 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded bg-[#0A0A0A] border-white/10 text-[#E50914] focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="isRecurring" className="text-xs font-semibold text-zinc-300 font-sans cursor-pointer">
                  Repeat weekly
                </label>
              </div>

              <div className="pt-2 flex justify-between items-center gap-2.5">
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteEvent(editingEvent.id);
                      setShowAddModal(false);
                      setEditingEvent(null);
                    }}
                    className="flex items-center gap-1 text-xs text-[#E50914] hover:text-[#E50914]/80 hover:underline font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Block
                  </button>
                )}
                <div className="flex gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingEvent(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-white/5 text-zinc-400 hover:text-white transition-colors text-xs font-semibold tracking-wider uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:brightness-110 text-white transition-colors text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(229,9,20,0.3)] cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
