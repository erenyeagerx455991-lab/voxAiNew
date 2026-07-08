// ── V8.6 Backend Architect — Controller Architecture Planner ──────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, ControllerArchitecture } from './backendTypes.js';

function deriveControllers(type: BackendType, features: ProductFeature[]): string[] {
  const controllers: string[] = ['AuthController', 'UserController', 'HealthController'];

  if (features.includes('Dashboard') || type === 'Dashboard') controllers.push('DashboardController');
  if (features.includes('Analytics') || type === 'Analytics') controllers.push('AnalyticsController');
  if (features.includes('Notifications')) controllers.push('NotificationController');
  if (features.includes('Billing')) controllers.push('BillingController', 'SubscriptionController');
  if (features.includes('AI') || type === 'AIPlatform') controllers.push('AIController');
  if (features.includes('Chat')) controllers.push('ChatController');
  if (features.includes('Reports')) controllers.push('ReportController');
  if (features.includes('Teams')) controllers.push('TeamController');
  if (features.includes('Search')) controllers.push('SearchController');
  if (features.includes('Profile')) controllers.push('ProfileController');
  if (type === 'CRMBackend') controllers.push('LeadController', 'ContactController', 'DealController');
  if (type === 'ECommerce') controllers.push('ProductController', 'OrderController', 'CartController', 'PaymentController');
  if (type === 'Marketplace') controllers.push('ProductController', 'SellerController', 'ReviewController');
  if (type === 'Healthcare') controllers.push('PatientController', 'AppointmentController');
  if (type === 'Finance') controllers.push('TransactionController', 'AccountController');
  if (type === 'Education') controllers.push('CourseController', 'EnrollmentController');
  if (type === 'SocialPlatform') controllers.push('FeedController', 'PostController', 'FollowController');
  if (type === 'CMS') controllers.push('ContentController', 'MediaController');
  if (type === 'BookingPlatform') controllers.push('BookingController', 'AvailabilityController');

  return [...new Set(controllers)];
}

export function planControllerArchitecture(
  type:     BackendType,
  features: ProductFeature[],
): ControllerArchitecture {
  const controllers = deriveControllers(type, features);
  return {
    controllers,
    hasValidation:            true,
    hasErrorHandling:         true,
    hasResponseNormalization: true,
    controllerCount:          controllers.length,
  };
}
