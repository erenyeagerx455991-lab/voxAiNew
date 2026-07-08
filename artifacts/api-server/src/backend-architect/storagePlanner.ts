// ── V8.6 Backend Architect — Storage Architecture Planner ─────────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, StorageArchitecture, StorageProvider } from './backendTypes.js';
import { isEnterpriseBackend, isSimpleBackend } from './backendPlanner.js';

function chooseProviders(type: BackendType, features: ProductFeature[]): StorageProvider[] {
  if (isSimpleBackend(type)) return ['Local'];

  const providers: StorageProvider[] = [];
  const hasMedia = features.includes('Media') || features.includes('FileUpload') ||
                   ['Marketplace', 'ECommerce', 'CMS', 'SocialPlatform'].includes(type);

  if (isEnterpriseBackend(type) || ['Marketplace', 'ECommerce', 'Finance', 'Healthcare'].includes(type)) {
    providers.push('S3');
  } else if (hasMedia) {
    providers.push('S3');
  } else {
    providers.push('Local');
  }

  if (['SocialPlatform', 'Marketplace', 'CMS'].includes(type)) providers.push('Cloudinary');

  return [...new Set(providers)] as StorageProvider[];
}

export function planStorageArchitecture(
  type:     BackendType,
  features: ProductFeature[],
): StorageArchitecture {
  const providers     = chooseProviders(type, features);
  const hasMedia      = features.includes('Media') || features.includes('FileUpload') ||
                        ['Marketplace', 'ECommerce', 'CMS', 'SocialPlatform'].includes(type);
  const isEnterprise  = isEnterpriseBackend(type);

  return {
    providers,
    primaryProvider:    providers[0] ?? 'Local',
    hasS3:              providers.includes('S3'),
    hasCloudinary:      providers.includes('Cloudinary'),
    hasLocalStorage:    providers.includes('Local'),
    hasBackups:         isEnterprise || ['Finance', 'Healthcare'].includes(type),
    hasImageProcessing: providers.includes('Cloudinary') || hasMedia,
    hasFileValidation:  hasMedia,
    maxFileSizeMB:      ['Finance', 'Healthcare'].includes(type) ? 50 : hasMedia ? 25 : 10,
  };
}
