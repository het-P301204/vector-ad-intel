import { motion } from 'framer-motion';
import { GitBranch, ChevronRight, Monitor, Globe, User, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { severityColor } from '../lib/utils';

interface PathNode {
  id: string;
  label: string;
  type: 'attacker' | 'user' | 'group' | 'computer' | 'domain';
  privileged?: boolean;
  target?: boolean;
}

interface AttackPath {
  targetName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  nodes: PathNode[];
  edges: string[][];
  description: string;
}

function buildPaths(targets: ReturnType<typeof useApp>['state']['targets']): AttackPath[] {
  const critHighTargets = targets.filter(t => t.severity === 'critical' || t.severity === 'high').slice(0, 4);
  return critHighTargets.map(target => {
    const nodes: PathNode[] = [{ id: 'you', label: 'Domain User', type: 'user' }];
    const edges: string[][] = [];

    if (target.spn) {
      nodes.push({ id: target.user.objectid, label: target.user.name, type: 'user', target: true });
      edges.push(['you', target.user.objectid]);
    } else {
      nodes.push({ id: target.user.objectid, label: target.user.name, type: 'user', target: true });
      edges.push(['you', target.user.objectid]);
    }

    if (target.privilegedGroups.length > 0) {
      const groupId = 'grp-priv';
      nodes.push({ id: groupId, label: target.privilegedGroups[0], type: 'group', privileged: true });
      edges.push([target.user.objectid, groupId]);

      if (target.daDistance <= 2) {
        nodes.push({ id: 'da', label: 'Domain Admin', type: 'user', privileged: true });
        edges.push([groupId, 'da']);
      }
    } else if (target.daDistance <= 2) {
      nodes.push({ id: 'da', label: 'Domain Admin', type: 'user', privileged: true });
      edges.push([target.user.objectid, 'da']);
    }

    return {
      targetName: target.user.name,
      severity: target.severity,
      nodes,
      edges,
      description: target.reasonSummary,
    };
  });
}

const nodeIcon = {
  attacker: <User size={12} />,
  user: <User size={12} />,
  group: <Shield size={12} />,
  computer: <Monitor size={12} />,
  domain: <Globe size={12} />,
};

const nodeColor = {
  attacker: '#3B82F6',
  user: '#6B7280',
  group: '#7C3AED',
  computer: '#8B95A5',
  domain: '#10B981',
};

export function AttackPaths() {
  const { state, openTarget } = useApp();
  const paths = buildPaths(state.targets);
  const shortPaths = state.targets.filter(t => t.daDistance <= 2);

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#07090D' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <GitBranch size={15} style={{ color: '#EF4444' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#F5F7FA' }}>Attack Paths</h1>
          </div>
          <p className="text-sm ml-11" style={{ color: '#8B95A5' }}>
            Privilege escalation paths from identified targets · {shortPaths.length} accounts with ≤2-hop DA path
          </p>
        </motion.div>

        {paths.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <GitBranch size={32} className="mb-4" style={{ color: 'rgba(139,149,165,0.2)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'rgba(139,149,165,0.4)' }}>No attack paths available</p>
            <p className="text-xs" style={{ color: 'rgba(139,149,165,0.25)' }}>Load a dataset to analyze privilege escalation paths</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paths.map((path, pi) => (
              <motion.div
                key={pi}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.1 }}
                className="rounded-2xl p-5"
                style={{ background: '#111820', border: `1px solid rgba(255,255,255,0.07)` }}
              >
                {/* Path header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PriorityBadge severity={path.severity} size="sm" />
                    <span className="font-mono font-semibold" style={{ color: '#F5F7FA' }}>{path.targetName}</span>
                  </div>
                  <button
                    onClick={() => {
                      const t = state.targets.find(t => t.user.name === path.targetName);
                      if (t) openTarget(t);
                    }}
                    className="text-xs flex items-center gap-1 transition-colors hover:text-blue-400"
                    style={{ color: 'rgba(139,149,165,0.5)' }}
                  >
                    Details <ChevronRight size={11} />
                  </button>
                </div>

                {/* Path visualization */}
                <div className="flex items-center gap-0 overflow-x-auto pb-2">
                  {path.nodes.map((node, ni) => (
                    <div key={node.id} className="flex items-center">
                      {ni > 0 && (
                        <div className="flex items-center mx-1">
                          <svg width="32" height="16">
                            <defs>
                              <marker id={`arrow-${pi}-${ni}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill={severityColor(path.severity)} opacity={0.5} />
                              </marker>
                            </defs>
                            <motion.line
                              x1="0" y1="8" x2="28" y2="8"
                              stroke={severityColor(path.severity)}
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                              opacity={0.4}
                              markerEnd={`url(#arrow-${pi}-${ni})`}
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 0.4 }}
                              transition={{ delay: pi * 0.1 + ni * 0.15 + 0.3 }}
                            />
                          </svg>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: pi * 0.1 + ni * 0.1 + 0.2, type: 'spring', stiffness: 400, damping: 30 }}
                        className="flex flex-col items-center gap-1.5 flex-shrink-0"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: node.privileged ? `rgba(239,68,68,0.15)` : node.target ? `rgba(59,130,246,0.15)` : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${node.privileged ? 'rgba(239,68,68,0.3)' : node.target ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            color: node.privileged ? '#EF4444' : node.target ? '#3B82F6' : nodeColor[node.type],
                            boxShadow: node.privileged ? '0 0 16px rgba(239,68,68,0.2)' : node.target ? '0 0 16px rgba(59,130,246,0.2)' : 'none',
                          }}
                        >
                          {nodeIcon[node.type]}
                        </div>
                        <span className="text-[10px] font-mono text-center max-w-[80px] truncate" style={{ color: node.privileged ? '#EF4444' : node.target ? '#3B82F6' : 'rgba(139,149,165,0.6)' }}>
                          {node.label}
                        </span>
                      </motion.div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] mt-3 pt-3 border-t" style={{ color: 'rgba(139,149,165,0.5)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  {path.description}
                  {path.severity === 'critical' || path.severity === 'high' ? ' · Heuristic path analysis' : ''}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}
        >
          <h3 className="text-xs font-mono font-semibold tracking-wider mb-2" style={{ color: '#EF4444' }}>IDENTITY HARDENING OPPORTUNITIES</h3>
          <div className="space-y-2">
            {[
              'Review RC4-dependent service accounts and enforce AES encryption',
              'Review accounts without Kerberos pre-authentication',
              'Review privileged service accounts for password rotation',
              'Review unexpected nested privileged group memberships',
              'Consider group Managed Service Accounts (gMSA) for service accounts',
            ].map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="font-mono text-[10px] flex-shrink-0 mt-0.5" style={{ color: 'rgba(239,68,68,0.5)' }}>0{i + 1}</span>
                <span className="text-xs" style={{ color: 'rgba(139,149,165,0.7)' }}>{rec}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
