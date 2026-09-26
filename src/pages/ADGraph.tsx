import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Network, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
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
  r: number;
}

interface GEdge {
  source: string;
  target: string;
  type: 'member' | 'admin' | 'privilege';
}

const TYPE_COLOR = {
  user: '#00C2FF',
  group: '#A78BFA',
  computer: '#4B5A70',
  domain: '#00E4A3',
};

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
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Build graph data from state
  useEffect(() => {
    const targets = state.targets;
    const groups = state.groups;

    const nodes: GNode[] = [];
    const edges: GEdge[] = [];

    // Add key target users
    const targetUsers = targets.slice(0, 20);
    targetUsers.forEach((t, i) => {
      const angle = (i / targetUsers.length) * Math.PI * 2;
      const radius = 150;
      nodes.push({
        id: t.user.objectid,
        x: Math.cos(angle) * radius + 400,
        y: Math.sin(angle) * radius + 300,
        vx: 0, vy: 0,
        label: t.user.name,
        type: 'user',
        privileged: t.privilegedGroups.length > 0,
        target: true,
        r: t.severity === 'critical' ? 12 : t.severity === 'high' ? 10 : 8,
      });
    });

    // Add privileged groups
    const privGroups = groups.filter(g => g.highvaluetarget || g.admincount).slice(0, 8);
    privGroups.forEach((g, i) => {
      const angle = (i / privGroups.length) * Math.PI * 2;
      nodes.push({
        id: g.objectid,
        x: Math.cos(angle) * 80 + 400,
        y: Math.sin(angle) * 80 + 300,
        vx: 0, vy: 0,
        label: g.name,
        type: 'group',
        privileged: true,
        target: false,
        r: 11,
      });
    });

    // Add domain node
    nodes.push({
      id: 'domain-root',
      x: 400, y: 300,
      vx: 0, vy: 0,
      label: state.stats?.datasetName ?? 'DOMAIN',
      type: 'domain',
      privileged: true,
      target: false,
      r: 16,
    });

    // Build edges
    targets.slice(0, 15).forEach(t => {
      t.user.memberof.forEach(gid => {
        const groupNode = nodes.find(n => n.id === gid);
        if (groupNode) {
          edges.push({ source: t.user.objectid, target: gid, type: 'member' });
        }
      });
    });

    nodesRef.current = nodes;
    edgesRef.current = edges;
    setGraphStats({ nodes: nodes.length, edges: edges.length });
  }, [state.targets, state.groups, state.stats]);

  // Force simulation + render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const tick = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Simple force simulation
      nodes.forEach(n => {
        // Repulsion
        nodes.forEach(other => {
          if (other.id === n.id) return;
          const dx = n.x - other.x;
          const dy = n.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const force = 1200 / (dist * dist);
          n.vx += (dx / dist) * force * 0.01;
          n.vy += (dy / dist) * force * 0.01;
        });

        // Attraction to center
        n.vx += (canvas.width / 2 - n.x) * 0.0002;
        n.vy += (canvas.height / 2 - n.y) * 0.0002;

        // Damping
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;

        // Bounds
        n.x = Math.max(50, Math.min(canvas.width - 50, n.x));
        n.y = Math.max(50, Math.min(canvas.height - 50, n.y));
      });

      // Edge spring
      edges.forEach(e => {
        const s = nodes.find(n => n.id === e.source);
        const t = nodes.find(n => n.id === e.target);
        if (!s || !t) return;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const targetLen = 100;
        const force = (dist - targetLen) * 0.008;
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
        t.vx -= (dx / dist) * force;
        t.vy -= (dy / dist) * force;
      });

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw edges
      edges.forEach(e => {
        const s = nodes.find(n => n.id === e.source);
        const t = nodes.find(n => n.id === e.target);
        if (!s || !t) return;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = e.type === 'privilege' ? 'rgba(255,58,92,0.35)' : 'rgba(0,194,255,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash(e.type === 'member' ? [] : [4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw nodes
      nodes.forEach(n => {
        const isSelected = selected?.id === n.id;
        const color = TYPE_COLOR[n.type];

        // Glow for privileged/selected
        if (n.privileged || isSelected) {
          const glowColor = n.privileged ? 'rgba(255,58,92,0.22)' : 'rgba(0,194,255,0.2)';
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
          ctx.fillStyle = glowColor;
          ctx.fill();
        }

        // Node body
        ctx.beginPath();
        if (n.type === 'group') {
          const s = n.r * 1.2;
          ctx.roundRect(n.x - s / 2, n.y - s / 2, s, s, 4);
        } else {
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        }
        ctx.fillStyle = n.privileged ? 'rgba(255,58,92,0.15)' : `${color}20`;
        ctx.fill();
        ctx.strokeStyle = n.privileged ? 'rgba(255,58,92,0.75)' : n.target ? `${color}cc` : `${color}45`;
        ctx.lineWidth = isSelected ? 2 : 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = n.privileged ? 'rgba(255,58,92,0.9)' : n.target ? color : 'rgba(126,143,168,0.5)';
        ctx.font = `${n.target || n.privileged ? 600 : 400} 9px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(n.label.split('.')[0].slice(0, 14), n.x, n.y + n.r + 12);
      });

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [zoom, pan, selected]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
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
    // Check if we clicked a node
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;
    const node = nodesRef.current.find(n => Math.hypot(n.x - mx, n.y - my) < n.r + 4);
    setSelected(node ?? null);
  }, [pan, zoom]);

  const fitView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ background: '#060A12' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b" style={{ borderColor: 'rgba(0,194,255,0.08)', background: 'rgba(11,17,32,0.8)' }}>
        <div className="flex items-center gap-2">
          <Network size={15} style={{ color: '#00C2FF' }} />
          <span className="font-semibold text-sm" style={{ color: '#EEF2FF' }}>AD Graph Explorer</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,194,255,0.08)', color: '#00C2FF' }}>
            {graphStats.nodes} nodes · {graphStats.edges} edges
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: '#8B95A5' }}><ZoomIn size={14} /></button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: '#8B95A5' }}><ZoomOut size={14} /></button>
          <button onClick={fitView} className="h-8 px-3 rounded-xl text-xs flex items-center gap-1 transition-colors hover:bg-white/5" style={{ color: '#8B95A5' }}><Maximize size={12} /> Fit</button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full"
          style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl" style={{ background: 'rgba(17,24,32,0.9)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}>
          <div className="text-[9px] font-mono tracking-wider mb-2" style={{ color: 'rgba(139,149,165,0.4)' }}>LEGEND</div>
          {[
            { color: '#00C2FF', label: 'User' },
            { color: '#A78BFA', label: 'Group' },
            { color: '#4B5A70', label: 'Computer' },
            { color: '#00E4A3', label: 'Domain' },
            { color: '#FF3A5C', label: 'Privileged' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              <span className="text-[10px]" style={{ color: 'rgba(139,149,165,0.6)' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Selected node info */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 p-4 rounded-xl"
            style={{ background: 'rgba(17,24,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', minWidth: 180 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: TYPE_COLOR[selected.type] }} />
              <span className="font-mono text-xs font-semibold" style={{ color: '#EEF2FF' }}>{selected.label}</span>
            </div>
            <div className="text-[11px] space-y-1" style={{ color: 'rgba(126,143,168,0.6)' }}>
              <div>Type: <span style={{ color: TYPE_COLOR[selected.type] }}>{selected.type}</span></div>
              {selected.privileged && <div style={{ color: '#FF3A5C' }}>● Privileged</div>}
              {selected.target && <div style={{ color: '#00C2FF' }}>↳ Attack target</div>}
            </div>
          </motion.div>
        )}

        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl text-[10px] font-mono" style={{ background: 'rgba(17,24,32,0.8)', color: 'rgba(139,149,165,0.5)' }}>
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
}
