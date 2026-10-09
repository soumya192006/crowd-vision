import React from 'react';
import {
  Sliders,
  Cpu,
  Layers,
  Network,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ModelSettings, CountingLine, BackendMode } from '../types';

interface SettingsPanelProps {
  settings: ModelSettings;
  onUpdateSettings: (s: Partial<ModelSettings>) => void;
  countingLine: CountingLine;
  onUpdateCountingLine: (l: Partial<CountingLine>) => void;
  isWebSocketActive: boolean;
  webSocketError: string | null;
}

export function SettingsPanel({
  settings,
  onUpdateSettings,
  countingLine,
  onUpdateCountingLine,
  isWebSocketActive,
  webSocketError,
}: SettingsPanelProps) {
  const handleResetDefaults = () => {
    onUpdateSettings({
      modelName: 'yolov8n',
      tracker: 'bytetrack',
      confidenceThreshold: 0.50,
      nmsIouThreshold: 0.45,
      maxCosineDistance: 0.2,
      trackBufferFrames: 30,
      showBoundingBoxes: true,
      showTrackIds: true,
      showConfidenceScores: true,
      showMotionTrails: true,
      showCountingLine: true,
      showClassLabel: true,
      countingMethod: 'current_detections',
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Pipeline Configuration & Tracking Parameters
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust detection sensitivity, ByteTrack association parameters, overlay visualization, and backend connection.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Backend Connection & Data Provider */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Network className="w-4 h-4 text-blue-400" />
            <span>Inference Backend Bridge</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1.5">
                Active Inference Source
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ backendMode: 'demo_simulation' })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    settings.backendMode === 'demo_simulation'
                      ? 'bg-blue-600/15 border-blue-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200">Demo Simulation</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Deterministic browser model. Zero setup required.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSettings({ backendMode: 'local_websocket' })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    settings.backendMode === 'local_websocket'
                      ? 'bg-blue-600/15 border-blue-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200">Local Python Backend</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Connects to your local YOLOv8 + ByteTrack server via WebSocket.
                  </div>
                </button>
              </div>
            </div>

            {settings.backendMode === 'local_websocket' && (
              <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <label className="text-slate-300 font-medium block">WebSocket Endpoint URL</label>
                <input
                  type="text"
                  value={settings.websocketUrl}
                  onChange={(e) => onUpdateSettings({ websocketUrl: e.target.value })}
                  placeholder="ws://localhost:8765/cv-stream"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />

                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  {isWebSocketActive ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Connected & Streaming real detections</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Waiting for local server on {settings.websocketUrl}</span>
                    </span>
                  )}
                </div>

                {webSocketError && (
                  <p className="text-[11px] text-rose-400 leading-tight">
                    {webSocketError} (Check the "About Project" tab for the runnable Python script)
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-slate-300 font-medium block mb-1">Counting Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ countingMethod: 'current_detections' })}
                  className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                    settings.countingMethod === 'current_detections'
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-medium">Current Detections</div>
                  <div className="text-[10px] text-slate-500">Per-frame valid YOLO boxes</div>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ countingMethod: 'active_tracks' })}
                  className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                    settings.countingMethod === 'active_tracks'
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-medium">Active Tracks</div>
                  <div className="text-[10px] text-slate-500">Filtered by ByteTrack state</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Model & Tracker Architecture */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Detection & Tracking Architecture</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                YOLOv8 Model Architecture
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['yolov8n', 'yolov8s', 'yolov8m'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onUpdateSettings({ modelName: m })}
                    className={`py-2 px-3 rounded-lg border font-mono text-center transition-colors ${
                      settings.modelName === m
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.toUpperCase()}
                    <div className="text-[10px] text-slate-500 font-sans">
                      {m === 'yolov8n' ? 'Nano · Edge' : m === 'yolov8s' ? 'Small' : 'Medium'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tracker algorithm */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Multi-Object Tracking Algorithm
              </label>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-mono text-slate-200 font-semibold">ByteTrack</div>
                  <div className="text-[10px] text-slate-400">
                    Two-stage association keeping low-score detections to prevent ID switches
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  ACTIVE
                </span>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span>Detection Confidence Threshold</span>
                  <span className="font-mono font-semibold text-white">
                    {(settings.confidenceThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.95"
                  step="0.05"
                  value={settings.confidenceThreshold}
                  onChange={(e) =>
                    onUpdateSettings({ confidenceThreshold: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">
                  {settings.backendMode === 'demo_simulation'
                    ? 'Filters visible simulated tracks above threshold (Illustrative mock filter)'
                    : 'Minimum confidence score passed to ByteTrack tracker in YOLOv8'}
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span>Track Buffer (Lost Frame Retention)</span>
                  <span className="font-mono font-semibold text-white">
                    {settings.trackBufferFrames} frames
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="5"
                  value={settings.trackBufferFrames}
                  onChange={(e) =>
                    onUpdateSettings({ trackBufferFrames: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">
                  How many frames ByteTrack remembers a lost track before terminating the ID
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Overlay Visual Elements */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Display Overlays</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={settings.showBoundingBoxes}
                onChange={(e) => onUpdateSettings({ showBoundingBoxes: e.target.checked })}
                className="rounded accent-blue-500"
              />
              <span className="text-slate-300">Bounding Boxes</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={settings.showTrackIds}
                onChange={(e) => onUpdateSettings({ showTrackIds: e.target.checked })}
                className="rounded accent-blue-500"
              />
              <span className="text-slate-300">ByteTrack IDs</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={settings.showConfidenceScores}
                onChange={(e) => onUpdateSettings({ showConfidenceScores: e.target.checked })}
                className="rounded accent-blue-500"
              />
              <span className="text-slate-300">Confidence Scores</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={settings.showMotionTrails}
                onChange={(e) => onUpdateSettings({ showMotionTrails: e.target.checked })}
                className="rounded accent-blue-500"
              />
              <span className="text-slate-300">Motion Trails</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={settings.showCountingLine}
                onChange={(e) => onUpdateSettings({ showCountingLine: e.target.checked })}
                className="rounded accent-blue-500"
              />
              <span className="text-slate-300">Virtual Counting Line</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={settings.showClassLabel}
                onChange={(e) => onUpdateSettings({ showClassLabel: e.target.checked })}
                className="rounded accent-blue-500"
              />
              <span className="text-slate-300">Class Label ("person")</span>
            </label>
          </div>
        </div>

        {/* Section 4: Virtual Counting Line Geometry */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Virtual Counting Line Calibration</span>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={countingLine.enabled}
                onChange={(e) => onUpdateCountingLine({ enabled: e.target.checked })}
                className="rounded accent-blue-500"
              />
              <span>Enabled</span>
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Horizontal Position (X)</span>
                <span className="font-mono font-semibold">{(countingLine.x1 * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={countingLine.x1}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateCountingLine({ x1: val, x2: val });
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-400 block mb-1">Top Boundary (Y1)</label>
                <input
                  type="number"
                  min="0.0"
                  max="0.5"
                  step="0.05"
                  value={countingLine.y1}
                  onChange={(e) => onUpdateCountingLine({ y1: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bottom Boundary (Y2)</label>
                <input
                  type="number"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={countingLine.y2}
                  onChange={(e) => onUpdateCountingLine({ y2: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Crossings across this threshold trigger directional counter events without duplicate accumulation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
