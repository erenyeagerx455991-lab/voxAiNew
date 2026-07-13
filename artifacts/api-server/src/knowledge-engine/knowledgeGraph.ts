// ── V9.4 Knowledge Engine — Knowledge Graph ───────────────────────────────────
//
// In-memory graph linking Products -> Features -> Components -> Patterns ->
// BusinessGoals -> Performance -> Security -> Accessibility -> Conversion ->
// ProductionOutcomes. Every node supports arbitrary relationships, not just
// the canonical chain. Distinct from the unrelated `backend.knowledgeGraph`
// (file/dependency graph) — do not confuse the two.
import type { KnowledgeNode, KnowledgeEdge, KnowledgeNodeType } from './types.js';

interface GraphState {
  nodes: Map<string, KnowledgeNode>;
  edges: KnowledgeEdge[];
}

const state: GraphState = { nodes: new Map(), edges: [] };

/** The canonical chain order from the spec, used for default relationship inference. */
export const CANONICAL_CHAIN: KnowledgeNodeType[] = [
  'Product', 'Feature', 'Component', 'Pattern', 'BusinessGoal',
  'Performance', 'Security', 'Accessibility', 'Conversion', 'ProductionOutcome',
];

export function addNode(node: KnowledgeNode): void {
  try {
    state.nodes.set(node.id, node);
  } catch { /* graph mutations must never stop a build */ }
}

export function addEdge(edge: KnowledgeEdge): void {
  try {
    if (!state.nodes.has(edge.from) || !state.nodes.has(edge.to)) return;
    state.edges.push(edge);
  } catch { /* graph mutations must never stop a build */ }
}

export function getNode(id: string): KnowledgeNode | undefined {
  return state.nodes.get(id);
}

export function listNodes(): KnowledgeNode[] {
  return [...state.nodes.values()];
}

export function listEdges(): KnowledgeEdge[] {
  return [...state.edges];
}

export function getRelated(nodeId: string, relation?: string): KnowledgeNode[] {
  const related: KnowledgeNode[] = [];
  for (const edge of state.edges) {
    if (edge.from === nodeId && (!relation || edge.relation === relation)) {
      const n = state.nodes.get(edge.to);
      if (n) related.push(n);
    }
    if (edge.to === nodeId && (!relation || edge.relation === relation)) {
      const n = state.nodes.get(edge.from);
      if (n) related.push(n);
    }
  }
  return related;
}

/** Breadth-first traversal up to `depth` hops from `startId`. */
export function traverse(startId: string, depth = 2): KnowledgeNode[] {
  const visited = new Set<string>([startId]);
  let frontier = [startId];
  const results: KnowledgeNode[] = [];

  for (let d = 0; d < depth && frontier.length > 0; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const n of getRelated(id)) {
        if (!visited.has(n.id)) {
          visited.add(n.id);
          results.push(n);
          next.push(n.id);
        }
      }
    }
    frontier = next;
  }
  return results;
}

/** Links a node into the canonical chain based on its type, connecting it to
 * the nearest existing predecessor/successor stage if present. Best-effort. */
export function linkIntoChain(node: KnowledgeNode): void {
  try {
    addNode(node);
    const idx = CANONICAL_CHAIN.indexOf(node.type);
    if (idx < 0) return;
    // Link forward to the nearest node of the next chain stage that shares the same domain.
    for (let i = idx + 1; i < CANONICAL_CHAIN.length; i++) {
      const candidate = [...state.nodes.values()].find(
        n => n.type === CANONICAL_CHAIN[i] && n.domain === node.domain,
      );
      if (candidate) {
        addEdge({ from: node.id, to: candidate.id, relation: 'chain-next', weight: 0.6 });
        break;
      }
    }
  } catch { /* never stop a build */ }
}

export function getGraphDensity(): number {
  const n = state.nodes.size;
  if (n < 2) return 0;
  const maxEdges = n * (n - 1);
  return maxEdges > 0 ? Math.min(1, state.edges.length / maxEdges) : 0;
}

export function getGraphStats(): { nodeCount: number; edgeCount: number; density: number } {
  return {
    nodeCount: state.nodes.size,
    edgeCount: state.edges.length,
    density:   parseFloat(getGraphDensity().toFixed(4)),
  };
}

export function resetKnowledgeGraph(): void {
  state.nodes.clear();
  state.edges.length = 0;
}
