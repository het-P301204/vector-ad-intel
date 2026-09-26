import type {
  ADUser, ADGroup, ADComputer, ADDomain, ScoreFactor, AnalyzedTarget,
  EncryptionType, PrivilegeTier, Severity, AttackType, DatasetStats
} from './types';

const PRIVILEGED_GROUPS = [
  'Domain Admins', 'Enterprise Admins', 'Schema Admins',
  'Administrators', 'Account Operators', 'Backup Operators',
  'Print Operators', 'Server Operators', 'DnsAdmins',
  'Exchange Windows Permissions', 'Exchange Organization Administrators',
  'Group Policy Creator Owners',
];

const DA_GROUPS = ['Domain Admins', 'Enterprise Admins', 'Schema Admins', 'Administrators'];

const EXCHANGE_DA_GROUPS = ['Exchange Windows Permissions', 'Exchange Organization Administrators'];

function getPrivilegedGroupMembership(user: ADUser, groups: ADGroup[]): string[] {
  const result: string[] = [];
  const visited = new Set<string>();

  function walk(groupId: string) {
    if (visited.has(groupId)) return;
    visited.add(groupId);
    const group = groups.find(g => g.objectid === groupId);
    if (!group) return;
    if (PRIVILEGED_GROUPS.some(p => group.name.toLowerCase().includes(p.toLowerCase()))) {
      result.push(group.name);
    }
    group.memberof.forEach(walk);
  }

  user.memberof.forEach(walk);
  return [...new Set(result)];
}

function getDADistance(user: ADUser, groups: ADGroup[]): number {
  const memberSet = new Set(user.memberof);

  // Direct DA membership
  for (const g of groups) {
    if (DA_GROUPS.some(da => g.name.toLowerCase() === da.toLowerCase()) && memberSet.has(g.objectid)) {
      return 1;
    }
  }

  // AdminCount and high-value target are strong signals
  if (user.admincount) return 2;

  // Exchange groups often have WriteDACL on the domain
  for (const g of groups) {
    if (EXCHANGE_DA_GROUPS.some(eg => g.name.toLowerCase() === eg.toLowerCase()) && memberSet.has(g.objectid)) {
      return 2;
    }
  }

  // DnsAdmins → can load DLL as SYSTEM on DC
  for (const g of groups) {
    if (g.name.toLowerCase() === 'dnsadmins' && memberSet.has(g.objectid)) {
      return 2;
    }
  }

  // Check nested: if user is in a group that is in a privileged group
  for (const userGroupId of user.memberof) {
    const userGroup = groups.find(g => g.objectid === userGroupId);
    if (!userGroup) continue;
    for (const parentId of userGroup.memberof) {
      const parentGroup = groups.find(g => g.objectid === parentId);
      if (!parentGroup) continue;
      if (PRIVILEGED_GROUPS.some(p => parentGroup.name.toLowerCase().includes(p.toLowerCase()))) {
        return 3;
      }
    }
  }

  return 99;
}

function getPrivilegeTier(user: ADUser, groups: ADGroup[]): PrivilegeTier {
  const memberSet = new Set(user.memberof);
  for (const g of groups) {
    if ((g.name === 'Domain Admins' || g.name === 'Enterprise Admins') && memberSet.has(g.objectid)) {
      return 'domain-admin';
    }
  }
  if (user.admincount) return 'privileged';
  const privGroups = getPrivilegedGroupMembership(user, groups);
  if (privGroups.length > 0) return 'privileged';
  return 'standard';
}

function getEncryptionType(user: ADUser): EncryptionType {
  return user.encryptiontype ?? 'RC4';
}

function getPasswordAgeDays(user: ADUser): number {
  const setAt = user.pwdlastset * 1000;
  return Math.floor((Date.now() - setAt) / 86400000);
}

function scoreTarget(
  user: ADUser,
  _groups: ADGroup[],
  privilegedGroups: string[],
  daDistance: number,
  encType: EncryptionType,
  pwdAge: number,
): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let score = 0;

  // Base attack type score
  if (user.hasspn && user.dontreqpreauth) {
    factors.push({ label: 'Kerberoastable + AS-REP roastable', points: 15, description: 'Account is vulnerable to both attack types' });
    score += 15;
  } else if (user.hasspn) {
    factors.push({ label: 'Kerberoastable (SPN registered)', points: 10, description: 'Service Principal Name enables offline hash cracking via Kerberoasting' });
    score += 10;
  } else if (user.dontreqpreauth) {
    factors.push({ label: 'AS-REP roastable (pre-auth disabled)', points: 8, description: 'Pre-authentication disabled enables offline hash cracking without credentials' });
    score += 8;
  }

  // Privilege tier
  if (privilegedGroups.some(g => DA_GROUPS.some(d => g.toLowerCase().includes(d.toLowerCase())))) {
    factors.push({ label: 'Direct Domain Admin membership', points: 35, description: 'Account is directly in Domain Admins or equivalent group' });
    score += 35;
  } else if (privilegedGroups.length > 0) {
    factors.push({ label: `Privileged group membership (${privilegedGroups[0]})`, points: 28, description: 'Member of a highly privileged group with elevated AD permissions' });
    score += 28;
  }

  if (user.admincount) {
    factors.push({ label: 'AdminCount = 1', points: 7, description: 'SDProp has propagated AdminSDHolder ACL - indicates historical or current privilege' });
    score += 7;
  }

  // DA distance scoring
  if (daDistance === 1) {
    factors.push({ label: 'Direct path to Domain Admin (1 hop)', points: 25, description: 'Compromising this account directly grants Domain Admin through group membership' });
    score += 25;
  } else if (daDistance === 2) {
    factors.push({ label: 'Near Domain Admin path (2 hops)', points: 18, description: 'Account has 2-hop privilege path to Domain Admin control' });
    score += 18;
  } else if (daDistance === 3) {
    factors.push({ label: 'Privilege escalation path (3 hops)', points: 10, description: 'Account has an identified path to Domain Admin escalation' });
    score += 10;
  }

  // Encryption type
  if (encType === 'DES') {
    factors.push({ label: 'DES encryption (legacy)', points: 25, description: 'DES is critically weak and cracks in seconds with modern hardware' });
    score += 25;
  } else if (encType === 'RC4') {
    factors.push({ label: 'RC4-HMAC encryption', points: 20, description: 'RC4 is computationally cheap to crack with GPU - Hashcat mode 13100 runs >100M H/s' });
    score += 20;
  } else if (encType === 'AES128') {
    factors.push({ label: 'AES-128 encryption', points: 10, description: 'AES-128 is stronger than RC4 but still crackable with sufficient resources' });
    score += 10;
  } else if (encType === 'AES256') {
    factors.push({ label: 'AES-256 encryption', points: 4, description: 'AES-256 provides strong encryption but is still theoretically crackable with weak passwords' });
    score += 4;
  }

  // Password age scoring
  if (pwdAge > 1825) { // 5+ years
    factors.push({ label: `Password age ${pwdAge} days (${Math.floor(pwdAge / 365)}+ years)`, points: 15, description: 'Extremely stale password - likely weak or never rotated, default or initial credential' });
    score += 15;
  } else if (pwdAge > 1095) { // 3+ years
    factors.push({ label: `Password age ${pwdAge} days (${Math.floor(pwdAge / 365)}+ years)`, points: 10, description: 'Password has not been rotated in years - significantly increases crack probability' });
    score += 10;
  } else if (pwdAge > 365) { // 1+ year
    factors.push({ label: `Password age ${pwdAge} days`, points: 5, description: 'Password rotation is overdue per standard security policy' });
    score += 5;
  }

  // SPN count bonus
  if (user.spns.length > 2) {
    factors.push({ label: `${user.spns.length} SPNs registered`, points: 3, description: 'Multiple SPNs increase attack surface and indicate widely-used service account' });
    score += 3;
  }

  return { score: Math.min(score, 100), factors };
}

function getSeverity(score: number, daDistance: number, privileged: boolean): Severity {
  if (score >= 85 || (score >= 70 && daDistance <= 2)) return 'critical';
  if (score >= 65 || (score >= 50 && (privileged || daDistance <= 3))) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function getReasonSummary(target: Omit<AnalyzedTarget, 'reasonSummary'>): string {
  const parts: string[] = [];

  if (target.attackType === 'kerberoast') parts.push('Kerberoastable SPN account');
  else if (target.attackType === 'asrep') parts.push('AS-REP roastable (no pre-auth)');
  else parts.push('Dual-vector (Kerberoast + AS-REP)');

  if (target.privilegedGroups.some(g => DA_GROUPS.some(d => g.toLowerCase().includes(d.toLowerCase())))) {
    parts.push('direct Domain Admin path');
  } else if (target.privilegedGroups.length > 0) {
    parts.push(`member of ${target.privilegedGroups[0]}`);
  }

  if (target.encryptionType === 'RC4') parts.push('RC4 encryption (fast crack)');
  if (target.passwordAgeDays > 1000) parts.push(`${Math.floor(target.passwordAgeDays / 365)}-year-old password`);
  if (target.daDistance <= 2) parts.push(`${target.daDistance}-hop DA path`);

  return parts.join(' · ');
}

export function analyzeTargets(users: ADUser[], groups: ADGroup[]): AnalyzedTarget[] {
  const roastableUsers = users.filter(u => u.hasspn || u.dontreqpreauth);

  const targets = roastableUsers.map(user => {
    const privilegedGroups = getPrivilegedGroupMembership(user, groups);
    const daDistance = getDADistance(user, groups);
    const encType = getEncryptionType(user);
    const pwdAge = getPasswordAgeDays(user);
    const { score, factors } = scoreTarget(user, groups, privilegedGroups, daDistance, encType, pwdAge);
    const privilegeTier = getPrivilegeTier(user, groups);

    const attackType: AttackType = user.hasspn && user.dontreqpreauth ? 'both'
      : user.hasspn ? 'kerberoast' : 'asrep';

    const hashcatMode = attackType === 'asrep' ? 18200 : 13100;
    const severity = getSeverity(score, daDistance, privilegedGroups.length > 0);

    const partial: Omit<AnalyzedTarget, 'reasonSummary' | 'rank'> = {
      user,
      attackType,
      severity,
      score,
      scoreFactors: factors,
      privilegeTier,
      encryptionType: encType,
      passwordAgeDays: pwdAge,
      daDistance,
      daDistanceHeuristic: daDistance !== 1,
      privilegedGroups,
      spn: user.spns[0],
      hashcatMode,
    };

    const reasonSummary = getReasonSummary(partial as AnalyzedTarget);
    return { ...partial, reasonSummary, rank: 0 };
  });

  // Sort by score descending
  targets.sort((a, b) => b.score - a.score);
  targets.forEach((t, i) => { t.rank = i + 1; });

  return targets;
}

export function computeStats(
  users: ADUser[],
  groups: ADGroup[],
  computers: ADComputer[],
  domains: ADDomain[],
  targets: AnalyzedTarget[],
  datasetName: string,
  isDemo: boolean,
): DatasetStats {
  return {
    users: users.length,
    groups: groups.length,
    computers: computers.length,
    domains: domains.length,
    kerberoastable: targets.filter(t => t.attackType === 'kerberoast' || t.attackType === 'both').length,
    asrepRoastable: targets.filter(t => t.attackType === 'asrep' || t.attackType === 'both').length,
    privilegedTargets: targets.filter(t => t.privilegeTier !== 'standard').length,
    criticalTargets: targets.filter(t => t.severity === 'critical').length,
    highTargets: targets.filter(t => t.severity === 'high').length,
    mediumTargets: targets.filter(t => t.severity === 'medium').length,
    lowTargets: targets.filter(t => t.severity === 'low').length,
    shortDaPaths: targets.filter(t => t.daDistance <= 2).length,
    rc4Accounts: targets.filter(t => t.encryptionType === 'RC4').length,
    stalePasswords: targets.filter(t => t.passwordAgeDays > 365).length,
    analysisTimestamp: new Date(),
    datasetName,
    isDemo,
  };
}

