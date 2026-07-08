// ── V8.6 Backend Architect — Repository Layer Planner ─────────────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, RepositoryArchitecture, RepositoryPattern } from './backendTypes.js';
import { isEnterpriseBackend } from './backendPlanner.js';

function choosePattern(type: BackendType): RepositoryPattern {
  if (['CMS', 'SocialPlatform'].includes(type)) return 'QueryBuilder';
  if (isEnterpriseBackend(type)) return 'Repository';
  return 'Repository';
}

function deriveRepositories(type: BackendType, features: ProductFeature[]): string[] {
  const repos: string[] = ['UserRepository', 'AuthRepository'];

  if (features.includes('Dashboard') || type === 'Dashboard') repos.push('DashboardRepository');
  if (features.includes('Analytics') || type === 'Analytics') repos.push('AnalyticsRepository');
  if (features.includes('Notifications')) repos.push('NotificationRepository');
  if (features.includes('Billing')) repos.push('BillingRepository', 'SubscriptionRepository');
  if (features.includes('AI') || type === 'AIPlatform') repos.push('EmbeddingRepository');
  if (features.includes('Chat')) repos.push('MessageRepository');
  if (features.includes('Reports')) repos.push('ReportRepository');
  if (features.includes('Teams')) repos.push('TeamRepository');
  if (features.includes('AuditLogs')) repos.push('AuditRepository');
  if (features.includes('Profile')) repos.push('ProfileRepository');
  if (type === 'CRMBackend') repos.push('LeadRepository', 'ContactRepository', 'DealRepository');
  if (type === 'ECommerce') repos.push('ProductRepository', 'OrderRepository', 'CartRepository');
  if (type === 'Marketplace') repos.push('ProductRepository', 'SellerRepository', 'ReviewRepository');
  if (type === 'Healthcare') repos.push('PatientRepository', 'AppointmentRepository');
  if (type === 'Finance') repos.push('TransactionRepository', 'AccountRepository');
  if (type === 'Education') repos.push('CourseRepository', 'EnrollmentRepository');
  if (type === 'SocialPlatform') repos.push('PostRepository', 'FollowRepository');
  if (type === 'CMS') repos.push('ContentRepository');

  return [...new Set(repos)];
}

export function planRepositoryLayer(
  type:     BackendType,
  features: ProductFeature[],
): RepositoryArchitecture {
  const isEnterprise = isEnterpriseBackend(type);

  return {
    pattern:                choosePattern(type),
    hasUnitOfWork:          isEnterprise || ['Finance', 'ECommerce', 'Healthcare'].includes(type),
    hasTransactions:        !['LandingAPI', 'Documentation'].includes(type),
    hasDatabaseAbstraction: true,
    hasConnectionPooling:   !['LandingAPI', 'Documentation', 'ServerlessCandidate'].includes(type),
    repositories:           deriveRepositories(type, features),
  };
}
