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
  shortLabel: string;
  type: 'user' | 'group' | 'domain';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  attackType: 'K' | 'A' | 'B' | '';   // Kerberoast / AS-REP / Both / none
  privileged: boolean;
  r: number;
  score: number;
  ring: number;   // 0=domain, 1=groups, 2=critical, 3=high, 4=medium/low
}

interface GEdge {
  source: string;
  target: string;
  privilege: boolean;
}

// Force simulation constants
const REPULSION = 4800;
const MIN_D = 32;
const MAX_V = 2.8;
const DAMPING = 0.86;
const GRAVITY_GROUP = 0.0012;
const GRAVITY_USER = 0.0004;
const EDGE_K = 0.004;
const EDGE_LEN = 120;

// Colors
const SEV_COLOR: Record<string, string> = {
  critical: '#FF3A5C',
  high:     '#FF8C00',
  medium:   '#FFD024',
  low:      '#4B5A70',
  none:     '#00E4A3',
};

const RING_RADII = [0, 120, 220, 300, 365]; // domain, groups, critical, high, med/low

function angleSpread(i: number, total: number, offsetDeg = 0): [number, number] {
  const a = (i / Math.max(total, 1)) * Math.PI * 2 + (offsetDeg * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a)];
}

function jitter(mag = 12): number {
  return (Math.random() - 0.5) * mag;
}

export function ADGraph() {
  const { state } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<GNode | null>(null);
  const [hovered, setHovered] = useState<GNode | null>(null);
  const [graphStats, setGraphStats] = useState({ nodes: 0, edges: 0, crits: 0, highs: 0 });
  const nodesRef = useRef<GNode[]>([]);
  const edgesRef = useRef<GEdge[]>([]);
  const animFrameRef = useRef<number | undefined>(undefined);
  const frameRef = useRef(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const canvasSize = useRef({ w: 1200, h: 800 });

  // Size canvas to container on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    const w = Math.max(width, 600);
    const h = Math.max(height, 500);
    canvas.width = w;
    canvas.height = h;
    canvasSize.current = { w, h };
  }, []);

  // Build graph when data changes
  useEffect(() => {
    const { w, h } = canvasSize.current;
    const cx = w / 2;
    const cy = h / 2;

    const nodes: GNode[] = [];
    const edges: GEdge[] = [];

    // Domain node — pinned at center
    nodes.push({
      id: 'domain-root',
      x: cx, y: cy, vx: 0, vy: 0,
      label: state.stats?.datasetName ?? 'DOMAIN',
      shortLabel: 'CORP',
      type: 'domain', severity: 'none', attackType: '',
      privileged: true, r: 20, score: 0, ring: 0,
    });

    // Privileged groups — ring 1
    const privGroups = state.groups
      .filter(g => g.highvaluetarget || g.admincount)
      .slice(0, 8);
    privGroups.forEach((g, i) => {
      const [cos, sin] = angleSpread(i, privGroups.length, -60);
      const r = RING_RADII[1];
      nodes.push({
        id: g.objectid,
        x: cx + cos * r + jitter(10), y: cy + sin * r + jitter(10),
        vx: 0, vy: 0,
        label: g.name,
        shortLabel: g.name.split('@')[0].slice(0, 14),
        type: 'group', severity: 'none', attackType: '',
        privileged: true, r: 13, score: 0, ring: 1,
      });
    });

    // Attack targets — by severity ring
    const crits = state.targets.filter(t => t.severity === 'critical').slice(0, 6);
    const highs = state.targets.filter(t => t.severity === 'high').slice(0, 7);
    const rest = state.targets.filter(t => t.severity !== 'critical' && t.severity !== 'high').slice(0, 9);

    const placeTargets = (list: typeof crits, ring: number, rOff = 0) => {
      list.forEach((t, i) => {
        const [cos, sin] = angleSpread(i, list.length, 15 * ring);
        const rad = RING_RADII[ring] + rOff;
        const aType: 'K' | 'A' | 'B' | '' =
          t.attackType === 'both' ? 'B' :
          t.attackType === 'kerberoast' ? 'K' :
          t.attackType === 'asrep' ? 'A' : '';
        const nodeR =
          t.severity === 'critical' ? 17 :
          t.severity === 'high' ? 13 :
          t.severity === 'medium' ? 10 : 8;
        nodes.push({
          id: t.user.objectid,
          x: cx + cos * rad + jitter(18), y: cy + sin * rad + jitter(18),
          vx: 0, vy: 0,
          label: t.user.name,
          shortLabel: (t.user.samaccountname || t.user.name.split('@')[0]).slice(0, 12),
          type: 'user',
          severity: t.severity,
          attackType: aType,
          privileged: t.privilegedGroups.length > 0,
          r: nodeR,
          score: t.score,
          ring,
        });
      });
    };

    placeTargets(crits, 2);
    placeTargets(highs, 3);
    placeTargets(rest, 4, 20);

    // Edges: targets → their group nodes
    const allTargets = [...crits, ...highs, ...rest];
    allTargets.forEach(t => {
      t.user.memberof.forEach(gid => {
        const gNode = nodes.find(n => n.id === gid);
        if (gNode && gNode.type === 'group') {
          edges.push({ source: t.user.objectid, target: gid, privilege: t.privilegedGroups.length > 0 });
        }
      });
    });

    // Edges: privileged groups → domain
    privGroups.forEach(g => {
      edges.push({ source: g.objectid, target: 'domain-root', privilege: true });
    });

    // Deduplicate edges
    const edgeSet = new Set<string>();
    const deduped: GEdge[] = [];
    edges.forEach(e => {
      const k = `${e.source}|${e.target}`;
      if (!edgeSet.has(k)) { edgeSet.add(k); deduped.push(e); }
    });

    nodesRef.current = nodes;
    edgesRef.current = deduped;
    frameRef.current = 0;
    setGraphStats({
      nodes: nodes.length, edges: deduped.length,
      crits: crits.length, highs: highs.length,
    });
  }, [state.targets, state.groups, state.stats]);

  // Draw helpers
  const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  };

  // Simulation + render loop
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

      const nodeMap = new Map<string, GNode>();
      nodes.forEach(n => nodeMap.set(n.id, n));

      // Forces
      nodes.forEach(n => {
        if (n.ring === 0) return; // domain pinned

        // Repulsion
        nodes.forEach(other => {
          if (other.id === n.id) return;
          const dx = n.x - other.x;
          const dy = n.y - other.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_D);
          const f = REPULSION / (dist * dist);
          n.vx += (dx / dist) * f * 0.01;
          n.vy += (dy / dist) * f * 0.01;
        });

        // Gravity toward center
        const grav = n.ring === 1 ? GRAVITY_GROUP : GRAVITY_USER;
        n.vx += (cx - n.x) * grav;
        n.vy += (cy - n.y) * grav;

        // Radial constraint — keep in rough ring
        const tx = cx, ty = cy;
        const dx = n.x - tx, dy = n.y - ty;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetR = RING_RADII[n.ring] ?? 300;
        const pull = (d - targetR) * 0.0003;
        n.vx -= (dx / d) * pull;
        n.vy -= (dy / d) * pull;

        // Speed cap + damping + integrate
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > MAX_V) { n.vx = n.vx / speed * MAX_V; n.vy = n.vy / speed * MAX_V; }
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx;
        n.y += n.vy;

        // Soft boundary
        const m = 50;
        if (n.x < m) n.vx += (m - n.x) * 0.1;
        if (n.x > cw - m) n.vx -= (n.x - (cw - m)) * 0.1;
        if (n.y < m) n.vy += (m - n.y) * 0.1;
        if (n.y > ch - m) n.vy -= (n.y - (ch - m)) * 0.1;
      });

      // Edge spring
      edges.forEach(e => {
        const s = nodeMap.get(e.source);
        const t = nodeMap.get(e.target);
        if (!s || !t) return;
        if (s.ring === 0 && t.ring === 0) return;
        const dx = t.x - s.x, dy = t.y - s.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const f = (dist - EDGE_LEN) * EDGE_K;
        const fx = (dx / dist) * f, fy = (dy / dist) * f;
        if (s.ring !== 0) { s.vx += fx; s.vy += fy; }
        if (t.ring !== 0) { t.vx -= fx; t.vy -= fy; }
      });

      // ── DRAW ──────────────────────────────────────────────────
      ctx.clearRect(0, 0, cw, ch);

      // Grid
      ctx.strokeStyle = 'rgba(0,194,255,0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x < cw; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
      for (let y = 0; y < ch; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // ── Edges ──
      edges.forEach(e => {
        const s = nodeMap.get(e.source);
        const t = nodeMap.get(e.target);
        if (!s || !t) return;
        const grad = ctx.createLinearGradient(s.x, s.y, t.x, t.y);
        if (e.privilege) {
          grad.addColorStop(0, 'rgba(255,58,92,0)');
          grad.addColorStop(0.5, 'rgba(255,58,92,0.4)');
          grad.addColorStop(1, 'rgba(255,140,0,0.15)');
        } else {
          grad.addColorStop(0, 'rgba(0,194,255,0)');
          grad.addColorStop(0.5, 'rgba(0,194,255,0.18)');
          grad.addColorStop(1, 'rgba(167,139,250,0.1)');
        }
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = e.privilege ? 1.5 : 0.8;
        ctx.setLineDash(e.privilege ? [6, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead on privilege edges
        if (e.privilege) {
          const dx = t.x - s.x, dy = t.y - s.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 1) {
            const ux = dx / len, uy = dy / len;
            const ax = t.x - ux * (t.r + 5), ay = t.y - uy * (t.r + 5);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax - ux * 9 - uy * 4, ay - uy * 9 + ux * 4);
            ctx.lineTo(ax - ux * 9 + uy * 4, ay - uy * 9 - ux * 4);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255,58,92,0.55)';
            ctx.fill();
          }
        }
      });

      // ── Nodes ──
      nodes.forEach(n => {
        const isSelected = selected?.id === n.id;
        const isHovered = hovered?.id === n.id;
        const color = n.severity !== 'none' ? (SEV_COLOR[n.severity] ?? '#00C2FF') : n.type === 'domain' ? '#00E4A3' : '#A78BFA';
        const pulse = Math.sin(frame * 0.04 + n.x * 0.008) * 0.5 + 0.5;

        // Critical nodes: animated multi-ring pulse
        if (n.severity === 'critical') {
          for (let layer = 3; layer >= 1; layer--) {
            const layerR = n.r + 6 + layer * 7 + pulse * 5;
            const alpha = (0.03 + pulse * 0.04) / layer;
            ctx.beginPath();
            ctx.arc(n.x, n.y, layerR, 0, Math.PI * 2);
            ctx.fillStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.fill();
          }
        } else if (n.type === 'domain') {
          // Domain: persistent outer ring
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 10 + pulse * 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,228,163,0.06)';
          ctx.fill();
        }

        // Hover/selected glow halo
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 8, 0, Math.PI * 2);
          ctx.fillStyle = color + '25';
          ctx.fill();
        }

        // ── Node body ──
        if (n.type === 'group') {
          const s = n.r * 2;
          const gx = n.x - s / 2, gy = n.y - s / 2;
          drawRoundRect(ctx, gx, gy, s, s, 5);
        } else if (n.type === 'domain') {
          ctx.beginPath();
          ctx.moveTo(n.x, n.y - n.r * 1.4);
          ctx.lineTo(n.x + n.r * 1.2, n.y);
          ctx.lineTo(n.x, n.y + n.r * 1.4);
          ctx.lineTo(n.x - n.r * 1.2, n.y);
          ctx.closePath();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        }

        const bg = ctx.createRadialGradient(n.x - n.r * 0.3, n.y - n.r * 0.3, 0, n.x, n.y, n.r * 1.6);
        bg.addColorStop(0, color + '28');
        bg.addColorStop(1, color + '06');
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.strokeStyle = isSelected || isHovered ? color : color + 'aa';
        ctx.lineWidth = isSelected ? 2.5 : (n.type === 'domain' ? 2.5 : 1.5);
        ctx.stroke();

        // ── Attack type badge inside node ──
        if (n.attackType) {
          ctx.font = `800 ${n.r > 12 ? 10 : 8}px 'JetBrains Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = color + 'ff';
          ctx.fillText(n.attackType, n.x, n.y);
        } else if (n.type === 'domain') {
          ctx.font = '700 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#00E4A3cc';
          ctx.fillText('DA', n.x, n.y);
        }

        // ── Label below node ──
        const labelY = n.type === 'group'
          ? n.y + n.r + 14
          : n.y + n.r + 13;

        ctx.textBaseline = 'alphabetic';
        ctx.font = `${n.severity === 'critical' || n.severity === 'high' ? 700 : 500} ${n.severity === 'critical' ? 10 : 9}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        const labelW = ctx.measureText(n.shortLabel).width;

        // Background pill for important nodes
        if (n.severity === 'critical' || n.severity === 'high' || n.type !== 'user' || isSelected || isHovered) {
          ctx.fillStyle = 'rgba(6,10,18,0.82)';
          ctx.beginPath();
          ctx.roundRect
            ? ctx.roundRect(n.x - labelW / 2 - 4, labelY - 10, labelW + 8, 13, 4)
            : (() => { ctx.rect(n.x - labelW / 2 - 4, labelY - 10, labelW + 8, 13); })();
          ctx.fill();
        }

        ctx.fillStyle = n.severity === 'critical' ? '#FF3A5C'
          : n.severity === 'high' ? '#FF8C00'
          : n.type === 'domain' ? '#00E4A3'
          : n.type === 'group' ? '#A78BFA'
          : n.severity === 'medium' ? '#FFD024'
          : 'rgba(126,143,168,0.5)';
        ctx.fillText(n.shortLabel, n.x, labelY);

        // Score line below label for critical/high
        if (n.score >= 65) {
          ctx.font = `700 8px 'JetBrains Mono', monospace`;
          ctx.fillStyle = color + 'cc';
          ctx.fillText(String(n.score), n.x, labelY + 11);
        }
      });

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [zoom, pan, selected, hovered]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(4, z - e.deltaY * 0.001)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;
    const node = nodesRef.current.find(n => Math.hypot(n.x - mx, n.y - my) < n.r + 10);
    setHovered(node ?? null);

    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, [pan, zoom]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;
    const node = nodesRef.current.find(n => Math.hypot(n.x - mx, n.y - my) < n.r + 10);
    setSelected(prev => prev?.id === node?.id ? null : (node ?? null));
  }, [pan, zoom]);

  const fitView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  return (
    <div className="h-full flex flex-col" style={{ background: '#060A12' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,194,255,0.07)', background: 'rgba(6,10,18,0.95)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,194,255,0.1)', border: '1px solid rgba(0,194,255,0.18)' }}>
            <Network size={13} style={{ color: '#00C2FF' }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: '#EEF2FF' }}>AD Graph Explorer</span>
          <div className="flex items-center gap-2 ml-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,58,92,0.1)', color: '#FF3A5C', border: '1px solid rgba(255,58,92,0.18)' }}>
              {graphStats.crits} CRITICAL
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,140,0,0.1)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.18)' }}>
              {graphStats.highs} HIGH
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,194,255,0.07)', color: 'rgba(0,194,255,0.5)', border: '1px solid rgba(0,194,255,0.1)' }}>
              {graphStats.nodes} nodes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => { nodesRef.current = nodesRef.current.map(n => ({ ...n, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2 })); setZoom(1); setPan({x:0,y:0}); }}
            className="h-8 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            style={{ color: 'rgba(0,194,255,0.4)', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,194,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#00C2FF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,194,255,0.4)'; }}>
            <RefreshCw size={11} /> Reset
          </button>
          <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all" style={{ color: 'rgba(126,143,168,0.5)' }}><ZoomIn size={13} /></button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.25))} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all" style={{ color: 'rgba(126,143,168,0.5)' }}><ZoomOut size={13} /></button>
          <button onClick={fitView} className="h-8 px-3 rounded-xl text-xs hover:bg-white/5 font-mono transition-all flex items-center gap-1.5" style={{ color: 'rgba(126,143,168,0.5)' }}><Maximize size={11}/> Fit</button>
          <span className="text-xs font-mono px-2 py-0.5 rounded-lg ml-1"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(126,143,168,0.35)' }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: isDragging.current ? 'grabbing' : hovered ? 'pointer' : 'grab' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => { isDragging.current = false; }}
          onClick={handleClick}
          onMouseLeave={() => { isDragging.current = false; setHovered(null); }}
        />

        {/* Legend — bottom left */}
        <div className="absolute bottom-4 left-4 rounded-2xl p-4"
          style={{ background: 'rgba(6,10,18,0.93)', border: '1px solid rgba(0,194,255,0.08)', backdropFilter: 'blur(16px)', minWidth: 170 }}>
          <div className="text-[9px] font-mono tracking-[0.18em] mb-3" style={{ color: 'rgba(0,194,255,0.3)' }}>SEVERITY · NODE TYPE</div>
          {[
            { color: '#FF3A5C', label: 'Critical target', shape: 'circle' },
            { color: '#FF8C00', label: 'High target', shape: 'circle' },
            { color: '#FFD024', label: 'Medium target', shape: 'circle' },
            { color: '#A78BFA', label: 'Privileged group', shape: 'square' },
            { color: '#00E4A3', label: 'Domain root', shape: 'diamond' },
          ].map(({ color, label, shape }) => (
            <div key={label} className="flex items-center gap-2.5 mb-2">
              <div className="w-3 h-3 flex-shrink-0 rounded-sm" style={{
                background: color,
                borderRadius: shape === 'circle' ? '50%' : shape === 'diamond' ? '2px' : '3px',
                transform: shape === 'diamond' ? 'rotate(45deg) scale(0.85)' : 'none',
                boxShadow: `0 0 5px ${color}60`,
              }} />
              <span className="text-[10px] font-mono" style={{ color: 'rgba(126,143,168,0.65)' }}>{label}</span>
            </div>
          ))}
          <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[9px] font-mono tracking-[0.18em] mb-2" style={{ color: 'rgba(0,194,255,0.3)' }}>ATTACK TYPE · IN NODE</div>
            {[['K', 'Kerberoast', '#00C2FF'], ['A', 'AS-REP Roast', '#A78BFA'], ['B', 'Both', '#FF3A5C']].map(([badge, label, color]) => (
              <div key={badge} className="flex items-center gap-2.5 mb-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15`, border: `1px solid ${color}40`, color, fontSize: 8, fontWeight: 800, fontFamily: 'monospace' }}>
                  {badge}
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(126,143,168,0.55)' }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 pt-2.5 text-[9px] font-mono space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(126,143,168,0.3)' }}>
            <div>Scroll — zoom</div>
            <div>Drag — pan</div>
            <div>Click — select</div>
          </div>
        </div>

        {/* Selected/Hovered node info — top right */}
        {(selected ?? hovered) && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4 rounded-2xl p-4"
            style={{
              background: 'rgba(6,10,18,0.97)',
              border: `1px solid ${SEV_COLOR[(selected ?? hovered)!.severity] ?? '#00C2FF'}18`,
              backdropFilter: 'blur(16px)',
              minWidth: 190,
              boxShadow: `0 4px 24px rgba(0,0,0,0.6)`,
            }}
          >
            {(() => {
              const n = selected ?? hovered!;
              const c = n.severity !== 'none' ? SEV_COLOR[n.severity] : n.type === 'domain' ? '#00E4A3' : '#A78BFA';
              return (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                    <span className="font-mono text-xs font-bold truncate" style={{ color: '#EEF2FF' }}>{n.shortLabel}</span>
                    {n.attackType && (
                      <span className="ml-auto font-mono text-[9px] font-black px-1.5 py-0.5 rounded-lg"
                        style={{ background: c + '18', color: c, border: `1px solid ${c}30` }}>{n.attackType}</span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono space-y-1.5" style={{ color: 'rgba(126,143,168,0.65)' }}>
                    {n.severity !== 'none' && (
                      <div className="flex justify-between">
                        <span>Severity</span>
                        <span style={{ color: c, fontWeight: 700 }}>{n.severity.toUpperCase()}</span>
                      </div>
                    )}
                    {n.score > 0 && (
                      <div className="flex justify-between">
                        <span>Score</span>
                        <span style={{ color: '#00C2FF', fontWeight: 700 }}>{n.score}/100</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span style={{ color: 'rgba(238,242,255,0.6)' }}>{n.type}</span>
                    </div>
                    {n.privileged && (
                      <div style={{ color: '#FF3A5C' }} className="font-semibold">⚡ Privileged path</div>
                    )}
                    {n.attackType === 'K' && <div style={{ color: '#00C2FF' }}>Kerberoastable SPN</div>}
                    {n.attackType === 'A' && <div style={{ color: '#A78BFA' }}>Pre-auth disabled</div>}
                    {n.attackType === 'B' && <div style={{ color: '#FF3A5C' }}>Dual-vector target</div>}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </div>
    </div>
  );
}
