import { AsyncLocalStorage } from 'async_hooks';

export interface TokenBuildContext {
  userId: string;
  buildId: string;
}

/**
 * AsyncLocalStorage that carries userId + buildId through the entire
 * async call chain — from executeBuildJob → runBuildPipeline → callGroq/callOpenRouter —
 * without changing any intermediate function signatures.
 *
 * Usage:
 *   tokenContext.run({ userId, buildId }, () => runBuildPipeline(...))
 *
 * Inside callGroq / callOpenRouter:
 *   const ctx = tokenContext.getStore();
 *   if (ctx) recordTokensUsed(ctx.userId, totalTokens);
 */
export const tokenContext = new AsyncLocalStorage<TokenBuildContext>();
