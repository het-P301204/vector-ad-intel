import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { attackTypeLabel } from '../lib/utils';

const SECTIONS = [
  { id: 'executive', label: 'Executive Summary', enabled: true },
  { id: 'technical', label: 'Technical Findings', enabled: true },
  { id: 'queue', label: 'Target Queue', enabled: true },
  { id: 'privilege', label: 'Privilege Analysis', enabled: true },
  { id: 'paths', label: 'Attack Paths', enabled: false },
  { id: 'kerberos', label: 'Kerberos Findings', enabled: true },
  { id: 'recommendations', label: 'Recommendations', enabled: true },
  { id: 'raw', label: 'Raw Dataset Statistics', enabled: false },
];

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(targets: ReturnType<typeof useApp>['state']['targets']) {
  const header = 'Rank,Account,Domain,Attack Type,Severity,Score,Encryption,Password Age (days),DA Distance,Privileged Groups\n';
  const rows = targets.map(t =>
    `${t.rank},"${t.user.name}","${t.user.domain}","${attackTypeLabel(t.attackType)}","${t.severity}",${t.score},"${t.encryptionType}",${t.passwordAgeDays},${t.daDistance},"${t.privilegedGroups.join('; ')}"`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vector-targets.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function Reports() {
  const { state } = useApp();
  const { stats, targets } = state;
  const [sections, setSections] = useState(SECTIONS);
  const [_generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  const toggle = (id: string) => setSections(prev =>
    prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
  );

  const generate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1200));
    setGenerating(false);
    setGenerated(true);
  };

  if (!stats) return null;



  return (
    <div className="h-full flex overflow-hidden" style={{ background: '#07090D' }}>
      {/* Left: Options */}
      <div className="w-72 flex-shrink-0 border-r p-5 overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: '#F5F7FA' }}>Report Builder</h2>
          <p className="text-xs mb-5" style={{ color: '#8B95A5' }}>Select sections to include</p>

          <div className="space-y-1.5 mb-6">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/5"
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: s.enabled ? '#3B82F6' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${s.enabled ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {s.enabled && <Check size={10} style={{ color: 'white' }} />}
                </div>
                <span className="text-sm" style={{ color: s.enabled ? '#F5F7FA' : '#8B95A5' }}>{s.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={generate}
              disabled={generating}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)', color: 'white', opacity: generating ? 0.6 : 1 }}
            >
              {generating ? (
                <><span className="animate-spin">◌</span> Generating...</>
              ) : (
                <><FileText size={13} /> Generate Report</>
              )}
            </motion.button>

            <button
              onClick={() => downloadCSV(targets)}
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8B95A5' }}
            >
              <Download size={13} /> Export CSV
            </button>

            <button
              onClick={() => downloadJSON({ stats, targets: targets.map(t => ({ ...t, user: t.user })) }, 'vector-analysis.json')}
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8B95A5' }}
            >
              <Download size={13} /> Export JSON
            </button>
          </div>
        </motion.div>
      </div>

      {/* Right: Preview */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="max-w-3xl mx-auto rounded-2xl overflow-hidden"
          style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Report header */}
          <div className="px-8 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(124,58,237,0.06))' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)' }}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2L7 12L12 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-mono text-sm font-bold tracking-wider" style={{ color: '#F5F7FA' }}>VECTOR</span>
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F7FA' }}>Active Directory Security Assessment</h1>
            <p className="text-sm" style={{ color: '#8B95A5' }}>
              {stats.datasetName} · {stats.analysisTimestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {stats.isDemo && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>DEMO</span>}
            </p>
          </div>

          <div className="px-8 py-6 space-y-8">
            {/* Executive Summary */}
            <section>
              <h2 className="text-base font-semibold mb-4 pb-2 border-b" style={{ color: '#F5F7FA', borderColor: 'rgba(255,255,255,0.07)' }}>Executive Summary</h2>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Identity Environment', items: [`${stats.users.toLocaleString()} user accounts`, `${stats.groups} groups`, `${stats.computers} computers`, `${stats.domains} domain`] },
                  { label: 'Attack Surface', items: [`${stats.kerberoastable} Kerberoastable`, `${stats.asrepRoastable} AS-REP roastable`, `${stats.privilegedTargets} privileged targets`, `${stats.rc4Accounts} RC4 accounts`] },
                  { label: 'Critical Findings', items: [`${stats.criticalTargets} critical targets`, `${stats.highTargets} high targets`, `${stats.shortDaPaths} short DA paths`, `${stats.stalePasswords} stale passwords`] },
                ].map(col => (
                  <div key={col.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[10px] font-mono tracking-wider mb-2" style={{ color: 'rgba(139,149,165,0.5)' }}>{col.label.toUpperCase()}</p>
                    {col.items.map(item => <p key={item} className="text-xs mb-1" style={{ color: '#8B95A5' }}>{item}</p>)}
                  </div>
                ))}
              </div>
              {stats.shortDaPaths > 0 && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p className="text-xs" style={{ color: 'rgba(239,68,68,0.8)' }}>
                    ⚠ {stats.shortDaPaths} accounts have short privilege paths to Domain Admin and should be prioritized for remediation.
                  </p>
                </div>
              )}
            </section>

            {/* Top Targets */}
            <section>
              <h2 className="text-base font-semibold mb-4 pb-2 border-b" style={{ color: '#F5F7FA', borderColor: 'rgba(255,255,255,0.07)' }}>Priority Attack Queue</h2>
              <div className="space-y-2">
                {targets.slice(0, 8).map((t, i) => (
                  <div key={t.user.objectid} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="font-mono text-xs w-4" style={{ color: 'rgba(139,149,165,0.35)' }}>{i + 1}</span>
                    <PriorityBadge severity={t.severity} size="sm" />
                    <span className="font-mono text-sm font-semibold flex-1" style={{ color: '#F5F7FA' }}>{t.user.name}</span>
                    <span className="text-xs" style={{ color: 'rgba(139,149,165,0.5)' }}>{attackTypeLabel(t.attackType)}</span>
                    <span className="font-mono text-xs" style={{ color: '#3B82F6' }}>Score {t.score}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommendations */}
            <section>
              <h2 className="text-base font-semibold mb-4 pb-2 border-b" style={{ color: '#F5F7FA', borderColor: 'rgba(255,255,255,0.07)' }}>Identity Hardening Recommendations</h2>
              <div className="space-y-3">
                {[
                  { n: '01', title: 'Enforce AES encryption for service accounts', detail: `${stats.rc4Accounts} accounts use RC4 encryption. Disable RC4 cipher support and enforce AES-256 via Group Policy.` },
                  { n: '02', title: 'Enable Kerberos pre-authentication', detail: `${stats.asrepRoastable} accounts have pre-authentication disabled. Enable DONT_REQ_PREAUTH=false for all accounts.` },
                  { n: '03', title: 'Rotate stale service account passwords', detail: `${stats.stalePasswords} accounts have passwords older than 1 year. Implement automated password rotation or gMSA.` },
                  { n: '04', title: 'Audit privileged group memberships', detail: `${stats.privilegedTargets} service accounts are in privileged groups. Review all SPN-registered accounts for unnecessary privilege.` },
                  { n: '05', title: 'Implement group Managed Service Accounts', detail: 'Replace legacy service accounts with gMSA to eliminate manual password management and reduce attack surface.' },
                ].map(r => (
                  <div key={r.n} className="flex gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="font-mono text-sm font-bold flex-shrink-0" style={{ color: 'rgba(59,130,246,0.5)' }}>{r.n}</span>
                    <div>
                      <p className="text-sm font-medium mb-0.5" style={{ color: '#F5F7FA' }}>{r.title}</p>
                      <p className="text-xs" style={{ color: 'rgba(139,149,165,0.6)' }}>{r.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="px-8 py-4 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] font-mono" style={{ color: 'rgba(139,149,165,0.3)' }}>
              Generated by VECTOR · Offline Analysis · {stats.analysisTimestamp.toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
