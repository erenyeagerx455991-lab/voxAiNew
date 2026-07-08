// ── V8.6 Backend Architect — Database Architecture Planner ────────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, DatabaseArchitecture, DatabaseType } from './backendTypes.js';
import { isEnterpriseBackend, isSimpleBackend } from './backendPlanner.js';

function choosePrimaryDB(type: BackendType, features: ProductFeature[]): DatabaseType {
  if (['CMS', 'SocialPlatform'].includes(type)) return 'MongoDB';
  if (type === 'AIPlatform' || features.includes('AI')) return 'PostgreSQL';
  if (type === 'Analytics' || type === 'Dashboard') return 'PostgreSQL';
  if (type === 'LandingAPI' || type === 'Documentation') return 'SQLite';
  if (type === 'ServerlessCandidate') return 'PostgreSQL';
  return 'PostgreSQL';
}

function chooseSecondaryDBs(type: BackendType, features: ProductFeature[]): DatabaseType[] {
  const secondary: DatabaseType[] = [];

  if (['SaaSBackend', 'CRMBackend', 'ERPBackend', 'Marketplace', 'ECommerce'].includes(type)) {
    secondary.push('Redis');
  }
  if (type === 'AIPlatform' || features.includes('AI')) {
    secondary.push('VectorDB');
  }
  if (type === 'Analytics') {
    secondary.push('TimeSeries');
  }
  if (['Marketplace', 'ECommerce', 'Healthcare', 'Finance'].includes(type)) {
    if (!secondary.includes('Redis')) secondary.push('Redis');
  }
  return secondary;
}

function chooseORM(primary: DatabaseType, type: BackendType): string {
  if (primary === 'MongoDB') return 'Mongoose';
  if (primary === 'SQLite' && isSimpleBackend(type)) return 'Drizzle';
  if (isEnterpriseBackend(type)) return 'Prisma';
  return 'Prisma';
}

function estimateTables(type: BackendType, features: ProductFeature[]): number {
  const base: Partial<Record<BackendType, number>> = {
    LandingAPI:            3,
    Documentation:         4,
    ServerlessCandidate:   5,
    Dashboard:            10,
    CMS:                   8,
    SaaSBackend:          15,
    CRMBackend:           20,
    BookingPlatform:      12,
    ECommerce:            18,
    Marketplace:          22,
    Analytics:            12,
    AIPlatform:           14,
    SocialPlatform:       16,
    InternalTool:         10,
    Education:            14,
    Healthcare:           20,
    Finance:              25,
    ERPBackend:           35,
    Enterprise:           30,
    MultiTenant:          20,
    MicroserviceCandidate:15,
    MonolithCandidate:    20,
    APIGateway:            6,
  };
  return (base[type] ?? 12) + Math.floor(features.length * 0.5);
}

export function planDatabaseArchitecture(
  type:     BackendType,
  features: ProductFeature[],
): DatabaseArchitecture {
  const primary     = choosePrimaryDB(type, features);
  const secondary   = chooseSecondaryDBs(type, features);
  const hasCache    = secondary.includes('Redis') || isEnterpriseBackend(type);
  const isEnterprise = isEnterpriseBackend(type);
  const isSimple    = isSimpleBackend(type);

  return {
    primary,
    secondary,
    hasCache,
    cacheType:        hasCache ? 'Redis' : 'Memory' as DatabaseType,
    hasMigrations:    primary !== 'MongoDB',
    hasSeeding:       true,
    hasIndexing:      !isSimple,
    hasPartitioning:  isEnterprise || type === 'Analytics',
    hasReplication:   isEnterprise || ['Finance', 'Healthcare'].includes(type),
    connectionPooling:primary !== 'SQLite',
    ormChoice:        chooseORM(primary, type),
    estimatedTables:  estimateTables(type, features),
  };
}
