import React, { useState } from 'react';
import { VideoPlayerWithOverlay } from './VideoPlayerWithOverlay';
import { TrackedPerson, CountingLine, ModelSettings, SystemStatus } from '../types';
import { SimulationEngine } from '../utils/simulation';
import { getTrackColor } from '../utils/colors';
import { Video, Camera, Compass, SlidersHorizontal, Check } from 'lucide-react';

interface LiveFeedViewProps {
  status: SystemStatus;
  onSetStatus: (status: SystemStatus) => void;
  tracks: TrackedPerson[];
  currentTimeSec: number;
  frameNumber: number;
  fps: number;
  settings: ModelSettings;
  onUpdateSettings: (s: Partial<ModelSettings>) => void;
  countingLine: CountingLine;
  onUpdateCountingLine: (l: Partial<CountingLine>) => void;
  uploadedVideoUrl: string | null;
  uploadedVideoFile: File | null;
  onUploadVideo: (file: File) => void;
  onClearUploadedVideo: () => void;
  simulationEngine: SimulationEngine;
}

export function LiveFeedView(props: LiveFeedViewProps) {
  const [selectedCamera, setSelectedCamera] = useState<'cam1' | 'cam2' | 'cam3'>('cam1');

  return (
    <div className="flex flex-col gap-6">
      {/* Top Feed Selector Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
            <Camera className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Live Video Stream & Tracking Inspector
            </h3>
            <p className="text-xs text-slate-400">
              High-resolution viewport with per-track bounding vector analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedCamera('cam1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCamera === 'cam1'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Camera 01: Lecture Hall
          </button>
          <button
            onClick={() => setSelectedCamera('cam2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCamera === 'cam2'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Camera 02: North Hallway
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Video Monitor */}
        <div className="lg:col-span-2">
          <VideoPlayerWithOverlay {...props} />
        </div>

        {/* Live Active Tracks Inspector List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-white">Active Tracks in View</h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {props.tracks.length} active
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {props.tracks.length > 0 ? (
              props.tracks.map((track) => {
                const color = getTrackColor(track.trackId);
                return (
                  <div
                    key={track.trackId}
                    className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <div className="font-mono font-semibold text-white">
                          ID #{track.trackId}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Pos: ({(track.box.x * 100).toFixed(0)}%, {(track.box.y * 100).toFixed(0)}%)
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-emerald-400 font-medium">
                        {(track.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {track.direction || 'moving'}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No active individuals currently detected in viewport.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            ByteTrack computes IoU matching and Kalman filter speed estimations across frames.
          </div>
        </div>
      </div>
    </div>
  );
}
