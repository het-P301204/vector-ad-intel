import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CommandPalette } from './components/CommandPalette';
import { TargetDrawer } from './components/TargetDrawer';
import { Landing } from './pages/Landing';
import { Overview } from './pages/Overview';
import { AttackQueue } from './pages/AttackQueue';
import { Targets } from './pages/Targets';
import { Kerberoasting } from './pages/Kerberoasting';
import { AsRep } from './pages/AsRep';
import { AttackPaths } from './pages/AttackPaths';
import { ADGraph } from './pages/ADGraph';
import { Reports } from './pages/Reports';
import { Dataset } from './pages/Dataset';
import { Settings } from './pages/Settings';
import { CommandCenter } from './pages/CommandCenter';

function PageContent() {
  const { state } = useApp();
  const { activePage } = state;

  const pages: Record<string, React.ReactNode> = {
    overview: <Overview />,
    'attack-queue': <AttackQueue />,
    targets: <Targets />,
    kerberoasting: <Kerberoasting />,
    asrep: <AsRep />,
    'attack-paths': <AttackPaths />,
    graph: <ADGraph />,
    'command-center': <CommandCenter />,
    reports: <Reports />,
    dataset: <Dataset />,
    settings: <Settings />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -4, filter: 'blur(1px)' }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="h-full"
      >
        {pages[activePage] ?? <Overview />}
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  const { state, dispatch } = useApp();

  // Global keyboard shortcuts
  useEffect(() => {
    let gPressed = false;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') return; // handled by palette
      if (e.key === '/') {
        e.preventDefault();
        dispatch({ type: 'SET_COMMAND_PALETTE', payload: true });
        return;
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_DRAWER', payload: false });
        dispatch({ type: 'SET_COMMAND_PALETTE', payload: false });
        return;
      }
      if (e.key === 'g' || e.key === 'G') { gPressed = true; setTimeout(() => { gPressed = false; }, 1000); return; }
      if (gPressed) {
        const map: Record<string, string> = { o: 'overview', q: 'attack-queue', t: 'targets', g: 'graph', r: 'reports' };
        if (map[e.key.toLowerCase()]) {
          e.preventDefault();
          dispatch({ type: 'SET_PAGE', payload: map[e.key.toLowerCase()] });
          gPressed = false;
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dispatch]);

  if (!state.hasDataset) {
    return (
      <div className="w-screen h-screen relative overflow-hidden">
        <Landing />
        <CommandPalette />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden" style={{ background: '#060A12' }}>
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative overflow-hidden">
          <PageContent />
          <TargetDrawer />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
