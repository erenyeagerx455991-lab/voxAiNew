// ── V9.5 Decision Graph ────────────────────────────────────────────────────────
// In-memory node/edge graph mirroring the canonical chain:
// Goal → Reasoning → Decision → Architecture → Generation → Evaluation → ProductionResult
import type { DecisionGraphEdge, DecisionGraphNode, DecisionNodeType } from './types.js';

let nodes: Map<string, DecisionGraphNode> = new Map();
let edges: DecisionGraphEdge[] = [];

const CHAIN_ORDER: DecisionNodeType[] = [
  'Goal', 'Reasoning', 'Decision', 'Architecture', 'Generation', 'Evaluation', 'ProductionResult',
];

export function addNode(node: DecisionGraphNode): DecisionGraphNode {
  nodes.set(node.id, node);
  return node;
}

export function getNode(id: string): DecisionGraphNode | undefined {
  return nodes.get(id);
}

export function listNodes(): DecisionGraphNode[] {
  return Array.from(nodes.values());
}

export function addEdge(edge: DecisionGraphEdge): void {
  if (!nodes.has(edge.from) || !nodes.has(edge.to)) return;
  edges.push(edge);
}

export function getRelated(id: string): DecisionGraphNode[] {
  const related: DecisionGraphNode[] = [];
  for (const e of edges) {
    if (e.from === id && nodes.has(e.to)) related.push(nodes.get(e.to)!);
    if (e.to === id && nodes.has(e.from)) related.push(nodes.get(e.from)!);
  }
  return related;
}

/** Links a build's full decision chain in one call — one node per stage. */
export function linkDecisionChain(buildId: string, labels: Partial<Record<DecisionNodeType, string>>): DecisionGraphNode[] {
  const chainNodes: DecisionGraphNode[] = [];
  for (const type of CHAIN_ORDER) {
    const id = `${buildId}:${type}`;
    chainNodes.push(addNode({ id, type, label: labels[type] ?? type }));
  }
  for (let i = 0; i < chainNodes.length - 1; i++) {
    addEdge({ from: chainNodes[i].id, to: chainNodes[i + 1].id, relation: 'leads-to', weight: 1 });
  }
  return chainNodes;
}

export function getGraphStats(): { nodeCount: number; edgeCount: number; density: number } {
  const nodeCount = nodes.size;
  const edgeCount = edges.length;
  const maxEdges = nodeCount > 1 ? nodeCount * (nodeCount - 1) : 1;
  const density = nodeCount > 1 ? Math.min(1, edgeCount / maxEdges) : 0;
  return { nodeCount, edgeCount, density };
}

export function resetDecisionGraph(): void {
  nodes = new Map();
  edges = [];
}
