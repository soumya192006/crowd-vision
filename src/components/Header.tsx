import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';
import { SystemStatus, BackendMode } from '../types';

interface HeaderProps {
  status: SystemStatus;
  onTogglePlayPause: () => void;
  onReset: () => void;
  backendMode: BackendMode;
  isWebSocketActive: boolean;
}

export function Header({
  status,
  onTogglePlayPause,
  onReset,
  backendMode,
  isWebSocketActive,
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isRealBackend = backendMode === 'local_websocket' && isWebSocketActive;

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Wordmark & Core Identity */}
      <div className="flex items-baseline gap-3 shrink-0">
        <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
          CrowdVision
        </span>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline whitespace-nowrap">
          YOLOv8 + ByteTrack · People Counting
        </span>
      </div>

      {/* Zone 2: System Telemetry & Mode Indicator */}
      <div className="flex items-center gap-4 text-xs">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'running'
                ? 'bg-emerald-400'
                : status === 'paused'
                ? 'bg-amber-400'
                : 'bg-rose-400'
            }`}
          />
          <span className="font-medium text-slate-300 capitalize whitespace-nowrap">
            {status}
          </span>
        </div>

        <span className="text-slate-600 hidden md:inline" aria-hidden="true">·</span>

        {/* Demo Mode or Live Mode Flag */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs">
          {isRealBackend ? (
            <span className="text-emerald-400 font-semibold tracking-wide">
              LOCAL PYTHON BACKEND ACTIVE
            </span>
          ) : (
            <span className="text-amber-300 font-semibold tracking-wide">
              DEMO MODE — SIMULATED TRACKING
            </span>
          )}
        </div>

        <span className="text-slate-600 hidden md:inline" aria-hidden="true">·</span>

        {/* Local time */}
        <div className="hidden md:flex items-center gap-1.5 text-slate-400 font-mono tabular-nums">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span>{currentTime || 'Loading...'}</span>
        </div>
      </div>

      {/* Zone 3: Primary Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onTogglePlayPause}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            status === 'running'
              ? 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30'
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20'
          }`}
          title={status === 'running' ? 'Pause tracking loop' : 'Start tracking loop'}
        >
          {status === 'running' ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </>
          )}
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors whitespace-nowrap"
          title="Reset Simulation State"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
}
