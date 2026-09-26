import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, ChevronDown, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PriorityBadge, AttackBadge } from '../components/ui/PriorityBadge';
import { MiniScoreBar } from '../components/ui/ScoreRing';
import { formatDays, daDistanceLabel, encryptionColor } from '../lib/utils';
import type { Severity, AttackType, EncryptionType } from '../lib/types';

export function AttackQueue() {
  const { filteredTargets, state, dispatch, openTarget } = useApp();
  const { filters } = state;


  const handleSearch = (v: string) => dispatch({ type: 'SET_FILTERS', payload: { search: v } });
  const handleSeverity = (v: Severity | 'all') => dispatch({ type: 'SET_FILTERS', payload: { severity: v } });
  const handleAttack = (v: AttackType | 'all') => dispatch({ type: 'SET_FILTERS', payload: { attackType: v } });
  const handleEnc = (v: EncryptionType | 'all') => dispatch({ type: 'SET_FILTERS', payload: { encryptionType: v } });

  const hasFilters = filters.severity !== 'all' || filters.attackType !== 'all' || filters.encryptionType !== 'all' || filters.search;

  return (
    <div className="h-full flex flex-col" style={{ background: '#07090D' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F5F7FA' }}>Attack Queue</h1>
          <p className="text-sm" style={{ color: '#8B95A5' }}>
            Prioritized offline analysis of identity attack targets · {filteredTargets.length} of {state.targets.length} accounts
          </p>
        </motion.div>

        {/* Filter bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-4 flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(139,149,165,0.4)' }} />
            <input
              value={filters.search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search targets, SPNs..."
              className="w-full pl-8 pr-3 h-9 rounded-xl text-sm bg-transparent outline-none"
              style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F7FA' }}
            />
          </div>

          {/* Severity filter */}
          <FilterChips
            label="Severity"
            value={filters.severity}
            options={[{ value: 'all', label: 'All' }, { value: 'critical', label: 'Critical', color: '#EF4444' }, { value: 'high', label: 'High', color: '#F97316' }, { value: 'medium', label: 'Medium', color: '#EAB308' }, { value: 'low', label: 'Low', color: '#6B7280' }]}
            onChange={v => handleSeverity(v as Severity | 'all')}
          />

          {/* Attack type filter */}
          <FilterChips
            label="Attack"
            value={filters.attackType}
            options={[{ value: 'all', label: 'All' }, { value: 'kerberoast', label: 'Kerberoast', color: '#3B82F6' }, { value: 'asrep', label: 'AS-REP', color: '#7C3AED' }]}
            onChange={v => handleAttack(v as AttackType | 'all')}
          />

          {/* Encryption filter */}
          <FilterChips
            label="Encryption"
            value={filters.encryptionType}
            options={[{ value: 'all', label: 'All' }, { value: 'RC4', label: 'RC4', color: '#EF4444' }, { value: 'AES128', label: 'AES128', color: '#F59E0B' }, { value: 'AES256', label: 'AES256', color: '#10B981' }]}
            onChange={v => handleEnc(v as EncryptionType | 'all')}
          />

          {hasFilters && (
            <button
              onClick={() => dispatch({ type: 'RESET_FILTERS' })}
              className="h-9 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-colors hover:bg-white/5"
              style={{ color: 'rgba(139,149,165,0.5)' }}
            >
              <X size={12} /> Reset
            </button>
          )}

          <button className="h-9 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-colors hover:bg-white/5 ml-auto" style={{ color: 'rgba(139,149,165,0.5)' }}>
            <Download size={12} /> Export CSV
          </button>
        </motion.div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {/* Header row */}
          <div
            className="grid gap-3 px-4 py-2.5 mb-2 rounded-xl text-[10px] font-mono tracking-wider sticky top-0"
            style={{
              gridTemplateColumns: '40px 1fr 140px 120px 80px 80px 80px 90px',
              background: '#0B0F14',
              color: 'rgba(139,149,165,0.5)',
              zIndex: 5,
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span>#</span>
            <span>TARGET</span>
            <span>ATTACK TYPE</span>
            <span>PRIVILEGE</span>
            <span>ENCRYPT</span>
            <span>PWD AGE</span>
            <span>DA PATH</span>
            <span>SCORE</span>
          </div>

          {/* Rows */}
          <div className="space-y-1">
            {filteredTargets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-sm font-medium mb-2" style={{ color: 'rgba(139,149,165,0.4)' }}>No targets match your filters</p>
                <button onClick={() => dispatch({ type: 'RESET_FILTERS' })} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Reset filters</button>
              </div>
            )}
            {filteredTargets.map((target, i) => (
              <motion.button
                key={target.user.objectid}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.5), duration: 0.25 }}
                onClick={() => openTarget(target)}
                className="w-full grid gap-3 px-4 py-3.5 rounded-xl text-left transition-all group items-center"
                style={{
                  gridTemplateColumns: '40px 1fr 140px 120px 80px 80px 80px 90px',
                  background: 'rgba(17,24,32,0.6)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
                whileHover={{
                  backgroundColor: 'rgba(17,24,32,1)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  transition: { duration: 0.1 }
                }}
              >
                {/* Rank */}
                <span className="font-mono text-xs" style={{ color: 'rgba(139,149,165,0.35)' }}>
                  {String(target.rank).padStart(2, '0')}
                </span>

                {/* Target name */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-sm font-semibold truncate" style={{ color: '#F5F7FA' }}>{target.user.name}</span>
                    <PriorityBadge severity={target.severity} size="sm" />
                  </div>
                  <span className="text-[11px] truncate block" style={{ color: 'rgba(139,149,165,0.4)' }}>
                    {target.spn ?? target.user.domain}
                  </span>
                </div>

                {/* Attack type */}
                <div><AttackBadge type={target.attackType} size="sm" /></div>

                {/* Privilege */}
                <span className="text-xs truncate" style={{ color: target.privilegedGroups.length > 0 ? '#F59E0B' : 'rgba(139,149,165,0.5)' }}>
                  {target.privilegedGroups.length > 0 ? target.privilegedGroups[0] : 'Standard'}
                </span>

                {/* Encryption */}
                <span className="font-mono text-[11px] font-semibold" style={{ color: encryptionColor(target.encryptionType) }}>
                  {target.encryptionType}
                </span>

                {/* Password age */}
                <span className="text-[11px]" style={{ color: target.passwordAgeDays > 365 ? '#F59E0B' : 'rgba(139,149,165,0.5)' }}>
                  {formatDays(target.passwordAgeDays)}
                </span>

                {/* DA distance */}
                <span className="font-mono text-[11px]" style={{ color: target.daDistance <= 2 ? '#EF4444' : target.daDistance <= 3 ? '#F97316' : 'rgba(139,149,165,0.5)' }}>
                  {daDistanceLabel(target.daDistance)}
                  {target.daDistanceHeuristic && <span title="Heuristic estimate" className="ml-1 opacity-40">~</span>}
                </span>

                {/* Score */}
                <div className="flex items-center gap-2">
                  <MiniScoreBar score={target.score} severity={target.severity} width={48} />
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: '#3B82F6' }} />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface FilterChip {
  value: string;
  label: string;
  color?: string;
}

function FilterChips({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: FilterChip[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);
  const isFiltered = value !== 'all';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-all"
        style={{
          background: isFiltered ? 'rgba(59,130,246,0.1)' : '#111820',
          border: `1px solid ${isFiltered ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
          color: isFiltered ? '#60A5FA' : '#8B95A5',
        }}
      >
        {current?.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: current.color }} />}
        {label}{isFiltered && `: ${current?.label}`}
        <ChevronDown size={11} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full mt-1 z-30 py-1 rounded-xl overflow-hidden"
              style={{ background: '#151C24', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 140 }}
            >
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5 text-left"
                  style={{ color: value === opt.value ? '#F5F7FA' : '#8B95A5' }}
                >
                  {opt.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: opt.color }} />}
                  {opt.label}
                  {value === opt.value && <span className="ml-auto text-blue-400">✓</span>}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
