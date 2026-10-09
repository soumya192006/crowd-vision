import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Download, TrendingUp, Clock, Hash, Activity } from 'lucide-react';
import { CountHistoryItem } from '../types';
import { exportCountHistoryToCSV } from '../utils/csvExport';

interface AnalyticsPanelProps {
  history: CountHistoryItem[];
  frameNumber: number;
  sessionDurationSec: number;
  peakCount: number;
  averageCount: number;
}

export function AnalyticsPanel({
  history,
  frameNumber,
  sessionDurationSec,
  peakCount,
  averageCount,
}: AnalyticsPanelProps) {
  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    return `${mins}m ${secs}s`;
  };

  const handleExportCSV = () => {
    exportCountHistoryToCSV(history);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Peak Visible Count</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {peakCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Maximum concurrent individuals</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Visible Count</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {averageCount.toFixed(1)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Mean density across session</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Frames Analyzed</span>
            <Hash className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {frameNumber.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Processed video frames</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Session Duration</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {formatDuration(sessionDurationSec)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Active tracking elapsed time</div>
        </div>
      </div>

      {/* Main Visible Person Count Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Crowd Density & Person Count Over Time
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous frame-by-frame visible individual count tracking history
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Analytics CSV</span>
          </button>
        </div>

        <div className="w-full h-72">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="inGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as CountHistoryItem;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs font-mono">
                          <div className="text-slate-400 mb-1.5 font-sans font-medium">Time: {label} (Frame {data.frame})</div>
                          <div className="text-blue-400 font-semibold">
                            Visible Count: <span className="text-white">{data.visibleCount} people</span>
                          </div>
                          <div className="text-emerald-400">
                            Cumulative In: <span className="text-white">{data.cumulativeIn}</span>
                          </div>
                          <div className="text-rose-400">
                            Cumulative Out: <span className="text-white">{data.cumulativeOut}</span>
                          </div>
                          <div className="text-slate-400 mt-1 pt-1 border-t border-slate-800">
                            Avg Conf: {(data.avgConfidence * 100).toFixed(1)}% · {data.fps} FPS
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visibleCount"
                  name="Visible People"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#countGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
              No historical data recorded yet. Start simulation playback to accumulate data.
            </div>
          )}
        </div>
      </div>

      {/* Secondary Chart: Entry vs Exit Accumulation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-semibold text-white tracking-tight mb-1">
          Cumulative Entry vs Exit Trajectory
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Tracking line directional crossings recorded across time
        </p>

        <div className="w-full h-56">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeIn"
                  name="Entries (IN)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeOut"
                  name="Exits (OUT)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="#f43f5e"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
              Accumulating line crossing timeline...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
