import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Crosshair, Users, Key, GitBranch,
  Network, FileText, Database, Settings, ChevronRight,
  Lock, Terminal
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  dividerAfter?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} />, shortcut: 'G O' },
  { id: 'attack-queue', label: 'Attack Queue', icon: <Crosshair size={16} />, shortcut: 'G Q', dividerAfter: true },
  { id: 'targets', label: 'All Targets', icon: <Users size={16} />, shortcut: 'G T' },
  { id: 'kerberoasting', label: 'Kerberoasting', icon: <Key size={16} /> },
  { id: 'asrep', label: 'AS-REP Roasting', icon: <Lock size={16} />, dividerAfter: true },
  { id: 'attack-paths', label: 'Attack Paths', icon: <GitBranch size={16} /> },
  { id: 'graph', label: 'AD Graph', icon: <Network size={16} />, shortcut: 'G G' },
  { id: 'command-center', label: 'Command Center', icon: <Terminal size={16} />, badge: 'NEW', dividerAfter: true },
  { id: 'reports', label: 'Reports', icon: <FileText size={16} />, shortcut: 'G R' },
  { id: 'dataset', label: 'Dataset', icon: <Database size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

export function Sidebar() {
  const { state, navigate, dispatch } = useApp();
  const collapsed = state.sidebarCollapsed;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 224 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className="relative flex flex-col flex-shrink-0 h-full overflow-hidden scanline-container"
      style={{
        background: 'linear-gradient(180deg, #0B1120 0%, #080E1C 100%)',
        borderRight: '1px solid rgba(0,194,255,0.08)',
        zIndex: 10,
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center h-14 px-3.5 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(0,194,255,0.08)' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <VectorLogo />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-mono font-bold text-sm tracking-[0.15em] whitespace-nowrap gradient-text-cyan">
                  VECTOR
                </span>
                <span className="text-[9px] font-mono tracking-widest whitespace-nowrap"
                  style={{ color: 'rgba(0,194,255,0.35)', letterSpacing: '0.18em' }}>
                  AD INTELLIGENCE
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => (
          <div key={item.id}>
            <NavButton
              item={item}
              active={state.activePage === item.id}
              collapsed={collapsed}
              onClick={() => navigate(item.id)}
            />
            {item.dividerAfter && (
              <div className="mx-2 my-2" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,194,255,0.08), transparent)' }} />
            )}
          </div>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="relative p-2 border-t" style={{ borderColor: 'rgba(0,194,255,0.08)' }}>
        <button
          onClick={() => dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: !collapsed })}
          className="w-full flex items-center justify-center h-8 rounded-xl transition-all duration-150 group"
          style={{ background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,194,255,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={13} style={{ color: 'rgba(0,194,255,0.25)' }} />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  );
}

function NavButton({ item, active, collapsed, onClick }: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 1 }}
      className="relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-0.5 text-left transition-all duration-150 group"
      style={{
        background: active
          ? 'linear-gradient(135deg, rgba(0,194,255,0.12), rgba(167,139,250,0.06))'
          : 'transparent',
        color: active ? '#EEF2FF' : '#7E8FA8',
      }}
    >
      {/* Active indicator bar */}
      <AnimatePresence>
        {active && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full"
            style={{
              height: 20,
              background: 'linear-gradient(180deg, #00C2FF, #A78BFA)',
              boxShadow: '0 0 10px rgba(0,194,255,0.6)',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          />
        )}
      </AnimatePresence>

      {/* Active glow */}
      {active && (
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at left, rgba(0,194,255,0.05) 0%, transparent 70%)' }} />
      )}

      <span className={`flex-shrink-0 transition-colors ${active ? '' : 'opacity-60 group-hover:opacity-90'}`}
        style={{ color: active ? '#00C2FF' : undefined }}>
        {item.icon}
      </span>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex items-center justify-between flex-1 min-w-0"
          >
            <span className="text-[13px] font-medium whitespace-nowrap truncate transition-colors group-hover:text-slate-300">
              {item.label}
            </span>
            <div className="flex items-center gap-1 ml-1">
              {item.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(167,139,250,0.2))',
                    border: '1px solid rgba(0,194,255,0.3)',
                    color: '#00C2FF',
                  }}>
                  {item.badge}
                </span>
              )}
              {item.shortcut && !active && (
                <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(0,194,255,0.3)' }}>
                  {item.shortcut}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function VectorLogo() {
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 relative"
      style={{
        background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 50%, #8B5CF6 100%)',
        boxShadow: '0 0 16px rgba(0,194,255,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 2L7 12L12 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 6H10" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </svg>
    </div>
  );
}
