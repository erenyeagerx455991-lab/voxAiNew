// ── V8.6 Backend Architect — Event Architecture Planner ───────────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, EventArchitecture } from './backendTypes.js';
import { isEnterpriseBackend, isSimpleBackend } from './backendPlanner.js';

function deriveEventTypes(type: BackendType, features: ProductFeature[]): string[] {
  const events: string[] = [];
  if (isSimpleBackend(type)) return events;

  events.push('user.created', 'user.updated', 'user.deleted');
  if (features.includes('Billing')) events.push('subscription.created', 'payment.processed', 'invoice.generated');
  if (features.includes('Notifications')) events.push('notification.sent');
  if (features.includes('AI') || type === 'AIPlatform') events.push('ai.request.completed');
  if (['ECommerce', 'Marketplace'].includes(type)) events.push('order.created', 'order.shipped', 'payment.completed');
  if (type === 'CRMBackend') events.push('lead.created', 'deal.won', 'deal.lost');
  if (type === 'Healthcare') events.push('appointment.scheduled', 'record.updated');
  if (type === 'Finance') events.push('transaction.completed', 'account.credited');
  if (type === 'SocialPlatform') events.push('post.created', 'follow.created');
  if (type === 'BookingPlatform') events.push('booking.created', 'booking.cancelled');
  if (isEnterpriseBackend(type)) events.push('audit.log', 'security.alert');

  return [...new Set(events)];
}

export function planEventArchitecture(
  type:     BackendType,
  features: ProductFeature[],
): EventArchitecture {
  const isSimple     = isSimpleBackend(type);
  const isEnterprise = isEnterpriseBackend(type);
  const eventTypes   = deriveEventTypes(type, features);
  const hasEvents    = eventTypes.length > 0;

  return {
    hasEvents,
    patterns:        hasEvents ? ['Observer', 'EventEmitter'] : [],
    hasEventSourcing:isEnterprise && ['Finance', 'Healthcare'].includes(type),
    hasCQRS:         isEnterprise && type !== 'LandingAPI',
    hasDomainEvents: hasEvents && !isSimple,
    eventTypes,
  };
}
