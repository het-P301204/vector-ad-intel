import { motion } from 'framer-motion';
import type { Severity, AttackType } from '../../lib/types';
import { severityColor, severityBg, attackTypeColor } from '../../lib/utils';

interface PriorityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const severityIcon = { critical: '●', high: '▲', medium: '■', low: '○' };

export function PriorityBadge({ severity, size = 'md', animated = false }: PriorityBadgeProps) {
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-1 gap-1',
    lg: 'text-xs px-3 py-1.5 gap-1.5',
  };

  const content = (
    <span
      className={`inline-flex items-center font-mono font-semibold tracking-wider rounded-full ${sizes[size]}`}
      style={{ color: severityColor(severity), background: severityBg(severity), border: `1px solid ${severityColor(severity)}30` }}
    >
      <span>{severityIcon[severity]}</span>
      {severity.toUpperCase()}
    </span>
  );

  if (animated) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
        {content}
      </motion.div>
    );
  }

  return content;
}

interface AttackBadgeProps {
  type: AttackType;
  size?: 'sm' | 'md';
}

const attackLabels = { kerberoast: 'KERBEROAST', asrep: 'AS-REP', both: 'KERB+ASREP' };

export function AttackBadge({ type, size = 'md' }: AttackBadgeProps) {
  const color = attackTypeColor(type);
  const sizes = { sm: 'text-[10px] px-2 py-0.5', md: 'text-[11px] px-2.5 py-1' };
  return (
    <span
      className={`inline-flex items-center font-mono font-semibold tracking-wider rounded-full ${sizes[size]}`}
      style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}
    >
      {attackLabels[type]}
    </span>
  );
}
