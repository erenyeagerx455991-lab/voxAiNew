// ── V8.9 Security Architect — Phase 11: Compliance Planner ───────────────────
import type { BackendType }       from '../backend-architect/backendTypes.js';
import type { ComplianceBlueprint, ComplianceStandard } from './securityTypes.js';

const CHECKLISTS: Record<ComplianceStandard, string[]> = {
  SOC2:     ['Access control','Encryption at rest','Audit logs','Incident response','Change management'],
  ISO27001: ['ISMS policy','Risk assessment','Asset management','Access control','Cryptography'],
  HIPAA:    ['PHI encryption','Access logs','Business associate agreement','Breach notification','Data minimization'],
  PCIDSS:   ['Network segmentation','Cardholder data encryption','Access control','Log monitoring','Vulnerability scans'],
  GDPR:     ['Consent management','Data export','Right to delete','Privacy notice','DPA agreement'],
  CCPA:     ['Opt-out mechanism','Data inventory','Privacy notice','Do Not Sell link','Data deletion'],
  FedRAMP:  ['FIPS 140-2 encryption','Continuous monitoring','POA&M management','Penetration testing','Incident reporting'],
};

export function planCompliance(t: BackendType): ComplianceBlueprint {
  const isFinancial = t === 'Finance' || t === 'ECommerce';
  const isHealth    = t === 'Healthcare';
  const isGovt      = t === 'ERPBackend';
  const isEnterprise= ['Enterprise','ERPBackend','CRMBackend','MultiTenant'].includes(t);
  const isConsumer  = ['ECommerce','SocialPlatform','Marketplace','BookingPlatform'].includes(t);
  const isSimple    = ['LandingAPI','Documentation','ServerlessCandidate'].includes(t);

  const standards: ComplianceStandard[] = [];
  if (!isSimple)  standards.push('SOC2', 'GDPR');
  if (isConsumer) standards.push('CCPA');
  if (isFinancial)standards.push('PCIDSS');
  if (isHealth)   standards.push('HIPAA');
  if (isEnterprise)standards.push('ISO27001');
  if (isGovt)     standards.push('FedRAMP');

  const unique = [...new Set(standards)] as ComplianceStandard[];
  const readinessChecklist = {} as Record<ComplianceStandard, string[]>;
  for (const s of unique) readinessChecklist[s] = CHECKLISTS[s];

  const complianceLevel = isHealth || isFinancial ? 'Enterprise' : isEnterprise ? 'Standard' : isSimple ? 'Basic' : 'Standard';

  return {
    standards:             unique,
    readinessChecklist,
    complianceLevel:       complianceLevel as ComplianceBlueprint['complianceLevel'],
    hasContinuousMonitoring:!isSimple,
    gapCount:              isSimple ? 0 : unique.length * 2,
  };
}
