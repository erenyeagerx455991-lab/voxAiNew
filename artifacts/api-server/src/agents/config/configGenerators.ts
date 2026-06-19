import type { ProjectBlueprint, ProjectFileSSE, QualityGateResult } from "../types.js";

export interface BlueprintValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProjectBlueprint(bp: ProjectBlueprint): BlueprintValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!bp.projectType) errors.push('Missing projectType');
  if (!Array.isArray(bp.pages) || bp.pages.length === 0) errors.push('No pages defined');
  if (!bp.techStack?.frontend) errors.push('Missing techStack.frontend');
  if (bp.authNeeded && !bp.authProvider) warnings.push('authNeeded but no authProvider specified');
  if (bp.databaseTables?.length > 0 && (!bp.apis || bp.apis.length === 0)) warnings.push('databaseTables defined but no apis');
  return { valid: errors.length === 0, errors, warnings };
}

export function computeQualityScore(pb: ProjectBlueprint): QualityGateResult {
  const issues: string[] = [];
  let score = 100;

  if (!pb.description || pb.description.length < 5)    { issues.push('Missing description');            score -= 5; }
  if (!pb.projectType)                                  { issues.push('Missing project type');           score -= 10; }
  if (pb.pages.length === 0)                            { issues.push('No pages defined');               score -= 15; }
  if (!pb.techStack?.frontend)                          { issues.push('Missing frontend tech stack');    score -= 10; }
  if (pb.authNeeded && !pb.authProvider)                { issues.push('Auth needed but no provider');   score -= 10; }
  if (pb.databaseTables.length > 0 && pb.entities.length === 0) { issues.push('Tables defined but no entities'); score -= 10; }
  if (pb.databaseTables.length > 0 && pb.apis.length === 0)     { issues.push('Database tables without API routes'); score -= 10; }
  if (pb.authNeeded && !pb.apis.some(a => a.toLowerCase().includes('auth'))) { issues.push('Auth needed but no auth API route'); score -= 5; }
  if (pb.entities.length > 1 && pb.relationships.length === 0)  { issues.push('Multiple entities but no relationships'); score -= 5; }

  const finalScore = Math.max(0, Math.min(100, score));
  return { score: finalScore, passed: finalScore >= 70, issues };
}

export function resolveProjectDependencies(pb: ProjectBlueprint) {
  const featureText = (pb.features || []).join(' ').toLowerCase();

  const frontend: Record<string, string> = {
    react: '^18.3.1', 'react-dom': '^18.3.1',
    'react-router-dom': '^6.26.0',
    'lucide-react': '^0.400.0',
    clsx: '^2.1.1', 'tailwind-merge': '^2.4.0',
  };
  const frontendDev: Record<string, string> = {
    '@types/react': '^18.3.3', '@types/react-dom': '^18.3.0',
    '@vitejs/plugin-react': '^4.3.1', typescript: '^5.5.3',
    vite: '^5.4.10', tailwindcss: '^3.4.14',
    autoprefixer: '^10.4.20', postcss: '^8.4.47',
  };
  const backend: Record<string, string> = {
    express: '^4.19.2', cors: '^2.8.5', dotenv: '^16.4.5', zod: '^3.23.8',
  };
  const backendDev: Record<string, string> = {
    '@types/express': '^4.17.21', '@types/cors': '^2.8.17',
    '@types/node': '^22.0.0', typescript: '^5.5.3',
    tsx: '^4.17.0', nodemon: '^3.1.4',
  };

  if (pb.authNeeded) {
    const p = (pb.authProvider || '').toLowerCase();
    if (p === 'clerk')          frontend['@clerk/clerk-react']    = '^5.7.0';
    else if (p === 'supabase')  frontend['@supabase/supabase-js'] = '^2.45.0';
    else {
      backend.jsonwebtoken   = '^9.0.2'; backend.bcryptjs      = '^2.4.3';
      backendDev['@types/jsonwebtoken'] = '^9.0.6';
      backendDev['@types/bcryptjs']     = '^2.4.6';
    }
  }

  if ((pb.databaseTables || []).length > 0) {
    backend['@prisma/client'] = '^5.19.0';
    backendDev.prisma         = '^5.19.0';
  }

  if (/chart|graph|analytic|dashboard|metric|stat/.test(featureText))
    frontend.recharts = '^2.12.0';

  if (/payment|stripe|billing|checkout|subscript/.test(featureText)) {
    frontend['@stripe/stripe-js'] = '^4.6.0';
    backend.stripe = '^16.12.0';
  }

  if (/upload|image|photo|media|file/.test(featureText)) {
    backend.multer              = '^1.4.5-lts.1';
    backendDev['@types/multer'] = '^1.4.12';
  }

  if (/email|newsletter|notification|mail/.test(featureText)) {
    backend.nodemailer              = '^6.9.15';
    backendDev['@types/nodemailer'] = '^6.4.16';
  }

  if (/map|location|geo|gps/.test(featureText)) {
    frontend.leaflet             = '^1.9.4';
    frontend['react-leaflet']    = '^4.2.1';
    frontendDev['@types/leaflet'] = '^1.9.12';
  }

  return { frontend, frontendDev, backend, backendDev };
}

export function validateProject(files: ProjectFileSSE[], pb: ProjectBlueprint): QualityGateResult {
  const issues: string[] = [];
  let score = 100;

  const allPaths = files.map(f => f.path + f.name);
  const has  = (name: string) => allPaths.some(p => p.endsWith('/' + name) || p === name);
  const hasSrc = (part: string) => allPaths.some(p => p.includes(part));

  if (!has('package.json'))  { issues.push('package.json missing');  score -= 15; }
  if (!has('index.html'))    { issues.push('index.html missing');     score -= 10; }
  if (!has('main.tsx'))      { issues.push('main.tsx missing');       score -= 10; }
  if (!has('App.tsx'))       { issues.push('App.tsx missing');        score -= 10; }
  if (!has('index.css'))     { issues.push('index.css missing');      score -= 5; }
  if (!has('vite.config.ts')){ issues.push('vite.config.ts missing'); score -= 5; }
  if (!has('tsconfig.json')) { issues.push('tsconfig.json missing');  score -= 5; }
  if (!hasSrc('src/'))       { issues.push('No src/ directory');      score -= 10; }
  if (!hasSrc('components/') && !hasSrc('pages/'))
    { issues.push('No components or pages generated'); score -= 10; }

  if (pb.apis.length > 0 && !hasSrc('routes/'))
    { issues.push('Backend routes missing'); score -= 5; }

  if ((pb.databaseTables || []).length > 0 && !has('schema.prisma') && !has('schema.sql'))
    { issues.push('Database schema missing'); score -= 5; }

  if (pb.authNeeded && !hasSrc('auth') && !hasSrc('Auth'))
    { issues.push('Auth files missing despite authNeeded=true'); score -= 5; }

  const finalScore = Math.max(0, Math.min(100, score));
  return { score: finalScore, passed: finalScore >= 90, issues };
}

export function generateReplitConfig(pb: ProjectBlueprint): ProjectFileSSE {
  const hasBackend = (pb.apis || []).length > 0;
  const content = hasBackend
    ? [
        `run = "npm run dev"`,
        ``,
        `[nix]`,
        `channel = "stable-24_05"`,
        ``,
        `[[ports]]`,
        `localPort = 5173`,
        `externalPort = 80`,
        ``,
        `[[ports]]`,
        `localPort = 3001`,
        `externalPort = 3001`,
        ``,
        `[env]`,
        `NODE_ENV = "development"`,
      ].join('\n')
    : [
        `run = "npm install && npm run dev"`,
        ``,
        `[nix]`,
        `channel = "stable-24_05"`,
        ``,
        `[[ports]]`,
        `localPort = 5173`,
        `externalPort = 80`,
        ``,
        `[env]`,
        `NODE_ENV = "development"`,
      ].join('\n');

  return { path: '', name: '.replit', lang: 'toml', content };
}

export function generateReplitNix(): ProjectFileSSE {
  return {
    path: '', name: 'replit.nix', lang: 'nix',
    content: `{ pkgs }: {\n  deps = [\n    pkgs.nodejs-22_x\n    pkgs.nodePackages.npm\n  ];\n}\n`,
  };
}

export function generateEnvExample(pb: ProjectBlueprint): ProjectFileSSE {
  const lines: string[] = [
    '# Environment Variables — copy to .env and fill in values',
    '',
    '# Server',
    'PORT=3001',
    'NODE_ENV=development',
    '',
  ];

  if (pb.databaseTables.length > 0) {
    lines.push('# Database', 'DATABASE_URL=postgresql://user:password@localhost:5432/dbname', '');
  }

  if (pb.authNeeded) {
    const provider = (pb.authProvider || 'JWT').toLowerCase();
    if (provider === 'supabase') {
      lines.push('# Supabase Auth', 'VITE_SUPABASE_URL=https://your-project.supabase.co', 'VITE_SUPABASE_ANON_KEY=your-anon-key', '');
    } else if (provider === 'clerk') {
      lines.push('# Clerk Auth', 'VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here', '');
    } else {
      lines.push('# JWT Auth', 'JWT_SECRET=change-this-to-a-long-random-secret', 'JWT_EXPIRES_IN=7d', '');
    }
  }

  return { path: '', name: '.env.example', lang: 'env', content: lines.join('\n') };
}

export function generateReadme(pb: ProjectBlueprint): ProjectFileSSE {
  const hasBackend = pb.apis.length > 0;
  const hasDb = pb.databaseTables.length > 0;

  const content = [
    `# ${pb.projectType}`,
    '',
    pb.description || `Generated by NexoGen AI Software Builder.`,
    '',
    '## Tech Stack',
    '',
    `- **Frontend**: ${pb.techStack.frontend}`,
    `- **UI**: ${pb.techStack.ui}`,
    `- **Routing**: ${pb.techStack.routing}`,
    hasBackend ? `- **Backend**: ${pb.techStack.backend}` : '',
    hasDb ? `- **Database**: ${pb.techStack.database}` : '',
    pb.authNeeded ? `- **Auth**: ${pb.authProvider || 'JWT'}` : '',
    '',
    '## Project Structure',
    '',
    '```',
    'src/',
    '  components/     # Shared UI components',
    '  pages/          # Page components',
    hasBackend ? '  api/            # Express API routes' : '',
    pb.authNeeded ? '  middleware/     # Auth middleware' : '',
    pb.authNeeded ? '  lib/auth.ts     # Auth utilities' : '',
    '  lib/utils.ts    # Utilities',
    '  types/          # TypeScript types',
    '  App.tsx         # Root component',
    '  main.tsx        # Entry point',
    '```',
    '',
    hasDb ? `## Database\n\nTables: ${pb.databaseTables.join(', ')}\n\nSee \`schema.sql\` and \`prisma/schema.prisma\`.\n` : '',
    pb.authNeeded ? `## Auth\n\nProvider: ${pb.authProvider || 'JWT'}. Copy \`.env.example\` to \`.env\` and configure.\n` : '',
    '## Getting Started',
    '',
    '```bash',
    'npm install',
    hasDb ? 'npx prisma migrate dev' : '',
    'npm run dev',
    '```',
  ].filter(line => line !== null && line !== undefined).join('\n');

  return { path: '', name: 'README.md', lang: 'md', content };
}
