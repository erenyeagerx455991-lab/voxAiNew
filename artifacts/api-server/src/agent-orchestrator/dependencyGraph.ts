// ── V9.2 Orchestrator — Dependency Graph Builder ─────────────────────────────
//
// Builds a DAG from the static agent registry (optionally restricted to a
// subset of active agents), topologically sorts it into parallel-safe waves,
// and reports graph statistics. Pure, deterministic, no I/O.
import type { AgentName, DependencyGraph, DependencyGraphNode, DependencyGraphStats } from './types.js';
import { AGENT_REGISTRY, ALL_AGENT_NAMES } from './agentRegistry.js';

/** Detect a cycle via DFS. Returns true if a cycle exists among `active`. */
function hasCycle(active: Set<AgentName>): boolean {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<AgentName, number>();
  for (const a of active) color.set(a, WHITE);

  function visit(node: AgentName): boolean {
    color.set(node, GRAY);
    for (const dep of AGENT_REGISTRY[node].dependsOn) {
      if (!active.has(dep)) continue;
      const c = color.get(dep);
      if (c === GRAY) return true;
      if (c === WHITE && visit(dep)) return true;
    }
    color.set(node, BLACK);
    return false;
  }

  for (const a of active) {
    if (color.get(a) === WHITE && visit(a)) return true;
  }
  return false;
}

/**
 * Build the execution dependency graph for a set of active agents
 * (defaults to every registered agent). Agents not in `active` are treated
 * as already-satisfied dependencies (they were skipped upstream).
 */
export function buildDependencyGraph(active: AgentName[] = ALL_AGENT_NAMES): DependencyGraph {
  const activeSet = new Set(active);
  const nodes: DependencyGraphNode[] = active.map(name => ({
    name,
    dependsOn: AGENT_REGISTRY[name].dependsOn.filter(d => activeSet.has(d)),
  }));

  const cyclic = hasCycle(activeSet);

  // Kahn's algorithm — group agents into waves; every agent in a wave has
  // all its dependencies satisfied by a strictly earlier wave.
  const remaining = new Map(nodes.map(n => [n.name, new Set(n.dependsOn)]));
  const waves: AgentName[][] = [];
  let totalEdges = 0;
  for (const n of nodes) totalEdges += n.dependsOn.length;

  const resolved = new Set<AgentName>();
  let guard = 0;
  while (remaining.size > 0 && guard < ALL_AGENT_NAMES.length + 1) {
    guard++;
    const wave: AgentName[] = [];
    for (const [name, deps] of remaining) {
      const satisfied = [...deps].every(d => resolved.has(d));
      if (satisfied) wave.push(name);
    }
    if (wave.length === 0) break; // cycle or unresolved dep — stop to avoid infinite loop
    for (const name of wave) {
      remaining.delete(name);
      resolved.add(name);
    }
    waves.push(wave);
  }

  const stats: DependencyGraphStats = {
    totalNodes: nodes.length,
    totalEdges,
    maxDepth: waves.length,
    parallelGroupCount: waves.filter(w => w.length > 1).length,
    hasCycle: cyclic,
  };

  return { nodes, waves, stats };
}

/** Flatten waves into a single priority-ordered list (used for `agentPriority`). */
export function flattenWaves(waves: AgentName[][]): AgentName[] {
  return waves.flat();
}
