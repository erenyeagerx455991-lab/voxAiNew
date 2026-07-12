// ── V8.9 Security Architect — Phase 18: Incident Response Planner ────────────
import type { BackendType }      from '../backend-architect/backendTypes.js';
import type { IncidentBlueprint } from './securityTypes.js';

export function planIncident(t: BackendType): IncidentBlueprint {
  const isRegulated  = ['Finance','Healthcare'].includes(t);
  const isEnterprise = ['Enterprise','ERPBackend','CRMBackend'].includes(t);
  const isSimple     = ['LandingAPI','Documentation'].includes(t);

  const mttrMinutes = isRegulated ? 15 : isEnterprise ? 30 : isSimple ? 120 : 60;

  return {
    hasDetection:        true,
    hasContainment:      !isSimple,
    hasRecovery:         !isSimple,
    hasPostmortem:       !isSimple,
    hasEscalationMatrix: isEnterprise || isRegulated,
    hasRunbooks:         isEnterprise || isRegulated,
    mttrMinutes,
    oncallRotation:      isEnterprise || isRegulated,
  };
}
