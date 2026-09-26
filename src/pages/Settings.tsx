import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface OptionGroupProps {
  label: string;
  description?: string;
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (v: string) => void;
}

function OptionGroup({ label, description, options, value, onChange }: OptionGroupProps) {
  return (
    <div className="py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-0.5" style={{ color: '#F5F7FA' }}>{label}</p>
          {description && <p className="text-xs" style={{ color: 'rgba(139,149,165,0.5)' }}>{description}</p>}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: value === opt.value ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${value === opt.value ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: value === opt.value ? '#60A5FA' : '#8B95A5',
              }}
              title={opt.description}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: '#F5F7FA' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'rgba(139,149,165,0.5)' }}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0"
        style={{ background: value ? '#3B82F6' : 'rgba(255,255,255,0.1)' }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
          style={{ background: 'white', left: value ? '18px' : '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
        />
      </button>
    </div>
  );
}

export function Settings() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const set = (payload: Partial<typeof settings>) => dispatch({ type: 'SET_SETTINGS', payload });

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#07090D' }}>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <SettingsIcon size={18} style={{ color: '#8B95A5' }} />
            <h1 className="text-2xl font-bold" style={{ color: '#F5F7FA' }}>Settings</h1>
          </div>
          <p className="text-sm ml-7" style={{ color: '#8B95A5' }}>Application preferences and configuration</p>
        </motion.div>

        {[
          {
            section: 'Appearance',
            items: (
              <>
                <OptionGroup label="Theme" description="Color scheme for the interface" value={settings.theme}
                  options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }, { value: 'system', label: 'System' }]}
                  onChange={v => set({ theme: v as typeof settings.theme })}
                />
                <OptionGroup label="Motion" description="Animation intensity" value={settings.motion}
                  options={[{ value: 'full', label: 'Full', description: 'All animations enabled' }, { value: 'reduced', label: 'Reduced', description: 'Minimal animations for accessibility' }]}
                  onChange={v => set({ motion: v as typeof settings.motion })}
                />
                <OptionGroup label="Density" description="Information density in tables and lists" value={settings.density}
                  options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]}
                  onChange={v => set({ density: v as typeof settings.density })}
                />
              </>
            )
          },
          {
            section: 'Graph',
            items: (
              <>
                <Toggle label="Node labels" description="Show account names on graph nodes" value={settings.graphNodeLabels} onChange={v => set({ graphNodeLabels: v })} />
                <Toggle label="Edge animations" description="Animate graph edges" value={settings.graphEdgeAnimations} onChange={v => set({ graphEdgeAnimations: v })} />
                <Toggle label="Auto clustering" description="Automatically cluster large node groups" value={settings.graphAutoClustering} onChange={v => set({ graphAutoClustering: v })} />
              </>
            )
          },
        ].map((group, i) => (
          <motion.div
            key={group.section}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.1 }}
            className="rounded-2xl px-5"
            style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <span className="text-[10px] font-mono tracking-wider" style={{ color: 'rgba(139,149,165,0.4)' }}>{group.section.toUpperCase()}</span>
            </div>
            {group.items}
          </motion.div>
        ))}

        {/* Version info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="flex items-center justify-between px-5 py-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div>
            <p className="text-sm font-mono font-semibold" style={{ color: '#F5F7FA' }}>VECTOR</p>
            <p className="text-xs" style={{ color: 'rgba(139,149,165,0.4)' }}>Active Directory Attack Intelligence · v1.0.0</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono" style={{ color: '#10B981' }}>OFFLINE</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
