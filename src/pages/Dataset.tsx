import { motion } from 'framer-motion';
import { Database, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Dataset() {
  const { state } = useApp();
  const { stats, users, groups, computers, domains, targets } = state;
  if (!stats) return null;

  const health = [
    { label: 'Users loaded', value: users.length, ok: users.length > 0 },
    { label: 'Groups loaded', value: groups.length, ok: groups.length > 0 },
    { label: 'Computers loaded', value: computers.length, ok: computers.length > 0 },
    { label: 'Domains loaded', value: domains.length, ok: domains.length > 0 },
    { label: 'Targets analyzed', value: targets.length, ok: targets.length > 0 },
    { label: 'Relationships mapped', value: targets.reduce((a, t) => a + t.user.memberof.length, 0), ok: true },
    { label: 'Missing pwdLastSet', value: users.filter(u => u.pwdlastset <= 0).length, ok: users.filter(u => u.pwdlastset <= 0).length === 0 },
    { label: 'Disabled accounts in targets', value: targets.filter(t => !t.user.enabled).length, ok: true },
  ];

  const score = Math.round((health.filter(h => h.ok).length / health.length) * 100);

  const dataPoints = [
    { label: 'Total users', value: users.length },
    { label: 'Total groups', value: groups.length },
    { label: 'Total computers', value: computers.length },
    { label: 'Domains', value: domains.length },
    { label: 'Kerberoastable', value: stats.kerberoastable },
    { label: 'AS-REP roastable', value: stats.asrepRoastable },
    { label: 'RC4 encryption', value: stats.rc4Accounts },
    { label: 'Stale passwords (>1yr)', value: stats.stalePasswords },
    { label: 'Admin count set', value: users.filter(u => u.admincount).length },
    { label: 'High value targets', value: users.filter(u => u.highvaluetarget).length },
    { label: 'Enabled accounts', value: users.filter(u => u.enabled).length },
    { label: 'Service accounts', value: users.filter(u => u.accounttype === 'service').length },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#07090D' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Database size={15} style={{ color: '#3B82F6' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#F5F7FA' }}>Dataset Health</h1>
          </div>
          <p className="text-sm ml-11" style={{ color: '#8B95A5' }}>Quality analysis of the imported dataset · {stats.datasetName}</p>
        </motion.div>

        {/* Health score */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-6"
          style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <motion.circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 214 }}
                  animate={{ strokeDashoffset: 214 - (score / 100) * 214 }}
                  strokeDasharray={214}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono font-bold text-lg" style={{ color: '#F5F7FA' }}>{score}%</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: '#F5F7FA' }}>Dataset Health Score</h3>
              <p className="text-xs mb-2" style={{ color: '#8B95A5' }}>
                {score >= 90 ? 'Dataset is complete and well-structured.' : score >= 70 ? 'Dataset is mostly complete with minor gaps.' : 'Dataset has significant gaps that may affect analysis accuracy.'}
              </p>
              <div className="flex gap-3">
                {[{ label: 'Pass', count: health.filter(h => h.ok).length, color: '#10B981' }, { label: 'Warn', count: health.filter(h => !h.ok && h.value > 0).length, color: '#F59E0B' }, { label: 'Fail', count: health.filter(h => !h.ok && h.value === 0).length, color: '#EF4444' }].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm" style={{ color: s.color }}>{s.count}</span>
                    <span className="text-xs" style={{ color: 'rgba(139,149,165,0.5)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Health checks */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="px-5 py-3 border-b text-[10px] font-mono tracking-wider" style={{ color: 'rgba(139,149,165,0.4)', borderColor: 'rgba(255,255,255,0.07)' }}>
            HEALTH CHECKS
          </div>
          {health.map((h) => (
            <div key={h.label} className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2">
                {h.ok ? <CheckCircle size={13} style={{ color: '#10B981' }} /> : h.value > 0 ? <AlertCircle size={13} style={{ color: '#F59E0B' }} /> : <XCircle size={13} style={{ color: '#EF4444' }} />}
                <span className="text-sm" style={{ color: '#F5F7FA' }}>{h.label}</span>
              </div>
              <span className="font-mono text-sm" style={{ color: h.ok ? '#10B981' : h.value > 0 ? '#F59E0B' : 'rgba(139,149,165,0.4)' }}>
                {h.value.toLocaleString()}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Data statistics */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h3 className="text-[10px] font-mono tracking-wider mb-4" style={{ color: 'rgba(139,149,165,0.4)' }}>RAW STATISTICS</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dataPoints.map(d => (
              <div key={d.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="font-mono font-bold text-lg mb-0.5" style={{ color: '#F5F7FA' }}>{d.value.toLocaleString()}</div>
                <div className="text-xs" style={{ color: 'rgba(139,149,165,0.5)' }}>{d.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
