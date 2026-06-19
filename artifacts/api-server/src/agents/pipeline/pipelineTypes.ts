import type { PageBlueprint, ProjectBlueprint, DesignDNA, ProjectFileSSE, ServerKnowledgeGraph, DNAComposition } from "../types.js";

export type { PageBlueprint, ProjectBlueprint, DesignDNA, ProjectFileSSE, ServerKnowledgeGraph, DNAComposition };

export interface PlannerOutput {
  cleanPlan: string;
  briefText: string;
  referenceSites: string;
  primaryReference: string;
  secondaryReferences: string[];
  blueprint: PageBlueprint;
  dnaComposition: DNAComposition;
  dnaOwnership: Record<string, string>;
  dnaTheme: Record<string, unknown> | null;
  dnaMotion: Record<string, unknown> | null;
  templateContext: string;
  templateMatch: {
    templateId: string;
    template: Record<string, unknown>;
    confidence: number;
    pages: string[];
    apis: string[];
    databaseTables: string[];
    features: string[];
  };
}

export interface ArchitectureOutput {
  plan: PlannerOutput;
  projectBlueprint: ProjectBlueprint;
}

export interface FrontendOutput {
  architecture: ArchitectureOutput;
  design: DesignDNA;
  designAgentStatus: string;
  designAgentError: string | null;
  projectFiles: ProjectFileSSE[];
  fixedCode: string;
  buildHealthMetrics: Record<string, unknown>;
  registrySelection: Record<string, string>;
}

export interface BackendOutput {
  architecture: ArchitectureOutput;
  frontend: FrontendOutput;
  allFiles: ProjectFileSSE[];
  backendFiles: ProjectFileSSE[];
  dbFiles: ProjectFileSSE[];
  authFiles: ProjectFileSSE[];
  knowledgeGraph: ServerKnowledgeGraph;
}

export interface PipelineKeys {
  groqKey: string;
  openrouterKey: string;
}
