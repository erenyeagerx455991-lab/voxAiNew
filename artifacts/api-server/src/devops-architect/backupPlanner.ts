// ── V8.7 DevOps Architect — Backup Planner ───────────────────────────────────
import type { BackendType, BackupBlueprint, BackupFrequency } from './devopsTypes.js';
import { isEnterprise, isSimple } from './infrastructurePlanner.js';

function chooseFrequency(t: BackendType): BackupFrequency {
  if (t === 'Finance' || t === 'Healthcare') return 'Continuous';
  if (isEnterprise(t)) return 'Hourly';
  if (isSimple(t)) return 'Daily';
  return 'Daily';
}

export function planBackup(t: BackendType): BackupBlueprint {
  const isRegulated = t === 'Finance' || t === 'Healthcare';

  return {
    hasDatabaseBackup:      true,
    hasObjectStorageBackup: !isSimple(t),
    hasSnapshotStrategy:    isEnterprise(t) || isRegulated,
    hasRetentionPolicy:     true,
    frequency:              chooseFrequency(t),
    retentionDays:          isRegulated ? 2555 : isEnterprise(t) ? 365 : 30,
    crossRegion:            isEnterprise(t) || isRegulated,
    encryption:             !isSimple(t),
  };
}
