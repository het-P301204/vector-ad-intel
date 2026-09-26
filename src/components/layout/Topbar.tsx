import { motion } from 'framer-motion';
import { Search, Command, X, Cpu } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Topbar() {
  const { state, dispatch } = useApp();
  const { stats, hasDataset, isDemo, datasetName } = state;

  return (
    <header
      className="flex items-center h-12 px-4 gap-3 flex-shrink-0"
      style={{
        background: 'rgba(8,14,28,0.95)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,194,255,0.07)',
        zIndex: 20,
      }}
    >
      {/* Dataset name / status */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {hasDataset && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{
              background: 'rgba(0,194,255,0.04)',
              border: '1px solid rgba(0,194,255,0.1)',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#00E4A3', boxShadow: '0 0 6px rgba(0,228,163,0.6)' }} />
            <span className="font-mono text-xs font-semibold" style={{ color: '#EEF2FF' }}>
              {datasetName}
            </span>
            {isDemo && (
              <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded-full"
                style={{
                  color: '#FFD024',
                  background: 'rgba(255,208,36,0.1)',
                  border: '1px solid rgba(255,208,36,0.2)',
                }}>
                DEMO
              </span>
            )}
            {stats && (
              <span className="text-[11px] font-mono"
                style={{ color: 'rgba(0,194,255,0.45)' }}>
                {stats.users.toLocaleString()} objects · {stats.analysisTimestamp.toLocaleTimeString()}
              </span>
            )}
          </motion.div>
        )}
        {!hasDataset && (
          <span className="text-xs font-mono" style={{ color: 'rgba(126,143,168,0.35)' }}>
            No dataset loaded
          </span>
        )}
      </div>

      {/* Threat summary chips (when dataset loaded) */}
      {hasDataset && stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:flex items-center gap-1.5"
        >
          {stats.criticalTargets > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
              style={{
                background: 'rgba(255,58,92,0.1)',
                border: '1px solid rgba(255,58,92,0.25)',
                color: '#FF3A5C',
              }}>
              <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
              {stats.criticalTargets} CRITICAL
            </span>
          )}
          {stats.highTargets > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
              style={{
                background: 'rgba(255,140,0,0.08)',
                border: '1px solid rgba(255,140,0,0.2)',
                color: '#FF8C00',
              }}>
              {stats.highTargets} HIGH
            </span>
          )}
          <span className="text-[10px] font-mono" style={{ color: 'rgba(0,194,255,0.3)' }}>
            {stats.rc4Accounts} RC4
          </span>
        </motion.div>
      )}

      {/* Search trigger */}
      <button
        onClick={() => dispatch({ type: 'SET_COMMAND_PALETTE', payload: true })}
        className="flex items-center gap-2 px-3 h-8 rounded-xl transition-all group"
        style={{
          background: 'rgba(0,194,255,0.04)',
          border: '1px solid rgba(0,194,255,0.09)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,194,255,0.2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,194,255,0.09)'; }}
      >
        <Search size={12} style={{ color: 'rgba(0,194,255,0.4)' }} />
        <span className="text-xs hidden md:inline font-mono" style={{ color: 'rgba(126,143,168,0.35)' }}>
          Search targets...
        </span>
        <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono"
          style={{ background: 'rgba(0,194,255,0.06)', color: 'rgba(0,194,255,0.35)' }}>
          <Command size={8} /> K
        </kbd>
      </button>

      {/* Offline indicator */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
        style={{
          background: 'rgba(0,228,163,0.06)',
          border: '1px solid rgba(0,228,163,0.15)',
        }}
        title="Fully offline — no data leaves this machine"
      >
        <Cpu size={10} style={{ color: '#00E4A3' }} />
        <span className="text-[10px] font-mono font-semibold" style={{ color: '#00E4A3' }}>
          OFFLINE
        </span>
      </div>

      {/* Clear dataset */}
      {hasDataset && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => dispatch({ type: 'CLEAR_DATASET' })}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{ color: 'rgba(126,143,168,0.35)', background: 'transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,58,92,0.08)';
            (e.currentTarget as HTMLButtonElement).style.color = '#FF3A5C';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(126,143,168,0.35)';
          }}
          title="Clear dataset"
        >
          <X size={13} />
        </motion.button>
      )}
    </header>
  );
}
