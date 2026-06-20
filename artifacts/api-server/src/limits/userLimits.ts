import type { Request } from 'express';
import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger('UserLimits');

export interface LimitConfig {
  maxActiveBuildsConcurrent: number;
  maxQueuedBuilds: number;
  dailyBuildQuota: number;
  dailyTokenQuota: number;
}

const DEFAULT_CONFIG: LimitConfig = {
  maxActiveBuildsConcurrent: Number(process.env['LIMIT_MAX_ACTIVE']     ?? 2),
  maxQueuedBuilds:           Number(process.env['LIMIT_MAX_QUEUED']     ?? 5),
  dailyBuildQuota:           Number(process.env['LIMIT_DAILY_BUILDS']   ?? 20),
  dailyTokenQuota:           Number(process.env['LIMIT_DAILY_TOKENS']   ?? 200_000),
};

let _config: LimitConfig = { ...DEFAULT_CONFIG };

interface UserState {
  activeBuilds: number;
  queuedBuilds: number;
  dailyBuilds: number;
  dailyTokens: number;
  dayStart: number;
  lastBuildAt?: number;
}

const _users = new Map<string, UserState>();

function startOfDay(): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function getUserState(userId: string): UserState {
  let state = _users.get(userId);
  const today = startOfDay();
  if (!state) {
    state = { activeBuilds: 0, queuedBuilds: 0, dailyBuilds: 0, dailyTokens: 0, dayStart: today };
    _users.set(userId, state);
  }
  if (state.dayStart < today) {
    state.dailyBuilds = 0;
    state.dailyTokens = 0;
    state.dayStart = today;
  }
  return state;
}

export function checkBuildLimit(userId: string): { allowed: boolean; reason?: string } {
  const s = getUserState(userId);
  if (s.activeBuilds >= _config.maxActiveBuildsConcurrent)
    return { allowed: false, reason: `Max concurrent builds reached (${_config.maxActiveBuildsConcurrent})` };
  if (s.queuedBuilds >= _config.maxQueuedBuilds)
    return { allowed: false, reason: `Build queue full (${_config.maxQueuedBuilds} queued)` };
  if (s.dailyBuilds >= _config.dailyBuildQuota)
    return { allowed: false, reason: `Daily build quota reached (${_config.dailyBuildQuota}/day)` };
  if (s.dailyTokens >= _config.dailyTokenQuota)
    return { allowed: false, reason: `Daily token quota reached (${_config.dailyTokenQuota} tokens/day)` };
  return { allowed: true };
}

export function recordBuildStarted(userId: string): void {
  const s = getUserState(userId);
  s.activeBuilds++;
  s.dailyBuilds++;
  s.queuedBuilds = Math.max(0, s.queuedBuilds - 1);
  s.lastBuildAt = Date.now();
  log.debug('BUILD_STARTED', { userId, activeBuilds: s.activeBuilds, dailyBuilds: s.dailyBuilds });
}

export function recordBuildQueued(userId: string): void {
  const s = getUserState(userId);
  s.queuedBuilds++;
}

export function recordBuildCompleted(userId: string): void {
  const s = getUserState(userId);
  s.activeBuilds = Math.max(0, s.activeBuilds - 1);
}

export function recordTokensUsed(userId: string, tokens: number): void {
  const s = getUserState(userId);
  s.dailyTokens += tokens;
  if (s.dailyTokens > _config.dailyTokenQuota) {
    log.warn('TOKEN_QUOTA_EXCEEDED', { userId, dailyTokens: s.dailyTokens });
  }
}

export function getUserQuotaStatus(userId: string) {
  const s = getUserState(userId);
  return {
    activeBuilds:    s.activeBuilds,
    queuedBuilds:    s.queuedBuilds,
    dailyBuilds:     s.dailyBuilds,
    dailyTokens:     s.dailyTokens,
    dailyBuildQuota: _config.dailyBuildQuota,
    dailyTokenQuota: _config.dailyTokenQuota,
    lastBuildAt:     s.lastBuildAt,
  };
}

export function getAllUserStats() {
  return Object.fromEntries(
    Array.from(_users.entries()).map(([uid, s]) => [uid, getUserQuotaStatus(uid)])
  );
}

export function extractUserId(req: Request): string {
  const key = req.headers['x-api-key'];
  if (key && typeof key === 'string') return `key:${key.slice(0, 8)}`;
  const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  return `ip:${ip}`;
}

export function configureLimits(config: Partial<LimitConfig>): void {
  _config = { ..._config, ...config };
}

export function _resetLimitsForTest(): void {
  _users.clear();
  _config = { ...DEFAULT_CONFIG };
}

export function _setUserStateForTest(userId: string, state: Partial<UserState>): void {
  const existing = getUserState(userId);
  Object.assign(existing, state);
}
