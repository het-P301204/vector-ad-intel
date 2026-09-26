import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Terminal, Clock, Shield, Key, User } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PriorityBadge, AttackBadge } from './ui/PriorityBadge';
import { ScoreRing } from './ui/ScoreRing';
import { formatDays, formatTimestamp, severityColor, encryptionColor, daDistanceLabel, privilegeLabel, privilegeColor, hashcatCommand } from '../lib/utils';

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${className}`}
      style={{
        background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
        color: copied ? '#10B981' : 'rgba(139,149,165,0.7)',
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function InfoRow({ label, value, mono = false, color }: { label: string; value: React.ReactNode; mono?: boolean; color?: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <span className="text-xs" style={{ color: 'rgba(139,149,165,0.6)' }}>{label}</span>
      <span className={`text-xs text-right max-w-[55%] ${mono ? 'font-mono' : 'font-medium'}`} style={{ color: color ?? '#F5F7FA' }}>
        {value}
      </span>
    </div>
  );
}

export function TargetDrawer() {
  const { state, closeTarget } = useApp();
  const { selectedTarget: target, drawerOpen } = state;

  const command = target ? hashcatCommand(target.hashcatMode, target.user.name, target.spn) : '';

  return (
    <AnimatePresence>
      {drawerOpen && target && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
            onClick={closeTarget}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="absolute top-0 right-0 bottom-0 z-40 flex flex-col overflow-hidden"
            style={{
              width: 480,
              background: '#10151C',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge severity={target.severity} size="lg" animated />
                  <AttackBadge type={target.attackType} size="md" />
                </div>
                <button onClick={closeTarget} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'rgba(139,149,165,0.5)' }}>
                  <X size={15} />
                </button>
              </div>
              <h2 className="font-mono text-xl font-bold" style={{ color: '#F5F7FA' }}>{target.user.name}</h2>
              <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(139,149,165,0.5)' }}>{target.user.domain}</p>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Score */}
              <div className="flex items-center gap-6 px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <ScoreRing score={target.score} severity={target.severity} size={100} strokeWidth={8} />
                <div className="flex-1">
                  <p className="text-xs mb-2" style={{ color: 'rgba(139,149,165,0.6)' }}>Priority Score</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: severityColor(target.severity) }} />
                      <span className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>{target.severity.charAt(0).toUpperCase() + target.severity.slice(1)} risk</span>
                    </div>
                    <p className="text-xs" style={{ color: 'rgba(139,149,165,0.5)' }}>
                      Rank #{target.rank} of {state.targets.length} targets
                    </p>
                    {target.daDistance <= 3 && (
                      <p className="text-xs font-medium" style={{ color: '#EF4444' }}>
                        ⚡ {daDistanceLabel(target.daDistance)} to Domain Admin
                        {target.daDistanceHeuristic && ' (heuristic)'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Why this target */}
              <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <h3 className="text-xs font-mono font-semibold tracking-wider mb-4" style={{ color: 'rgba(139,149,165,0.6)' }}>WHY VECTOR PRIORITIZED THIS ACCOUNT</h3>
                <div className="space-y-2">
                  {target.scoreFactors.map((factor, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 + 0.1, duration: 0.2 }}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <span className="font-mono text-sm font-bold flex-shrink-0 w-8 text-right" style={{ color: '#3B82F6' }}>
                        +{factor.points}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium mb-0.5" style={{ color: '#F5F7FA' }}>{factor.label}</p>
                        <p className="text-[11px]" style={{ color: 'rgba(139,149,165,0.5)' }}>{factor.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <span className="text-xs font-mono" style={{ color: '#8B95A5' }}>Priority Score</span>
                  <span className="font-mono font-bold" style={{ color: '#3B82F6' }}>{target.score} / 100</span>
                </div>
              </div>

              {/* Identity */}
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <SectionTitle icon={<User size={12} />} label="Identity" />
                <InfoRow label="Username" value={target.user.samaccountname} mono />
                <InfoRow label="Domain" value={target.user.domain} mono />
                <InfoRow label="Account Type" value={target.user.accounttype} />
                <InfoRow label="Enabled" value={target.user.enabled ? 'Yes' : 'No'} color={target.user.enabled ? '#10B981' : '#EF4444'} />
                <InfoRow label="AdminCount" value={target.user.admincount ? '1' : '0'} mono color={target.user.admincount ? '#F59E0B' : undefined} />
                {target.user.description && (
                  <InfoRow label="Description" value={target.user.description} />
                )}
              </div>

              {/* Kerberos */}
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <SectionTitle icon={<Key size={12} />} label="Kerberos" />
                <InfoRow label="Attack Type" value={<AttackBadge type={target.attackType} size="sm" />} />
                <InfoRow label="Encryption" value={target.encryptionType} mono color={encryptionColor(target.encryptionType)} />
                <InfoRow label="Pre-auth Required" value={target.user.dontreqpreauth ? 'No (vulnerable)' : 'Yes'} color={target.user.dontreqpreauth ? '#EF4444' : '#10B981'} />
                {target.spn && <InfoRow label="Primary SPN" value={target.spn} mono />}
                {target.user.spns.length > 1 && (
                  <InfoRow label="All SPNs" value={`${target.user.spns.length} registered`} />
                )}
              </div>

              {/* Password */}
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <SectionTitle icon={<Clock size={12} />} label="Password Metadata" />
                <InfoRow label="Password Set" value={formatTimestamp(target.user.pwdlastset)} mono />
                <InfoRow label="Password Age" value={formatDays(target.passwordAgeDays)} color={target.passwordAgeDays > 365 ? '#F59E0B' : undefined} />
                <InfoRow label="Last Logon" value={target.user.lastlogon > 0 ? formatTimestamp(target.user.lastlogon) : 'Never'} mono />
              </div>

              {/* Privilege */}
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <SectionTitle icon={<Shield size={12} />} label="Privilege" />
                <InfoRow
                  label="Privilege Tier"
                  value={privilegeLabel(target.privilegeTier)}
                  color={privilegeColor(target.privilegeTier)}
                />
                <InfoRow
                  label="DA Distance"
                  value={<>
                    {daDistanceLabel(target.daDistance)}
                    {target.daDistanceHeuristic && <span className="ml-1 text-[10px] opacity-50 font-mono">HEURISTIC</span>}
                  </>}
                  color={target.daDistance <= 2 ? '#EF4444' : target.daDistance <= 3 ? '#F97316' : undefined}
                />
                {target.privilegedGroups.length > 0 && (
                  <div className="py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-xs" style={{ color: 'rgba(139,149,165,0.6)' }}>Privileged Groups</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {target.privilegedGroups.map(g => (
                        <span key={g} className="px-2 py-1 rounded-lg text-[11px] font-medium" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Hashcat command */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal size={13} style={{ color: '#3B82F6' }} />
                  <h3 className="text-xs font-mono font-semibold tracking-wider" style={{ color: '#F5F7FA' }}>
                    HASHCAT · Mode {target.hashcatMode}
                  </h3>
                </div>
                <div className="relative rounded-xl overflow-hidden" style={{ background: '#0B0F14', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-[10px] font-mono" style={{ color: 'rgba(139,149,165,0.4)' }}>
                      {target.attackType === 'asrep' ? 'AS-REP Roast' : 'Kerberoast'} · {target.user.name}
                    </span>
                    <CopyButton text={command} />
                  </div>
                  <div className="p-3 overflow-x-auto">
                    <code className="text-xs font-mono break-all" style={{ color: '#10B981' }}>
                      {command}
                    </code>
                  </div>
                </div>
                <p className="text-[11px] mt-2" style={{ color: 'rgba(139,149,165,0.35)' }}>
                  Replace &lt;hash&gt; with captured hash from GetUserSPNs.py or Rubeus.exe
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <span style={{ color: '#3B82F6' }}>{icon}</span>
      <h3 className="text-[10px] font-mono font-semibold tracking-wider" style={{ color: 'rgba(139,149,165,0.5)' }}>
        {label.toUpperCase()}
      </h3>
    </div>
  );
}
