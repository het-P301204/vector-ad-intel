import { useEffect, useRef, useState, useCallback } from 'react';
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
  const { loadDemo, loadFiles, state } = useApp();
  const particles = useParticles(28);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadFiles(Array.from(files));
    }
    // Reset so the same files can be re-selected
    e.target.value = '';
  }, [loadFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.json'));
    if (files.length > 0) loadFiles(files);
  }, [loadFiles]);

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
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div
            className={`relative rounded-2xl p-8 text-center transition-all duration-200 ${isDragging ? 'scale-[1.02]' : ''}`}
            style={{
              background: isDragging ? 'rgba(0,194,255,0.06)' : 'rgba(17,24,32,0.8)',
              border: `2px dashed ${isDragging ? 'rgba(0,194,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: isDragging ? '0 0 40px rgba(0,194,255,0.1)' : 'none',
            }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload size={24} className="mx-auto mb-3" style={{ color: 'rgba(139,149,165,0.4)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: '#F5F7FA' }}>Drop BloodHound JSON files</p>
            <p className="text-xs mb-4" style={{ color: 'rgba(139,149,165,0.4)' }}>users.json, groups.json, computers.json</p>

            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={state.isImporting}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(0,194,255,0.25)',
                  opacity: state.isImporting ? 0.5 : 1,
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
                  opacity: state.isImporting ? 0.5 : 1,
                }}
              >
                <Play size={13} style={{ color: '#00C2FF' }} />
                Load demo dataset
                <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#00C2FF' }} />
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

  const stages = ['PARSE', 'GRAPH', 'IDENTIFY', 'SCORE', 'RANK'];
  const percent = Math.round((progress.stageIndex / progress.totalStages) * 100);
  const activeStage = progress.stageIndex - 1; // 0-indexed current stage

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-20 flex items-center justify-center"
      style={{ background: 'rgba(6,10,18,0.96)', backdropFilter: 'blur(24px)' }}
    >
      {/* Ambient radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 35% at 50% 50%, rgba(0,194,255,0.05) 0%, transparent 70%)',
      }} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full rounded-3xl overflow-hidden"
        style={{
          maxWidth: 540,
          background: 'linear-gradient(160deg, #0D1828 0%, #0A1220 100%)',
          border: '1px solid rgba(0,194,255,0.1)',
          boxShadow: '0 32px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,194,255,0.05)',
        }}
      >
        {/* Subtle grid texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0,194,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(0,194,255,0.012) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />

        {/* Top scan line */}
        <div className="relative h-px overflow-hidden" style={{ background: 'rgba(0,194,255,0.04)' }}>
          <motion.div
            className="absolute inset-y-0 w-32"
            animate={{ x: ['-128px', '640px'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 0 }}
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,194,255,0.6), transparent)' }}
          />
        </div>

        <div className="relative px-9 pt-8 pb-7">

          {/* Header row */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: '#00C2FF', boxShadow: '0 0 8px #00C2FF, 0 0 16px rgba(0,194,255,0.3)' }}
              />
              <span className="font-mono text-xs font-bold tracking-[0.22em] uppercase" style={{ color: 'rgba(238,242,255,0.9)' }}>
                Analyzing Dataset
              </span>
            </div>
            {/* Plain percentage — no key remount, no jitter */}
            <span className="font-mono text-3xl font-bold tabular-nums leading-none" style={{ color: '#00C2FF', textShadow: '0 0 24px rgba(0,194,255,0.4)' }}>
              {percent}<span className="text-sm font-normal ml-0.5" style={{ color: 'rgba(0,194,255,0.35)' }}>%</span>
            </span>
          </div>

          {/* Stage nodes — NO connecting line. Each enlightens on complete. */}
          <div className="flex items-start justify-between mb-8 px-2">
            {stages.map((label, i) => {
              const isDone = i < progress.stageIndex;
              const isActive = i === activeStage;
              const isFuture = i > activeStage;
              return (
                <div key={i} className="flex flex-col items-center gap-2.5" style={{ flex: 1 }}>
                  <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
                    {/* Pulse ring — active only */}
                    {isActive && (
                      <motion.div
                        className="absolute rounded-full"
                        animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                        style={{ width: 48, height: 48, background: 'rgba(0,194,255,0.15)', borderRadius: '50%' }}
                      />
                    )}
                    {/* The node circle */}
                    <motion.div
                      className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center font-mono font-bold text-sm"
                      animate={isDone ? {
                        background: 'rgba(0,194,255,0.12)',
                        borderColor: 'rgba(0,194,255,0.55)',
                        color: '#00C2FF',
                        boxShadow: '0 0 16px rgba(0,194,255,0.25)',
                      } : isActive ? {
                        background: 'rgba(0,194,255,0.08)',
                        borderColor: 'rgba(0,194,255,0.6)',
                        color: '#00C2FF',
                        boxShadow: ['0 0 10px rgba(0,194,255,0.2)', '0 0 22px rgba(0,194,255,0.45)', '0 0 10px rgba(0,194,255,0.2)'],
                      } : {
                        background: 'rgba(255,255,255,0.025)',
                        borderColor: 'rgba(255,255,255,0.07)',
                        color: 'rgba(126,143,168,0.2)',
                        boxShadow: 'none',
                      }}
                      transition={isDone || isFuture ? { duration: 0.5 } : { boxShadow: { duration: 1.4, repeat: Infinity } }}
                      style={{ border: '1.5px solid', willChange: 'box-shadow' }}
                    >
                      {isDone ? '✓' : i + 1}
                    </motion.div>
                  </div>
                  <motion.span
                    animate={isDone ? { color: '#00C2FF', opacity: 0.9 } : isActive ? { color: '#00C2FF', opacity: 0.6 } : { color: 'rgba(126,143,168,1)', opacity: 0.18 }}
                    transition={{ duration: 0.5 }}
                    className="text-[8px] font-mono tracking-[0.15em] font-semibold uppercase"
                  >
                    {label}
                  </motion.span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="relative rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Fill + shimmer clipped inside it */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                style={{ background: 'linear-gradient(90deg, #0EA5E9, #00C2FF 55%, #818CF8)' }}
              >
                {/* Shimmer constrained to fill */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'linear', repeatDelay: 0 }}
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)' }}
                />
              </motion.div>
            </div>
            {/* Lead glow dot — absolutely positioned over the bar */}
            {percent > 1 && percent < 99 && (
              <div className="relative" style={{ height: 0 }}>
                <motion.div
                  className="absolute"
                  animate={{ left: `${percent}%` }}
                  transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                  style={{ top: -9, transform: 'translateX(-50%)' }}
                >
                  <motion.div
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#00C2FF',
                      boxShadow: '0 0 10px #00C2FF, 0 0 20px rgba(0,194,255,0.5)',
                    }}
                  />
                </motion.div>
              </div>
            )}
          </div>

          {/* Terminal log — fixed height, no resize */}
          <div className="rounded-2xl px-4 overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(0,194,255,0.05)', height: 96 }}>
            <div className="flex flex-col justify-end h-full py-3 gap-1.5">
              <AnimatePresence>
                {progress.messages.slice(-2).map((msg) => (
                  <motion.div
                    key={msg}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 text-[11px] font-mono flex-shrink-0"
                    style={{ color: '#00E4A3' }}
                  >
                    <span style={{ color: 'rgba(0,228,163,0.35)', fontSize: 8 }}>✓</span>
                    {msg}
                  </motion.div>
                ))}
              </AnimatePresence>
              {progress.currentMessage && (
                <div className="flex items-center gap-2 text-[11px] font-mono flex-shrink-0" style={{ color: 'rgba(0,194,255,0.8)' }}>
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                    style={{ fontSize: 10 }}
                  >▋</motion.span>
                  {progress.currentMessage}
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
