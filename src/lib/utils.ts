import type { Severity, EncryptionType, PrivilegeTier, AttackType } from './types';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function formatDays(days: number): string {
  if (days > 1825) return `${Math.floor(days / 365)}+ years`;
  if (days > 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}, ${Math.floor((days % 365) / 30)} mo`;
  if (days > 30) return `${Math.floor(days / 30)} months`;
  if (days === 0) return 'Today';
  return `${days} days`;
}

export function formatTimestamp(ts: number): string {
  if (ts <= 0) return 'Never';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function severityColor(s: Severity): string {
  switch (s) {
    case 'critical': return '#FF3A5C';
    case 'high': return '#FF8C00';
    case 'medium': return '#FFD024';
    case 'low': return '#4B5A70';
  }
}

export function severityBg(s: Severity): string {
  switch (s) {
    case 'critical': return 'rgba(255,58,92,0.12)';
    case 'high': return 'rgba(255,140,0,0.12)';
    case 'medium': return 'rgba(255,208,36,0.12)';
    case 'low': return 'rgba(75,90,112,0.15)';
  }
}

export function severityLabel(s: Severity): string {
  return s.toUpperCase();
}

export function encryptionColor(e: EncryptionType): string {
  switch (e) {
    case 'RC4': return '#FF3A5C';
    case 'DES': return '#FF8C00';
    case 'AES128': return '#FFD024';
    case 'AES256': return '#00E4A3';
    default: return '#4B5A70';
  }
}

export function attackTypeLabel(t: AttackType): string {
  switch (t) {
    case 'kerberoast': return 'Kerberoast';
    case 'asrep': return 'AS-REP';
    case 'both': return 'Kerberoast + AS-REP';
  }
}

export function attackTypeColor(t: AttackType): string {
  switch (t) {
    case 'kerberoast': return '#00C2FF';
    case 'asrep': return '#A78BFA';
    case 'both': return '#FF3A5C';
  }
}

export function privilegeLabel(p: PrivilegeTier): string {
  switch (p) {
    case 'domain-admin': return 'Domain Admin';
    case 'enterprise-admin': return 'Enterprise Admin';
    case 'privileged': return 'Privileged';
    case 'standard': return 'Standard';
  }
}

export function privilegeColor(p: PrivilegeTier): string {
  switch (p) {
    case 'domain-admin': return '#FF3A5C';
    case 'enterprise-admin': return '#FF8C00';
    case 'privileged': return '#FFD024';
    case 'standard': return '#4B5A70';
  }
}

export function daDistanceLabel(d: number): string {
  if (d === 99) return '—';
  if (d === 1) return '1 hop';
  if (d === 2) return '2 hops';
  if (d === 3) return '3 hops';
  return `${d} hops`;
}

export function hashcatCommand(mode: number, target: string, spn?: string): string {
  const hash = spn ? `<hash_for_${target}>` : `<asrep_hash_for_${target}>`;
  return `hashcat -a 0 -m ${mode} ${hash} wordlist.txt --rules-file OneRuleToRuleThemAll.rule`;
}

export function getberoastGetCommand(spn: string): string {
  return `GetUserSPNs.py CORP.ENTERPRISE.LOCAL/user:password -request-user ${spn.split('/')[0]} -outputfile hashes.kerberoast`;
}

export function scoreGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + '...';
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
