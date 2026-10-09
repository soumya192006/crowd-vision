export interface BoundingBox {
  x: number;      // normalized 0..1 or pixel x
  y: number;      // normalized 0..1 or pixel y
  width: number;  // normalized 0..1 or pixel width
  height: number; // normalized 0..1 or pixel height
}

export interface TrackedPerson {
  trackId: number;
  box: BoundingBox;        // normalized [0..1]
  confidence: number;     // 0..1
  classLabel: string;     // 'person'
  trail: Array<{ x: number; y: number; timestamp: number }>; // history of centroid positions (normalized)
  velocity?: { vx: number; vy: number };
  firstSeenFrame: number;
  lastSeenFrame: number;
  direction?: 'incoming' | 'outgoing' | 'stationary';
  hasCrossedLine?: boolean;
}

export interface CountingLine {
  id: string;
  name: string;
  enabled: boolean;
  // Normalized coordinates (0..1)
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  directionLabelIn: string;
  directionLabelOut: string;
}

export interface EventLog {
  id: string;
  timestamp: string;
  frameNumber: number;
  type: 'track_created' | 'track_updated' | 'track_lost' | 'line_crossed_in' | 'line_crossed_out' | 'system_alert';
  trackId?: number;
  description: string;
  confidence?: number;
}

export interface CountHistoryItem {
  timestamp: string;
  timeSec: number;
  frame: number;
  visibleCount: number;
  activeTracks: number;
  fps: number;
  avgConfidence: number;
  cumulativeIn: number;
  cumulativeOut: number;
}

export type SystemStatus = 'running' | 'paused' | 'stopped';

export type BackendMode = 'demo_simulation' | 'local_websocket';

export interface ModelSettings {
  modelName: 'yolov8n' | 'yolov8s' | 'yolov8m';
  tracker: 'bytetrack';
  confidenceThreshold: number; // 0.1 .. 0.95
  nmsIouThreshold: number;     // 0.1 .. 0.95
  maxCosineDistance: number;   // 0.1 .. 0.5
  trackBufferFrames: number;   // 15 .. 90
  showBoundingBoxes: boolean;
  showTrackIds: boolean;
  showConfidenceScores: boolean;
  showMotionTrails: boolean;
  showCountingLine: boolean;
  showClassLabel: boolean;
  backendMode: BackendMode;
  websocketUrl: string;
  countingMethod: 'current_detections' | 'active_tracks';
}
