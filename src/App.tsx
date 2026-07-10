import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TimetableBuilder from "./components/TimetableBuilder";
import AIGenerator from "./components/AIGenerator";
import TaskManager from "./components/TaskManager";
import InsightsPage from "./components/InsightsPage";
import SettingsPage from "./components/SettingsPage";

import { TimetableEvent, Task, UserPreferences, FixedCommitment } from "./types";
import { INITIAL_EVENTS, INITIAL_TASKS } from "./utils";

export default function App() {
  // Navigation states
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Core schedules state (hydrated from localStorage)
  const [events, setEvents] = useState<TimetableEvent[]>(() => {
    const saved = localStorage.getItem("redline_events");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved events:", e);
      }
    }
    return INITIAL_EVENTS; // Fallback template
  });

  // Core tasks state (hydrated from localStorage)
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("redline_tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved tasks:", e);
      }
    }
    return INITIAL_TASKS; // Fallback template
  });

  // User Preferences state (hydrated from localStorage)
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem("redline_preferences");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved preferences:", e);
      }
    }
    return {
      wakeTime: "07:00",
      sleepTime: "23:00",
      goals: "- Study programming for 3 hours/day\n- Focus on core strength gym workouts 3x/week\n- Maintain a high focus work schedule",
      fixedCommitments: [],
      notificationEnabled: true
    };
  });

  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("redline_theme") || "redline";
  });

  // Sync state to local storage when changed
  useEffect(() => {
    localStorage.setItem("redline_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("redline_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("redline_preferences", JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem("redline_theme", theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Timetable Event Handlers
  const handleAddEvent = (newEvent: Omit<TimetableEvent, "id">) => {
    const event: TimetableEvent = {
      ...newEvent,
      id: Math.random().toString(36).substring(2, 9),
    };
    setEvents((prev) => [...prev, event]);
  };

  const handleUpdateEvent = (id: string, updatedFields: Partial<TimetableEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updatedFields } : e))
    );
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleToggleEventComplete = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
  };

  // Task Handlers
  const handleAddTask = (newTask: Omit<Task, "id" | "createdAt" | "completed">) => {
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substring(2, 9),
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTasks((prev) => [task, ...prev]);
  };

  const handleToggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Preference Handlers
  const handleSavePreferences = (updatedPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...updatedPrefs
    }));
  };

  const handleSetNotificationEnabled = (enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      notificationEnabled: enabled
    }));
  };

  // General operations
  const handleClearAll = () => {
    if (window.confirm("Are you absolutely sure you want to clear your entire timetable? This cannot be undone.")) {
      setEvents([]);
      setTasks([]);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("This will reset your current schedule back to the default preview data template. Proceed?")) {
      setEvents(INITIAL_EVENTS);
      setTasks(INITIAL_TASKS);
    }
  };

  const handleImportEvents = (imported: TimetableEvent[]) => {
    setEvents((prev) => [...prev, ...imported]);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col md:flex-row text-white font-sans antialiased overflow-x-hidden">
      {/* Navigation Sidebar Drawer */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Main Screen Content Frame */}
      <main className="flex-1 min-h-screen md:h-screen md:overflow-y-auto px-4 md:px-8 py-6 pt-20 md:pt-8 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === "dashboard" && (
            <Dashboard 
              events={events}
              tasks={tasks}
              onAddEvent={handleAddEvent}
              onToggleEventComplete={handleToggleEventComplete}
              onAddTask={handleAddTask}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "timetable" && (
            <TimetableBuilder 
              events={events}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          {activeTab === "ai-generator" && (
            <AIGenerator 
              preferences={preferences}
              onSavePreferences={handleSavePreferences}
              onSetEvents={setEvents}
            />
          )}

          {activeTab === "tasks" && (
            <TaskManager 
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === "insights" && (
            <InsightsPage 
              events={events}
              tasks={tasks}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage 
              events={events}
              theme={theme}
              onThemeChange={setTheme}
              notificationEnabled={preferences.notificationEnabled}
              onSetNotificationEnabled={handleSetNotificationEnabled}
              onClearAll={handleClearAll}
              onResetToDefault={handleResetToDefault}
              onImportEvents={handleImportEvents}
            />
          )}
        </div>
      </main>
    </div>
  );
}
