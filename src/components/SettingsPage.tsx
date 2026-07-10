import React, { useState } from "react";
import { 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  Bell, 
  Palette, 
  Info, 
  Check, 
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";
import { TimetableEvent } from "../types";
import { exportToCSV } from "../utils";

interface SettingsPageProps {
  events: TimetableEvent[];
  theme: string;
  onThemeChange: (theme: string) => void;
  notificationEnabled: boolean;
  onSetNotificationEnabled: (enabled: boolean) => void;
  onClearAll: () => void;
  onResetToDefault: () => void;
  onImportEvents: (imported: TimetableEvent[]) => void;
}

export default function SettingsPage({
  events,
  theme,
  onThemeChange,
  notificationEnabled,
  onSetNotificationEnabled,
  onClearAll,
  onResetToDefault,
  onImportEvents
}: SettingsPageProps) {
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

  const themeOptions = [
    { id: "redline", name: "Redline Core", desc: "Base high-contrast Red & Black theme.", activeColors: "bg-red-600 border-red-500" },
    { id: "gray", name: "Monochrome Gray", desc: "Clean and minimalist grayscale aesthetic.", activeColors: "bg-gray-600 border-gray-500" },
    { id: "light", name: "Daylight Bright", desc: "Crisp light interface with high visibility.", activeColors: "bg-slate-200 border-slate-300" },
  ];

  const handleExport = () => {
    exportToCSV(events);
  };

  // Import from CSV parser
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("File empty");

        const lines = text.split("\n");
        if (lines.length <= 1) throw new Error("Header only or invalid structure");

        const parsedEvents: TimetableEvent[] = [];
        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));

        // Validate basic headers
        const requiredHeaders = ["Title", "Day", "Start Time", "End Time", "Category"];
        const hasRequired = requiredHeaders.every(req => headers.includes(req));
        if (!hasRequired) {
          throw new Error("Missing required columns: Title, Day, Start Time, End Time, Category");
        }

        const titleIdx = headers.indexOf("Title");
        const dayIdx = headers.indexOf("Day");
        const startIdx = headers.indexOf("Start Time");
        const endIdx = headers.indexOf("End Time");
        const catIdx = headers.indexOf("Category");
        const notesIdx = headers.indexOf("Notes");
        const recIdx = headers.indexOf("Recurring");

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV line parser split by comma but respecting quotes
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
          const values = matches.map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

          if (values.length < 5) continue;

          parsedEvents.push({
            id: Math.random().toString(36).substring(2, 9),
            title: values[titleIdx] || "Untitled Event",
            day: (values[dayIdx] || "Monday") as any,
            startTime: values[startIdx] || "09:00",
            endTime: values[endIdx] || "10:00",
            category: (values[catIdx] || "personal") as any,
            notes: notesIdx !== -1 ? values[notesIdx] : "",
            isRecurring: recIdx !== -1 ? (values[recIdx] === "Yes") : true,
            completed: false
          });
        }

        if (parsedEvents.length === 0) {
          throw new Error("No valid events parsed.");
        }

        onImportEvents(parsedEvents);
        setImportSuccess(true);
      } catch (err: any) {
        setImportError(err.message || "Failed to parse CSV. Double check column formatting.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="settings-tab-panel">
      {/* Page Header */}
      <div>
        <h2 className="font-sans font-extrabold text-2xl tracking-tight text-white flex items-center gap-2.5">
          SYSTEM <span className="text-[#E50914]">SETTINGS</span>
        </h2>
        <p className="text-zinc-400 mt-1 text-sm font-medium">
          Control visual skins, notification schedules, database purges, and CSV transfer protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual Styling Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Themes Panel */}
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-4 shadow-lg">
            <h3 className="font-sans font-extrabold text-base text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#E50914]" /> Interface Skins
            </h3>
            <p className="text-xs text-zinc-400">
              Select your customized colorway. Red and Black remains the primary base highlight across all presets.
            </p>

            <div className="space-y-3" id="theme-settings-list">
              {themeOptions.map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => onThemeChange(opt.id)}
                  className={`
                    p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all duration-200
                    ${theme === opt.id 
                      ? "bg-[#E50914]/5 border-[#E50914]" 
                      : "bg-[#0A0A0A] border-white/5 hover:border-white/10"
                    }
                  `}
                >
                  <div className="space-y-0.5 pl-1">
                    <h4 className="text-sm font-extrabold text-white">{opt.name}</h4>
                    <p className="text-xs text-zinc-500">{opt.desc}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border ${opt.activeColors}`} />
                    {theme === opt.id && <Check className="w-4 h-4 text-[#E50914]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Panel */}
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-4 shadow-lg">
            <h3 className="font-sans font-extrabold text-base text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#E50914]" /> Notifications & Routine Reminders
            </h3>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0A0A0A] border border-white/5">
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-white">Daily Morning Schedule Alert</h4>
                <p className="text-[11px] text-zinc-400 leading-normal max-w-sm">
                  Triggers local browser notification reminders summarizing your active blocks for the upcoming day.
                </p>
              </div>

              {/* Custom Switch Component */}
              <button
                onClick={() => onSetNotificationEnabled(!notificationEnabled)}
                className={`
                  w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer
                  ${notificationEnabled ? "bg-[#E50914]" : "bg-[#0D0D0D] border border-white/5"}
                `}
                id="toggle-notification-btn"
              >
                <div className={`bg-white w-4.5 h-4.5 rounded-full transition-transform duration-200 ${notificationEnabled ? "translate-x-5.5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Database & Data Sync Tools (Right side - 1 col) */}
        <div className="space-y-6">
          {/* Data import/export panel */}
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-4 shadow-lg">
            <h3 className="font-sans font-extrabold text-sm tracking-wider uppercase text-zinc-400">
              CSV Data Transfer
            </h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Export your weekly timetable blocks to standard CSV spreadsheet formats, or import a previously exported routine.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#E50914]" /> Export Timetable CSV
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                  id="import-csv-file-input"
                />
                <label
                  htmlFor="import-csv-file-input"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-zinc-500" /> Import Schedule CSV
                </label>
              </div>

              {importError && (
                <p className="text-[10px] text-red-400 font-mono text-center leading-normal bg-[#E50914]/5 p-2.5 rounded-xl border border-[#E50914]/20">
                  ⚠️ Error: {importError}
                </p>
              )}

              {importSuccess && (
                <p className="text-[10px] text-green-400 font-mono text-center leading-normal bg-green-950/20 p-2.5 rounded-xl border border-green-900/30 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> CSV imported successfully!
                </p>
              )}
            </div>
          </div>

          {/* Wipe and Resets panel */}
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-4 shadow-lg">
            <h3 className="font-sans font-extrabold text-sm tracking-wider uppercase text-zinc-400">
              System Operations
            </h3>

            <div className="space-y-2.5">
              {/* Load Template */}
              <button
                onClick={onResetToDefault}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-all text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" /> Load Premium Template
              </button>

              {/* Wipe all */}
              <button
                onClick={onClearAll}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#E50914]/5 border border-[#E50914]/20 hover:bg-[#E50914]/10 text-red-400 transition-all text-xs font-semibold"
                id="clear-all-data-btn"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#E50914]" /> Wipe Local Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
