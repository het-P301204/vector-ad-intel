import { motion } from 'framer-motion';
import { Lock, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { MiniScoreBar } from '../components/ui/ScoreRing';
import { formatDays } from '../lib/utils';

export function AsRep() {
  const { state, openTarget } = useApp();
  const targets = state.targets.filter(t => t.attackType === 'asrep' || t.attackType === 'both');
  const privileged = targets.filter(t => t.privilegedGroups.length > 0).length;
  const critical = targets.filter(t => t.severity === 'critical').length;
  const highValue = targets.filter(t => t.severity === 'critical' || t.severity === 'high').length;

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#07090D' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
              <Lock size={15} style={{ color: '#7C3AED' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#F5F7FA' }}>AS-REP Roasting</h1>
          </div>
          <p className="text-sm ml-11" style={{ color: '#8B95A5' }}>Accounts with Kerberos pre-authentication disabled</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pre-auth Disabled', value: targets.length, color: '#7C3AED' },
            { label: 'Privileged', value: privileged, color: '#F59E0B' },
            { label: 'High Value', value: highValue, color: '#F97316' },
            { label: 'Critical', value: critical, color: '#EF4444' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-4" style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="font-mono font-bold text-3xl mb-1" style={{ color: s.value > 0 ? s.color : 'rgba(139,149,165,0.3)' }}>{s.value}</div>
              <div className="text-sm font-medium" style={{ color: '#8B95A5' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Target list */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="grid gap-3 px-5 py-3 text-[10px] font-mono tracking-wider border-b" style={{
            gridTemplateColumns: '1fr 100px 140px 90px 90px',
            color: 'rgba(139,149,165,0.4)',
            borderColor: 'rgba(255,255,255,0.07)',
          }}>
            <span>ACCOUNT</span>
            <span>PRE-AUTH</span>
            <span>PRIVILEGE</span>
            <span>PWD AGE</span>
            <span>SCORE</span>
          </div>

          {targets.map((target, i) => (
            <motion.button
              key={target.user.objectid}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => openTarget(target)}
              className="w-full grid gap-3 px-5 py-3.5 text-left transition-all group items-center border-b"
              style={{ gridTemplateColumns: '1fr 100px 140px 90px 90px', borderColor: 'rgba(255,255,255,0.04)' }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-sm font-semibold" style={{ color: '#F5F7FA' }}>{target.user.name}</span>
                  <PriorityBadge severity={target.severity} size="sm" />
                </div>
                <span className="text-[11px] font-mono" style={{ color: 'rgba(139,149,165,0.35)' }}>{target.user.domain}</span>
              </div>
              <span className="text-xs" style={{ color: '#EF4444' }}>DISABLED</span>
              <span className="text-[11px] truncate" style={{ color: target.privilegedGroups.length > 0 ? '#F59E0B' : 'rgba(139,149,165,0.35)' }}>
                {target.privilegedGroups.length > 0 ? target.privilegedGroups[0] : 'Standard'}
              </span>
              <span className="text-[11px]" style={{ color: target.passwordAgeDays > 365 ? '#F59E0B' : 'rgba(139,149,165,0.4)' }}>
                {formatDays(target.passwordAgeDays)}
              </span>
              <div className="flex items-center gap-1">
                <MiniScoreBar score={target.score} severity={target.severity} width={48} />
                <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#7C3AED' }} />
              </div>
            </motion.button>
          ))}

          {targets.length === 0 && (
            <div className="py-16 text-center">
              <Lock size={24} className="mx-auto mb-3" style={{ color: 'rgba(139,149,165,0.2)' }} />
              <p className="text-sm" style={{ color: 'rgba(139,149,165,0.4)' }}>No AS-REP roastable accounts found</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.12)' }}
        >
          <h3 className="text-xs font-mono font-semibold tracking-wider mb-2" style={{ color: '#7C3AED' }}>ABOUT AS-REP ROASTING</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(139,149,165,0.7)' }}>
            Accounts with "Do not require Kerberos preauthentication" enabled (UF_DONT_REQUIRE_PREAUTH) allow an unauthenticated attacker to request an AS-REP ticket. This ticket is encrypted with the account's password hash and can be cracked offline — no credentials required.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
