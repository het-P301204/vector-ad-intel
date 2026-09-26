export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AttackType = 'kerberoast' | 'asrep' | 'both';
export type EncryptionType = 'RC4' | 'AES128' | 'AES256' | 'DES' | 'unknown';
export type PrivilegeTier = 'domain-admin' | 'enterprise-admin' | 'privileged' | 'standard';
export type AccountType = 'service' | 'user' | 'computer';

export interface ADUser {
  objectid: string;
  name: string;
  domain: string;
  distinguishedname: string;
  samaccountname: string;
  enabled: boolean;
  admincount: boolean;
  hasspn: boolean;
  dontreqpreauth: boolean;
  pwdlastset: number;
  lastlogon: number;
  description?: string;
  spns: string[];
  encryptiontype?: EncryptionType;
  memberof: string[];
  highvaluetarget: boolean;
  accounttype: AccountType;
}

export interface ADGroup {
  objectid: string;
  name: string;
  domain: string;
  admincount: boolean;
  highvaluetarget: boolean;
  members: string[];
  memberof: string[];
  description?: string;
}

export interface ADComputer {
  objectid: string;
  name: string;
  domain: string;
  enabled: boolean;
  operatingsystem?: string;
  lastlogon: number;
  admincount: boolean;
  highvaluetarget: boolean;
}

export interface ADDomain {
  objectid: string;
  name: string;
  distinguishedname: string;
  functionallevel?: string;
}

export interface ScoreFactor {
  label: string;
  points: number;
  description: string;
}

export interface AnalyzedTarget {
  user: ADUser;
  attackType: AttackType;
  severity: Severity;
  score: number;
  scoreFactors: ScoreFactor[];
  privilegeTier: PrivilegeTier;
  encryptionType: EncryptionType;
  passwordAgeDays: number;
  daDistance: number;
  daDistanceHeuristic: boolean;
  privilegedGroups: string[];
  spn?: string;
  hashcatMode: number;
  rank: number;
  reasonSummary: string;
}

export interface DatasetStats {
  users: number;
  groups: number;
  computers: number;
  domains: number;
  kerberoastable: number;
  asrepRoastable: number;
  privilegedTargets: number;
  criticalTargets: number;
  highTargets: number;
  mediumTargets: number;
  lowTargets: number;
  shortDaPaths: number;
  rc4Accounts: number;
  stalePasswords: number;
  analysisTimestamp: Date;
  datasetName: string;
  isDemo: boolean;
}

export interface AppState {
  hasDataset: boolean;
  isImporting: boolean;
  importProgress: ImportProgress | null;
  users: ADUser[];
  groups: ADGroup[];
  computers: ADComputer[];
  domains: ADDomain[];
  targets: AnalyzedTarget[];
  stats: DatasetStats | null;
  datasetName: string;
  isDemo: boolean;
  activePage: string;
  selectedTarget: AnalyzedTarget | null;
  drawerOpen: boolean;
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  filters: FilterState;
  settings: AppSettings;
}

export interface ImportProgress {
  stage: 'parse' | 'graph' | 'identify' | 'score' | 'prioritize' | 'done';
  stageIndex: number;
  totalStages: number;
  messages: string[];
  currentMessage: string;
}

export interface FilterState {
  attackType: AttackType | 'all';
  severity: Severity | 'all';
  encryptionType: EncryptionType | 'all';
  minScore: number;
  maxDaDistance: number;
  search: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  motion: 'full' | 'reduced';
  density: 'comfortable' | 'compact';
  graphNodeLabels: boolean;
  graphEdgeAnimations: boolean;
  graphAutoClustering: boolean;
}

export interface GraphNode {
  id: string;
  type: 'user' | 'group' | 'computer' | 'domain' | 'service';
  label: string;
  privileged?: boolean;
  target?: boolean;
  domainAdmin?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'memberof' | 'admin' | 'session' | 'trust' | 'escalation';
  label?: string;
}
