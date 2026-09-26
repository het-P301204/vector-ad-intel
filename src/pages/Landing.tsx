import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ChevronRight, Play, Shield, Zap, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'user' | 'group' | 'computer' | 'domain' | 'admin';
  size: number;
  opacity: number;
}

const NODE_LABELS = {
  user: { label: 'USER', color: '#3B82F6' },
  group: { label: 'GROUP', color: '#7C3AED' },
  computer: { label: 'HOST', color: '#6B7280' },
  domain: { label: 'DOMAIN', color: '#10B981' },
  admin: { label: 'DA', color: '#EF4444' },
};

const NODE_TYPES: Array<Particle['type']> = ['user', 'user', 'user', 'group', 'computer', 'domain', 'admin'];

function useParticles(count: number) {
  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
      type: NODE_TYPES[Math.floor(Math.random() * NODE_TYPES.length)],
      size: 4 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.4,
    }))
  );

  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = () => {
      setParticles(prev => prev.map(p => {
        let x = p.x + p.vx;
        let y = p.y + p.vy;
        let vx = p.vx;
        let vy = p.vy;
        if (x < 0 || x > 100) { vx = -vx; x = Math.max(0, Math.min(100, x)); }
        if (y < 0 || y > 100) { vy = -vy; y = Math.max(0, Math.min(100, y)); }
        return { ...p, x, y, vx, vy };
      }));
      frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, []);

  return particles;
}

function ParticleCanvas({ particles }: { particles: Particle[] }) {
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.35 }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Connections */}
      {particles.slice(0, 18).map((p, i) => {
        const next = particles[(i + 1) % 18];
        const dist = Math.hypot(p.x - next.x, p.y - next.y);
        if (dist > 30) return null;
        return (
          <line
            key={`line-${i}`}
            x1={`${p.x}%`} y1={`${p.y}%`}
            x2={`${next.x}%`} y2={`${next.y}%`}
            stroke="rgba(59,130,246,0.15)"
            strokeWidth="0.5"
          />
        );
      })}
      {/* Nodes */}
      {particles.map(p => {
        const { color } = NODE_LABELS[p.type];
        return (
          <g key={p.id}>
            <circle cx={`${p.x}%`} cy={`${p.y}%`} r={p.size + 3} fill={color} opacity={0.06} />
            <circle cx={`${p.x}%`} cy={`${p.y}%`} r={p.size} fill={color} opacity={p.opacity * 0.8} />
          </g>
        );
      })}
    </svg>
  );
}

export function Landing() {
  const { loadDemo, state } = useApp();
  const particles = useParticles(28);
  const [isDragging, setIsDragging] = useState(false);

  const features = [
    { icon: <Shield size={14} />, text: 'Fully offline analysis' },
    { icon: <Zap size={14} />, text: 'Privilege-aware scoring' },
    { icon: <Lock size={14} />, text: 'Kerberoast & AS-REP detection' },
  ];

  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden" style={{ background: '#07090D' }}>
      <ParticleCanvas particles={particles} />

      {/* Radial gradient center glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 70%)',
      }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
          style={{
            background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)',
            boxShadow: '0 0 40px rgba(59,130,246,0.3), 0 0 80px rgba(124,58,237,0.15)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 4L14 24L24 4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 12H20" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>
        </motion.div>

        {/* Product name */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono font-bold tracking-[0.25em] mb-3"
          style={{ fontSize: 44, color: '#F5F7FA', letterSpacing: '0.2em' }}
        >
          VECTOR
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
        >
          <p className="text-xl font-medium mb-2" style={{ color: '#8B95A5' }}>
            Active Directory Attack Intelligence
          </p>
          <p className="text-sm mb-10" style={{ color: 'rgba(139,149,165,0.5)' }}>
            Turn BloodHound exports into prioritized attack intelligence.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(139,149,165,0.8)' }}
            >
              <span style={{ color: '#3B82F6' }}>{f.icon}</span>
              {f.text}
            </motion.div>
          ))}
        </motion.div>

        {/* Import zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div
            className={`relative rounded-2xl p-8 text-center transition-all duration-200 ${isDragging ? 'scale-[1.02]' : ''}`}
            style={{
              background: isDragging ? 'rgba(59,130,246,0.08)' : 'rgba(17,24,32,0.8)',
              border: `2px dashed ${isDragging ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: isDragging ? '0 0 40px rgba(59,130,246,0.12)' : 'none',
            }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); }}
          >
            <Upload size={24} className="mx-auto mb-3" style={{ color: 'rgba(139,149,165,0.4)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: '#F5F7FA' }}>Drop BloodHound JSON files</p>
            <p className="text-xs mb-4" style={{ color: 'rgba(139,149,165,0.4)' }}>users.json, groups.json, computers.json</p>

            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                }}
              >
                <Upload size={14} />
                Import BloodHound Export
              </motion.button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-xs" style={{ color: 'rgba(139,149,165,0.4)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadDemo}
                disabled={state.isImporting}
                className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all group"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#8B95A5',
                }}
              >
                <Play size={13} className="text-blue-400" />
                Load demo dataset
                <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs"
          style={{ color: 'rgba(139,149,165,0.3)' }}
        >
          Analysis runs entirely in your browser · No data leaves your machine
        </motion.p>
      </div>

      {/* Import progress overlay */}
      <AnimatePresence>
        {state.isImporting && state.importProgress && (
          <ImportProgressOverlay />
        )}
      </AnimatePresence>
    </div>
  );
}

function ImportProgressOverlay() {
  const { state } = useApp();
  const progress = state.importProgress!;

  const stageLabels = ['Parse', 'Build Graph', 'Identify', 'Score', 'Prioritize'];
  const percent = Math.round((progress.stageIndex / progress.totalStages) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center"
      style={{ background: 'rgba(7,9,13,0.9)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl p-8"
        style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#3B82F6', boxShadow: '0 0 8px rgba(59,130,246,0.6)' }} />
          <span className="font-mono text-sm font-semibold tracking-wider" style={{ color: '#F5F7FA' }}>ANALYZING DATASET</span>
        </div>

        {/* Stage pipeline */}
        <div className="flex items-center justify-between mb-6">
          {stageLabels.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-500"
                style={{
                  background: i < progress.stageIndex ? '#3B82F6' : i === progress.stageIndex - 1 ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
                  color: i < progress.stageIndex ? 'white' : i === progress.stageIndex - 1 ? '#3B82F6' : 'rgba(139,149,165,0.3)',
                  boxShadow: i === progress.stageIndex - 1 ? '0 0 12px rgba(59,130,246,0.4)' : 'none',
                }}
              >
                {i < progress.stageIndex ? '✓' : i + 1}
              </div>
              <span className="text-[9px] font-mono" style={{ color: i < progress.stageIndex ? '#3B82F6' : 'rgba(139,149,165,0.3)' }}>
                {label.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="rounded-full overflow-hidden mb-4" style={{ height: 4, background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, #1D4ED8, #7C3AED)', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}
          />
        </div>

        {/* Log messages */}
        <div className="space-y-1.5">
          {progress.messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs font-mono"
              style={{ color: 'rgba(16,185,129,0.8)' }}
            >
              {msg}
            </motion.div>
          ))}
          <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'rgba(139,149,165,0.6)' }}>
            <span className="animate-pulse">▋</span>
            {progress.currentMessage}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
