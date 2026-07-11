// ── V8.7 DevOps & Infrastructure Architect — Public Facade ────────────────────
//
// Single import point for all V8.7 modules. Downstream consumers
// (pipeline, tests, telemetry) should only import from this file.

export { runDevOpsArchitect }            from './devopsArchitect.js';

// Types
export type {
  InfrastructureType, CloudProvider, CICDProvider, LoadBalancingStrategy,
  ScalingType, EnvironmentName, DeploymentStrategy,
  DevOpsDimension, DevOpsBlueprint, DevOpsArchitectOutput,
  DevOpsLearningRecord, DevOpsLearningInput,
  DevOpsQualityScore, DevOpsMetricsSnapshot,
} from './devopsTypes.js';
export { ALL_DEVOPS_DIMENSIONS }         from './devopsTypes.js';

// Planners
export { detectInfrastructure }          from './infrastructurePlanner.js';
export { planCloud }                     from './cloudPlanner.js';
export { planContainer }                 from './containerPlanner.js';
export { planDocker }                    from './dockerPlanner.js';
export { planKubernetes }                from './kubernetesPlanner.js';
export { planNetwork }                   from './networkPlanner.js';
export { planCDN }                       from './cdnPlanner.js';
export { planLoadBalancer }              from './loadBalancerPlanner.js';
export { planAutoScaling }               from './autoscalingPlanner.js';
export { planCICD }                      from './cicdPlanner.js';
export { planEnvironments }              from './environmentPlanner.js';
export { planSecrets }                   from './secretPlanner.js';
export { planDevOpsDeployment }          from './deploymentPlanner.js';
export { planMonitoring }                from './monitoringPlanner.js';
export { planLogging }                   from './loggingPlanner.js';
export { planAlerts }                    from './alertPlanner.js';
export { planBackup }                    from './backupPlanner.js';
export { planRecovery }                  from './recoveryPlanner.js';
export { planCost }                      from './costPlanner.js';
export { planDevOpsSecurity }            from './securityPlanner.js';
export { planDevOpsPerformance }         from './performancePlanner.js';

// Validator
export { validateDevOpsBlueprint }       from './devopsValidator.js';
export type { DevOpsValidationResult }   from './devopsValidator.js';

// Learning
export {
  learnFromDevOpsBuild,
  getDevOpsLearningStats,
  getDevOpsLearnCount,
  resetDevOpsLearning,
}                                        from './devopsLearning.js';

// Metrics
export {
  recordDevOpsBuild,
  getDevOpsMetrics,
  resetDevOpsMetrics,
}                                        from './devopsMetrics.js';
export type { DevOpsMetricsSnapshot }    from './devopsMetrics.js';

// Persistence
export {
  saveDevOpsBlueprint,
  flushDevOpsPersistence,
  getDevOpsSnapshots,
  getRecentDevOpsSnapshots,
  getDevOpsSnapshotAtVersion,
  rollbackDevOpsToVersion,
  getCurrentDevOpsVersion,
  getDevOpsPersistenceStats,
  resetDevOpsPersistence,
  initDevOpsPersistence,
}                                        from './devopsPersistence.js';
