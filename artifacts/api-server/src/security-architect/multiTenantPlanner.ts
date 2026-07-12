// ── V8.9 Security Architect — Phase 4: Multi-Tenant Planner ──────────────────
import type { BackendType }       from '../backend-architect/backendTypes.js';
import type { MultiTenantBlueprint, TenantModel } from './securityTypes.js';

export function planMultiTenant(t: BackendType): MultiTenantBlueprint {
  const isMultiTenant = ['MultiTenant','SaaSBackend','Marketplace','ERPBackend','CRMBackend'].includes(t);
  const isEnterprise  = ['Enterprise','Finance','Healthcare'].includes(t);
  const isSimple      = ['LandingAPI','Documentation','ServerlessCandidate'].includes(t);

  let model: TenantModel = 'SingleTenant';
  let isolationLevel: MultiTenantBlueprint['isolationLevel'] = 'None';

  if (isEnterprise) {
    model = 'DedicatedDatabase'; isolationLevel = 'Database';
  } else if (t === 'MultiTenant') {
    model = 'SharedSchema'; isolationLevel = 'Schema';
  } else if (isMultiTenant) {
    model = 'SharedDatabase'; isolationLevel = 'Row';
  }

  return {
    model,
    hasIsolation:             !isSimple && model !== 'SingleTenant',
    hasCrossTenantProtection: isMultiTenant || isEnterprise,
    isolationLevel,
    hasDataBoundary:          isEnterprise,
    tenantIdStrategy:         isMultiTenant ? 'UUID column on every table' : 'N/A',
  };
}
