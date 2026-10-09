import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrackedPerson,
  EventLog,
  CountHistoryItem,
  SystemStatus,
  ModelSettings,
  CountingLine,
} from '../types';
import { SimulationEngine } from '../utils/simulation';

const STORAGE_SETTINGS_KEY = 'crowdvision_model_settings_v1';
const STORAGE_LINE_KEY = 'crowdvision_counting_line_v1';

const DEFAULT_LINE: CountingLine = {
  id: 'line-main',
  name: 'Hall Entrance Crossing',
  enabled: true,
  x1: 0.50,
  y1: 0.15,
  x2: 0.50,
  y2: 0.88,
  directionLabelIn: 'Entering Room (IN)',
  directionLabelOut: 'Exiting Room (OUT)',
};

const DEFAULT_SETTINGS: ModelSettings = {
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
  backendMode: 'demo_simulation',
  websocketUrl: 'ws://localhost:8765/cv-stream',
  countingMethod: 'current_detections',
};

export function useTrackerEngine() {
  // Model Settings
  const [settings, setSettings] = useState<ModelSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Counting Line Config
  const [countingLine, setCountingLine] = useState<CountingLine>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LINE_KEY);
      return saved ? { ...DEFAULT_LINE, ...JSON.parse(saved) } : DEFAULT_LINE;
    } catch {
      return DEFAULT_LINE;
    }
  });

  // Playback & System Status
  const [status, setStatus] = useState<SystemStatus>('running');
  const [frameNumber, setFrameNumber] = useState<number>(1);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [fps, setFps] = useState<number>(29.8);
  const [isWebSocketActive, setIsWebSocketActive] = useState<boolean>(false);
  const [webSocketError, setWebSocketError] = useState<string | null>(null);

  // Video File
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Tracking Data
  const [activeTracks, setActiveTracks] = useState<TrackedPerson[]>([]);
  const [cumulativeIn, setCumulativeIn] = useState<number>(14);
  const [cumulativeOut, setCumulativeOut] = useState<number>(8);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([
    {
      id: 'init-1',
      timestamp: new Date(Date.now() - 24000).toLocaleTimeString(),
      frameNumber: 1,
      type: 'system_alert',
      description: 'CrowdVision detection engine initialized (YOLOv8n + ByteTrack)',
    },
    {
      id: 'init-2',
      timestamp: new Date(Date.now() - 18000).toLocaleTimeString(),
      frameNumber: 12,
      type: 'track_created',
      trackId: 101,
      description: 'Track ID #101 initialized at seminar entrance',
      confidence: 0.94,
    },
    {
      id: 'init-3',
      timestamp: new Date(Date.now() - 11000).toLocaleTimeString(),
      frameNumber: 38,
      type: 'line_crossed_in',
      trackId: 101,
      description: 'Person #101 crossed entrance line [ENTRY / IN]',
      confidence: 0.93,
    },
    {
      id: 'init-4',
      timestamp: new Date(Date.now() - 5000).toLocaleTimeString(),
      frameNumber: 62,
      type: 'track_created',
      trackId: 102,
      description: 'Track ID #102 initialized near walkway',
      confidence: 0.89,
    },
  ]);

  // Count History for Charts
  const [countHistory, setCountHistory] = useState<CountHistoryItem[]>([
    {
      timestamp: '00:00',
      timeSec: 0,
      frame: 1,
      visibleCount: 3,
      activeTracks: 3,
      fps: 30.0,
      avgConfidence: 0.91,
      cumulativeIn: 10,
      cumulativeOut: 5,
    },
    {
      timestamp: '00:05',
      timeSec: 5,
      frame: 150,
      visibleCount: 4,
      activeTracks: 4,
      fps: 29.8,
      avgConfidence: 0.90,
      cumulativeIn: 12,
      cumulativeOut: 6,
    },
    {
      timestamp: '00:10',
      timeSec: 10,
      frame: 300,
      visibleCount: 5,
      activeTracks: 5,
      fps: 30.1,
      avgConfidence: 0.92,
      cumulativeIn: 14,
      cumulativeOut: 8,
    },
  ]);

  // Engines and refs
  const simulationEngineRef = useRef<SimulationEngine>(new SimulationEngine(DEFAULT_LINE));
  const wsRef = useRef<WebSocket | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(performance.now());
  const historyTickCounterRef = useRef<number>(0);

  // Sync line config to simulation
  useEffect(() => {
    simulationEngineRef.current.updateLineConfig(countingLine);
    try {
      localStorage.setItem(STORAGE_LINE_KEY, JSON.stringify(countingLine));
    } catch {}
  }, [countingLine]);

  // Sync model settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<ModelSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Set line configuration
  const updateCountingLine = useCallback((newLine: Partial<CountingLine>) => {
    setCountingLine(prev => ({ ...prev, ...newLine }));
  }, []);

  // Handle uploaded video file
  const handleUploadVideo = useCallback((file: File) => {
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    const url = URL.createObjectURL(file);
    setUploadedVideoFile(file);
    setUploadedVideoUrl(url);
    setStatus('running');

    // Add log
    setEventLogs(prev => [
      {
        id: `upload-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        frameNumber: 1,
        type: 'system_alert',
        description: `Local video loaded: "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
      },
      ...prev.slice(0, 99),
    ]);
  }, [uploadedVideoUrl]);

  // Clear uploaded video and return to built-in simulation feed
  const clearUploadedVideo = useCallback(() => {
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    setUploadedVideoFile(null);
    setUploadedVideoUrl(null);
  }, [uploadedVideoUrl]);

  // Reset demo simulation state
  const resetDemo = useCallback(() => {
    simulationEngineRef.current.reset();
    setFrameNumber(1);
    setCurrentTimeSec(0);
    setCumulativeIn(0);
    setCumulativeOut(0);
    setActiveTracks([]);
    setCountHistory([]);
    setEventLogs([
      {
        id: `reset-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        frameNumber: 1,
        type: 'system_alert',
        description: 'Simulation environment reset to initial state',
      },
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setEventLogs([]);
  }, []);

  // Connect or disconnect WebSocket when backendMode or websocketUrl changes
  useEffect(() => {
    if (settings.backendMode !== 'local_websocket') {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsWebSocketActive(false);
      setWebSocketError(null);
      return;
    }

    // Try connecting to local Python backend WebSocket
    try {
      const ws = new WebSocket(settings.websocketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsWebSocketActive(true);
        setWebSocketError(null);
        setEventLogs(prev => [
          {
            id: `ws-open-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            frameNumber,
            type: 'system_alert',
            description: `Connected to local Python CV backend at ${settings.websocketUrl}`,
          },
          ...prev.slice(0, 99),
        ]);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.tracks && Array.isArray(payload.tracks)) {
            setActiveTracks(payload.tracks);
          }
          if (payload.frame) setFrameNumber(payload.frame);
          if (payload.fps) setFps(payload.fps);
          if (payload.cumulative_in !== undefined) setCumulativeIn(payload.cumulative_in);
          if (payload.cumulative_out !== undefined) setCumulativeOut(payload.cumulative_out);
          if (payload.events && Array.isArray(payload.events)) {
            setEventLogs(prev => [...payload.events, ...prev].slice(0, 150));
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message from Python backend:', err);
        }
      };

      ws.onerror = () => {
        setIsWebSocketActive(false);
        setWebSocketError(`Unable to connect to ${settings.websocketUrl}. Make sure local Python script is running.`);
      };

      ws.onclose = () => {
        setIsWebSocketActive(false);
      };

      return () => {
        ws.close();
      };
    } catch (e: any) {
      setWebSocketError(e.message || 'Failed to initialize WebSocket');
      setIsWebSocketActive(false);
    }
  }, [settings.backendMode, settings.websocketUrl]);

  // Main animation / simulation tick loop when running in Demo Simulation mode
  useEffect(() => {
    if (status !== 'running') return;
    if (settings.backendMode === 'local_websocket' && isWebSocketActive) return;

    let isMounted = true;

    const tick = (time: number) => {
      const elapsed = time - lastTickTimeRef.current;
      // Target ~30 FPS (33ms step)
      if (elapsed >= 32) {
        lastTickTimeRef.current = time;

        const calculatedFps = Math.min(60, Math.round(1000 / Math.max(1, elapsed)));
        setFps(calculatedFps);

        // Run simulation step
        const result = simulationEngineRef.current.step(settings.confidenceThreshold);

        if (isMounted) {
          setActiveTracks(result.tracks);
          setFrameNumber(prev => prev + 1);
          setCurrentTimeSec(prev => prev + 0.033);
          setCumulativeIn(result.cumulativeIn);
          setCumulativeOut(result.cumulativeOut);

          if (result.events.length > 0) {
            setEventLogs(prev => [...result.events, ...prev].slice(0, 120));
          }

          // Sample history every 30 frames (~1 sec)
          historyTickCounterRef.current++;
          if (historyTickCounterRef.current >= 30) {
            historyTickCounterRef.current = 0;

            const visibleCount = result.tracks.length;
            const avgConf =
              result.tracks.length > 0
                ? result.tracks.reduce((acc, t) => acc + t.confidence, 0) / result.tracks.length
                : 0.90;

            const min = Math.floor(currentTimeSec / 60);
            const sec = Math.floor(currentTimeSec % 60);
            const timeFormatted = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

            setCountHistory(prev => [
              ...prev.slice(-35), // keep last 36 data points (~35 seconds)
              {
                timestamp: timeFormatted,
                timeSec: currentTimeSec,
                frame: frameNumber,
                visibleCount,
                activeTracks: result.tracks.length,
                fps: calculatedFps,
                avgConfidence: avgConf,
                cumulativeIn: result.cumulativeIn,
                cumulativeOut: result.cumulativeOut,
              },
            ]);
          }
        }
      }

      if (isMounted && status === 'running') {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status, settings.backendMode, isWebSocketActive, settings.confidenceThreshold, currentTimeSec, frameNumber]);

  return {
    status,
    setStatus,
    frameNumber,
    currentTimeSec,
    fps,
    activeTracks,
    cumulativeIn,
    cumulativeOut,
    eventLogs,
    countHistory,
    settings,
    updateSettings,
    countingLine,
    updateCountingLine,
    uploadedVideoFile,
    uploadedVideoUrl,
    videoDuration,
    setVideoDuration,
    handleUploadVideo,
    clearUploadedVideo,
    resetDemo,
    clearLogs,
    isWebSocketActive,
    webSocketError,
    simulationEngine: simulationEngineRef.current,
  };
}
