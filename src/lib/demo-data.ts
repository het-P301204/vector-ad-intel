import type { ADUser, ADGroup, ADComputer, ADDomain } from './types';

const now = Date.now();
const days = (d: number) => Math.floor((now - d * 86400000) / 1000);

export const demoDomain: ADDomain[] = [
  {
    objectid: 'S-1-5-21-1234567890-DOMAIN',
    name: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    functionallevel: 'Windows Server 2016',
  }
];

export const demoGroups: ADGroup[] = [
  { objectid: 'GRP-001', name: 'Domain Admins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: true, highvaluetarget: true, members: ['USR-001', 'USR-010', 'USR-020'], memberof: ['GRP-002'] },
  { objectid: 'GRP-002', name: 'Administrators', domain: 'CORP.ENTERPRISE.LOCAL', admincount: true, highvaluetarget: true, members: ['USR-001', 'GRP-001'], memberof: [] },
  { objectid: 'GRP-003', name: 'Enterprise Admins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: true, highvaluetarget: true, members: ['USR-001'], memberof: ['GRP-001'] },
  { objectid: 'GRP-004', name: 'Backup Operators', domain: 'CORP.ENTERPRISE.LOCAL', admincount: true, highvaluetarget: true, members: ['USR-002', 'USR-005'], memberof: [], description: 'Members can bypass file/directory permissions' },
  { objectid: 'GRP-005', name: 'Schema Admins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: true, highvaluetarget: true, members: ['USR-001'], memberof: [] },
  { objectid: 'GRP-006', name: 'DnsAdmins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: true, members: ['USR-007'], memberof: [], description: 'DNS server administrators - can load DLLs as SYSTEM' },
  { objectid: 'GRP-007', name: 'Remote Desktop Users', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: ['USR-011', 'USR-012', 'USR-013'], memberof: [] },
  { objectid: 'GRP-008', name: 'IT Operations', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: ['USR-011', 'USR-012'], memberof: ['GRP-004'] },
  { objectid: 'GRP-009', name: 'Server Admins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: true, highvaluetarget: true, members: ['USR-003', 'USR-008'], memberof: ['GRP-002'] },
  { objectid: 'GRP-010', name: 'Database Admins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: ['USR-004', 'USR-009'], memberof: ['GRP-009'] },
  { objectid: 'GRP-011', name: 'DevOps Team', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: ['USR-006', 'USR-015', 'USR-016'], memberof: [] },
  { objectid: 'GRP-012', name: 'Security Team', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: ['USR-013', 'USR-014'], memberof: [] },
  { objectid: 'GRP-013', name: 'Help Desk', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: ['USR-017', 'USR-018', 'USR-019'], memberof: [] },
  { objectid: 'GRP-014', name: 'Finance Users', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: [], memberof: [] },
  { objectid: 'GRP-015', name: 'HR Users', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: [], memberof: [] },
  { objectid: 'GRP-016', name: 'All Users', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: [], memberof: [] },
  { objectid: 'GRP-017', name: 'VPN Users', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: [], memberof: [] },
  { objectid: 'GRP-018', name: 'SharePoint Admins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: ['USR-008'], memberof: ['GRP-009'] },
  { objectid: 'GRP-019', name: 'Exchange Admins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: true, highvaluetarget: true, members: ['USR-005'], memberof: ['GRP-002'] },
  { objectid: 'GRP-020', name: 'VMware Admins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: ['USR-009'], memberof: [] },
  { objectid: 'GRP-021', name: 'SCCM Admins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: true, highvaluetarget: true, members: ['USR-003'], memberof: ['GRP-002'] },
  { objectid: 'GRP-022', name: 'Network Admins', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: [], memberof: [] },
  { objectid: 'GRP-023', name: 'Print Operators', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: [], memberof: [] },
  { objectid: 'GRP-024', name: 'Contractors', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: [], memberof: [] },
  { objectid: 'GRP-025', name: 'Domain Users', domain: 'CORP.ENTERPRISE.LOCAL', admincount: false, highvaluetarget: false, members: [], memberof: [] },
];

export const demoUsers: ADUser[] = [
  // === CRITICAL TARGET: svc-backup — Kerberoastable, Backup Operators (DA 1-hop), RC4, 5+ year old password ===
  {
    objectid: 'USR-002', name: 'svc-backup', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-backup,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-backup', enabled: true, admincount: true,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(1842), lastlogon: days(7),
    description: 'Veeam Backup & Replication service account',
    spns: ['MSSQLSvc/SQLPROD01.corp.enterprise.local:1433', 'MSSQLSvc/SQLPROD01.corp.enterprise.local'],
    encryptiontype: 'RC4',
    memberof: ['GRP-004', 'GRP-016'],
    highvaluetarget: true, accounttype: 'service',
  },

  // === CRITICAL: svc-legacy — AS-REP roastable, privileged, stale password ===
  {
    objectid: 'USR-020', name: 'svc-legacy', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-legacy,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-legacy', enabled: true, admincount: true,
    hasspn: false, dontreqpreauth: true,
    pwdlastset: days(2190), lastlogon: days(90),
    description: 'Legacy application service account - do not modify',
    spns: [], encryptiontype: 'RC4',
    memberof: ['GRP-009', 'GRP-016'],
    highvaluetarget: true, accounttype: 'service',
  },

  // === HIGH: svc-sql-prod — Kerberoastable, Database Admins → Server Admins → Administrators, RC4 ===
  {
    objectid: 'USR-004', name: 'svc-sql-prod', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-sql-prod,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-sql-prod', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(923), lastlogon: days(1),
    description: 'SQL Server production service account',
    spns: ['MSSQLSvc/SQLPROD01.corp.enterprise.local:1433', 'MSSQLSvc/SQLPROD02.corp.enterprise.local:1433'],
    encryptiontype: 'RC4',
    memberof: ['GRP-010', 'GRP-016'],
    highvaluetarget: true, accounttype: 'service',
  },

  // === HIGH: svc-deploy — Kerberoastable, DevOps, nested membership, RC4 ===
  {
    objectid: 'USR-006', name: 'svc-deploy', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-deploy,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-deploy', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(547), lastlogon: days(2),
    description: 'CI/CD deployment service account',
    spns: ['HTTP/deploy.corp.enterprise.local', 'HTTP/deploy01.corp.enterprise.local'],
    encryptiontype: 'RC4',
    memberof: ['GRP-011', 'GRP-016'],
    highvaluetarget: true, accounttype: 'service',
  },

  // === HIGH: svc-exchange — Kerberoastable, Exchange Admins (DA path), RC4, old password ===
  {
    objectid: 'USR-005', name: 'svc-exchange', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-exchange,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-exchange', enabled: true, admincount: true,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(1456), lastlogon: days(0),
    description: 'Microsoft Exchange service account',
    spns: ['exchangeMDB/EXCHPROD01.corp.enterprise.local', 'exchangeRFR/EXCHPROD01.corp.enterprise.local', 'SMTP/EXCHPROD01.corp.enterprise.local'],
    encryptiontype: 'RC4',
    memberof: ['GRP-019', 'GRP-016'],
    highvaluetarget: true, accounttype: 'service',
  },

  // === HIGH: svc-sccm — Kerberoastable, SCCM Admins (DA path), AES128 ===
  {
    objectid: 'USR-003', name: 'svc-sccm', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-sccm,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-sccm', enabled: true, admincount: true,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(365), lastlogon: days(1),
    description: 'SCCM/MECM service account',
    spns: ['WSMAN/SCCMPROD01.corp.enterprise.local', 'HTTP/SCCMPROD01.corp.enterprise.local'],
    encryptiontype: 'AES128',
    memberof: ['GRP-021', 'GRP-016'],
    highvaluetarget: true, accounttype: 'service',
  },

  // === HIGH: dns-admin-svc — Kerberoastable, DnsAdmins (privilege escalation to SYSTEM), RC4 ===
  {
    objectid: 'USR-007', name: 'dns-admin-svc', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=dns-admin-svc,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'dns-admin-svc', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(730), lastlogon: days(14),
    description: 'DNS administration service',
    spns: ['DNS/DC01.corp.enterprise.local', 'DNS/DC02.corp.enterprise.local'],
    encryptiontype: 'RC4',
    memberof: ['GRP-006', 'GRP-016'],
    highvaluetarget: true, accounttype: 'service',
  },

  // === HIGH: svc-rdp — Kerberoastable, Remote Desktop, RC4 ===
  {
    objectid: 'USR-015', name: 'svc-rdp', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-rdp,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-rdp', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(411), lastlogon: days(30),
    description: 'Remote Desktop Gateway service account',
    spns: ['TERMSRV/RDGW01.corp.enterprise.local', 'TERMSRV/RDGW02.corp.enterprise.local'],
    encryptiontype: 'RC4',
    memberof: ['GRP-007', 'GRP-016'],
    highvaluetarget: false, accounttype: 'service',
  },

  // === MEDIUM: svc-sharepoint — Kerberoastable, SharePoint Admins, AES256 ===
  {
    objectid: 'USR-008', name: 'svc-sharepoint', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-sharepoint,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-sharepoint', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(180), lastlogon: days(0),
    description: 'SharePoint farm service account',
    spns: ['HTTP/sharepoint.corp.enterprise.local', 'HTTP/sp.corp.enterprise.local'],
    encryptiontype: 'AES256',
    memberof: ['GRP-018', 'GRP-016'],
    highvaluetarget: false, accounttype: 'service',
  },

  // === MEDIUM: svc-vmware — Kerberoastable, VMware, AES128 ===
  {
    objectid: 'USR-009', name: 'svc-vmware', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-vmware,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-vmware', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(245), lastlogon: days(5),
    description: 'VMware vCenter service account',
    spns: ['HTTP/vcenter.corp.enterprise.local'],
    encryptiontype: 'AES128',
    memberof: ['GRP-020', 'GRP-016'],
    highvaluetarget: false, accounttype: 'service',
  },

  // === MEDIUM: svc-monitoring — Kerberoastable, AES256, recent password ===
  {
    objectid: 'USR-016', name: 'svc-monitoring', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-monitoring,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-monitoring', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(45), lastlogon: days(0),
    description: 'Monitoring and alerting service account',
    spns: ['HTTP/grafana.corp.enterprise.local', 'HTTP/prometheus.corp.enterprise.local'],
    encryptiontype: 'AES256',
    memberof: ['GRP-016'],
    highvaluetarget: false, accounttype: 'service',
  },

  // === LOW: web-service — Kerberoastable, low privilege, AES256 ===
  {
    objectid: 'USR-017', name: 'web-service', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=web-service,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'web-service', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(30), lastlogon: days(0),
    description: 'Web application service account',
    spns: ['HTTP/www.corp.enterprise.local', 'HTTP/app.corp.enterprise.local'],
    encryptiontype: 'AES256',
    memberof: ['GRP-016'],
    highvaluetarget: false, accounttype: 'service',
  },

  // === LOW: print-svc — Kerberoastable, minimal membership, RC4 ===
  {
    objectid: 'USR-018', name: 'print-svc', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=print-svc,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'print-svc', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(60), lastlogon: days(2),
    description: 'Print spooler service account',
    spns: ['WSMAN/PRINTSVR01.corp.enterprise.local'],
    encryptiontype: 'RC4',
    memberof: ['GRP-023', 'GRP-016'],
    highvaluetarget: false, accounttype: 'service',
  },

  // === MEDIUM: svc-api — Kerberoastable, RC4, moderate privilege ===
  {
    objectid: 'USR-019', name: 'svc-api', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-api,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-api', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(200), lastlogon: days(1),
    description: 'API gateway service account',
    spns: ['HTTP/api.corp.enterprise.local', 'HTTP/api-gw.corp.enterprise.local'],
    encryptiontype: 'RC4',
    memberof: ['GRP-011', 'GRP-016'],
    highvaluetarget: false, accounttype: 'service',
  },

  // === LOW: svc-backup-dr — Kerberoastable, AES256, DR site ===
  {
    objectid: 'USR-030', name: 'svc-backup-dr', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-backup-dr,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-backup-dr', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(90), lastlogon: days(7),
    description: 'DR site backup service account',
    spns: ['MSSQLSvc/SQLDR01.corp.enterprise.local:1433'],
    encryptiontype: 'AES256',
    memberof: ['GRP-016'],
    highvaluetarget: false, accounttype: 'service',
  },

  // === MEDIUM: svc-wmi — Kerberoastable, RC4, WMI access ===
  {
    objectid: 'USR-031', name: 'svc-wmi', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=svc-wmi,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'svc-wmi', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(312), lastlogon: days(0),
    description: 'WMI monitoring service account',
    spns: ['WSMAN/MGMT01.corp.enterprise.local', 'WSMAN/MGMT02.corp.enterprise.local'],
    encryptiontype: 'RC4',
    memberof: ['GRP-012', 'GRP-016'],
    highvaluetarget: false, accounttype: 'service',
  },

  // === LOW: iis-app-pool — Kerberoastable, AES128 ===
  {
    objectid: 'USR-032', name: 'iis-app-pool', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=iis-app-pool,OU=Service Accounts,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'iis-app-pool', enabled: true, admincount: false,
    hasspn: true, dontreqpreauth: false,
    pwdlastset: days(120), lastlogon: days(0),
    description: 'IIS Application Pool identity',
    spns: ['HTTP/intranet.corp.enterprise.local'],
    encryptiontype: 'AES128',
    memberof: ['GRP-016'],
    highvaluetarget: false, accounttype: 'service',
  },

  // === AS-REP ROASTABLE ACCOUNTS ===

  // HIGH: john.smith — AS-REP, privileged (IT Ops → Backup Ops → DA path)
  {
    objectid: 'USR-011', name: 'john.smith', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=John Smith,OU=IT,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'john.smith', enabled: true, admincount: false,
    hasspn: false, dontreqpreauth: true,
    pwdlastset: days(456), lastlogon: days(3),
    description: 'IT Operations Engineer',
    spns: [], encryptiontype: 'RC4',
    memberof: ['GRP-007', 'GRP-008', 'GRP-016'],
    highvaluetarget: true, accounttype: 'user',
  },

  // HIGH: alex.jones — AS-REP, Server Admins membership
  {
    objectid: 'USR-012', name: 'alex.jones', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=Alex Jones,OU=IT,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'alex.jones', enabled: true, admincount: false,
    hasspn: false, dontreqpreauth: true,
    pwdlastset: days(289), lastlogon: days(1),
    description: 'System Administrator',
    spns: [], encryptiontype: 'RC4',
    memberof: ['GRP-008', 'GRP-016'],
    highvaluetarget: false, accounttype: 'user',
  },

  // MEDIUM: sarah.chen — AS-REP, no privilege, moderate risk
  {
    objectid: 'USR-013', name: 'sarah.chen', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=Sarah Chen,OU=Security,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'sarah.chen', enabled: true, admincount: false,
    hasspn: false, dontreqpreauth: true,
    pwdlastset: days(167), lastlogon: days(0),
    description: 'Security Analyst',
    spns: [], encryptiontype: 'RC4',
    memberof: ['GRP-012', 'GRP-016'],
    highvaluetarget: false, accounttype: 'user',
  },

  // MEDIUM: mike.thompson — AS-REP, standard user
  {
    objectid: 'USR-014', name: 'mike.thompson', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=Mike Thompson,OU=IT,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'mike.thompson', enabled: true, admincount: false,
    hasspn: false, dontreqpreauth: true,
    pwdlastset: days(78), lastlogon: days(2),
    description: 'IT Support',
    spns: [], encryptiontype: 'RC4',
    memberof: ['GRP-013', 'GRP-016'],
    highvaluetarget: false, accounttype: 'user',
  },

  // LOW: contractor01 — AS-REP, contractor, no privilege
  {
    objectid: 'USR-033', name: 'contractor01', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=Contractor01,OU=Contractors,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'contractor01', enabled: true, admincount: false,
    hasspn: false, dontreqpreauth: true,
    pwdlastset: days(45), lastlogon: days(14),
    description: 'External contractor account',
    spns: [], encryptiontype: 'RC4',
    memberof: ['GRP-024', 'GRP-016'],
    highvaluetarget: false, accounttype: 'user',
  },

  // LOW: temp.support — AS-REP, temp account
  {
    objectid: 'USR-034', name: 'temp.support', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=Temp Support,OU=Temp,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'temp.support', enabled: true, admincount: false,
    hasspn: false, dontreqpreauth: true,
    pwdlastset: days(22), lastlogon: days(7),
    description: 'Temporary support account - review for removal',
    spns: [], encryptiontype: 'RC4',
    memberof: ['GRP-013', 'GRP-016'],
    highvaluetarget: false, accounttype: 'user',
  },

  // PRIVILEGED NON-ROASTABLE ACCOUNTS (Domain Admin)
  {
    objectid: 'USR-001', name: 'Administrator', domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: 'CN=Administrator,CN=Users,DC=CORP,DC=ENTERPRISE,DC=LOCAL',
    samaccountname: 'Administrator', enabled: true, admincount: true,
    hasspn: false, dontreqpreauth: false,
    pwdlastset: days(90), lastlogon: days(0),
    spns: [], encryptiontype: 'AES256',
    memberof: ['GRP-001', 'GRP-002', 'GRP-003', 'GRP-005', 'GRP-016'],
    highvaluetarget: true, accounttype: 'user',
  },

  // Regular users (filling out the dataset)
  ...Array.from({ length: 120 }, (_, i) => ({
    objectid: `USR-${100 + i}`,
    name: [
      'james.wilson', 'emily.taylor', 'david.anderson', 'jessica.moore',
      'christopher.jackson', 'ashley.martin', 'daniel.white', 'brittany.harris',
      'matthew.thomas', 'amanda.garcia', 'ryan.martinez', 'stephanie.robinson',
      'nicholas.clark', 'megan.rodriguez', 'tyler.lewis', 'heather.lee',
      'andrew.walker', 'samantha.hall', 'jonathan.allen', 'tiffany.young',
      'kevin.hernandez', 'courtney.king', 'brandon.wright', 'lindsey.scott',
      'justin.green', 'kimberly.adams', 'eric.baker', 'michelle.nelson',
      'adam.carter', 'crystal.mitchell', 'zachary.perez', 'amber.roberts',
      'patrick.turner', 'lacey.phillips', 'nathan.campbell', 'vanessa.parker',
      'timothy.evans', 'holly.edwards', 'jason.collins', 'diana.stewart',
      'kyle.sanchez', 'shannon.morris', 'aaron.rogers', 'tracey.reed',
      'marcus.cook', 'lauren.morgan', 'dustin.bell', 'brittney.murphy',
      'cody.bailey', 'kaylee.rivera', 'derek.cooper', 'tara.richardson',
      'travis.cox', 'misty.howard', 'shawn.ward', 'wendy.torres',
      'scott.peterson', 'tonya.gray', 'lance.ramirez', 'tammy.james',
      'mario.watson', 'april.brooks', 'omar.kelly', 'dawn.sanders',
      'victor.price', 'raven.bennett', 'henry.wood', 'latasha.barnes',
      'harold.ross', 'gina.henderson', 'keith.coleman', 'desiree.jenkins',
      'phillip.perry', 'candice.powell', 'carl.long', 'felicia.patterson',
      'jerry.hughes', 'monique.flores', 'walter.washington', 'ebony.butler',
      'arthur.simmons', 'precious.foster', 'frank.gonzales', 'jasmine.Bryant',
      'raymond.alexander', 'tasha.Russell', 'gregory.Griffin', 'tanisha.Diaz',
      'samuel.Hayes', 'yolanda.Myers', 'willie.Ford', 'keisha.Hamilton',
      'ralph.Graham', 'tanya.Sullivan', 'lawrence.Wallace', 'latoya.Woods',
      'joe.Cole', 'shayla.West', 'louis.Jordan', 'lydia.Owens',
      'billy.Reynolds', 'erica.Fisher', 'ethan.Ellis', 'vanessa.Harrison',
      'zachary.Gibson', 'alicia.McDonald', 'alex.cruz', 'brianna.Marshall',
      'calvin.Ortiz', 'patricia.Gomez', 'clarence.Murray', 'irene.Freeman',
      'clifton.Wells', 'sylvia.Webb', 'donald.Simpson', 'lorraine.Stevens',
      'dwight.Tucker', 'evelyn.Porter', 'earl.Hunter', 'julia.Hicks',
    ][i % 120] + (i >= 120 ? `.${i}` : ''),
    domain: 'CORP.ENTERPRISE.LOCAL',
    distinguishedname: `CN=User${100 + i},OU=Users,DC=CORP,DC=ENTERPRISE,DC=LOCAL`,
    samaccountname: `user${100 + i}`,
    enabled: Math.random() > 0.05,
    admincount: false,
    hasspn: false,
    dontreqpreauth: false,
    pwdlastset: days(Math.floor(Math.random() * 400)),
    lastlogon: days(Math.floor(Math.random() * 60)),
    spns: [],
    encryptiontype: 'AES256' as const,
    memberof: ['GRP-016', ...(Math.random() > 0.8 ? ['GRP-014'] : []), ...(Math.random() > 0.9 ? ['GRP-015'] : [])],
    highvaluetarget: false,
    accounttype: 'user' as const,
  })),
];

export const demoComputers: ADComputer[] = [
  { objectid: 'CMP-001', name: 'DC01', domain: 'CORP.ENTERPRISE.LOCAL', enabled: true, operatingsystem: 'Windows Server 2019', lastlogon: days(0), admincount: true, highvaluetarget: true },
  { objectid: 'CMP-002', name: 'DC02', domain: 'CORP.ENTERPRISE.LOCAL', enabled: true, operatingsystem: 'Windows Server 2019', lastlogon: days(0), admincount: true, highvaluetarget: true },
  { objectid: 'CMP-003', name: 'SQLPROD01', domain: 'CORP.ENTERPRISE.LOCAL', enabled: true, operatingsystem: 'Windows Server 2022', lastlogon: days(0), admincount: false, highvaluetarget: true },
  { objectid: 'CMP-004', name: 'SQLPROD02', domain: 'CORP.ENTERPRISE.LOCAL', enabled: true, operatingsystem: 'Windows Server 2022', lastlogon: days(0), admincount: false, highvaluetarget: true },
  { objectid: 'CMP-005', name: 'EXCHPROD01', domain: 'CORP.ENTERPRISE.LOCAL', enabled: true, operatingsystem: 'Windows Server 2019', lastlogon: days(0), admincount: true, highvaluetarget: true },
  { objectid: 'CMP-006', name: 'SCCMPROD01', domain: 'CORP.ENTERPRISE.LOCAL', enabled: true, operatingsystem: 'Windows Server 2019', lastlogon: days(1), admincount: true, highvaluetarget: true },
  { objectid: 'CMP-007', name: 'VCENTER01', domain: 'CORP.ENTERPRISE.LOCAL', enabled: true, operatingsystem: 'Windows Server 2019', lastlogon: days(0), admincount: false, highvaluetarget: true },
  { objectid: 'CMP-008', name: 'RDGW01', domain: 'CORP.ENTERPRISE.LOCAL', enabled: true, operatingsystem: 'Windows Server 2022', lastlogon: days(0), admincount: false, highvaluetarget: false },
  { objectid: 'CMP-009', name: 'PRINTSVR01', domain: 'CORP.ENTERPRISE.LOCAL', enabled: true, operatingsystem: 'Windows Server 2016', lastlogon: days(3), admincount: false, highvaluetarget: false },
  ...Array.from({ length: 65 }, (_, i) => ({
    objectid: `CMP-${10 + i}`,
    name: `WKS${String(i + 1).padStart(4, '0')}`,
    domain: 'CORP.ENTERPRISE.LOCAL',
    enabled: Math.random() > 0.08,
    operatingsystem: ['Windows 11 Enterprise', 'Windows 10 Enterprise', 'Windows 10 Pro'][Math.floor(Math.random() * 3)],
    lastlogon: days(Math.floor(Math.random() * 30)),
    admincount: false,
    highvaluetarget: false,
  })),
];
