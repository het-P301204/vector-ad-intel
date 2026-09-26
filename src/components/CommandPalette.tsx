import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Upload, LayoutDashboard, Crosshair, Key, Lock, Network, FileText, Database, Settings, X, ArrowRight, Users, GitBranch } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  category: string;
}

export function CommandPalette() {
  const { state, dispatch, navigate, loadDemo } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpen = state.commandPaletteOpen;

  const commands: Command[] = [
    { id: 'load-demo', label: 'Load demo dataset', description: 'CORP.ENTERPRISE.LOCAL synthetic environment', icon: <Upload size={14} />, action: () => { loadDemo(); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, category: 'Dataset' },
    { id: 'clear', label: 'Clear dataset', description: 'Remove current dataset', icon: <X size={14} />, action: () => { dispatch({ type: 'CLEAR_DATASET' }); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, category: 'Dataset' },
    { id: 'overview', label: 'Overview', description: 'Executive summary and metrics', icon: <LayoutDashboard size={14} />, action: () => { navigate('overview'); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, shortcut: 'G O', category: 'Navigate' },
    { id: 'attack-queue', label: 'Attack Queue', description: 'Prioritized target queue', icon: <Crosshair size={14} />, action: () => { navigate('attack-queue'); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, shortcut: 'G Q', category: 'Navigate' },
    { id: 'targets', label: 'All Targets', description: 'Full list of roastable accounts', icon: <Users size={14} />, action: () => { navigate('targets'); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, shortcut: 'G T', category: 'Navigate' },
    { id: 'kerberoasting', label: 'Kerberoasting', description: 'SPN-registered accounts', icon: <Key size={14} />, action: () => { navigate('kerberoasting'); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, category: 'Navigate' },
    { id: 'asrep', label: 'AS-REP Roasting', description: 'Pre-auth disabled accounts', icon: <Lock size={14} />, action: () => { navigate('asrep'); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, category: 'Navigate' },
    { id: 'attack-paths', label: 'Attack Paths', description: 'Privilege escalation paths', icon: <GitBranch size={14} />, action: () => { navigate('attack-paths'); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, category: 'Navigate' },
    { id: 'graph', label: 'AD Graph', description: 'Full graph explorer', icon: <Network size={14} />, action: () => { navigate('graph'); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, shortcut: 'G G', category: 'Navigate' },
    { id: 'reports', label: 'Reports', description: 'Generate analysis reports', icon: <FileText size={14} />, action: () => { navigate('reports'); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, shortcut: 'G R', category: 'Navigate' },
    { id: 'dataset', label: 'Dataset Health', description: 'Dataset quality analysis', icon: <Database size={14} />, action: () => { navigate('dataset'); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, category: 'Navigate' },
    { id: 'settings', label: 'Settings', description: 'Application preferences', icon: <Settings size={14} />, action: () => { navigate('settings'); dispatch({ type: 'SET_COMMAND_PALETTE', payload: false }); }, category: 'Navigate' },
  ];

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.description?.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'SET_COMMAND_PALETTE', payload: !isOpen });
      }
      if (e.key === 'Escape' && isOpen) {
        dispatch({ type: 'SET_COMMAND_PALETTE', payload: false });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, dispatch]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => dispatch({ type: 'SET_COMMAND_PALETTE', payload: false })}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className="fixed left-1/2 z-50 w-full max-w-lg overflow-hidden"
            style={{
              top: '18%',
              transform: 'translateX(-50%)',
              background: '#111820',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.08)',
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <Search size={15} style={{ color: 'rgba(139,149,165,0.5)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search VECTOR..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600"
                style={{ color: '#F5F7FA', fontFamily: 'Inter, system-ui, sans-serif' }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ color: 'rgba(139,149,165,0.4)' }}>
                  <X size={14} />
                </button>
              )}
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(139,149,165,0.5)' }}>ESC</kbd>
            </div>

            {/* Results */}
            <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
              {Object.entries(grouped).map(([category, cmds]) => (
                <div key={category}>
                  <div className="px-4 py-2 text-[10px] font-mono tracking-wider" style={{ color: 'rgba(139,149,165,0.4)' }}>
                    {category.toUpperCase()}
                  </div>
                  {cmds.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/5 group"
                    >
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(139,149,165,0.6)' }}>
                        {cmd.icon}
                      </span>
                      <span className="flex-1 text-left">
                        <span className="text-sm font-medium" style={{ color: '#F5F7FA' }}>{cmd.label}</span>
                        {cmd.description && (
                          <span className="block text-[11px] mt-0.5" style={{ color: 'rgba(139,149,165,0.5)' }}>{cmd.description}</span>
                        )}
                      </span>
                      {cmd.shortcut && (
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(139,149,165,0.3)' }}>{cmd.shortcut}</span>
                      )}
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#3B82F6' }} />
                    </button>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm" style={{ color: 'rgba(139,149,165,0.4)' }}>No results for "{query}"</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
