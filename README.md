# CrowdVision — Offline People Counting and Tracking System
### YOLOv8 + ByteTrack · Computer Vision Internship Prototype

CrowdVision is an offline-capable computer vision monitoring dashboard designed for counting people and tracking movement in classrooms, college seminar halls, corridors, and indoor facilities.

---

## 1. Quick Start & Setup

### Development Environment (Web Prototype)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.

The web prototype launches immediately into **Demo Mode** with a deterministic indoor simulation engine. No API keys or cloud accounts are required.

---

## 2. Running Local Computer Vision Inference (Python YOLOv8 + ByteTrack)

To connect real video cameras or offline local MP4 inference:

1. Install Python prerequisites on your machine:
   ```bash
   pip install ultralytics opencv-python websockets asyncio
   ```

2. Save the backend script (available in the dashboard under **About Project** -> **Python Backend Bridge**) as `cv_backend.py`.

3. Launch the local vision service:
   ```bash
   python cv_backend.py
   ```

4. In the CrowdVision web app:
   - Go to **Settings**
   - Under **Active Inference Source**, choose **Local Python Backend**
   - Confirm endpoint: `ws://localhost:8765/cv-stream`
   - The dashboard will connect and display real bounding boxes, ByteTrack IDs, and person counts from your local GPU/CPU.

---

## 3. Streaming Telemetry Specification (JSON over WebSocket)

The frontend communicates with local vision services via WebSocket:

```json
{
  "frame": 340,
  "timestamp": "10:14:23",
  "fps": 30.2,
  "visibleCount": 5,
  "cumulative_in": 14,
  "cumulative_out": 9,
  "tracks": [
    {
      "trackId": 101,
      "box": {
        "x": 0.42,
        "y": 0.35,
        "width": 0.09,
        "height": 0.24
      },
      "confidence": 0.94,
      "classLabel": "person",
      "trail": [
        { "x": 0.41, "y": 0.33, "timestamp": 11.2 }
      ]
    }
  ],
  "events": []
}
```

- **Normalized Coordinates**: `x`, `y`, `width`, `height` are normalized from `0.0` to `1.0` so that canvas overlays align dynamically regardless of video resolution or container resizing.

---

## 4. Implementation Transparency Matrix

| Feature | Web Prototype Status | Implementation Details |
|---|---|---|
| **Local Video Upload** | Genuinely Implemented | HTML5 file picker & local Object URLs. Video is decoded entirely within browser memory. |
| **Canvas CV Overlays** | Genuinely Implemented | Synchronous HTML5 canvas rendering bounding boxes, persistent IDs, centroid trails, and virtual tripwires. |
| **Analytics & Trends** | Genuinely Implemented | Recharts time-series charts, peak detection, average calculations, and real-time history accumulation. |
| **CSV Data Export** | Genuinely Implemented | Client-side CSV generation and download for event audit logs and occupancy timelines. |
| **Settings & Persistence** | Genuinely Implemented | Sliders, display toggles, counting line calibration saved to browser `localStorage`. |
| **WebSocket Bridge** | Genuinely Implemented | Active WebSocket client supporting local backend integration. |
| **Demo Tracking Engine** | Deterministic Simulation | Mathematically modeled movement, perspective scaling, and line crossing logic to allow testing without local Python setup. |
| **YOLOv8 + ByteTrack Deep Weights** | Requires Local Python | Deep learning models execute in Python with PyTorch/ONNX for native hardware acceleration. |

---

## 5. Offline & Privacy Design

- **Zero Cloud Dependencies**: No external LLM or cloud vision APIs are called.
- **Data Sovereignty**: Video frames never leave your local machine or local network.
- **Works Without Internet**: Once assets are cached, the dashboard operates completely offline.
