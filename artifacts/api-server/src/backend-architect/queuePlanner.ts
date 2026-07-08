// ── V8.6 Backend Architect — Queue Architecture Planner ───────────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, QueueArchitecture, QueueType } from './backendTypes.js';
import { isEnterpriseBackend, isSimpleBackend } from './backendPlanner.js';

function deriveQueues(type: BackendType, features: ProductFeature[]): QueueType[] {
  if (isSimpleBackend(type)) return [];

  const queues: QueueType[] = ['Email', 'Background'];
  if (features.includes('Notifications')) queues.push('Email');
  if (features.includes('AI') || type === 'AIPlatform') queues.push('AI');
  if (['ECommerce', 'Marketplace', 'Finance'].includes(type)) queues.push('Webhook');
  if (['ECommerce', 'Marketplace'].includes(type)) queues.push('ImageProcessing');
  if (isEnterpriseBackend(type)) queues.push('Priority', 'Retry', 'DeadLetter');

  return [...new Set(queues)] as QueueType[];
}

export function planQueueArchitecture(
  type:     BackendType,
  features: ProductFeature[],
): QueueArchitecture {
  const queues    = deriveQueues(type, features);
  const hasQueues = queues.length > 0;
  const isSimple  = isSimpleBackend(type);

  return {
    hasQueues,
    queues,
    hasBackgroundJobs:   hasQueues,
    hasEmailQueue:       queues.includes('Email'),
    hasImageProcessing:  queues.includes('ImageProcessing'),
    hasAIQueue:          queues.includes('AI'),
    hasWebhookQueue:     queues.includes('Webhook'),
    hasRetryQueue:       queues.includes('Retry') || (hasQueues && !isSimple),
    hasDeadLetterQueue:  queues.includes('DeadLetter') || (hasQueues && isEnterpriseBackend(type)),
    hasPriorityQueue:    queues.includes('Priority'),
    queueProvider:       isSimple ? 'None' : hasQueues ? 'BullMQ' : 'None',
  };
}
