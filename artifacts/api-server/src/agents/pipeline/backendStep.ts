import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { generateBackendFiles, generateDatabaseFiles, generateAuthFiles } from "../backend/backendAgent.js";
import { generateEnvExample, generateReadme, generateReplitConfig, generateReplitNix, validateProject } from "../config/configGenerators.js";
import { buildKnowledgeGraphServer } from "../knowledge/knowledgeGraph.js";
import type { ProjectFileSSE } from "../types.js";
import type { ArchitectureOutput, FrontendOutput, BackendOutput, PipelineKeys } from "./pipelineTypes.js";

export async function runBackendStep(
  arch: ArchitectureOutput,
  frontend: FrontendOutput,
  keys: PipelineKeys,
  res: Response
): Promise<BackendOutput> {
  const { groqKey } = keys;
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
        generateBackendFiles(projectBlueprint.apis, projectBlueprint.entities || [], projectBlueprint.projectType, groqKey)
          .then(files => {
            backendFiles = files as ProjectFileSSE[];
            console.log(`[BackendAgent] Generated ${files.length} backend files`);
            sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          })
          .catch(e => {
            console.error('[BackendAgent] Failed:', e);
            sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "error", error: e.message });
          })
      );
    }

    if (hasTables) {
      sse(res, { type: "step", step: 6, agent: "Database Agent", status: "active", tables: projectBlueprint.databaseTables });
      tasks.push(
        generateDatabaseFiles(projectBlueprint.databaseTables, projectBlueprint.relationships || [], projectBlueprint.entities || [], groqKey)
          .then(files => {
            dbFiles = files as ProjectFileSSE[];
            console.log(`[DatabaseAgent] Generated ${files.length} database files`);
            sse(res, { type: "step", step: 6, agent: "Database Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          })
          .catch(e => {
            console.error('[DatabaseAgent] Failed:', e);
            sse(res, { type: "step", step: 6, agent: "Database Agent", status: "error", error: e.message });
          })
      );
    }

    if (needsAuth) {
      sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "active", provider: projectBlueprint.authProvider });
      tasks.push(
        generateAuthFiles(projectBlueprint.authProvider || 'JWT', groqKey)
          .then(files => {
            authFiles = files as ProjectFileSSE[];
            console.log(`[AuthAgent] Generated ${files.length} auth files`);
            sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          })
          .catch(e => {
            console.error('[AuthAgent] Failed:', e);
            sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "error", error: e.message });
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

  console.log(`[Pipeline] Total files: ${allFiles.length} (frontend: ${projectFiles.length}, backend: ${backendFiles.length}, db: ${dbFiles.length}, auth: ${authFiles.length})`);

  const pv = validateProject(allFiles, projectBlueprint);
  console.log(`[ProjectValidator] score=${pv.score} passed=${pv.passed}${pv.issues.length ? ' — ' + pv.issues.join('; ') : ''}`);
  sse(res, { type: "project_validate", score: pv.score, passed: pv.passed, issues: pv.issues, fileCount: allFiles.length });

  sse(res, { type: "step", step: 8, agent: "Scaffold Agent", status: "done", fileCount: allFiles.length });

  sse(res, { type: "graph_build_start" });
  const knowledgeGraph = buildKnowledgeGraphServer(allFiles, projectBlueprint);
  sse(res, { type: "graph_build_done", graph: knowledgeGraph });
  sse(res, { type: "graph_health", score: knowledgeGraph.graphHealthScore, pages: knowledgeGraph.pages.length, components: knowledgeGraph.components.length, apis: knowledgeGraph.apis.length, routes: knowledgeGraph.routes.length });
  console.log(`[KnowledgeGraph] Built — pages:${knowledgeGraph.pages.length} components:${knowledgeGraph.components.length} apis:${knowledgeGraph.apis.length} healthScore:${knowledgeGraph.graphHealthScore}`);

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
