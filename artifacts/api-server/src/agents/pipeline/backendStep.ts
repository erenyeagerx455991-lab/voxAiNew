import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { generateBackendFiles, generateDatabaseFiles, generateAuthFiles } from "../backend/backendAgent.js";
import { generateEnvExample, generateReadme, generateReplitConfig, generateReplitNix, validateProject } from "../config/configGenerators.js";
import { buildKnowledgeGraphServer } from "../knowledge/knowledgeGraph.js";
import type { ProjectFileSSE } from "../types.js";
import type { ArchitectureOutput, FrontendOutput, BackendOutput, PipelineKeys } from "./pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("BackendStep");

export async function runBackendStep(
  arch: ArchitectureOutput,
  frontend: FrontendOutput,
  keys: PipelineKeys,
  res: Response
): Promise<BackendOutput> {
  const { openrouterKey } = keys;
  const { projectBlueprint } = arch;
  const { projectFiles } = frontend;

  const hasApis   = projectBlueprint.apis.length > 0;
  const hasTables = projectBlueprint.databaseTables.length > 0;
  const needsAuth = projectBlueprint.authNeeded;

  let backendFiles: ProjectFileSSE[] = [];
  let dbFiles: ProjectFileSSE[] = [];
  let authFiles: ProjectFileSSE[] = [];

  if (hasApis || hasTables || needsAuth) {
    const tasks: Promise<void>[] = [];

    if (hasApis) {
      sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "active", apis: projectBlueprint.apis });
      tasks.push(
        generateBackendFiles(projectBlueprint.apis, projectBlueprint.entities || [], projectBlueprint.projectType, openrouterKey)
          .then(files => {
            backendFiles = files as ProjectFileSSE[];
            log.info("BACKEND_AGENT_DONE", { fileCount: files.length });
            sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          })
          .catch(e => {
            log.error("BACKEND_AGENT_FAILED", { error: String(e) });
            sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "error", error: (e as Error).message });
          })
      );
    }

    if (hasTables) {
      sse(res, { type: "step", step: 6, agent: "Database Agent", status: "active", tables: projectBlueprint.databaseTables });
      tasks.push(
        generateDatabaseFiles(projectBlueprint.databaseTables, projectBlueprint.relationships || [], projectBlueprint.entities || [], openrouterKey)
          .then(files => {
            dbFiles = files as ProjectFileSSE[];
            log.info("DATABASE_AGENT_DONE", { fileCount: files.length });
            sse(res, { type: "step", step: 6, agent: "Database Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          })
          .catch(e => {
            log.error("DATABASE_AGENT_FAILED", { error: String(e) });
            sse(res, { type: "step", step: 6, agent: "Database Agent", status: "error", error: (e as Error).message });
          })
      );
    }

    if (needsAuth) {
      sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "active", provider: projectBlueprint.authProvider });
      tasks.push(
        generateAuthFiles(projectBlueprint.authProvider || 'JWT', openrouterKey)
          .then(files => {
            authFiles = files as ProjectFileSSE[];
            log.info("AUTH_AGENT_DONE", { fileCount: files.length });
            sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          })
          .catch(e => {
            log.error("AUTH_AGENT_FAILED", { error: String(e) });
            sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "error", error: (e as Error).message });
          })
      );
    }

    await Promise.all(tasks);
  }

  sse(res, { type: "step", step: 8, agent: "Scaffold Agent", status: "active" });

  const extraFiles: ProjectFileSSE[] = [
    ...backendFiles,
    ...dbFiles,
    ...authFiles,
    ...(hasApis || hasTables || needsAuth ? [generateEnvExample(projectBlueprint)] : []),
    generateReadme(projectBlueprint),
    generateReplitConfig(projectBlueprint),
    generateReplitNix(),
  ] as ProjectFileSSE[];

  const reservedNames = new Set(['README.md', '.replit', 'replit.nix', '.env.example']);
  const allFiles: ProjectFileSSE[] = [
    ...projectFiles.filter(f => !reservedNames.has(f.name)),
    ...extraFiles,
  ];

  log.info("SCAFFOLD_COMPLETE", {
    total: allFiles.length,
    frontend: projectFiles.length,
    backend: backendFiles.length,
    db: dbFiles.length,
    auth: authFiles.length,
  });

  const pv = validateProject(allFiles, projectBlueprint);
  log.info("PROJECT_VALIDATED", { score: pv.score, passed: pv.passed, issueCount: pv.issues.length });
  sse(res, { type: "project_validate", score: pv.score, passed: pv.passed, issues: pv.issues, fileCount: allFiles.length });

  sse(res, { type: "step", step: 8, agent: "Scaffold Agent", status: "done", fileCount: allFiles.length });

  sse(res, { type: "graph_build_start" });
  const knowledgeGraph = buildKnowledgeGraphServer(allFiles, projectBlueprint);
  sse(res, { type: "graph_build_done", graph: knowledgeGraph });
  sse(res, { type: "graph_health", score: knowledgeGraph.graphHealthScore, pages: knowledgeGraph.pages.length, components: knowledgeGraph.components.length, apis: knowledgeGraph.apis.length, routes: knowledgeGraph.routes.length });
  log.info("KNOWLEDGE_GRAPH_BUILT", {
    pages: knowledgeGraph.pages.length,
    components: knowledgeGraph.components.length,
    apis: knowledgeGraph.apis.length,
    healthScore: knowledgeGraph.graphHealthScore,
  });

  return {
    architecture: arch,
    frontend,
    allFiles,
    backendFiles,
    dbFiles,
    authFiles,
    knowledgeGraph,
  };
}
