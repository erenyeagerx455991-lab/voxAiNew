import type { ProjectFileSSE, ExtractedFile } from "../types.js";
import { callAI } from "../llm/aiService.js";
import { BACKEND_SYSTEM, DATABASE_SYSTEM, AUTH_SYSTEM } from "../llm/prompts.js";

export function extractBackendFiles(code: string): ExtractedFile[] {
  const files: ExtractedFile[] = [];
  const delimPattern = /\/\/\s*===\s*FILE:\s*([^=\n]+?)\s*===/g;
  const positions: Array<{ fullPath: string; start: number; headerEnd: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = delimPattern.exec(code)) !== null) {
    positions.push({ fullPath: m[1].trim(), start: m.index, headerEnd: m.index + m[0].length });
  }

  for (let i = 0; i < positions.length; i++) {
    const { fullPath, headerEnd } = positions[i];
    const rawContent = code.slice(headerEnd, i + 1 < positions.length ? positions[i + 1].start : code.length).trim();
    const content = rawContent
      .replace(/^```(?:[a-z]+)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();
    if (content.length === 0) continue;

    const lastSlash = fullPath.lastIndexOf('/');
    const path = lastSlash >= 0 ? fullPath.slice(0, lastSlash + 1) : '';
    const name = lastSlash >= 0 ? fullPath.slice(lastSlash + 1) : fullPath;
    files.push({ path, name, content });
  }

  return files;
}

export async function generateBackendFiles(
  apis: string[],
  entities: string[],
  projectType: string,
  openrouterKey: string
): Promise<ProjectFileSSE[]> {
  if (apis.length === 0) return [];

  const apiFileDelimiters = apis.map(a => `// === FILE: src/api/${a}.ts ===`).join('\n');
  const userPrompt = `Generate Express.js TypeScript API route files for a ${projectType}.

APIs to generate:
${apis.map(a => `- ${a}`).join('\n')}

Entity context: ${entities.join(', ') || 'infer from API names'}

Required file delimiters:
${apiFileDelimiters}
// === FILE: src/server.ts ===
// === FILE: src/middleware/errorHandler.ts ===

Generate all files now. Do not truncate.`;

  try {
    const raw = await callAI(
      openrouterKey,
      [
        { role: 'system', content: BACKEND_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      { label: "backend-api", maxTokens: 4000 }
    );
    const extracted = extractBackendFiles(raw);
    console.log(`[BackendAgent] Extracted ${extracted.length} files from output`);
    return extracted.map(f => ({
      path: f.path,
      name: f.name,
      lang: f.name.endsWith('.tsx') ? 'tsx' : 'ts',
      content: f.content,
    }));
  } catch (e) {
    console.error('[BackendAgent] Generation failed:', e);
    return [];
  }
}

export async function generateDatabaseFiles(
  tables: string[],
  relationships: string[],
  entities: string[],
  openrouterKey: string
): Promise<ProjectFileSSE[]> {
  if (tables.length === 0) return [];

  const userPrompt = `Generate complete PostgreSQL and Prisma schemas.

Tables:
${tables.map(t => `- ${t}`).join('\n')}

Entities: ${entities.join(', ')}

Relationships:
${relationships.length > 0 ? relationships.map(r => `- ${r}`).join('\n') : '(infer from table names)'}

Required files:
// === FILE: schema.sql ===
// === FILE: prisma/schema.prisma ===

Generate both files completely. Do not truncate.`;

  try {
    const raw = await callAI(
      openrouterKey,
      [
        { role: 'system', content: DATABASE_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      { label: "backend-database", maxTokens: 3000 }
    );
    const extracted = extractBackendFiles(raw);
    console.log(`[DatabaseAgent] Extracted ${extracted.length} files from output`);
    return extracted.map(f => ({
      path: f.path,
      name: f.name,
      lang: f.name.endsWith('.sql') ? 'sql' : f.name.endsWith('.prisma') ? 'prisma' : 'ts',
      content: f.content,
    }));
  } catch (e) {
    console.error('[DatabaseAgent] Generation failed:', e);
    return [];
  }
}

export async function generateAuthFiles(
  authProvider: string,
  openrouterKey: string
): Promise<ProjectFileSSE[]> {
  const provider = (authProvider || 'JWT').toUpperCase();

  const userPrompt = `Generate authentication files for provider: ${provider}.

Required files:
// === FILE: src/lib/auth.ts ===
// === FILE: src/middleware/authMiddleware.ts ===
// === FILE: src/api/auth.ts ===
// === FILE: src/pages/Login.tsx ===
// === FILE: src/pages/Signup.tsx ===
// === FILE: src/components/ProtectedRoute.tsx ===

Provider: ${provider}
${provider === 'SUPABASE' ? 'Use @supabase/supabase-js for all auth operations.' : ''}
${provider === 'CLERK' ? 'Use @clerk/clerk-react. ClerkProvider wraps the app.' : ''}
${!['SUPABASE', 'CLERK'].includes(provider) ? 'Use jsonwebtoken + bcryptjs. Store JWT in localStorage.' : ''}

Generate all files now. Do not truncate.`;

  try {
    const raw = await callAI(
      openrouterKey,
      [
        { role: 'system', content: AUTH_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      { label: "backend-auth", maxTokens: 4000 }
    );
    const extracted = extractBackendFiles(raw);
    console.log(`[AuthAgent] Extracted ${extracted.length} files from output`);
    return extracted.map(f => ({
      path: f.path,
      name: f.name,
      lang: f.name.endsWith('.tsx') ? 'tsx' : 'ts',
      content: f.content,
    }));
  } catch (e) {
    console.error('[AuthAgent] Generation failed:', e);
    return [];
  }
}
