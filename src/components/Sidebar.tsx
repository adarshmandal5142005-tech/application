import React from "react";
import { 
  Calendar, 
  LayoutDashboard, 
  Sparkles, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Clock, 
  Menu, 
  X 
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "timetable", label: "Timetable Grid", icon: Calendar },
    { id: "ai-generator", label: "AI Generator", icon: Sparkles, badge: "SMART" },
    { id: "tasks", label: "Tasks & Focus", icon: CheckSquare },
    { id: "insights", label: "Insights & Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-white/5 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#E50914] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(229,9,20,0.4)]">
            <Clock className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="font-sans font-bold text-lg tracking-tight text-white">
            REDLINE<span className="text-[#E50914]">.ROUTINE</span>
          </span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)} 
          className="p-2 text-zinc-400 hover:text-white transition-colors"
          id="mobile-nav-toggle"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Main Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#0A0A0A] border-r border-white/5 p-6 flex flex-col justify-between z-50 transition-all duration-300
        md:translate-x-0 md:static md:h-screen
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Top brand header */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E50914] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(229,9,20,0.4)]">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-sans font-extrabold text-xl tracking-tight text-white leading-none">
                REDLINE
              </h1>
              <span className="text-[10px] font-mono tracking-widest text-[#E50914] uppercase font-bold">
                Routine Builder
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1" id="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleSelect(item.id)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl font-sans text-sm font-medium tracking-wide transition-all duration-200 group border-l-2
                    ${isActive 
                      ? "bg-white/5 text-[#E50914] border-[#E50914] shadow-[0_0_15px_rgba(229,9,20,0.05)] font-bold" 
                      : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-[#E50914]" : "text-gray-400 group-hover:text-[#E50914]"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom system indicators */}
        <div className="border-t border-white/5 pt-4 space-y-2">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.6)] animate-pulse" />
            <span className="text-xs font-mono text-zinc-500 tracking-wide">
              SYSTEM ONLINE
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 px-2 leading-relaxed">
            Locally Saved (localStorage)
          </p>
        </div>
      </aside>
    </>
  );
}
