import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { AppState, AppSettings, FilterState, AnalyzedTarget, ImportProgress, ADUser, ADGroup, ADComputer, ADDomain, EncryptionType, AccountType } from '../lib/types';
import { demoUsers, demoGroups, demoComputers, demoDomain } from '../lib/demo-data';
import { analyzeTargets, computeStats } from '../lib/analysis';

const defaultFilters: FilterState = {
  attackType: 'all',
  severity: 'all',
  encryptionType: 'all',
  minScore: 0,
  maxDaDistance: 99,
  search: '',
};

const defaultSettings: AppSettings = {
  theme: 'dark',
  motion: 'full',
  density: 'comfortable',
  graphNodeLabels: true,
  graphEdgeAnimations: true,
  graphAutoClustering: false,
};

const initialState: AppState = {
  hasDataset: false,
  isImporting: false,
  importProgress: null,
  users: [],
  groups: [],
  computers: [],
  domains: [],
  targets: [],
  stats: null,
  datasetName: '',
  isDemo: false,
  activePage: 'overview',
  selectedTarget: null,
  drawerOpen: false,
  commandPaletteOpen: false,
  sidebarCollapsed: false,
  filters: defaultFilters,
  settings: defaultSettings,
};

type Action =
  | { type: 'LOAD_DEMO' }
  | { type: 'SET_IMPORT_PROGRESS'; payload: ImportProgress | null }
  | { type: 'DATASET_LOADED'; payload: Partial<AppState> }
  | { type: 'SET_PAGE'; payload: string }
  | { type: 'SELECT_TARGET'; payload: AnalyzedTarget | null }
  | { type: 'SET_DRAWER'; payload: boolean }
  | { type: 'SET_COMMAND_PALETTE'; payload: boolean }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'CLEAR_DATASET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_DEMO':
      return { ...state, isImporting: true };

    case 'SET_IMPORT_PROGRESS':
      return { ...state, importProgress: action.payload };

    case 'DATASET_LOADED':
      return { ...state, ...action.payload, isImporting: false, importProgress: null, hasDataset: true };

    case 'SET_PAGE':
      return { ...state, activePage: action.payload, drawerOpen: false };

    case 'SELECT_TARGET':
      return { ...state, selectedTarget: action.payload, drawerOpen: action.payload !== null };

    case 'SET_DRAWER':
      return { ...state, drawerOpen: action.payload, selectedTarget: action.payload ? state.selectedTarget : null };

    case 'SET_COMMAND_PALETTE':
      return { ...state, commandPaletteOpen: action.payload };

    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload };

    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case 'RESET_FILTERS':
      return { ...state, filters: defaultFilters };

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'CLEAR_DATASET':
      return { ...initialState, settings: state.settings };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  loadDemo: () => Promise<void>;
  loadFiles: (files: File[]) => Promise<void>;
  navigate: (page: string) => void;
  openTarget: (target: AnalyzedTarget) => void;
  closeTarget: () => void;
  filteredTargets: AnalyzedTarget[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadDemo = useCallback(async () => {
    dispatch({ type: 'LOAD_DEMO' });

    const stages: ImportProgress[] = [
      { stage: 'parse', stageIndex: 1, totalStages: 5, messages: [], currentMessage: 'Parsing users.json...' },
      { stage: 'parse', stageIndex: 1, totalStages: 5, messages: ['✓ users.json parsed — 154 objects'], currentMessage: 'Parsing groups.json...' },
      { stage: 'parse', stageIndex: 1, totalStages: 5, messages: ['✓ users.json parsed — 154 objects', '✓ groups.json parsed — 25 objects'], currentMessage: 'Parsing computers.json...' },
      { stage: 'graph', stageIndex: 2, totalStages: 5, messages: ['✓ users.json parsed — 154 objects', '✓ groups.json parsed — 25 objects', '✓ computers.json parsed — 74 objects'], currentMessage: 'Building identity graph...' },
      { stage: 'identify', stageIndex: 3, totalStages: 5, messages: ['✓ users.json parsed — 154 objects', '✓ groups.json parsed — 25 objects', '✓ computers.json parsed — 74 objects', '✓ Domain relationships mapped'], currentMessage: 'Identifying attack targets...' },
      { stage: 'score', stageIndex: 4, totalStages: 5, messages: ['✓ users.json parsed — 154 objects', '✓ groups.json parsed — 25 objects', '✓ computers.json parsed — 74 objects', '✓ Domain relationships mapped', '✓ 23 roastable accounts identified'], currentMessage: 'Scoring and ranking targets...' },
      { stage: 'prioritize', stageIndex: 5, totalStages: 5, messages: ['✓ users.json parsed — 154 objects', '✓ groups.json parsed — 25 objects', '✓ computers.json parsed — 74 objects', '✓ Domain relationships mapped', '✓ 23 roastable accounts identified', '✓ Privilege graph analyzed'], currentMessage: 'Generating priority queue...' },
    ];

    for (const stage of stages) {
      await new Promise(r => setTimeout(r, 400));
      dispatch({ type: 'SET_IMPORT_PROGRESS', payload: stage });
    }

    await new Promise(r => setTimeout(r, 500));

    const targets = analyzeTargets(demoUsers, demoGroups);
    const stats = computeStats(demoUsers, demoGroups, demoComputers, demoDomain, targets, 'CORP.ENTERPRISE.LOCAL', true);

    dispatch({
      type: 'DATASET_LOADED',
      payload: {
        users: demoUsers,
        groups: demoGroups,
        computers: demoComputers,
        domains: demoDomain,
        targets,
        stats,
        datasetName: 'CORP.ENTERPRISE.LOCAL',
        isDemo: true,
        activePage: 'overview',
      },
    });
  }, []);

  // Normalize BloodHound export (v4/v5 Properties-wrapped OR direct interface)
  const parseUsers = (raw: unknown[]): ADUser[] => raw.map((item: any) => {
    if ('hasspn' in item) return item as ADUser;
    const p = item.Properties ?? {};
    return {
      objectid: item.ObjectIdentifier ?? '',
      name: p.name ?? '',
      domain: p.domain ?? '',
      distinguishedname: p.distinguishedname ?? '',
      samaccountname: p.samaccountname ?? (p.name ?? '').split('@')[0],
      enabled: p.enabled ?? true,
      admincount: p.admincount ?? false,
      hasspn: p.hasspn ?? false,
      dontreqpreauth: p.dontreqpreauth ?? false,
      pwdlastset: p.pwdlastset ?? 0,
      lastlogon: p.lastlogon ?? 0,
      description: p.description,
      spns: (item.SPNTargets ?? []).map((s: any) => s.ComputerSID ?? ''),
      encryptiontype: p.encryptiontype as EncryptionType | undefined,
      memberof: (item.MemberOf ?? []).map((m: any) => m.ObjectIdentifier ?? m),
      highvaluetarget: p.highvalue ?? p.highvaluetarget ?? false,
      accounttype: (p.accounttype as AccountType | undefined) ?? 'user',
    };
  });

  const parseGroups = (raw: unknown[]): ADGroup[] => raw.map((item: any) => {
    if ('members' in item) return item as ADGroup;
    const p = item.Properties ?? {};
    return {
      objectid: item.ObjectIdentifier ?? '',
      name: p.name ?? '',
      domain: p.domain ?? '',
      admincount: p.admincount ?? false,
      highvaluetarget: p.highvalue ?? p.highvaluetarget ?? false,
      members: (item.Members ?? []).map((m: any) => m.ObjectIdentifier ?? m),
      memberof: (item.MemberOf ?? []).map((m: any) => m.ObjectIdentifier ?? m),
      description: p.description,
    };
  });

  const parseComputers = (raw: unknown[]): ADComputer[] => raw.map((item: any) => {
    if ('lastlogon' in item && !('Properties' in item)) return item as ADComputer;
    const p = item.Properties ?? {};
    return {
      objectid: item.ObjectIdentifier ?? '',
      name: p.name ?? '',
      domain: p.domain ?? '',
      enabled: p.enabled ?? true,
      operatingsystem: p.operatingsystem,
      lastlogon: p.lastlogon ?? 0,
      admincount: p.admincount ?? false,
      highvaluetarget: p.highvalue ?? false,
    };
  });

  const parseDomains = (raw: unknown[]): ADDomain[] => raw.map((item: any) => {
    if ('distinguishedname' in item && !('Properties' in item)) return item as ADDomain;
    const p = item.Properties ?? {};
    return {
      objectid: item.ObjectIdentifier ?? '',
      name: p.name ?? '',
      distinguishedname: p.distinguishedname ?? '',
      functionallevel: p.functionallevel,
    };
  });

  const loadFiles = useCallback(async (files: File[]) => {
    dispatch({ type: 'LOAD_DEMO' });

    let users: ADUser[] = [];
    let groups: ADGroup[] = [];
    let computers: ADComputer[] = [];
    let domains: ADDomain[] = [];
    let datasetName = 'IMPORTED DATASET';
    const messages: string[] = [];

    dispatch({ type: 'SET_IMPORT_PROGRESS', payload: { stage: 'parse', stageIndex: 1, totalStages: 5, messages: [], currentMessage: 'Reading files...' } });
    await new Promise(r => setTimeout(r, 200));

    for (const file of files) {
      const name = file.name.toLowerCase();
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : (parsed.data ?? parsed.users ?? parsed.groups ?? parsed.computers ?? parsed.domains ?? []);

      if (name.includes('user')) {
        users = parseUsers(arr);
        if (users[0]?.domain) datasetName = users[0].domain.toUpperCase();
        messages.push(`✓ ${file.name} — ${users.length} objects`);
      } else if (name.includes('group')) {
        groups = parseGroups(arr);
        messages.push(`✓ ${file.name} — ${groups.length} objects`);
      } else if (name.includes('computer')) {
        computers = parseComputers(arr);
        messages.push(`✓ ${file.name} — ${computers.length} objects`);
      } else if (name.includes('domain')) {
        domains = parseDomains(arr);
      }
      dispatch({ type: 'SET_IMPORT_PROGRESS', payload: { stage: 'parse', stageIndex: 1, totalStages: 5, messages: [...messages], currentMessage: 'Parsing next file...' } });
      await new Promise(r => setTimeout(r, 250));
    }

    await new Promise(r => setTimeout(r, 300));
    dispatch({ type: 'SET_IMPORT_PROGRESS', payload: { stage: 'graph', stageIndex: 2, totalStages: 5, messages: [...messages], currentMessage: 'Building identity graph...' } });
    await new Promise(r => setTimeout(r, 400));
    dispatch({ type: 'SET_IMPORT_PROGRESS', payload: { stage: 'identify', stageIndex: 3, totalStages: 5, messages: [...messages, '✓ Domain relationships mapped'], currentMessage: 'Identifying attack targets...' } });
    await new Promise(r => setTimeout(r, 350));
    dispatch({ type: 'SET_IMPORT_PROGRESS', payload: { stage: 'score', stageIndex: 4, totalStages: 5, messages: [...messages, '✓ Domain relationships mapped'], currentMessage: 'Scoring and ranking targets...' } });
    await new Promise(r => setTimeout(r, 350));
    dispatch({ type: 'SET_IMPORT_PROGRESS', payload: { stage: 'prioritize', stageIndex: 5, totalStages: 5, messages: [...messages, '✓ Domain relationships mapped'], currentMessage: 'Generating priority queue...' } });
    await new Promise(r => setTimeout(r, 400));

    const targets = analyzeTargets(users, groups);
    const stats = computeStats(users, groups, computers, domains, targets, datasetName, false);

    dispatch({
      type: 'DATASET_LOADED',
      payload: { users, groups, computers, domains, targets, stats, datasetName, isDemo: false, activePage: 'overview' },
    });
  }, []);

  const navigate = useCallback((page: string) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  }, []);

  const openTarget = useCallback((target: AnalyzedTarget) => {
    dispatch({ type: 'SELECT_TARGET', payload: target });
  }, []);

  const closeTarget = useCallback(() => {
    dispatch({ type: 'SET_DRAWER', payload: false });
  }, []);

  const filteredTargets = React.useMemo(() => {
    const { filters, targets } = state;
    return targets.filter(t => {
      if (filters.attackType !== 'all' && t.attackType !== filters.attackType && !(filters.attackType === 'kerberoast' && t.attackType === 'both') && !(filters.attackType === 'asrep' && t.attackType === 'both')) return false;
      if (filters.severity !== 'all' && t.severity !== filters.severity) return false;
      if (filters.encryptionType !== 'all' && t.encryptionType !== filters.encryptionType) return false;
      if (t.score < filters.minScore) return false;
      if (t.daDistance > filters.maxDaDistance) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!t.user.name.toLowerCase().includes(q) &&
            !t.user.samaccountname.toLowerCase().includes(q) &&
            !(t.spn?.toLowerCase().includes(q)) &&
            !t.user.domain.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [state.targets, state.filters]);

  return (
    <AppContext.Provider value={{ state, dispatch, loadDemo, loadFiles, navigate, openTarget, closeTarget, filteredTargets }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
