import { motion } from 'framer-motion';
import { Crosshair, Users, Key, Lock, AlertTriangle, Shield, TrendingUp, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/ui/MetricCard';
import { PriorityBadge, AttackBadge } from '../components/ui/PriorityBadge';
import { MiniScoreBar } from '../components/ui/ScoreRing';
import { severityColor } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function Overview() {
  const { state, openTarget, navigate } = useApp();
  const { stats, targets } = state;
  if (!stats) return null;

  const top5 = targets.slice(0, 5);
  const criticalTargets = targets.filter(t => t.severity === 'critical');
  const highTargets = targets.filter(t => t.severity === 'high');

  const donutData = [
    { name: 'Kerberoast', value: stats.kerberoastable, color: '#00C2FF' },
    { name: 'AS-REP', value: stats.asrepRoastable, color: '#A78BFA' },
    { name: 'Both', value: targets.filter(t => t.attackType === 'both').length, color: '#FF3A5C' },
  ].filter(d => d.value > 0);

  const encryptionData = [
    { name: 'RC4', value: stats.rc4Accounts, color: '#FF3A5C' },
    { name: 'AES128', value: targets.filter(t => t.encryptionType === 'AES128').length, color: '#FFD024' },
    { name: 'AES256', value: targets.filter(t => t.encryptionType === 'AES256').length, color: '#00E4A3' },
  ].filter(d => d.value > 0);

  const pwdAgeData = [
    { range: '< 90d', count: targets.filter(t => t.passwordAgeDays < 90).length },
    { range: '90-365d', count: targets.filter(t => t.passwordAgeDays >= 90 && t.passwordAgeDays < 365).length },
    { range: '1-3yr', count: targets.filter(t => t.passwordAgeDays >= 365 && t.passwordAgeDays < 1095).length },
    { range: '3-5yr', count: targets.filter(t => t.passwordAgeDays >= 1095 && t.passwordAgeDays < 1825).length },
    { range: '5yr+', count: targets.filter(t => t.passwordAgeDays >= 1825).length },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#060A12' }}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1 gradient-text-cyan">Overview</h1>
              <p className="text-sm" style={{ color: 'rgba(126,143,168,0.7)' }}>
                Enterprise identity attack surface · Analysis complete · {stats.analysisTimestamp.toLocaleString()}
              </p>
            </div>
            {stats.isDemo && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono" style={{ background: 'rgba(255,208,36,0.06)', border: '1px solid rgba(255,208,36,0.18)', color: '#FFD024' }}>
                DEMO DATASET · Synthetic Active Directory Environment
              </div>
            )}
          </div>
        </motion.div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricCard label="Total Accounts" value={stats.users} icon={<Users size={16} />} color="#00C2FF" delay={0} />
          <MetricCard label="Kerberoastable" value={stats.kerberoastable} icon={<Key size={16} />} color="#00C2FF" danger subtitle="SPN-registered" delay={50} />
          <MetricCard label="AS-REP Roastable" value={stats.asrepRoastable} icon={<Lock size={16} />} color="#A78BFA" danger subtitle="Pre-auth disabled" delay={100} />
          <MetricCard label="Privileged Targets" value={stats.privilegedTargets} icon={<Shield size={16} />} color="#FFD024" danger delay={150} />
          <MetricCard label="Short DA Paths" value={stats.shortDaPaths} icon={<TrendingUp size={16} />} color="#FF3A5C" danger subtitle="≤ 2 hops" delay={200} />
          <MetricCard label="Critical Targets" value={stats.criticalTargets} icon={<AlertTriangle size={16} />} color="#FF3A5C" danger delay={250} />
        </div>

        {/* Priority heat strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(160deg, #131C2E 0%, #0F1828 100%)', border: '1px solid rgba(0,194,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#EEF2FF' }}>Target Priority Distribution</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(126,143,168,0.6)' }}>All {targets.length} identified roastable accounts by severity</p>
            </div>
          </div>

          <div className="space-y-3">
            {(['critical', 'high', 'medium', 'low'] as const).map(severity => {
              const severityTargets = targets.filter(t => t.severity === severity);
              if (severityTargets.length === 0) return null;
              const pct = (severityTargets.length / targets.length) * 100;
              const color = severityColor(severity);
              const icons = { critical: '●', high: '▲', medium: '■', low: '○' };
              return (
                <div key={severity} className="flex items-center gap-4">
                  <div className="w-24 flex items-center gap-1.5">
                    <span className="text-[10px]" style={{ color }}>{icons[severity]}</span>
                    <span className="text-xs font-mono font-semibold tracking-wider" style={{ color }}>
                      {severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 relative rounded-full overflow-hidden" style={{ height: 8, background: 'rgba(255,255,255,0.04)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-y-0 left-0 rounded-full flex items-stretch"
                        style={{ background: color, boxShadow: `0 0 8px ${color}40` }}
                      >
                        {/* Individual target markers */}
                        {severityTargets.slice(0, 8).map((t, i) => (
                          <button
                            key={t.user.objectid}
                            onClick={() => openTarget(t)}
                            className="relative flex-1 rounded-full transition-all hover:opacity-80"
                            title={`${t.user.name} — Score ${t.score}`}
                            style={{ borderRight: i < severityTargets.length - 1 ? '1px solid rgba(0,0,0,0.2)' : 'none' }}
                          />
                        ))}
                      </motion.div>
                    </div>
                    <span className="font-mono text-xs w-6 text-right" style={{ color }}>{severityTargets.length}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Main grid: Priority queue + Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Priority queue - 3 cols */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="xl:col-span-3 rounded-2xl p-5"
            style={{ background: 'linear-gradient(160deg, #131C2E 0%, #0F1828 100%)', border: '1px solid rgba(0,194,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#EEF2FF' }}>
                  <Crosshair size={14} style={{ color: '#00C2FF' }} />
                  Priority Attack Queue
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(126,143,168,0.6)' }}>Highest-value targets from identity graph analysis</p>
              </div>
              <button
                onClick={() => navigate('attack-queue')}
                className="text-xs flex items-center gap-1 transition-colors"
                style={{ color: 'rgba(0,194,255,0.4)' }}
              >
                View all <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-2">
              {top5.map((target, i) => (
                <motion.button
                  key={target.user.objectid}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  onClick={() => openTarget(target)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all group text-left"
                  style={{ background: 'rgba(0,194,255,0.02)', border: '1px solid rgba(0,194,255,0.05)' }}
                  whileHover={{ backgroundColor: 'rgba(0,194,255,0.04)', borderColor: 'rgba(0,194,255,0.1)' }}
                >
                  {/* Rank */}
                  <span className="font-mono text-xs w-5 text-center flex-shrink-0" style={{ color: 'rgba(0,194,255,0.3)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold truncate" style={{ color: '#EEF2FF' }}>{target.user.name}</span>
                      <PriorityBadge severity={target.severity} size="sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <AttackBadge type={target.attackType} size="sm" />
                      <span className="text-[11px] truncate" style={{ color: 'rgba(126,143,168,0.5)' }}>{target.reasonSummary}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0">
                    <MiniScoreBar score={target.score} severity={target.severity} width={64} />
                  </div>

                  <ChevronRight size={13} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#00C2FF' }} />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Charts - 2 cols */}
          <div className="xl:col-span-2 space-y-4">
            {/* Attack type distribution */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(160deg, #131C2E 0%, #0F1828 100%)', border: '1px solid rgba(0,194,255,0.06)' }}
            >
              <h3 className="text-xs font-semibold mb-4" style={{ color: '#EEF2FF' }}>Attack Type Distribution</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={90} height={90}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" startAngle={90} endAngle={-270}>
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {donutData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                      <span className="text-[11px]" style={{ color: 'rgba(126,143,168,0.7)' }}>{d.name}</span>
                      <span className="font-mono text-[11px] ml-auto" style={{ color: '#EEF2FF' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Encryption distribution */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(160deg, #131C2E 0%, #0F1828 100%)', border: '1px solid rgba(0,194,255,0.06)' }}
            >
              <h3 className="text-xs font-semibold mb-3" style={{ color: '#EEF2FF' }}>Encryption Types</h3>
              <div className="space-y-2.5">
                {encryptionData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] w-12 flex-shrink-0" style={{ color: d.color }}>{d.name}</span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(0,194,255,0.04)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.value / targets.length) * 100}%` }}
                        transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ background: d.color, boxShadow: `0 0 6px ${d.color}50` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] w-4" style={{ color: 'rgba(126,143,168,0.7)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Password age */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(160deg, #131C2E 0%, #0F1828 100%)', border: '1px solid rgba(0,194,255,0.06)' }}
            >
              <h3 className="text-xs font-semibold mb-3" style={{ color: '#EEF2FF' }}>Password Age Distribution</h3>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={pwdAgeData} barSize={16} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,194,255,0.05)" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: 'rgba(126,143,168,0.5)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(126,143,168,0.5)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#00C2FF">
                    {pwdAgeData.map((_entry, i) => (
                      <Cell key={i} fill={i >= 3 ? '#FF3A5C' : i >= 2 ? '#FFD024' : '#00C2FF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>

        {/* Critical/High alerts */}
        {(criticalTargets.length > 0 || highTargets.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,58,92,0.04)', border: '1px solid rgba(255,58,92,0.15)' }}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} style={{ color: '#FF3A5C', marginTop: 1 }} />
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#F5F7FA' }}>
                    {criticalTargets.length + highTargets.length} high-priority targets require investigation
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(239,68,68,0.7)' }}>
                    {criticalTargets.length > 0 && `${criticalTargets.length} critical: ${criticalTargets.slice(0, 3).map(t => t.user.name).join(', ')}${criticalTargets.length > 3 ? '...' : ''}`}
                    {criticalTargets.length > 0 && highTargets.length > 0 && ' · '}
                    {highTargets.length > 0 && `${highTargets.length} high priority accounts`}
                  </p>
                </div>
                <button onClick={() => navigate('attack-queue')} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                  View queue <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
