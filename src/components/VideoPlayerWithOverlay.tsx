import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Square,
  Maximize2,
  Minimize2,
  Upload,
  Eye,
  EyeOff,
  Video,
  Layers,
  Sparkles,
  AlertCircle,
  FileVideo,
  X,
} from 'lucide-react';
import { TrackedPerson, CountingLine, ModelSettings, SystemStatus } from '../types';
import { getTrackColor, hexToRgba } from '../utils/colors';
import { SimulationEngine } from '../utils/simulation';

interface VideoPlayerWithOverlayProps {
  status: SystemStatus;
  onSetStatus: (status: SystemStatus) => void;
  tracks: TrackedPerson[];
  currentTimeSec: number;
  frameNumber: number;
  fps: number;
  settings: ModelSettings;
  onUpdateSettings: (s: Partial<ModelSettings>) => void;
  countingLine: CountingLine;
  uploadedVideoUrl: string | null;
  uploadedVideoFile: File | null;
  onUploadVideo: (file: File) => void;
  onClearUploadedVideo: () => void;
  simulationEngine: SimulationEngine;
}

export function VideoPlayerWithOverlay({
  status,
  onSetStatus,
  tracks,
  currentTimeSec,
  frameNumber,
  fps,
  settings,
  onUpdateSettings,
  countingLine,
  uploadedVideoUrl,
  uploadedVideoFile,
  onUploadVideo,
  onClearUploadedVideo,
  simulationEngine,
}: VideoPlayerWithOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 450 });

  // Handle local video playback synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !uploadedVideoUrl) return;

    if (status === 'running') {
      video.play().catch(() => {});
    } else if (status === 'paused') {
      video.pause();
    } else if (status === 'stopped') {
      video.pause();
      video.currentTime = 0;
    }
  }, [status, uploadedVideoUrl]);

  // Handle Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keep canvas size matching container client width & height (16:9 ratio)
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const targetWidth = Math.max(320, Math.floor(rect.width));
      // Maintain 16:9 or fit container
      const targetHeight = Math.max(200, Math.floor(targetWidth * (9 / 16)));
      setCanvasDimensions({ width: targetWidth, height: targetHeight });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Primary Canvas Overlay Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // If NO uploaded video is playing, draw the simulated indoor seminar background
    if (!uploadedVideoUrl) {
      simulationEngine.renderIndoorScene(ctx, width, height, true);
    }

    // Draw Virtual Counting Line if enabled
    if (settings.showCountingLine && countingLine.enabled) {
      const lx1 = countingLine.x1 * width;
      const ly1 = countingLine.y1 * height;
      const lx2 = countingLine.x2 * width;
      const ly2 = countingLine.y2 * height;

      // Glow backing
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(lx1, ly1);
      ctx.lineTo(lx2, ly2);
      ctx.stroke();

      // Sharp line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(lx1, ly1);
      ctx.lineTo(lx2, ly2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label at middle of line
      const midX = (lx1 + lx2) / 2;
      const midY = (ly1 + ly2) / 2;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      const tagText = 'COUNTING LINE';
      ctx.font = '10px JetBrains Mono, monospace';
      const textWidth = ctx.measureText(tagText).width;
      ctx.fillRect(midX - textWidth / 2 - 6, midY - 10, textWidth + 12, 20);
      ctx.strokeRect(midX - textWidth / 2 - 6, midY - 10, textWidth + 12, 20);

      ctx.fillStyle = '#34d399';
      ctx.fillText(tagText, midX - textWidth / 2, midY + 4);

      // Direction indicator arrows (IN / OUT)
      ctx.fillStyle = 'rgba(52, 211, 153, 0.9)';
      ctx.font = '9px Plus Jakarta Sans, sans-serif';
      ctx.fillText('← IN', lx1 + 10, ly1 + 18);
      ctx.fillText('OUT →', lx1 - 38, ly1 + 18);

      ctx.restore();
    }

    // Draw Motion Trails
    if (settings.showMotionTrails) {
      tracks.forEach((track) => {
        if (!track.trail || track.trail.length < 2) return;
        const color = getTrackColor(track.trackId);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        track.trail.forEach((pt, idx) => {
          const px = pt.x * width;
          const py = pt.y * height;
          if (idx === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        });
        ctx.globalAlpha = 0.55;
        ctx.stroke();
        ctx.restore();
      });
    }

    // Draw Bounding Boxes and ByteTrack ID Labels
    if (settings.showBoundingBoxes) {
      tracks.forEach((track) => {
        const color = getTrackColor(track.trackId);
        const bx = track.box.x * width;
        const by = track.box.y * height;
        const bw = track.box.width * width;
        const bh = track.box.height * height;

        ctx.save();

        // Box semi-transparent fill
        ctx.fillStyle = hexToRgba(color, 0.12);
        ctx.fillRect(bx, by, bw, bh);

        // Box stroke border
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Corner accents (tactical computer vision look)
        const cornerLen = Math.min(10, bw / 4, bh / 4);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';

        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();

        // Centroid dot
        const cx = bx + bw / 2;
        const cy = by + bh;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label Tag Above Box
        if (settings.showTrackIds || settings.showConfidenceScores) {
          const labelParts: string[] = [];
          if (settings.showTrackIds) labelParts.push(`ID #${track.trackId}`);
          if (settings.showClassLabel) labelParts.push('person');
          if (settings.showConfidenceScores)
            labelParts.push(`${(track.confidence * 100).toFixed(0)}%`);

          const labelStr = labelParts.join(' · ');

          ctx.font = '11px JetBrains Mono, monospace';
          const badgeWidth = ctx.measureText(labelStr).width + 12;
          const badgeHeight = 18;
          const badgeY = Math.max(0, by - badgeHeight - 2);

          // Tag background
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.fillRect(bx, badgeY, badgeWidth, badgeHeight);

          // Tag top border indicator matching track color
          ctx.fillStyle = color;
          ctx.fillRect(bx, badgeY, badgeWidth, 2);

          // Tag text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelStr, bx + 6, badgeY + 13);
        }

        ctx.restore();
      });
    }
  }, [
    tracks,
    settings,
    countingLine,
    uploadedVideoUrl,
    canvasDimensions,
    simulationEngine,
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadVideo(file);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
      }`}
    >
      {/* Top Video Header Bar with Status & Overlay Toggles */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <Video className="w-4 h-4 text-blue-400" />
            <span>Primary Video Monitor</span>
          </div>

          <span className="text-slate-600">·</span>

          {uploadedVideoFile ? (
            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] truncate max-w-xs">
              <FileVideo className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{uploadedVideoFile.name}</span>
              <button
                onClick={onClearUploadedVideo}
                className="text-slate-400 hover:text-rose-400 ml-1 p-0.5 rounded transition-colors"
                title="Switch back to simulated video scene"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-slate-400 font-mono text-[11px]">
              Simulated Seminar Hall Scene
            </span>
          )}
        </div>

        {/* Overlay toggle toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateSettings({ showBoundingBoxes: !settings.showBoundingBoxes })}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              settings.showBoundingBoxes
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            title="Toggle Bounding Boxes"
          >
            <Layers className="w-3 h-3" />
            <span>Boxes</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showTrackIds: !settings.showTrackIds })}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              settings.showTrackIds
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            title="Toggle Track IDs"
          >
            <span>IDs</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showMotionTrails: !settings.showMotionTrails })}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              settings.showMotionTrails
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            title="Toggle Motion Velocity Trails"
          >
            <span>Trails</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ showCountingLine: !settings.showCountingLine })}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              settings.showCountingLine
                ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            title="Toggle Virtual Counting Line"
          >
            <span>Line</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport & Canvas Overlay Container */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {/* Real Uploaded HTML5 Video element if video file provided */}
        {uploadedVideoUrl && (
          <video
            ref={videoRef}
            src={uploadedVideoUrl}
            className="absolute inset-0 w-full h-full object-contain"
            loop
            muted
            playsInline
            onLoadedMetadata={(e) => {
              setVideoDuration(e.currentTarget.duration);
            }}
            onTimeUpdate={(e) => {
              setVideoCurrentTime(e.currentTarget.currentTime);
            }}
          />
        )}

        {/* Canvas Overlay for Computer Vision tracking boxes, IDs, and simulated scene */}
        <canvas
          ref={canvasRef}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Live HUD Badges over Video */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
          {/* Prominent Current Visible People Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/85 border border-slate-800 rounded-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-slate-300">Visible People:</span>
            <span className="text-base font-bold font-mono text-white tabular-nums">
              {tracks.length}
            </span>
          </div>

          {/* Model info banner */}
          <div className="text-[11px] font-mono text-slate-300 bg-slate-950/80 border border-slate-800/80 px-2 py-0.5 rounded">
            {settings.modelName.toUpperCase()} · {settings.tracker.toUpperCase()} · {fps.toFixed(0)} FPS
          </div>
        </div>

        {/* Explicit Demo Notice when running simulated tracking */}
        <div className="absolute top-3 right-3 pointer-events-none z-10">
          <div className="px-2.5 py-1 bg-amber-950/80 border border-amber-500/40 rounded-md text-[11px] font-mono font-medium text-amber-300 backdrop-blur-md">
            DEMO MODE — SIMULATED TRACKING
          </div>
        </div>

        {/* Upload hint if in demo scene */}
        {!uploadedVideoUrl && (
          <div className="absolute bottom-3 left-3 pointer-events-auto z-10 hidden sm:block">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-md backdrop-blur-md transition-colors"
            >
              <Upload className="w-3 h-3 text-blue-400" />
              <span>Upload Video (MP4/WebM)</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden File Picker Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Bottom Video Controls & Telemetry Scrub Bar */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2">
        {/* Playback Controls & Frame counters */}
        <div className="flex items-center justify-between text-xs">
          {/* Play/Pause/Stop Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetStatus(status === 'running' ? 'paused' : 'running')}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              title={status === 'running' ? 'Pause' : 'Play'}
            >
              {status === 'running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => onSetStatus('stopped')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Time code display */}
            <div className="font-mono text-slate-300 tabular-nums text-xs">
              {formatTime(uploadedVideoUrl ? videoCurrentTime : currentTimeSec)}
              <span className="text-slate-500 mx-1">/</span>
              {uploadedVideoUrl ? formatTime(videoDuration) : '∞ Live'}
            </div>

            <span className="text-slate-600 hidden md:inline">·</span>

            {/* Frame counter */}
            <div className="hidden md:flex items-center gap-1 font-mono text-slate-400 text-xs">
              <span>Frame:</span>
              <span className="text-slate-200 tabular-nums">{frameNumber}</span>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Load custom video file for local offline playback"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Choose Video</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
