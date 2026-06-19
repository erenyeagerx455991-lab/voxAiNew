// Global test setup — runs before every test file
import { vi } from 'vitest';

// Prevent real filesystem writes during unit tests
vi.mock('fs/promises', async (importOriginal) => {
  const real = await importOriginal<typeof import('fs/promises')>();
  return real; // Tests that need FS isolation mock it inline
});

// Silence pino/logger noise in test output
process.env['LOG_LEVEL'] = 'silent';
process.env['NODE_ENV'] = 'test';
