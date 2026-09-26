import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  danger?: boolean;
  delay?: number;
}

function useCountUp(target: number, delay = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 1000;
      const step = () => {
        start += 16;
        const progress = Math.min(start / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [inView, target, delay]);

  return { value, ref };
}

export function MetricCard({ label, value, subtitle, icon, color = '#00C2FF', danger = false, delay = 0 }: MetricCardProps) {
  const { value: displayValue, ref } = useCountUp(value, delay);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="relative group rounded-[18px] p-5 cursor-default overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #131C2E 0%, #0F1828 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
      }}
    >
      {/* Gradient hover overlay */}
      <div
        className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${color}08 0%, transparent 70%)`,
          border: `1px solid ${color}18`,
        }}
      />

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 rounded-[18px] pointer-events-none opacity-30"
        style={{ background: `radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />

      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}14`,
            color,
            boxShadow: `0 0 12px ${color}20`,
          }}
        >
          {icon}
        </div>
        {danger && value > 0 && (
          <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-full"
            style={{ color: '#FF3A5C', background: 'rgba(255,58,92,0.08)', border: '1px solid rgba(255,58,92,0.2)' }}>
            RISK
          </span>
        )}
      </div>

      <div>
        <div className="font-mono font-bold leading-none mb-1.5"
          style={{ fontSize: 30, color: danger && value > 0 ? color : '#EEF2FF', letterSpacing: '-0.02em' }}>
          {displayValue.toLocaleString()}
        </div>
        <div className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(126,143,168,0.7)' }}>{label}</div>
        {subtitle && (
          <div className="text-[10px] mt-1 font-mono" style={{ color: 'rgba(126,143,168,0.4)' }}>{subtitle}</div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }}
      />
    </motion.div>
  );
}
