import React from 'react';
import {
  LayoutDashboard,
  Video,
  BarChart3,
  ListFilter,
  Sliders,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'live_feed' | 'analytics' | 'logs' | 'settings' | 'about';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeCount: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  activeCount,
}: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'live_feed' as NavTab,
      label: 'Live Feed',
      icon: Video,
      badge: activeCount > 0 ? `${activeCount} tracks` : null,
    },
    {
      id: 'analytics' as NavTab,
      label: 'Tracking Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'logs' as NavTab,
      label: 'Event Logs',
      icon: ListFilter,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Sliders,
      badge: null,
    },
    {
      id: 'about' as NavTab,
      label: 'About Project',
      icon: Info,
      badge: null,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between bg-slate-900 border-r border-slate-800 transition-all duration-200 z-30 shrink-0 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Brand / Nav Section */}
      <div className="flex flex-col">
        {/* Workspace Brand Lockup */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/80">
          {!collapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-md bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div className="truncate">
                <div className="text-sm font-semibold text-white tracking-tight">VisionConsole</div>
                <div className="text-xs text-slate-400 font-mono">v8-ByteTrack</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 mx-auto rounded-md bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-blue-400" />
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors hidden md:block"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {!collapsed && (
                  <div className="flex items-center justify-between w-full overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs font-mono text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Offline System Status badge */}
      <div className="p-3 border-t border-slate-800">
        {!collapsed ? (
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Offline Architecture</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Zero cloud APIs. Video frames never leave your local system.
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title="Offline Capable · Zero Cloud Dependencies">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
        )}
      </div>
    </aside>
  );
}
