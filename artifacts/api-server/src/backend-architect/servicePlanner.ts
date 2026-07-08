// ── V8.6 Backend Architect — Service Layer Planner ────────────────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, ServiceArchitecture } from './backendTypes.js';
import { isEnterpriseBackend } from './backendPlanner.js';

function deriveServices(type: BackendType, features: ProductFeature[]): string[] {
  const services: string[] = ['UserService', 'AuthService'];

  if (features.includes('Dashboard') || type === 'Dashboard') services.push('DashboardService');
  if (features.includes('Analytics') || type === 'Analytics') services.push('AnalyticsService');
  if (features.includes('Notifications')) services.push('NotificationService');
  if (features.includes('Billing')) services.push('BillingService', 'SubscriptionService');
  if (features.includes('AI') || type === 'AIPlatform') services.push('AIService', 'EmbeddingService');
  if (features.includes('Chat')) services.push('ChatService', 'MessageService');
  if (features.includes('Reports')) services.push('ReportService');
  if (features.includes('Teams')) services.push('TeamService', 'MemberService');
  if (features.includes('Permissions') || features.includes('AuditLogs')) services.push('PermissionService', 'AuditService');
  if (features.includes('Search')) services.push('SearchService');
  if (features.includes('Profile')) services.push('ProfileService');
  if (features.includes('FileUpload') || features.includes('Media')) services.push('StorageService', 'MediaService');
  if (features.includes('Calendar') || type === 'BookingPlatform') services.push('BookingService', 'CalendarService');
  if (features.includes('Payment') || ['ECommerce', 'Marketplace'].includes(type)) {
    services.push('PaymentService', 'OrderService');
  }
  if (type === 'CRMBackend') services.push('LeadService', 'ContactService', 'DealService', 'PipelineService');
  if (type === 'ECommerce') services.push('ProductService', 'CartService', 'InventoryService');
  if (type === 'Marketplace') services.push('ProductService', 'SellerService', 'ReviewService');
  if (type === 'Healthcare') services.push('PatientService', 'AppointmentService', 'RecordService');
  if (type === 'Finance') services.push('AccountService', 'TransactionService', 'ReportService');
  if (type === 'Education') services.push('CourseService', 'EnrollmentService', 'ProgressService');
  if (type === 'SocialPlatform') services.push('FeedService', 'PostService', 'FollowService');
  if (type === 'CMS') services.push('ContentService', 'PublishService', 'MediaService');

  services.push('EmailService', 'CacheService', 'HealthService');
  return [...new Set(services)];
}

export function planServiceLayer(
  type:     BackendType,
  features: ProductFeature[],
): ServiceArchitecture {
  const services    = deriveServices(type, features);
  const isEnterprise = isEnterpriseBackend(type);

  return {
    services,
    hasBusinessServices:     true,
    hasDomainServices:       isEnterprise || services.length > 8,
    hasUtilityServices:      true,
    hasIntegrationServices:  services.some(s => s.includes('Payment') || s.includes('Email')),
    hasNotificationServices: features.includes('Notifications') || services.includes('EmailService'),
    hasPaymentServices:      services.some(s => s.includes('Payment') || s.includes('Billing')),
    hasAIServices:           type === 'AIPlatform' || features.includes('AI'),
    hasAnalyticsServices:    type === 'Analytics' || features.includes('Analytics'),
    serviceCount:            services.length,
  };
}
