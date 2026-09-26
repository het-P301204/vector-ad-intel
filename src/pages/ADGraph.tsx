import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Network, ZoomIn, ZoomOut, Maximize, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface GNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  type: 'user' | 'group' | 'computer' | 'domain';
  privileged: boolean;
  target: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  r: number;
  score: number;
}

interface GEdge {
  source: string;
  target: string;
  type: 'member' | 'privilege';
}

// Force constants — tuned for a stable, visually pleasing layout
const REPULSION_K = 5000;     // repulsion coefficient
const MIN_DIST = 35;           // min distance to prevent infinite force
const MAX_VEL = 3.5;           // velocity clamp
const GRAVITY = 0.0006;        // center pull strength
const EDGE_LEN = 130;          // natural edge length
const EDGE_K = 0.005;          // edge spring constant
const DAMPING = 0.87;          // velocity decay per tick

// Color palette
const TYPE_COLOR: Record<string, string> = {
  user: '#00C2FF',
  group: '#A78BFA',
  computer: '#4B5A70',
  domain: '#00E4A3',
};

const SEV_COLOR: Record<string, string> = {
  critical: '#FF3A5C',
  high: '#FF8C00',
  medium: '#FFD024',
  low: '#4B5A70',
  none: '#00C2FF',
};

// Golden-angle distribution — ensures nodes start well-separated
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function sunflower(i: number, n: number, cx: number, cy: number): [number, number] {
  const r = Math.sqrt((i + 0.5) / n) * Math.min(cx, cy) * 0.7;
  const theta = i * GOLDEN;
  return [cx + Math.cos(theta) * r, cy + Math.sin(theta) * r];
}

export function ADGraph() {
  const { state } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<GNode | null>(null);
  const [graphStats, setGraphStats] = useState({ nodes: 0, edges: 0 });
  const nodesRef = useRef<GNode[]>([]);
  const edgesRef = useRef<GEdge[]>([]);
  const animFrameRef = useRef<number | undefined>(undefined);
  const frameRef = useRef(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Build graph data
  useEffect(() => {
    const canvas = canvasRef.current;
    const cw = canvas?.width ?? 1200;
    const ch = canvas?.height ?? 800;
    const cx = cw / 2;
    const cy = ch / 2;

    const nodes: GNode[] = [];
    const edges: GEdge[] = [];

    // Domain node at center
    nodes.push({
      id: 'domain-root',
      x: cx, y: cy,
      vx: 0, vy: 0,
      label: state.stats?.datasetName ?? 'DOMAIN',
      type: 'domain',
      privileged: true,
      target: false,
      severity: 'none',
      r: 18,
      score: 100,
    });

    // Privileged groups — inner ring
    const privGroups = state.groups.filter(g => g.highvaluetarget || g.admincount).slice(0, 8);
    privGroups.forEach((g, i) => {
      const angle = (i / Math.max(privGroups.length, 1)) * Math.PI * 2;
      const rRing = 100;
      nodes.push({
        id: g.objectid,
        x: cx + Math.cos(angle) * rRing + (Math.random() - 0.5) * 20,
        y: cy + Math.sin(angle) * rRing + (Math.random() - 0.5) * 20,
        vx: 0, vy: 0,
        label: g.name,
        type: 'group',
        privileged: true,
        target: false,
        severity: 'none',
        r: 12,
        score: 0,
      });
    });

    // Attack targets — outer sunflower
    const targets = state.targets.slice(0, 22);
    const totalNodes = targets.length;
    targets.forEach((t, i) => {
      const [x, y] = sunflower(i, totalNodes, cx, cy);
      // Offset outward to separate from groups
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      const scale = 1 + (150 / dist);
      nodes.push({
        id: t.user.objectid,
        x: cx + dx * scale + (Math.random() - 0.5) * 15,
        y: cy + dy * scale + (Math.random() - 0.5) * 15,
        vx: 0, vy: 0,
        label: t.user.name,
        type: 'user',
        privileged: t.privilegedGroups.length > 0,
        target: true,
        severity: t.severity,
        r: t.severity === 'critical' ? 13 : t.severity === 'high' ? 10 : 8,
        score: t.score,
      });
    });

    // Edges: targets → their group nodes
    targets.slice(0, 18).forEach(t => {
      t.user.memberof.forEach(gid => {
        const gNode = nodes.find(n => n.id === gid);
        if (gNode) {
          edges.push({
            source: t.user.objectid,
            target: gid,
            type: t.privilegedGroups.length > 0 ? 'privilege' : 'member',
          });
        }
      });
      // Connect privileged groups → domain
      if (t.daDistance <= 2) {
        const groupNode = nodes.find(n => n.type === 'group' && t.user.memberof.includes(n.id));
        if (groupNode) {
          edges.push({ source: groupNode.id, target: 'domain-root', type: 'privilege' });
        }
      }
    });

    // Dedupe edges
    const edgeSet = new Set<string>();
    const deduped: GEdge[] = [];
    edges.forEach(e => {
      const key = `${e.source}|${e.target}`;
      if (!edgeSet.has(key)) { edgeSet.add(key); deduped.push(e); }
    });

    nodesRef.current = nodes;
    edgesRef.current = deduped;
    setGraphStats({ nodes: nodes.length, edges: deduped.length });
    frameRef.current = 0;
  }, [state.targets, state.groups, state.stats]);

  // Draw background grid + node glow helper
  function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const step = 40;
    ctx.strokeStyle = 'rgba(0,194,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }

  // Arrowhead
  function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, targetR: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const ux = dx / len;
    const uy = dy / len;
    // Arrow base at target node edge
    const ax = x2 - ux * (targetR + 4);
    const ay = y2 - uy * (targetR + 4);
    const perp = 4;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - ux * 8 - uy * perp, ay - uy * 8 + ux * perp);
    ctx.lineTo(ax - ux * 8 + uy * perp, ay - uy * 8 - ux * perp);
    ctx.closePath();
    ctx.fill();
  }

  // Force simulation + render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const tick = () => {
      frameRef.current++;
      const frame = frameRef.current;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const cw = canvas.width;
      const ch = canvas.height;
      const cx = cw / 2;
      const cy = ch / 2;

      // Build lookup map for performance
      const nodeMap = new Map<string, GNode>();
      nodes.forEach(n => nodeMap.set(n.id, n));

      // Forces
      nodes.forEach(n => {
        // Repulsion from all other nodes (with min-distance guard)
        nodes.forEach(other => {
          if (other.id === n.id) return;
          const dx = n.x - other.x;
          const dy = n.y - other.y;
          const d2 = dx * dx + dy * dy;
          const dist = Math.max(Math.sqrt(d2), MIN_DIST);
          const force = REPULSION_K / (dist * dist);
          n.vx += (dx / dist) * force * 0.01;
          n.vy += (dy / dist) * force * 0.01;
        });

        // Center gravity (stronger for groups, weaker for users)
        const grav = n.type === 'group' ? GRAVITY * 2.5 : GRAVITY;
        n.vx += (cx - n.x) * grav;
        n.vy += (cy - n.y) * grav;

        // Velocity cap
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > MAX_VEL) { n.vx = n.vx / speed * MAX_VEL; n.vy = n.vy / speed * MAX_VEL; }

        // Damping + integrate
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx;
        n.y += n.vy;

        // Elastic boundary push
        const margin = 55;
        if (n.x < margin) n.vx += (margin - n.x) * 0.12;
        if (n.x > cw - margin) n.vx -= (n.x - (cw - margin)) * 0.12;
        if (n.y < margin) n.vy += (margin - n.y) * 0.12;
        if (n.y > ch - margin) n.vy -= (n.y - (ch - margin)) * 0.12;
      });

      // Edge spring
      edges.forEach(e => {
        const s = nodeMap.get(e.source);
        const t = nodeMap.get(e.target);
        if (!s || !t) return;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (dist - EDGE_LEN) * EDGE_K;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        s.vx += fx; s.vy += fy;
        t.vx -= fx; t.vy -= fy;
      });

      // ── Draw ────────────────────────────────────────────────────
      ctx.clearRect(0, 0, cw, ch);
      ctx.save();

      // Grid background
      drawGrid(ctx, cw, ch);

      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // ── Edges ──
      edges.forEach(e => {
        const s = nodeMap.get(e.source);
        const t = nodeMap.get(e.target);
        if (!s || !t) return;

        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Gradient stroke
        const grad = ctx.createLinearGradient(s.x, s.y, t.x, t.y);
        if (e.type === 'privilege') {
          grad.addColorStop(0, 'rgba(255,58,92,0.0)');
          grad.addColorStop(0.5, 'rgba(255,58,92,0.35)');
          grad.addColorStop(1, 'rgba(255,140,0,0.2)');
        } else {
          grad.addColorStop(0, 'rgba(0,194,255,0.0)');
          grad.addColorStop(0.5, 'rgba(0,194,255,0.2)');
          grad.addColorStop(1, 'rgba(167,139,250,0.15)');
        }

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = e.type === 'privilege' ? 1.5 : 1;
        ctx.setLineDash(e.type === 'privilege' ? [5, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead on privilege edges
        if (e.type === 'privilege' && dist > 20) {
          ctx.fillStyle = 'rgba(255,58,92,0.5)';
          drawArrow(ctx, s.x, s.y, t.x, t.y, t.r);
        }
      });

      // ── Nodes ──
      nodes.forEach(n => {
        const isSelected = selected?.id === n.id;
        const color = n.privileged && n.type !== 'domain'
          ? SEV_COLOR[n.severity] ?? '#FF3A5C'
          : TYPE_COLOR[n.type] ?? '#00C2FF';
        const pulse = Math.sin(frame * 0.04 + n.x * 0.01) * 0.5 + 0.5; // 0–1

        // ── Outer glow layers ──
        if (n.severity === 'critical' || n.type === 'domain') {
          // Animated pulse ring for critical nodes
          const ringR = n.r + 8 + pulse * 8;
          const ringAlpha = 0.05 + pulse * 0.08;
          ctx.beginPath();
          ctx.arc(n.x, n.y, ringR, 0, Math.PI * 2);
          ctx.fillStyle = `${color}${Math.round(ringAlpha * 255).toString(16).padStart(2, '0')}`;
          ctx.fill();
        }

        // Static glow halo
        if (n.privileged || n.type === 'domain' || isSelected) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
          const glowAlpha = isSelected ? 0.3 : 0.18;
          ctx.fillStyle = color + Math.round(glowAlpha * 255).toString(16).padStart(2, '0');
          ctx.fill();
        }

        // ── Node body ──
        ctx.beginPath();
        if (n.type === 'group') {
          // Rounded rectangle for groups (manual path for browser compat)
          const s = n.r * 1.4;
          const gx = n.x - s / 2;
          const gy = n.y - s / 2;
          const gr = 5;
          ctx.moveTo(gx + gr, gy);
          ctx.lineTo(gx + s - gr, gy);
          ctx.arcTo(gx + s, gy, gx + s, gy + gr, gr);
          ctx.lineTo(gx + s, gy + s - gr);
          ctx.arcTo(gx + s, gy + s, gx + s - gr, gy + s, gr);
          ctx.lineTo(gx + gr, gy + s);
          ctx.arcTo(gx, gy + s, gx, gy + s - gr, gr);
          ctx.lineTo(gx, gy + gr);
          ctx.arcTo(gx, gy, gx + gr, gy, gr);
          ctx.closePath();
        } else if (n.type === 'domain') {
          // Diamond for domain
          ctx.moveTo(n.x, n.y - n.r * 1.3);
          ctx.lineTo(n.x + n.r * 1.1, n.y);
          ctx.lineTo(n.x, n.y + n.r * 1.3);
          ctx.lineTo(n.x - n.r * 1.1, n.y);
          ctx.closePath();
        } else {
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        }

        // Fill with gradient
        const nodeGrad = ctx.createRadialGradient(n.x - n.r * 0.3, n.y - n.r * 0.3, 0, n.x, n.y, n.r * 1.5);
        nodeGrad.addColorStop(0, color + '30');
        nodeGrad.addColorStop(1, color + '08');
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = isSelected
          ? color + 'ff'
          : color + (n.target || n.privileged ? 'cc' : '55');
        ctx.lineWidth = isSelected ? 2.5 : (n.type === 'domain' ? 2 : 1.5);
        ctx.stroke();

        // Inner dot for user nodes (looks like a crosshair target)
        if (n.type === 'user' && n.target) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = color + 'cc';
          ctx.fill();
        }

        // ── Label ──
        const shortLabel = n.label.split('.')[0].split('\\').pop()?.slice(0, 13) ?? n.label;
        const labelY = n.y + n.r + (n.type === 'group' ? n.r * 0.9 : 0) + 14;

        ctx.font = `${n.target || n.privileged || n.type === 'domain' ? 600 : 400} 9px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        const tw = ctx.measureText(shortLabel).width;

        // Label background pill
        if (n.target || n.type === 'domain' || n.type === 'group') {
          ctx.fillStyle = 'rgba(6,10,18,0.75)';
          ctx.beginPath();
          ctx.roundRect(n.x - tw / 2 - 4, labelY - 9, tw + 8, 13, 4);
          ctx.fill();
        }

        ctx.fillStyle = n.severity === 'critical'
          ? '#FF3A5C'
          : n.severity === 'high'
          ? '#FF8C00'
          : n.target
          ? color
          : n.type === 'domain'
          ? '#00E4A3'
          : n.type === 'group'
          ? '#A78BFA'
          : 'rgba(126,143,168,0.5)';
        ctx.fillText(shortLabel, n.x, labelY);

        // Score badge for high-priority targets
        if (n.target && n.score >= 70) {
          ctx.font = `700 8px 'JetBrains Mono', monospace`;
          const scoreStr = String(n.score);
          ctx.fillStyle = SEV_COLOR[n.severity] ?? '#00C2FF';
          ctx.fillText(scoreStr, n.x, labelY + 11);
        }
      });

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [zoom, pan, selected]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.25, Math.min(4, z - e.deltaY * 0.001)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;
    const node = nodesRef.current.find(n => Math.hypot(n.x - mx, n.y - my) < n.r + 8);
    setSelected(node ?? null);
  }, [pan, zoom]);

  const fitView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const resetLayout = useCallback(() => {
    // Re-trigger data build by clearing and rebuilding node positions
    nodesRef.current = nodesRef.current.map((n, i) => {
      const canvas = canvasRef.current;
      const cx = (canvas?.width ?? 1200) / 2;
      const cy = (canvas?.height ?? 800) / 2;
      const [x, y] = n.type === 'domain'
        ? [cx, cy]
        : n.type === 'group'
        ? [cx + Math.cos(i * 0.8) * 100, cy + Math.sin(i * 0.8) * 100]
        : sunflower(i, nodesRef.current.length, cx, cy);
      return { ...n, x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 };
    });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ background: '#060A12' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(0,194,255,0.08)', background: 'rgba(6,10,18,0.9)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(167,139,250,0.2))', border: '1px solid rgba(0,194,255,0.2)' }}>
            <Network size={13} style={{ color: '#00C2FF' }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: '#EEF2FF' }}>AD Graph Explorer</span>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,194,255,0.08)', color: '#00C2FF', border: '1px solid rgba(0,194,255,0.12)' }}>
            {graphStats.nodes} nodes · {graphStats.edges} edges
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={resetLayout} className="h-8 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            style={{ color: 'rgba(0,194,255,0.5)', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,194,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#00C2FF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,194,255,0.5)'; }}>
            <RefreshCw size={11} /> Reset
          </button>
          <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/5" style={{ color: 'rgba(126,143,168,0.6)' }}><ZoomIn size={13} /></button>
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/5" style={{ color: 'rgba(126,143,168,0.6)' }}><ZoomOut size={13} /></button>
          <button onClick={fitView} className="h-8 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-all hover:bg-white/5 font-mono"
            style={{ color: 'rgba(126,143,168,0.6)' }}><Maximize size={11} /> Fit</button>
          <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-xs font-mono px-2 py-0.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(126,143,168,0.4)' }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1400}
          height={900}
          className="w-full h-full"
          style={{ cursor: isDragging.current ? 'grabbing' : 'grab', display: 'block' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { isDragging.current = false; }}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-3.5 rounded-2xl"
          style={{ background: 'rgba(6,10,18,0.92)', border: '1px solid rgba(0,194,255,0.08)', backdropFilter: 'blur(16px)' }}>
          <div className="text-[9px] font-mono tracking-widest mb-2.5" style={{ color: 'rgba(0,194,255,0.35)' }}>NODE TYPES</div>
          {[
            { color: '#00C2FF', label: 'User / Target', shape: 'circle' },
            { color: '#A78BFA', label: 'Group', shape: 'square' },
            { color: '#00E4A3', label: 'Domain Root', shape: 'diamond' },
            { color: '#FF3A5C', label: 'Critical / Privileged', shape: 'circle' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2.5 mb-1.5">
              <div className="w-2.5 h-2.5 flex-shrink-0 rounded-sm" style={{
                background: l.color,
                borderRadius: l.shape === 'circle' ? '50%' : l.shape === 'diamond' ? '2px' : '3px',
                transform: l.shape === 'diamond' ? 'rotate(45deg) scale(0.8)' : 'none',
                boxShadow: `0 0 6px ${l.color}80`,
              }} />
              <span className="text-[10px] font-mono" style={{ color: 'rgba(126,143,168,0.7)' }}>{l.label}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="text-[9px] font-mono tracking-widest mb-2" style={{ color: 'rgba(0,194,255,0.35)' }}>EDGES</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-px" style={{ background: 'rgba(0,194,255,0.4)' }} />
              <span className="text-[10px] font-mono" style={{ color: 'rgba(126,143,168,0.6)' }}>Membership</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8" style={{ borderTop: '1px dashed rgba(255,58,92,0.5)', display: 'block' }} />
              <span className="text-[10px] font-mono" style={{ color: 'rgba(126,143,168,0.6)' }}>Privilege path</span>
            </div>
          </div>
        </div>

        {/* Selected node info */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="absolute top-4 right-4 p-4 rounded-2xl"
            style={{
              background: 'rgba(6,10,18,0.95)',
              border: `1px solid ${TYPE_COLOR[selected.type] ?? '#00C2FF'}20`,
              backdropFilter: 'blur(16px)',
              minWidth: 200,
              boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${TYPE_COLOR[selected.type] ?? '#00C2FF'}15`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: selected.privileged ? SEV_COLOR[selected.severity] ?? '#FF3A5C' : TYPE_COLOR[selected.type],
                  boxShadow: `0 0 8px ${selected.privileged ? '#FF3A5C' : TYPE_COLOR[selected.type]}`,
                }} />
              <span className="font-mono text-xs font-bold truncate" style={{ color: '#EEF2FF' }}>
                {selected.label.split('.')[0].split('\\').pop()}
              </span>
            </div>
            <div className="text-[11px] space-y-1.5 font-mono" style={{ color: 'rgba(126,143,168,0.7)' }}>
              <div>Type: <span style={{ color: TYPE_COLOR[selected.type] }}>{selected.type}</span></div>
              {selected.severity !== 'none' && (
                <div>Severity: <span style={{ color: SEV_COLOR[selected.severity] }}>{selected.severity.toUpperCase()}</span></div>
              )}
              {selected.score > 0 && (
                <div>Score: <span style={{ color: '#00C2FF' }}>{selected.score}/100</span></div>
              )}
              {selected.privileged && <div style={{ color: '#FF3A5C' }}>⚡ Privileged</div>}
              {selected.target && <div style={{ color: '#00C2FF' }}>🎯 Attack target</div>}
            </div>
          </motion.div>
        )}

        {/* Tip */}
        <div className="absolute bottom-4 right-4 text-[10px] font-mono px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(6,10,18,0.8)', color: 'rgba(126,143,168,0.35)', border: '1px solid rgba(255,255,255,0.04)' }}>
          Scroll: zoom · Drag: pan · Click: select
        </div>
      </div>
    </div>
  );
}
