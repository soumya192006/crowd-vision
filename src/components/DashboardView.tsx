import React, { useMemo } from 'react';
import { VideoPlayerWithOverlay } from './VideoPlayerWithOverlay';
import { MetricCards, CrossingStatsRow } from './MetricCards';
import { AnalyticsPanel } from './AnalyticsPanel';
import { EventLogsTable } from './EventLogsTable';
import {
  TrackedPerson,
  CountingLine,
  ModelSettings,
  SystemStatus,
  CountHistoryItem,
  EventLog,
} from '../types';
import { SimulationEngine } from '../utils/simulation';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, BarChart3, ListFilter } from 'lucide-react';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  status: SystemStatus;
  onSetStatus: (status: SystemStatus) => void;
  tracks: TrackedPerson[];
  currentTimeSec: number;
  frameNumber: number;
  fps: number;
  cumulativeIn: number;
  cumulativeOut: number;
  settings: ModelSettings;
  onUpdateSettings: (s: Partial<ModelSettings>) => void;
  countingLine: CountingLine;
  uploadedVideoUrl: string | null;
  uploadedVideoFile: File | null;
  onUploadVideo: (file: File) => void;
  onClearUploadedVideo: () => void;
  simulationEngine: SimulationEngine;
  countHistory: CountHistoryItem[];
  eventLogs: EventLog[];
  onClearLogs: () => void;
  onNavigateTab: (tab: NavTab) => void;
  isRealBackend: boolean;
}

export function DashboardView({
  status,
  onSetStatus,
  tracks,
  currentTimeSec,
  frameNumber,
  fps,
  cumulativeIn,
  cumulativeOut,
  settings,
  onUpdateSettings,
  countingLine,
  uploadedVideoUrl,
  uploadedVideoFile,
  onUploadVideo,
  onClearUploadedVideo,
  simulationEngine,
  countHistory,
  eventLogs,
  onClearLogs,
  onNavigateTab,
  isRealBackend,
}: DashboardViewProps) {
  const peakCount = useMemo(() => {
    if (countHistory.length === 0) return tracks.length;
    return Math.max(...countHistory.map((h) => h.visibleCount), tracks.length);
  }, [countHistory, tracks.length]);

  const avgCount = useMemo(() => {
    if (countHistory.length === 0) return tracks.length;
    const sum = countHistory.reduce((acc, h) => acc + h.visibleCount, 0);
    return sum / countHistory.length;
  }, [countHistory, tracks.length]);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Metric Cards Header */}
      <MetricCards
        tracks={tracks}
        fps={fps}
        cumulativeIn={cumulativeIn}
        cumulativeOut={cumulativeOut}
        peakCount={peakCount}
        countingMethod={settings.countingMethod}
      />

      {/* 2. Secondary Crossing Strip */}
      <CrossingStatsRow cumulativeIn={cumulativeIn} cumulativeOut={cumulativeOut} />

      {/* 3. Main Split: Left Video Monitoring Panel, Right Quick Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Video Monitoring) - 7 cols */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <VideoPlayerWithOverlay
            status={status}
            onSetStatus={onSetStatus}
            tracks={tracks}
            currentTimeSec={currentTimeSec}
            frameNumber={frameNumber}
            fps={fps}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            countingLine={countingLine}
            uploadedVideoUrl={uploadedVideoUrl}
            uploadedVideoFile={uploadedVideoFile}
            onUploadVideo={onUploadVideo}
            onClearUploadedVideo={onClearUploadedVideo}
            simulationEngine={simulationEngine}
          />
        </div>

        {/* Right Column (Live Trends & Activity) - 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Quick Density Chart Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-semibold text-white">Live Occupancy Trend</h4>
              </div>
              <button
                onClick={() => onNavigateTab('analytics')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>Full Analytics</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="w-full h-36">
              {countHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={countHistory.slice(-20)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="quickGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', fontSize: '11px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visibleCount"
                      name="People"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#quickGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                  Accumulating trend points...
                </div>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Avg: {avgCount.toFixed(1)} people</span>
              <span>Peak: {peakCount}</span>
            </div>
          </div>

          {/* Recent Event Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-semibold text-white">Recent Detections & Events</h4>
              </div>
              <button
                onClick={() => onNavigateTab('logs')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>All Logs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {eventLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60 text-xs flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">{log.timestamp}</span>
                    {log.trackId ? (
                      <span className="text-blue-400 font-medium">#{log.trackId}</span>
                    ) : (
                      <span className="text-slate-500">System</span>
                    )}
                  </div>
                  <div className="text-slate-200 text-xs truncate">{log.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
