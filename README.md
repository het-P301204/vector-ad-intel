<p align="center">
  <img src="public/favicon.svg" alt="VECTOR Logo" width="60" height="60" />
</p>

<h1 align="center">VECTOR</h1>
<h3 align="center">Active Directory Attack Intelligence Platform</h3>

<p align="center">
  Transform BloodHound exports into prioritized, actionable attack intelligence.<br/>
  Identify the highest-value Kerberoast and AS-REP targets — then generate the exact commands to exploit them.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&style=flat-square" alt="Vite" />
  <img src="https://img.shields.io/badge/Framer_Motion-11-0055FF?logo=framer&logoColor=white&style=flat-square" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/Fully-Offline-00E4A3?style=flat-square" alt="Fully Offline" />
</p>

---

## Overview

**VECTOR** is a premium security workstation UI for Active Directory penetration testers and red teamers. It ingests BloodHound/SharpHound JSON exports and uses a multi-factor scoring engine to rank every Kerberoastable and AS-REP roastable account by **real attack value** — not just whether a flag is set.

> **Fully offline.** No telemetry, no external requests, no cloud. Your AD data never leaves your machine.

---

## Features

### Intelligence Engine
- **Multi-factor scoring** (0–100) — combines privilege tier, DA path length, encryption type, password age, SPN count, and AdminCount
- **DA distance heuristics** — calculates how many privilege escalation hops separate each account from Domain Admin
- **Severity classification** — CRITICAL / HIGH / MEDIUM / LOW with automatic escalation rules
- **Reason summaries** — human-readable explanation of exactly why a target scored the way it did

### Attack Surface
- **Kerberoasting analysis** — SPN enumeration, RC4 vs AES encryption detection, offline hash cracking priority
- **AS-REP Roasting** — pre-authentication disabled account detection with hashcat mode 18200 commands
- **Dual-vector targeting** — accounts vulnerable to both attack types automatically flagged
- **Attack Paths** — visual SVG representation of privilege escalation chains

### Command Center *(new)*
- **Per-target command generation** — Impacket, Rubeus, PowerView, CrackMapExec, and Hashcat commands generated for every target
- **One-click copy** — copy any individual command or all commands for a target at once
- **Post-exploitation commands** — DCSync, lateral movement, and BloodHound re-enumeration after credential recovery
- **Tool annotations** — shows which tool to use for each command with contextual notes

### Visualization
- **AD Graph** — canvas-based force-directed graph showing users, groups, computers, and domain with live physics simulation
- **Priority heat strip** — visual distribution of all targets by severity with interactive markers
- **Charts** — attack type distribution, encryption breakdown, password age histogram

### Workflow
- **Import** — drag-and-drop or file-picker for BloodHound `users.json`, `groups.json`, `computers.json`, `domains.json`
- **Demo mode** — ships with a fully synthetic `CORP.ENTERPRISE.LOCAL` dataset (154 users, 25 groups, 74 computers, 23 roastable targets)
- **Reports builder** — configurable HTML/text report with live preview and CSV/JSON export
- **Command Palette** — `⌘K` or `/` to instantly navigate or search any target

### UX
- **Keyboard shortcuts** — `G+O` Overview, `G+Q` Attack Queue, `G+T` Targets, `G+G` Graph, `G+R` Reports
- **Spring animations** — Framer Motion throughout with `AnimatePresence` page transitions
- **Collapsible sidebar** — 224px → 56px icon-only mode with animated active indicator
- **Score ring** — animated SVG ring with count-up effect in target drawer

---

## Screenshots

> *Load the demo dataset to explore without any BloodHound data.*

### Landing Page
Clean particle-node animation with drag-and-drop import zone.

### Overview Dashboard
Six animated metric cards, priority heat strip, attack queue, and three recharts panels (donut, bar, histogram).

### Attack Queue
Sortable, filterable table of all 23 roastable accounts with CRITICAL/HIGH severity chips, encryption type, DA path distance, and score bars.

### Target Drawer
Slide-in panel with animated 0–100 score ring, factor-by-factor breakdown (why this score?), Kerberos metadata, privilege groups, and ready-to-run Hashcat command.

### Command Center
Split-pane: target list on left, generated attack commands on right. Organized by category (Kerberoast / AS-REP / Crack / Pivot / Enum) with one-click copy and bulk export.

### AD Graph
Canvas-based force-directed visualization with real physics simulation. Click any node for details. Zoom/pan with mouse. Privileged nodes glow red.

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/het-P301204/vector-ad-intel.git
cd vector-ad-intel

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) and click **Load demo dataset** to explore.

---

## Import Real Data

Export from BloodHound or SharpHound and import the JSON files:

```
SharpHound.exe -c All --zipfilename corp_export
# Unzip and import the individual JSON files into VECTOR
```

VECTOR reads the following BloodHound export format:

| File | Contents |
|------|----------|
| `*_users.json` | User objects with `hasspn`, `dontreqpreauth`, `pwdlastset`, `encryptiontype`, `memberof` |
| `*_groups.json` | Group objects with `memberof`, `admincount`, `highvaluetarget` |
| `*_computers.json` | Computer objects |
| `*_domains.json` | Domain root |

---

## Scoring Engine

Each target receives a composite score (0–100) from:

| Factor | Max Points |
|--------|-----------|
| Kerberoast + AS-REP (both) | 15 |
| Kerberoast only | 10 |
| AS-REP only | 8 |
| Direct Domain Admin membership | 35 |
| Privileged group membership | 28 |
| AdminCount = 1 | 7 |
| 1-hop DA path | 25 |
| 2-hop DA path | 18 |
| 3-hop DA path | 10 |
| DES encryption | 25 |
| RC4-HMAC encryption | 20 |
| AES-128 | 10 |
| AES-256 | 4 |
| Password age 5+ years | 15 |
| Password age 3+ years | 10 |
| Password age 1+ year | 5 |
| Multiple SPNs (3+) | 3 |

**Severity thresholds:**
- `CRITICAL` — score ≥ 85, or score ≥ 70 with DA path ≤ 2 hops
- `HIGH` — score ≥ 65, or score ≥ 50 with privilege / DA path ≤ 3
- `MEDIUM` — score ≥ 40
- `LOW` — everything else

---

## Architecture

```
src/
├── lib/
│   ├── types.ts          # Full TypeScript interfaces
│   ├── analysis.ts       # Scoring engine + DA path analysis
│   ├── demo-data.ts      # Synthetic CORP.ENTERPRISE.LOCAL dataset
│   └── utils.ts          # Color helpers, formatters
├── context/
│   └── AppContext.tsx    # useReducer global state
├── components/
│   ├── layout/           # Sidebar, Topbar
│   ├── ui/               # MetricCard, ScoreRing, PriorityBadge
│   ├── CommandPalette.tsx
│   └── TargetDrawer.tsx
└── pages/
    ├── Landing.tsx        # Particle hero + import zone
    ├── Overview.tsx       # Dashboard
    ├── AttackQueue.tsx    # Filtered target table
    ├── CommandCenter.tsx  # Per-target command generation ← NEW
    ├── Kerberoasting.tsx
    ├── AsRep.tsx
    ├── AttackPaths.tsx    # SVG privilege chain visualization
    ├── ADGraph.tsx        # Canvas force-directed graph
    ├── Reports.tsx        # Report builder + export
    ├── Dataset.tsx        # Dataset health view
    └── Settings.tsx
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Animation | Framer Motion 11 |
| Charts | Recharts |
| Icons | Lucide React |
| State | React `useReducer` + Context |
| Graph | Custom canvas force-directed (no React Flow) |

---

## Security Notes

VECTOR is designed for **authorized penetration testing and security assessments only**.

- All analysis runs **100% client-side** — no data sent to any server
- No telemetry, analytics, or external requests (aside from Google Fonts in `index.html`)
- User-provided JSON is displayed via React (XSS-safe by default)
- The Command Center includes a disclaimer on every session

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open Command Palette |
| `/` | Open Command Palette |
| `Esc` | Close drawer / palette |
| `G → O` | Navigate to Overview |
| `G → Q` | Navigate to Attack Queue |
| `G → T` | Navigate to All Targets |
| `G → G` | Navigate to AD Graph |
| `G → R` | Navigate to Reports |

---

## Demo Dataset

The built-in demo uses a fully synthetic `CORP.ENTERPRISE.LOCAL` environment:

- **154 users** — 17 Kerberoastable, 6 AS-REP roastable, 5 CRITICAL targets
- **25 groups** — Domain Admins, Exchange Admins, DnsAdmins, Backup Operators, etc.
- **74 computers** — workstations, servers, DCs
- Key accounts: `svc-backup` (score 98, RC4, 5yr password, Backup Operators), `svc-legacy` (score 97, AS-REP, 6yr password), `svc-exchange` (score 95, Exchange Admins → DA path)

---

## License

MIT — see [LICENSE](LICENSE) for details.

> **Legal reminder:** Only use this tool against systems you own or have explicit written authorization to test. Unauthorized use of these techniques is illegal in most jurisdictions.

---

<p align="center">
  Built for red teamers who want signal, not noise.<br/>
  <strong>VECTOR</strong> — Active Directory Attack Intelligence
</p>
