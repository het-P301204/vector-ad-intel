import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Severity } from '../../lib/types';
import { severityColor } from '../../lib/utils';

interface ScoreRingProps {
  score: number;
  severity: Severity;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function ScoreRing({ score, severity, size = 120, strokeWidth = 8, showLabel = true }: ScoreRingProps) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayScore, setDisplayScore] = useState(0);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const color = severityColor(severity);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1200;
    const step = () => {
      start += 16;
      const progress = Math.min(start / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, score]);

  const dashOffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg ref={ref} width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.05s ease-out', filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-bold leading-none" style={{ fontSize: size * 0.28, color }}>{displayScore}</span>
          <span className="font-mono text-[10px] tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>SCORE</span>
        </div>
      )}
    </div>
  );
}

interface MiniScoreBarProps {
  score: number;
  severity: Severity;
  width?: number;
}

export function MiniScoreBar({ score, severity, width = 80 }: MiniScoreBarProps) {
  const color = severityColor(severity);
  return (
    <div className="flex items-center gap-2">
      <div className="relative rounded-full overflow-hidden" style={{ width, height: 4, background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
      <span className="font-mono text-xs" style={{ color }}>{score}</span>
    </div>
  );
}
