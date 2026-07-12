// ── V9.4 Knowledge Graph Engine — in-memory graph ────────────────────────────

import type { KnowledgeNode, KnowledgeEdge, KnowledgeDomain, KnowledgeRelationship } from './types.js';

export class KnowledgeGraphEngine {
  private nodes = new Map<string, KnowledgeNode>();
  private edges: KnowledgeEdge[] = [];

  addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: KnowledgeEdge): void {
    this.edges.push(edge);
  }

  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): KnowledgeNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): KnowledgeEdge[] {
    return [...this.edges];
  }

  getRelated(nodeId: string, relationship?: KnowledgeRelationship): KnowledgeNode[] {
    const related: KnowledgeNode[] = [];
    for (const e of this.edges) {
      if (e.from === nodeId && (!relationship || e.type === relationship)) {
        const n = this.nodes.get(e.to);
        if (n) related.push(n);
      }
      if (e.to === nodeId && (!relationship || e.type === relationship)) {
        const n = this.nodes.get(e.from);
        if (n) related.push(n);
      }
    }
    return related;
  }

  traverse(startId: string, maxDepth = 3): KnowledgeNode[] {
    const visited = new Set<string>();
    const result: KnowledgeNode[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const item = queue.shift()!;
      if (visited.has(item.id) || item.depth > maxDepth) continue;
      visited.add(item.id);
      const node = this.nodes.get(item.id);
      if (node) {
        result.push(node);
        for (const e of this.edges) {
          if (e.from === item.id && !visited.has(e.to)) {
            queue.push({ id: e.to, depth: item.depth + 1 });
          }
        }
      }
    }
    return result;
  }

  reset(): void {
    this.nodes.clear();
    this.edges = [];
  }

  get nodeCount(): number { return this.nodes.size; }
  get edgeCount(): number { return this.edges.length; }
  get relationshipDensity(): number {
    const n = this.nodes.size;
    if (n < 2) return 0;
    return parseFloat((this.edges.length / (n * (n - 1) / 2)).toFixed(4));
  }
}

// ── Singleton + domain chain initialization ───────────────────────────────────

export const globalKnowledgeGraph = new KnowledgeGraphEngine();

const DOMAIN_CHAIN: KnowledgeDomain[] = [
  'Product', 'Frontend', 'Component', 'Design', 'Business',
  'Performance', 'Security', 'Accessibility', 'Conversion',
];

const RELATIONSHIP_MAP: Record<string, KnowledgeRelationship> = {
  'Product->Frontend':      'PRODUCES',
  'Frontend->Component':    'PRODUCES',
  'Component->Design':      'REFERENCES',
  'Design->Business':       'PRODUCES',
  'Business->Performance':  'OPTIMIZES',
  'Performance->Security':  'VALIDATES',
  'Security->Accessibility':'VALIDATES',
  'Accessibility->Conversion': 'OPTIMIZES',
};

export function initializeDomainChain(): void {
  for (const domain of DOMAIN_CHAIN) {
    const nodeId = `domain:${domain}`;
    if (!globalKnowledgeGraph.getNode(nodeId)) {
      globalKnowledgeGraph.addNode({
        id: nodeId,
        domain,
        label: domain,
        properties: { initialized: true },
        recordIds: [],
      });
    }
  }

  for (let i = 0; i < DOMAIN_CHAIN.length - 1; i++) {
    const from = `domain:${DOMAIN_CHAIN[i]}`;
    const to   = `domain:${DOMAIN_CHAIN[i + 1]}`;
    const key  = `${DOMAIN_CHAIN[i]}->${DOMAIN_CHAIN[i + 1]}`;
    const rel: KnowledgeRelationship = RELATIONSHIP_MAP[key] ?? 'REFERENCES';
    globalKnowledgeGraph.addEdge({ from, to, type: rel, weight: 1.0 });
  }
}

initializeDomainChain();
