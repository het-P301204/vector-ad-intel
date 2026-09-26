import { motion } from 'framer-motion';
import { Key, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { MiniScoreBar } from '../components/ui/ScoreRing';
import { formatDays, encryptionColor } from '../lib/utils';

export function Kerberoasting() {
  const { state, openTarget } = useApp();
  const targets = state.targets.filter(t => t.attackType === 'kerberoast' || t.attackType === 'both');
  const rc4Count = targets.filter(t => t.encryptionType === 'RC4').length;
  const privileged = targets.filter(t => t.privilegedGroups.length > 0).length;

  const highValue = targets.filter(t => t.severity === 'critical' || t.severity === 'high').length;

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#07090D' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <Key size={15} style={{ color: '#3B82F6' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#F5F7FA' }}>Kerberoasting</h1>
          </div>
          <p className="text-sm ml-11" style={{ color: '#8B95A5' }}>SPN-registered accounts identified from the imported dataset</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total SPNs', value: targets.length, color: '#3B82F6' },
            { label: 'RC4-backed', value: rc4Count, color: '#EF4444', note: 'Fast crack' },
            { label: 'Privileged', value: privileged, color: '#F59E0B', note: 'Group membership' },
            { label: 'Critical/High', value: highValue, color: '#F97316', note: 'Priority targets' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-4"
              style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="font-mono font-bold text-3xl mb-1" style={{ color: s.value > 0 ? s.color : 'rgba(139,149,165,0.3)' }}>{s.value}</div>
              <div className="text-sm font-medium" style={{ color: '#8B95A5' }}>{s.label}</div>
              {s.note && <div className="text-[11px] mt-0.5" style={{ color: 'rgba(139,149,165,0.4)' }}>{s.note}</div>}
            </motion.div>
          ))}
        </div>

        {/* Target list */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Table header */}
          <div className="grid gap-3 px-5 py-3 text-[10px] font-mono tracking-wider border-b" style={{
            gridTemplateColumns: '1fr 180px 80px 100px 90px 90px',
            color: 'rgba(139,149,165,0.4)',
            borderColor: 'rgba(255,255,255,0.07)',
          }}>
            <span>ACCOUNT</span>
            <span>SPN</span>
            <span>ENCRYPT</span>
            <span>PRIVILEGE</span>
            <span>PWD AGE</span>
            <span>SCORE</span>
          </div>

          {targets.map((target, i) => (
            <motion.button
              key={target.user.objectid}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.04 }}
              onClick={() => openTarget(target)}
              className="w-full grid gap-3 px-5 py-3.5 text-left transition-all group items-center border-b"
              style={{
                gridTemplateColumns: '1fr 180px 80px 100px 90px 90px',
                borderColor: 'rgba(255,255,255,0.04)',
              }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-sm font-semibold" style={{ color: '#F5F7FA' }}>{target.user.name}</span>
                  <PriorityBadge severity={target.severity} size="sm" />
                </div>
                <span className="text-[11px] font-mono" style={{ color: 'rgba(139,149,165,0.35)' }}>{target.user.domain}</span>
              </div>
              <span className="text-[11px] font-mono truncate" style={{ color: 'rgba(139,149,165,0.5)' }} title={target.spn}>
                {target.spn ? target.spn.split('/')[0] : '—'}
              </span>
              <span className="font-mono text-[11px] font-semibold" style={{ color: encryptionColor(target.encryptionType) }}>
                {target.encryptionType}
              </span>
              <span className="text-[11px] truncate" style={{ color: target.privilegedGroups.length > 0 ? '#F59E0B' : 'rgba(139,149,165,0.35)' }}>
                {target.privilegedGroups.length > 0 ? target.privilegedGroups[0] : 'Standard'}
              </span>
              <span className="text-[11px]" style={{ color: target.passwordAgeDays > 365 ? '#F59E0B' : 'rgba(139,149,165,0.4)' }}>
                {formatDays(target.passwordAgeDays)}
              </span>
              <div className="flex items-center gap-1">
                <MiniScoreBar score={target.score} severity={target.severity} width={48} />
                <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#3B82F6' }} />
              </div>
            </motion.button>
          ))}

          {targets.length === 0 && (
            <div className="py-16 text-center">
              <Key size={24} className="mx-auto mb-3" style={{ color: 'rgba(139,149,165,0.2)' }} />
              <p className="text-sm" style={{ color: 'rgba(139,149,165,0.4)' }}>No Kerberoastable accounts found</p>
            </div>
          )}
        </motion.div>

        {/* Info box */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}
        >
          <h3 className="text-xs font-mono font-semibold tracking-wider mb-2" style={{ color: '#3B82F6' }}>ABOUT KERBEROASTING</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(139,149,165,0.7)' }}>
            Any domain user can request Kerberos service tickets for SPN-registered accounts. These tickets are encrypted with the service account's password hash and can be cracked offline. RC4-HMAC tickets crack significantly faster than AES tickets on modern GPU hardware.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
