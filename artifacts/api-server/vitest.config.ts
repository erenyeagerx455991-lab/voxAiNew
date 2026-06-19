import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/runtime/errorClassifier.ts',
        'src/runtime/dependencyResolverV2.ts',
        // buildExecutor.ts is excluded: it orchestrates real subprocess calls
        // (npm install + Vite build) that require integration-testing, not unit testing.
        // Its subprocess helpers (runCmd, runInstall, runBuild) can only be verified
        // against a live OS. buildRepairTargets/buildRuntimeState are tested separately.
        'src/runtime/security/packageScanner.ts',
        'src/security/authMiddleware.ts',
        'src/security/rateLimiter.ts',
        'src/security/corsConfig.ts',
        'src/security/workspaceCleanup.ts',
        'src/security/securityMetrics.ts',
      ],
      exclude: ['node_modules', 'dist', 'src/tests'],
      thresholds: {
        statements: 70,
        functions: 70,
        branches: 60,
        lines: 70,
      },
      reporter: ['text', 'json-summary'],
    },
    reporters: ['verbose'],
    testTimeout: 15000,
  },
});
