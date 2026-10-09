import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  Code2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Layers,
  Sparkles,
  GitBranch,
} from 'lucide-react';

export function AboutProjectPanel() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'python_code' | 'schema' | 'audit'>('architecture');

  const pythonScript = `# ==============================================================================
# CrowdVision: Local Python Computer Vision Backend (YOLOv8 + ByteTrack)
# ==============================================================================
# Requirements:
#   pip install ultralytics opencv-python websockets asyncio
#
# Run locally:
#   python cv_backend.py
#
# Then open the CrowdVision Dashboard, go to Settings -> Select "Local Python Backend",
# and connect to ws://localhost:8765/cv-stream.
# ==============================================================================

import asyncio
import json
import time
import cv2
import websockets
from ultralytics import YOLO

# Initialize YOLOv8 Nano model (pretrained on COCO)
model = YOLO('yolov8n.pt')

# Select video source: 0 for default webcam, or path to local mp4 file
VIDEO_SOURCE = 0  # e.g., 'sample_classroom.mp4'

connected_clients = set()

async def stream_handler(websocket):
    connected_clients.add(websocket)
    print(f"[CrowdVision] Client connected: {websocket.remote_address}")
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)
        print(f"[CrowdVision] Client disconnected")

async def cv_processing_loop():
    cap = cv2.VideoCapture(VIDEO_SOURCE)
    frame_idx = 0
    prev_time = time.time()
    cumulative_in = 0
    cumulative_out = 0

    print("[CrowdVision] Starting CV capture loop...")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            # Loop video if file ended
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        frame_idx += 1
        h, w, _ = frame.shape
        now = time.time()
        fps = 1.0 / max(0.001, (now - prev_time))
        prev_time = now

        # Run YOLOv8 detection + ByteTrack multi-object tracking
        # Filter strictly for class 0 (person)
        results = model.track(
            source=frame,
            persist=True,
            classes=[0],            # Person class only
            tracker="bytetrack.yaml",
            conf=0.45,
            iou=0.5,
            verbose=False
        )

        tracks_payload = []
        if results[0].boxes and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            track_ids = results[0].boxes.id.int().cpu().numpy()
            confidences = results[0].boxes.conf.cpu().numpy()

            for box, track_id, conf in zip(boxes, track_ids, confidences):
                x1, y1, x2, y2 = box
                # Convert to normalized coordinates (0.0 to 1.0)
                norm_x = float(x1 / w)
                norm_y = float(y1 / h)
                norm_w = float((x2 - x1) / w)
                norm_h = float((y2 - y1) / h)

                tracks_payload.append({
                    "trackId": int(track_id),
                    "box": {
                        "x": norm_x,
                        "y": norm_y,
                        "width": norm_w,
                        "height": norm_h
                    },
                    "confidence": float(conf),
                    "classLabel": "person",
                    "trail": []
                })

        # Construct real-time telemetry message
        telemetry = {
            "frame": frame_idx,
            "timestamp": time.strftime("%H:%M:%S"),
            "fps": round(fps, 1),
            "visibleCount": len(tracks_payload),
            "cumulative_in": cumulative_in,
            "cumulative_out": cumulative_out,
            "tracks": tracks_payload,
            "events": []
        }

        # Broadcast payload to all connected frontend clients
        if connected_clients:
            message = json.dumps(telemetry)
            await asyncio.gather(
                *[client.send(message) for client in connected_clients],
                return_exceptions=True
            )

        # ~30 FPS throttle
        await asyncio.sleep(0.03)

    cap.release()

async def main():
    server = await websockets.serve(stream_handler, "localhost", 8765)
    print("[CrowdVision] WebSocket Server listening on ws://localhost:8765/cv-stream")
    await cv_processing_loop()

if __name__ == "__main__":
    asyncio.run(main())
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Internship Project Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
          <BookOpen className="w-4 h-4" />
          <span>INTERNSHIP PROJECT BRIEF</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">
          CrowdVision: Offline People Counting & Tracking System
        </h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Developed as a computer vision research prototype for monitoring room density, counting occupants, and analyzing footfall in indoor campus spaces (lecture halls, auditoriums, corridors) without relying on cloud infrastructure or remote telemetry.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800 self-start">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'architecture' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          CV Architecture
        </button>
        <button
          onClick={() => setActiveTab('python_code')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'python_code' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Python Backend Bridge
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'schema' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          WebSocket Protocol
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Simulated vs Genuine Matrix
        </button>
      </div>

      {/* Tab 1: CV Architecture */}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">1. Object Detection (YOLOv8)</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                YOLOv8 processes incoming video frames in a single pass. For crowd counting, inference is filtered strictly to COCO Class 0 (<code className="text-blue-300 font-mono">person</code>). Its anchor-free design yields high recall even in crowded indoor seminar halls.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              Input: 640x640 frame · Nano / Small
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <GitBranch className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">2. Multi-Object Tracking (ByteTrack)</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                ByteTrack associates detected bounding boxes across successive frames using a two-stage association pipeline. Rather than discarding low-score detections, it leverages them to re-identify temporarily occluded individuals, drastically minimizing ID switches.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              Kalman Filter + Hungarian Matching
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">3. Virtual Line Crossing Logic</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                To prevent equating the current count with total footfall, the system models virtual tripwires. When a tracked person's centroid vector intersects the line segment in a designated orientation, a directional crossing event is registered with debounce protection.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              2D Segment Cross-Product · Debounce
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Python Backend Code */}
      {activeTab === 'python_code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Ready-to-Run Local Python Backend Script
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Save as <code className="text-blue-300 font-mono">cv_backend.py</code> and execute locally to feed real YOLOv8 detections into this dashboard.
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Copy Python Script</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-[460px] leading-relaxed">
              {pythonScript}
            </pre>
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-lg text-xs text-blue-300">
            <strong>Local Offline Guarantee:</strong> When running <code className="font-mono">cv_backend.py</code>, inference occurs entirely on your local machine (CPU or CUDA GPU). No video frames or images are ever uploaded to the cloud or third-party servers.
          </div>
        </div>
      )}

      {/* Tab 3: Protocol Schema */}
      {activeTab === 'schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              WebSocket Streaming Telemetry Specification
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              The dashboard expects JSON messages on <code className="text-blue-300 font-mono">ws://localhost:8765/cv-stream</code> matching this contract:
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
{`{
  "frame": 1240,                   // Video frame sequence index
  "timestamp": "14:22:05",         // ISO or local clock string
  "fps": 31.4,                     // Instantaneous inference rate
  "visibleCount": 6,               // Number of individuals currently in frame
  "cumulative_in": 28,             // Total crossed in direction
  "cumulative_out": 19,            // Total crossed out direction
  "tracks": [
    {
      "trackId": 104,              // ByteTrack persistent tracker ID
      "box": {
        "x": 0.42,                 // Normalized bounding box top-left X [0.0 .. 1.0]
        "y": 0.35,                 // Normalized bounding box top-left Y [0.0 .. 1.0]
        "width": 0.08,             // Normalized bounding box width [0.0 .. 1.0]
        "height": 0.22             // Normalized bounding box height [0.0 .. 1.0]
      },
      "confidence": 0.92,          // YOLOv8 class score [0.0 .. 1.0]
      "classLabel": "person",      // Filtered to person
      "trail": [                   // Centroid vector trajectory (last N points)
        { "x": 0.41, "y": 0.33, "timestamp": 12.4 }
      ]
    }
  ]
}`}
          </div>

          <p className="text-xs text-slate-400">
            Normalized coordinates [0..1] allow overlays to scale responsively to any screen width or aspect ratio without distortion.
          </p>
        </div>
      )}

      {/* Tab 4: Audit Matrix */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Implementation Transparency Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Clear distinction between genuinely implemented client-side components and simulated elements in this web prototype.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">System Component</th>
                  <th className="py-2 px-3">Status in Web Prototype</th>
                  <th className="py-2 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Local Video Upload & Playback</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-medium">Genuinely Implemented</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    Plays user MP4/WebM files locally in browser memory using HTML5 video API. Zero upload to servers.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Responsive Canvas Overlay</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-medium">Genuinely Implemented</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    Synchronized Canvas drawing bounding boxes, ByteTrack IDs, velocity trails, and virtual tripwires.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Analytics & CSV Export</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-medium">Genuinely Implemented</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    Recharts line charts, peak/mean analytics, and client-side CSV downloads for audit logs and counts.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Local WebSocket Bridge</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-medium">Genuinely Implemented</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    Real WebSocket client ready to receive telemetry from local Python YOLOv8 server.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Demo Tracking Simulation</td>
                  <td className="py-2.5 px-3 text-amber-400 font-medium">Deterministic Simulation</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    Simulates people walking across an indoor hall with realistic perspective scaling and line crossings.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">YOLOv8 + ByteTrack Deep Inference</td>
                  <td className="py-2.5 px-3 text-slate-400 font-medium">Requires Local Python</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    Neural network weights run in Python via Ultralytics and OpenCV (provided script) for true GPU acceleration.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
