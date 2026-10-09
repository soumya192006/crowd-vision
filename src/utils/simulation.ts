import { TrackedPerson, CountingLine, EventLog } from '../types';

interface SimulatedAgent {
  id: number;
  // Normalized 0..1 coordinates
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  state: 'entering' | 'walking' | 'lingering' | 'exiting';
  lingerTicks: number;
  baseConfidence: number;
  active: boolean;
  history: Array<{ x: number; y: number; timestamp: number }>;
  crossedLine: boolean;
  avatarColor: string;
}

export class SimulationEngine {
  private agents: SimulatedAgent[] = [];
  private nextId = 101;
  private frameCount = 0;
  private timeSec = 0;
  private cumulativeIn = 0;
  private cumulativeOut = 0;
  private lineCrossingConfig: CountingLine;

  constructor(lineConfig: CountingLine) {
    this.lineCrossingConfig = lineConfig;
    this.initPresetAgents();
  }

  public updateLineConfig(lineConfig: CountingLine) {
    this.lineCrossingConfig = lineConfig;
  }

  public reset() {
    this.agents = [];
    this.nextId = 101;
    this.frameCount = 0;
    this.timeSec = 0;
    this.cumulativeIn = 0;
    this.cumulativeOut = 0;
    this.initPresetAgents();
  }

  private initPresetAgents() {
    // Start with 4-6 agents in the room with varied paths
    const initialPositions = [
      { x: 0.22, y: 0.45, vx: 0.0018, vy: 0.0006, targetX: 0.75, targetY: 0.55 },
      { x: 0.40, y: 0.62, vx: -0.0012, vy: 0.0004, targetX: 0.15, targetY: 0.70 },
      { x: 0.65, y: 0.38, vx: 0.0008, vy: -0.0010, targetX: 0.85, targetY: 0.25 },
      { x: 0.35, y: 0.28, vx: 0.0015, vy: 0.0012, targetX: 0.55, targetY: 0.75 },
      { x: 0.78, y: 0.68, vx: -0.0016, vy: -0.0008, targetX: 0.30, targetY: 0.40 },
    ];

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    initialPositions.forEach((pos, idx) => {
      const id = this.nextId++;
      this.agents.push({
        id,
        x: pos.x,
        y: pos.y,
        vx: pos.vx,
        vy: pos.vy,
        targetX: pos.targetX,
        targetY: pos.targetY,
        state: 'walking',
        lingerTicks: 0,
        baseConfidence: 0.88 + (idx % 4) * 0.03,
        active: true,
        history: [{ x: pos.x, y: pos.y, timestamp: 0 }],
        crossedLine: false,
        avatarColor: colors[idx % colors.length],
      });
    });
  }

  // Check if line segment between (x1, y1) and (x2, y2) crosses the counting line
  private checkLineCross(prevX: number, prevY: number, currX: number, currY: number): 'in' | 'out' | null {
    if (!this.lineCrossingConfig.enabled) return null;

    const lx1 = this.lineCrossingConfig.x1;
    const ly1 = this.lineCrossingConfig.y1;
    const lx2 = this.lineCrossingConfig.x2;
    const ly2 = this.lineCrossingConfig.y2;

    // Cross product signs for 2D line segment intersection
    const ccw = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
      return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
    };

    const intersect =
      ccw(lx1, ly1, currX, currY, prevX, prevY) !== ccw(lx2, ly2, currX, currY, prevX, prevY) &&
      ccw(lx1, ly1, lx2, ly2, prevX, prevY) !== ccw(lx1, ly1, lx2, ly2, currX, currY);

    if (intersect) {
      // Determine direction relative to line normal
      // Vector of line: (dx, dy)
      const dx = lx2 - lx1;
      const dy = ly2 - ly1;
      // Normal vector (-dy, dx) points towards "In" direction
      const moveX = currX - prevX;
      const moveY = currY - prevY;
      const dot = -dy * moveX + dx * moveY;
      return dot >= 0 ? 'in' : 'out';
    }

    return null;
  }

  public step(confidenceThresh: number = 0.5): {
    tracks: TrackedPerson[];
    events: EventLog[];
    cumulativeIn: number;
    cumulativeOut: number;
  } {
    this.frameCount++;
    this.timeSec += 0.033; // ~30 fps
    const newEvents: EventLog[] = [];
    const timestampStr = new Date(Date.now() - (10000 - this.frameCount * 33)).toLocaleTimeString();

    // Occasionally spawn new agent at room entry points (Left door or Top hallway)
    if (this.frameCount % 90 === 0 && this.agents.filter(a => a.active).length < 9) {
      const spawnAtLeft = Math.random() > 0.4;
      const id = this.nextId++;
      const newAgent: SimulatedAgent = {
        id,
        x: spawnAtLeft ? 0.05 : 0.45 + (Math.random() * 0.2 - 0.1),
        y: spawnAtLeft ? 0.35 + Math.random() * 0.3 : 0.12,
        vx: spawnAtLeft ? 0.0022 + Math.random() * 0.001 : (Math.random() - 0.5) * 0.002,
        vy: spawnAtLeft ? (Math.random() - 0.5) * 0.001 : 0.002 + Math.random() * 0.001,
        targetX: 0.65 + Math.random() * 0.25,
        targetY: 0.45 + Math.random() * 0.4,
        state: 'entering',
        lingerTicks: 0,
        baseConfidence: 0.85 + Math.random() * 0.12,
        active: true,
        history: [],
        crossedLine: false,
        avatarColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 5)],
      };
      newAgent.history.push({ x: newAgent.x, y: newAgent.y, timestamp: this.timeSec });
      this.agents.push(newAgent);

      newEvents.push({
        id: `ev-${Date.now()}-${id}`,
        timestamp: timestampStr,
        frameNumber: this.frameCount,
        type: 'track_created',
        trackId: id,
        description: `New track ID #${id} initialized by ByteTrack tracker`,
        confidence: newAgent.baseConfidence,
      });
    }

    // Update active agents
    for (const agent of this.agents) {
      if (!agent.active) continue;

      const prevX = agent.x;
      const prevY = agent.y;

      // Behavior state machine
      if (agent.state === 'lingering') {
        agent.lingerTicks--;
        // Tiny natural sway
        agent.x += (Math.random() - 0.5) * 0.0003;
        agent.y += (Math.random() - 0.5) * 0.0003;
        if (agent.lingerTicks <= 0) {
          agent.state = 'exiting';
          agent.targetX = Math.random() > 0.5 ? 0.95 : 0.05;
          agent.targetY = 0.5 + (Math.random() - 0.5) * 0.3;
          const dx = agent.targetX - agent.x;
          const dy = agent.targetY - agent.y;
          const dist = Math.hypot(dx, dy) || 1;
          agent.vx = (dx / dist) * 0.0022;
          agent.vy = (dy / dist) * 0.0022;
        }
      } else {
        // Steer towards target
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.05) {
          if (agent.state === 'entering' || agent.state === 'walking') {
            // Decide to linger or pick another waypoint
            if (Math.random() > 0.4) {
              agent.state = 'lingering';
              agent.lingerTicks = 45 + Math.floor(Math.random() * 60);
            } else {
              agent.state = 'walking';
              agent.targetX = 0.2 + Math.random() * 0.6;
              agent.targetY = 0.3 + Math.random() * 0.5;
              const ndx = agent.targetX - agent.x;
              const ndy = agent.targetY - agent.y;
              const ndist = Math.hypot(ndx, ndy) || 1;
              agent.vx = (ndx / ndist) * 0.002;
              agent.vy = (ndy / ndist) * 0.002;
            }
          } else if (agent.state === 'exiting') {
            // Out of bounds
            agent.active = false;
            newEvents.push({
              id: `ev-lost-${Date.now()}-${agent.id}`,
              timestamp: timestampStr,
              frameNumber: this.frameCount,
              type: 'track_lost',
              trackId: agent.id,
              description: `Track ID #${agent.id} departed field of view (track buffer elapsed)`,
              confidence: agent.baseConfidence,
            });
            continue;
          }
        } else {
          // Normal walking step
          agent.x += agent.vx;
          agent.y += agent.vy;
        }
      }

      // Check boundary loss
      if (agent.x < 0.02 || agent.x > 0.98 || agent.y < 0.05 || agent.y > 0.95) {
        agent.active = false;
        newEvents.push({
          id: `ev-bound-${Date.now()}-${agent.id}`,
          timestamp: timestampStr,
          frameNumber: this.frameCount,
          type: 'track_lost',
          trackId: agent.id,
          description: `Track ID #${agent.id} exited camera boundary`,
        });
        continue;
      }

      // Check virtual counting line crossing
      if (!agent.crossedLine) {
        const crossing = this.checkLineCross(prevX, prevY, agent.x, agent.y);
        if (crossing === 'in') {
          agent.crossedLine = true;
          this.cumulativeIn++;
          newEvents.push({
            id: `ev-cross-in-${Date.now()}-${agent.id}`,
            timestamp: timestampStr,
            frameNumber: this.frameCount,
            type: 'line_crossed_in',
            trackId: agent.id,
            description: `Person #${agent.id} crossed counting line [ENTRY / IN]`,
            confidence: agent.baseConfidence,
          });
        } else if (crossing === 'out') {
          agent.crossedLine = true;
          this.cumulativeOut++;
          newEvents.push({
            id: `ev-cross-out-${Date.now()}-${agent.id}`,
            timestamp: timestampStr,
            frameNumber: this.frameCount,
            type: 'line_crossed_out',
            trackId: agent.id,
            description: `Person #${agent.id} crossed counting line [EXIT / OUT]`,
            confidence: agent.baseConfidence,
          });
        }
      }

      // Update position history trail (keep last 16 points)
      agent.history.push({ x: agent.x, y: agent.y, timestamp: this.timeSec });
      if (agent.history.length > 20) {
        agent.history.shift();
      }
    }

    // Convert active agents to TrackedPerson structures
    // Add realistic perspective scaling: people lower in the frame (higher y) appear larger
    const activeTracks: TrackedPerson[] = this.agents
      .filter(a => a.active)
      .map(agent => {
        // Perspective multiplier: y ranges 0.15 .. 0.9
        const depth = Math.max(0.2, Math.min(1.0, agent.y));
        const boxHeight = 0.12 + depth * 0.16; // 0.15 to 0.28 normalized
        const boxWidth = boxHeight * 0.44;     // human aspect ratio ~ 1:2.3

        // Bounding box top-left
        const boxX = Math.max(0.01, Math.min(0.99 - boxWidth, agent.x - boxWidth / 2));
        const boxY = Math.max(0.01, Math.min(0.99 - boxHeight, agent.y - boxHeight * 0.9));

        // Slightly modulate confidence with small jitter
        const confJitter = (Math.sin(this.frameCount * 0.2 + agent.id) * 0.03);
        const confidence = Math.min(0.98, Math.max(0.55, agent.baseConfidence + confJitter));

        return {
          trackId: agent.id,
          box: {
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: boxHeight,
          },
          confidence,
          classLabel: 'person',
          trail: [...agent.history],
          velocity: { vx: agent.vx, vy: agent.vy },
          firstSeenFrame: 1,
          lastSeenFrame: this.frameCount,
          direction: (agent.vx > 0.0005 ? 'incoming' : agent.vx < -0.0005 ? 'outgoing' : 'stationary') as 'incoming' | 'outgoing' | 'stationary',
          hasCrossedLine: agent.crossedLine,
        };
      })
      .filter(t => t.confidence >= confidenceThresh);

    return {
      tracks: activeTracks,
      events: newEvents,
      cumulativeIn: this.cumulativeIn,
      cumulativeOut: this.cumulativeOut,
    };
  }

  // Draw simulated indoor hall background when no user video is uploaded
  public renderIndoorScene(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    showStylizedSilhouettes: boolean = true
  ) {
    // Navy-slate perspective indoor classroom / hall background
    ctx.save();

    // 1. Ceiling & Ambient
    const ambientGrad = ctx.createLinearGradient(0, 0, 0, height);
    ambientGrad.addColorStop(0, '#0c1527');
    ambientGrad.addColorStop(0.35, '#111d33');
    ambientGrad.addColorStop(0.65, '#17233d');
    ambientGrad.addColorStop(1, '#0e1728');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Perspective grid floor lines (hallway/classroom perspective)
    const horizonY = height * 0.35;
    const vanishX = width * 0.5;

    // Floor surface
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    floorGrad.addColorStop(0, '#101d32');
    floorGrad.addColorStop(1, '#0a101d');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Perspective floor tiles
    ctx.strokeStyle = 'rgba(56, 114, 224, 0.12)';
    ctx.lineWidth = 1;

    // Longitudinal perspective rays
    const rays = 18;
    for (let i = 0; i <= rays; i++) {
      const targetBottomX = (width / rays) * i;
      ctx.beginPath();
      ctx.moveTo(vanishX, horizonY);
      ctx.lineTo(targetBottomX, height);
      ctx.stroke();
    }

    // Transverse lines (expanding geometrically)
    let yStep = horizonY + 14;
    let dist = 10;
    while (yStep < height) {
      ctx.beginPath();
      ctx.moveTo(0, yStep);
      ctx.lineTo(width, yStep);
      ctx.stroke();
      dist *= 1.25;
      yStep += dist;
    }

    // 3. Wall elements: Doorway on left, whiteboard / screen on right
    // Left doorway (Entrance)
    ctx.fillStyle = 'rgba(30, 58, 102, 0.4)';
    ctx.fillRect(0, horizonY - 40, width * 0.14, height * 0.45);
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
    ctx.strokeRect(0, horizonY - 40, width * 0.14, height * 0.45);

    // Door sign
    ctx.fillStyle = 'rgba(96, 165, 250, 0.8)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('ENTRY 01', 8, horizonY - 26);

    // Right seminar display / board
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(width * 0.76, horizonY - 50, width * 0.22, height * 0.25);
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
    ctx.strokeRect(width * 0.76, horizonY - 50, width * 0.22, height * 0.25);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('SEMINAR HALL A-4', width * 0.78, horizonY - 32);

    // 4. Stylized desks / tables
    ctx.fillStyle = 'rgba(23, 37, 66, 0.6)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    // Desk 1
    ctx.fillRect(width * 0.25, height * 0.55, width * 0.16, height * 0.06);
    ctx.strokeRect(width * 0.25, height * 0.55, width * 0.16, height * 0.06);
    // Desk 2
    ctx.fillRect(width * 0.58, height * 0.58, width * 0.18, height * 0.06);
    ctx.strokeRect(width * 0.58, height * 0.58, width * 0.18, height * 0.06);

    // 5. Stylized human avatars in the room (rendered under bounding boxes for realistic look)
    if (showStylizedSilhouettes) {
      for (const agent of this.agents) {
        if (!agent.active) continue;
        const px = agent.x * width;
        const py = agent.y * height;
        const depth = Math.max(0.25, Math.min(1.0, agent.y));
        const headRadius = 7 * depth + 3;
        const bodyHeight = 38 * depth + 14;
        const shoulderWidth = 18 * depth + 8;

        // Shadow under feet
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(px, py, shoulderWidth * 0.9, 5 * depth + 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stylized figure body
        ctx.fillStyle = agent.avatarColor || '#38bdf8';
        ctx.beginPath();
        // Torso/coat
        ctx.roundRect(px - shoulderWidth / 2, py - bodyHeight, shoulderWidth, bodyHeight * 0.65, 4);
        ctx.fill();

        // Head
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(px, py - bodyHeight - headRadius, headRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
