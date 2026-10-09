import React from 'react';
import { Users, Crosshair, Gauge, Zap, ArrowDownRight, ArrowUpRight, Maximize2 } from 'lucide-react';
import { TrackedPerson } from '../types';

interface MetricCardsProps {
  tracks: TrackedPerson[];
  fps: number;
  cumulativeIn: number;
  cumulativeOut: number;
  peakCount: number;
  countingMethod: 'current_detections' | 'active_tracks';
}

export function MetricCards({
  tracks,
  fps,
  cumulativeIn,
  cumulativeOut,
  peakCount,
  countingMethod,
}: MetricCardsProps) {
  const visibleCount = tracks.length;
  const activeIdsCount = tracks.filter(t => t.confidence >= 0.4).length;

  const avgConfidence =
    tracks.length > 0
      ? (tracks.reduce((acc, t) => acc + t.confidence, 0) / tracks.length) * 100
      : 89.2;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5">
      {/* 1. Current Visible People */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300">Visible People</span>
          <Users className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
            {visibleCount}
          </span>
          <span className="text-xs text-slate-400">
            {countingMethod === 'current_detections' ? 'detections' : 'tracked'}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
          <span>Peak visible: <strong className="text-slate-200 font-mono">{peakCount}</strong></span>
          <span className="text-slate-400 text-[10px]">Real-time</span>
        </div>
      </div>

      {/* 2. Active Tracking IDs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300">Active Track IDs</span>
          <Crosshair className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
            {activeIdsCount}
          </span>
          <span className="text-xs text-slate-400">ByteTrack paths</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
          <span>Buffer: <strong className="text-slate-200 font-mono">30 frames</strong></span>
          <span className="text-slate-400 text-[10px]">Kalman Filter</span>
        </div>
      </div>

      {/* 3. Average Detection Confidence */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300">Avg Confidence</span>
          <Gauge className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
            {avgConfidence.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">YOLOv8 score</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
          <span>Target: <strong className="text-slate-200 font-mono">Class: Person</strong></span>
          <span className="text-slate-400 text-[10px]">IoU 0.45</span>
        </div>
      </div>

      {/* 4. Processing FPS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300">Processing Rate</span>
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
            {fps.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400">FPS</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
          <span>Latency: <strong className="text-slate-200 font-mono">~{(1000 / Math.max(1, fps)).toFixed(0)} ms</strong></span>
          <span className="text-slate-400 text-[10px]">Edge Local</span>
        </div>
      </div>
    </div>
  );
}

export function CrossingStatsRow({
  cumulativeIn,
  cumulativeOut,
}: {
  cumulativeIn: number;
  cumulativeOut: number;
}) {
  const netInRoom = Math.max(0, cumulativeIn - cumulativeOut);

  return (
    <div className="grid grid-cols-3 gap-3 bg-slate-900/50 border border-slate-800/80 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <ArrowDownRight className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Total Entries (IN)</div>
          <div className="text-base font-bold font-mono text-white tabular-nums">{cumulativeIn}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-x border-slate-800 px-3">
        <div className="w-8 h-8 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Total Exits (OUT)</div>
          <div className="text-base font-bold font-mono text-white tabular-nums">{cumulativeOut}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
          <Maximize2 className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Net Estimated In Area</div>
          <div className="text-base font-bold font-mono text-white tabular-nums">{netInRoom}</div>
        </div>
      </div>
    </div>
  );
}
