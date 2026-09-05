// ─── Service & Health Status ──────────────────────────────────────────────────

export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type ServiceTier = 'tier-1' | 'tier-2' | 'tier-3' | 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3';
export type Environment = 'production' | 'staging' | 'development';


export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertState = 'firing' | 'pending' | 'resolved';

export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4';
export type IncidentState = 'open' | 'investigating' | 'identified' | 'mitigating' | 'resolved';

export type SloStatus = 'met' | 'at_risk' | 'breached';
export type SloType = 'availability' | 'latency' | 'error_rate';

export type LogLevel = 'FATAL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
export type SpanKind = 'SERVER' | 'CLIENT' | 'INTERNAL' | 'PRODUCER' | 'CONSUMER';
export type SpanStatusCode = 'OK' | 'ERROR' | 'UNSET';

// ─── Service Catalog ──────────────────────────────────────────────────────────

export interface ServiceDependency {
  targetServiceId: string;
  targetServiceName: string;
  type: 'http' | 'grpc' | 'database' | 'queue';
  callRateRps: number;
  errorRatePercent: number;
  p99LatencyMs: number;
}

export interface ServiceGoldenSignals {
  throughputRps: number;
  errorRatePercent: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  cpuUsagePercent: number;
  memoryUsageMb: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  team: string;
  environment: Environment;
  tier: ServiceTier;
  version: string;
  status: ServiceStatus;
  uptimePercent: number;
  requestRate: number;
  errorRate: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  activeAlertCount: number;
  dependencies: ServiceDependency[];
  goldenSignals: ServiceGoldenSignals;
  updatedAt: string; // ISO 8601
}

// ─── Telemetry: Metrics ───────────────────────────────────────────────────────

export interface MetricDatapoint {
  timestamp: string; // ISO 8601
  value: number;
}

export interface MetricSeries {
  metricName: string;
  serviceId?: string;
  serviceName?: string;
  unit: string;
  aggregation?: 'avg' | 'sum' | 'max' | 'min' | 'p50' | 'p95' | 'p99';
  tags?: Record<string, string>;
  points: MetricDatapoint[];
}

export interface MetricSummary {
  metricName: string;
  displayName: string;
  description: string;
  unit: string;
  category: 'http' | 'system' | 'database' | 'runtime';
  currentValue: number;
  minValue: number;
  maxValue: number;
  avgValue: number;
  p50Value: number;
  p95Value: number;
  p99Value: number;
  changePercent: number;
  series: MetricDatapoint[];
}

// ─── Telemetry: Logs ──────────────────────────────────────────────────────────

export interface LogEntry {
  id: string;
  timestamp: string; // ISO 8601
  level: LogLevel;
  service: string;
  environment: Environment;
  message: string;
  traceId?: string;
  spanId?: string;
  requestId?: string;
  attributes: {
    httpMethod?: string;
    httpPath?: string;
    httpStatus?: number;
    latencyMs?: number;
    clientIp?: string;
    userAgent?: string;
    host?: string;
    errorType?: string;
    stackTrace?: string;
    [key: string]: unknown;
  };
}

// ─── Telemetry: Distributed Traces (OpenTelemetry Semantic Conventions) ───────

export interface SpanEvent {
  name: string;
  timestamp: string;
  attributes?: Record<string, unknown>;
}

export interface Span {
  id: string;
  traceId: string;
  parentId: string | null;
  serviceName: string;
  name: string; // operation name
  kind: SpanKind;
  startTime: string; // ISO 8601
  startOffsetMs: number; // offset relative to trace start
  durationMs: number;
  statusCode: SpanStatusCode;
  statusMessage?: string;
  attributes: {
    'http.method'?: string;
    'http.route'?: string;
    'http.status_code'?: number;
    'http.url'?: string;
    'db.system'?: string;
    'db.statement'?: string;
    'db.name'?: string;
    'net.peer.name'?: string;
    'rpc.system'?: string;
    'rpc.method'?: string;
    [key: string]: unknown;
  };
  events?: SpanEvent[];
  children?: Span[];
}

export interface Trace {
  id: string;
  rootService: string;
  operation: string;
  startTime: string; // ISO 8601
  durationMs: number;
  statusCode: SpanStatusCode;
  spanCount: number;
  depth: number;
  servicesInvolved: string[];
  spans: Span[];
}

// ─── Reliability: Alerts & Incidents ──────────────────────────────────────────

export interface Alert {
  id: string;
  name: string;
  severity: AlertSeverity;
  state: AlertState;
  serviceId: string | null;
  serviceName: string | null;
  environment: Environment;
  summary: string;
  condition: string;
  currentValue: number;
  threshold: number;
  unit: string;
  firedAt: string; // ISO 8601
  resolvedAt: string | null;
  durationMinutes: number;
  relatedTraceId?: string;
  relatedLogId?: string;
  incidentId?: string;
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string; // ISO 8601
  type: 'created' | 'status_change' | 'note' | 'mitigation' | 'alert_attached' | 'resolved';
  title: string;
  description: string;
  author: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  state: IncidentState;
  affectedServices: string[];
  summary: string;
  impact: string;
  commander: string | null;
  startedAt: string; // ISO 8601
  resolvedAt: string | null;
  durationMinutes: number;
  timeline: IncidentTimelineEvent[];
  relatedAlertIds: string[];
  relatedTraceIds: string[];
  relatedLogIds: string[];
  sloImpactSummary?: string;
  postIncidentNotes?: string;
}

// ─── SRE: SLOs & Error Budgets ────────────────────────────────────────────────

export interface SloDefinition {
  id: string;
  name: string;
  serviceId: string;
  serviceName: string;
  type: SloType;
  targetPercent: number;
  currentPercent: number;
  errorBudgetRemainingPercent: number;
  errorBudgetRemainingMinutes: number;
  burnRate: number; // 1x normal, >2x at risk, >6x critical burn
  windowDays: number;
  status: SloStatus;
  description: string;
  achievementHistory: MetricDatapoint[];
  burnDownHistory: MetricDatapoint[];
  updatedAt: string;
}

// ─── Infrastructure Inventory ─────────────────────────────────────────────────

export interface InfrastructureResource {
  id: string;
  name: string;
  type: 'k8s_cluster' | 'k8s_node' | 'k8s_pod' | 'docker_container' | 'aws_rds' | 'aws_alb' | 'aws_sqs' | 'aws_s3' | 'redis_cache';
  category: 'compute' | 'database' | 'network' | 'storage' | 'messaging';
  environment: Environment;
  status: 'healthy' | 'warning' | 'critical' | 'stopped';
  region: string;
  zone?: string;
  ipAddress?: string;
  version?: string;
  metrics: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent?: number;
    networkIoMbps?: number;
    restarts?: number;
    uptimeDays?: number;
  };
  tags: Record<string, string>;
  updatedAt: string;
}

// ─── System Status & Telemetry Simulation ──────────────────────────────────────

export interface SystemComponentStatus {
  id: string;
  name: string;
  category: 'core' | 'collector' | 'storage' | 'engine';
  status: 'operational' | 'degraded' | 'down' | 'not_configured';
  latencyMs: number;
  version: string;
  details: string;
  mode: 'real' | 'simulated';
}

export interface FaultInjectionConfig {
  latencySpike: boolean;
  errorRateBurst: boolean;
  serviceOutage: string | null; // serviceId or null
  dbPoolExhaustion: boolean;
  trafficSpike: boolean;
}

// ─── Overview / Dashboard Aggregation ──────────────────────────────────────────

export interface OverviewTelemetryTrends {
  requestRateSeries: MetricDatapoint[];
  errorRateSeries: MetricDatapoint[];
  latencyP99Series: MetricDatapoint[];
  latencyP50Series: MetricDatapoint[];
}

export interface OverviewData {
  systemHealth: {
    overallStatus: ServiceStatus;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    totalServices: number;
  };
  metrics: {
    requestRateRps: number;
    requestRateChangePercent: number;
    errorRatePercent: number;
    errorRateChangePercent: number;
    latencyP50Ms: number;
    latencyP95Ms: number;
    latencyP99Ms: number;
    latencyChangePercent: number;
  };
  telemetryTrends: OverviewTelemetryTrends;
  activeAlerts: number;
  criticalAlerts: number;
  openIncidents: number;
  activeSev1Incidents: number;
  slosAtRisk: number;
  slosBreached: number;
  recentAlerts: Alert[];
  recentIncidents: Incident[];
  services: Service[];
  slos: SloDefinition[];
  recentLogs: LogEntry[];
  recentTraces: Trace[];
  generatedAt: string;
}

// ─── SRE: Runbooks & Automated Remediation ──────────────────────────────────

export interface Runbook {
  id: string;
  title: string;
  serviceId: string;
  serviceName: string;
  severity: AlertSeverity;
  symptoms: string[];
  possibleCauses: string[];
  investigationSteps: string[];
  diagnosticCommands: string[];
  mitigationSteps: string[];
  escalationPath: string;
  recoveryVerification: string;
}

export type RemediationSafetyLevel = 'safe_automatic' | 'manual_approval_required';

export interface RemediationAction {
  id: string;
  name: string;
  type: 'restart_pod' | 'scale_deployment' | 'refresh_collector' | 'flush_cache' | 'probe_health';
  serviceId: string;
  serviceName: string;
  safetyLevel: RemediationSafetyLevel;
  description: string;
  commandSnippet: string;
}

export interface RemediationAuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  actionId: string;
  actionName: string;
  serviceId: string;
  serviceName: string;
  triggerReason: string;
  triggeredBy: 'automation' | 'sre_operator';
  status: 'success' | 'failed' | 'in_progress';
  details: string;
}

// ─── SRE: Postmortems & Continuous Improvement ──────────────────────────────

export interface PostmortemActionItem {
  id: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  owner: string;
  status: 'open' | 'in_progress' | 'completed';
  dueDate: string;
}

export interface Postmortem {
  id: string;
  incidentId: string;
  title: string;
  severity: IncidentSeverity;
  leadInvestigator: string;
  status: 'draft' | 'under_review' | 'published';
  summary: string;
  impact: {
    customerImpact: string;
    downtimeMinutes: number;
    errorCount: number;
    sloImpact: string;
  };
  timeline: IncidentTimelineEvent[];
  rootCause: string;
  contributingFactors: string[];
  fiveWhys: string[];
  detectionNotes: string;
  mitigationNotes: string;
  actionItems: PostmortemActionItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── SRE: Deployment & Change Correlation ────────────────────────────────────

export interface DeploymentEvent {
  id: string;
  serviceId: string;
  serviceName: string;
  environment: Environment;
  version: string;
  commitSha: string;
  author: string;
  deployedAt: string; // ISO 8601
  status: 'successful' | 'rolled_back' | 'failed';
  releaseNotes: string;
}

// ─── SRE: Notifications & Alert Routing ──────────────────────────────────────

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'slack' | 'webhook' | 'pagerduty' | 'email';
  targetUrl?: string;
  enabled: boolean;
  configured: boolean;
  alertSeverities: AlertSeverity[];
}

export interface SreMetricsSummary {
  mttaMinutes: number;
  mttrMinutes: number;
  incidentCount30d: number;
  alertCount30d: number;
  mtbfHours: number;
  avgErrorBudgetConsumptionPercent: number;
}

// ─── Phase 8: Cloud Security, Zero Trust & RBAC ──────────────────────────────

export type UserRole = 'viewer' | 'operator' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export type SecurityFindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SecurityFindingStatus = 'open' | 'acknowledged' | 'fixed' | 'accepted_risk';
export type SecurityFindingCategory = 'iam' | 'secrets' | 'network' | 'container' | 'dependency' | 'api' | 'compliance';

export interface SecurityFinding {
  id: string;
  title: string;
  category: SecurityFindingCategory;
  severity: SecurityFindingSeverity;
  status: SecurityFindingStatus;
  resource: string;
  description: string;
  impact: string;
  recommendation: string;
  firstDetectedAt: string;
  lastDetectedAt: string;
}

export interface SecurityCategoryScore {
  score: number;
  maxScore: number;
  passedChecks: number;
  totalChecks: number;
}

export interface SecurityPostureScore {
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  categories: {
    iam: SecurityCategoryScore;
    secrets: SecurityCategoryScore;
    network: SecurityCategoryScore;
    container: SecurityCategoryScore;
    dependencies: SecurityCategoryScore;
    compliance: SecurityCategoryScore;
  };
  summary: string;
  evaluatedAt: string;
}

export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'PERMISSION_DENIED'
  | 'ROLE_CHANGED'
  | 'SECRET_ACCESS'
  | 'CONFIG_CHANGED'
  | 'REMEDIATION_EXECUTED';

export interface SecurityAuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  eventType: SecurityEventType;
  actor: string;
  role: UserRole;
  resource: string;
  action: string;
  status: 'allow' | 'deny' | 'success' | 'failed';
  ipAddress?: string | undefined;
  details: string;
}


export interface SecurityRunbook {
  id: string;
  title: string;
  threatCategory: SecurityFindingCategory;
  severity: SecurityFindingSeverity;
  detection: string[];
  investigation: string[];
  containment: string[];
  remediation: string[];
  verification: string[];
  escalation: string;
}

export interface ComplianceControl {
  id: string;
  framework: 'CIS_K8S' | 'CIS_AWS' | 'OWASP_TOP_10' | 'OWASP_ASVS';
  controlNumber: string;
  title: string;
  description: string;
  status: 'compliant' | 'partially_compliant' | 'non_compliant';
  evidence: string;
}

// ─── Phase 9: FinOps & Cloud Cost Intelligence ───────────────────────────────

export type CostDataSource = 'real_aws_billing' | 'estimated_k8s_allocation' | 'demo_local';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR';

export interface CostRecord {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: CurrencyCode;
  service: string;
  environment: Environment;
  resourceId?: string;
}

export interface ServiceCostBreakdown {
  serviceId: string;
  serviceName: string;
  category: 'compute' | 'database' | 'networking' | 'storage' | 'observability';
  monthlyCost: number;
  percentageOfTotal: number;
  costTrendPercent: number;
}

export interface ResourceCostBreakdown {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  region: string;
  environment: Environment;
  monthlyCost: number;
  cpuRequested: string;
  cpuUsed: string;
  memoryRequested: string;
  memoryUsed: string;
  efficiencyScore: number; // 0 - 100
  dataSource: CostDataSource;
}

export interface CostAllocationItem {
  key: string;
  name: string;
  cost: number;
  percentage: number;
}

export interface CostAllocationDimension {
  dimension: 'environment' | 'service' | 'team' | 'project';
  items: CostAllocationItem[];
}

export interface CostBudget {
  id: string;
  name: string;
  scope: string;
  amount: number;
  currency: CurrencyCode;
  period: 'monthly' | 'quarterly' | 'annual';
  spent: number;
  remaining: number;
  percentageConsumed: number;
  forecastAmount: number;
  status: 'ok' | 'warning' | 'critical' | 'breached';
  owner: string;
}

export interface CostForecast {
  currentSpend: number;
  projectedMonthEnd: number;
  budgetAmount: number;
  projectedVariance: number;
  variancePercent: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  method: 'historical_run_rate';
}

export interface CostAnomaly {
  id: string;
  serviceId: string;
  serviceName: string;
  detectedAt: string;
  expectedCost: number;
  actualCost: number;
  deviationPercent: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  possibleCause: string;
  status: 'open' | 'investigating' | 'resolved';
}

export interface OptimizationRecommendation {
  id: string;
  title: string;
  category: 'rightsizing' | 'idle_resources' | 'storage' | 'networking' | 'kubernetes' | 'architecture';
  priority: 'critical' | 'high' | 'medium' | 'low';
  risk: 'low' | 'medium' | 'high';
  confidence: 'high' | 'medium' | 'low';
  resource: string;
  currentConfig: string;
  recommendedConfig: string;
  estimatedMonthlySavings: number;
  estimatedAnnualSavings: number;
  reason: string;
  actionRequired: string;
  status: 'review_required' | 'approved' | 'applied' | 'dismissed';
}

export interface FinOpsSummary {
  currentMonthCost: number;
  previousMonthCost: number;
  monthOverMonthChangePercent: number;
  forecastedMonthEndCost: number;
  totalMonthlyBudget: number;
  totalBudgetConsumedPercent: number;
  currency: CurrencyCode;
  activeAnomaliesCount: number;
  totalPotentialMonthlySavings: number;
  dataSource: CostDataSource;
  lastUpdatedAt: string;
}

// ─── Phase 10: AI/ML-Powered SRE & Predictive Intelligence ───────────────────

export type IntelligenceMethod =
  | 'real_ml'
  | 'statistical'
  | 'rule_based'
  | 'heuristic'
  | 'demo'
  | 'insufficient_data';

export type IntelligenceConfidence = 'high' | 'medium' | 'low';

export interface PredictiveAnomaly {
  id: string;
  metric: string;
  serviceId: string;
  timestamp: string;
  observedValue: number;
  expectedRange: [number, number];
  deviationPercent: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: IntelligenceConfidence;
  method: IntelligenceMethod;
  explanation: string;
}

export interface CapacityForecastPoint {
  timestamp: string;
  value: number;
  lowerBand: number;
  upperBand: number;
}

export interface CapacityForecast {
  metric: 'cpu_percent' | 'memory_mb' | 'request_rate';
  serviceId: string;
  horizon: '1h' | '6h' | '24h' | '7d';
  currentUsage: number;
  predictedUsage: number;
  capacityLimit: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidence: IntelligenceConfidence;
  method: IntelligenceMethod;
  trainingWindow: string;
  forecastPoints: CapacityForecastPoint[];
}

export interface SloRiskPrediction {
  sloId: string;
  sloName: string;
  serviceId: string;
  currentBurnRate: number;
  remainingErrorBudgetPercent: number;
  projectedExhaustionHours: number | null;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidence: IntelligenceConfidence;
  method: IntelligenceMethod;
  rationale: string;
}

export interface RootCauseAnalysis {
  incidentId: string;
  likelyCause: string;
  confidence: IntelligenceConfidence;
  method: IntelligenceMethod;
  evidence: string[];
  alternativeHypotheses: string[];
  correlatedDeploymentId?: string;
  correlatedAlertIds: string[];
  recommendedInvestigation: string;
}

export interface DeploymentRiskAssessment {
  deploymentId: string;
  serviceId: string;
  version: string;
  commitSha: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: IntelligenceConfidence;
  method: IntelligenceMethod;
  riskFactors: string[];
  rollbackRecommended: boolean;
  rationale: string;
}

export interface AiSreRecommendation {
  id: string;
  category: 'scaling' | 'latency' | 'rollback' | 'cost' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  reason: string;
  evidence: string[];
  confidence: IntelligenceConfidence;
  method: IntelligenceMethod;
  actionRequired: string;
  requiresHumanApproval: boolean;
  status: 'review_required' | 'approved' | 'applied' | 'dismissed';
}

export interface IntelligenceSummary {
  activeAnomaliesCount: number;
  capacityRiskCount: number;
  sloRiskCount: number;
  pendingRecommendationsCount: number;
  averageConfidence: IntelligenceConfidence;
  primaryMethod: IntelligenceMethod;
  evaluatedAt: string;
}

// ─── Phase 11: Disaster Recovery, Resilience & Self-Healing ──────────────────

export type ResilienceClassification =
  | 'implemented'
  | 'tested'
  | 'simulated'
  | 'designed'
  | 'not_available'
  | 'remaining_risk';

export type ResilienceServiceTier = 'tier_0_critical' | 'tier_1_important' | 'tier_2_non_critical';

export interface ServiceDependencyNode {
  serviceId: string;
  serviceName: string;
  tier: ResilienceServiceTier;
  dependencies: string[];
  dependents: string[];
  failureImpact: string;
  recoveryPriority: number; // 1 = highest priority
}

export interface SinglePointOfFailure {
  id: string;
  component: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  mitigationStatus: ResilienceClassification;
  recommendation: string;
}

export interface RtoRpoMetric {
  id: string;
  component: string;
  tier: ResilienceServiceTier;
  targetRtoSeconds: number;
  observedRtoSeconds: number | null;
  targetRpoSeconds: number;
  observedRpoSeconds: number | null;
  status: 'pass' | 'warning' | 'breached' | 'untested';
  classification: ResilienceClassification;
}


export interface BackupRecord {
  id: string;
  resource: string;
  resourceType: 'ebs_volume' | 's3_bucket' | 'terraform_state' | 'k8s_manifests' | 'app_config';
  backupType: 'automated' | 'manual';
  lastBackupAt: string;
  nextBackupAt: string;
  retentionDays: number;
  encrypted: boolean;
  status: 'healthy' | 'warning' | 'failed' | 'stale';
  verificationStatus: ResilienceClassification;
}

export interface DisasterScenario {
  id: string;
  name: string;
  description: string;
  targetComponent: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  failureType:
    | 'pod_failure'
    | 'container_crash'
    | 'node_drain'
    | 'deployment_failure'
    | 'db_starvation'
    | 'network_isolation';
  expectedBehavior: string;
  recoveryAction: string;
  targetRtoSeconds: number;
  targetRpoSeconds: number;
  lastTestedAt?: string;
  lastResult?: 'passed' | 'failed' | 'not_run';
}

export interface SimulationExecution {
  id: string;
  scenarioId: string;
  scenarioName: string;
  startedAt: string;
  completedAt?: string;
  state: 'preparing' | 'running' | 'detected' | 'recovering' | 'recovered' | 'failed';
  detectionDurationSeconds?: number;
  recoveryDurationSeconds?: number;
  observedRtoSeconds?: number;
  result: 'passed' | 'failed' | 'in_progress';
  logs: string[];
}

export interface ResilienceRunbook {
  id: string;
  title: string;
  targetFailure: string;
  severity: 'critical' | 'high' | 'medium';
  rtoTargetSeconds: number;
  detection: string[];
  diagnosis: string[];
  containment: string[];
  recoverySteps: string[];
  verification: string[];
  escalationPath: string;
}

export interface ResilienceSummary {
  overallResilienceScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  criticalServicesCount: number;
  spofCount: number;
  healthyBackupsCount: number;
  testedScenariosCount: number;
  avgObservedRtoSeconds: number;
  evaluatedAt: string;
}

// ─── Phase 12: Multi-Cloud, Cloud-Agnostic & Provider Abstraction ───────────

export type CloudProviderType = 'aws' | 'azure' | 'gcp' | 'all';

export type ProviderConnectionStatus =
  | 'live'
  | 'connected'
  | 'partial'
  | 'demo'
  | 'simulated'
  | 'designed'
  | 'not_configured'
  | 'error';

export interface CloudAccount {
  id: string;
  provider: CloudProviderType;
  name: string;
  accountId: string;
  primaryRegion: string;
  environment: Environment;
  status: ProviderConnectionStatus;
  lastSyncAt: string;
}

export type ProviderCapabilityStatus = 'supported' | 'partial' | 'unavailable' | 'demo';

export interface ProviderCapabilities {
  provider: CloudProviderType;
  resources: ProviderCapabilityStatus;
  compute: ProviderCapabilityStatus;
  storage: ProviderCapabilityStatus;
  networking: ProviderCapabilityStatus;
  kubernetes: ProviderCapabilityStatus;
  cost: ProviderCapabilityStatus;
  security: ProviderCapabilityStatus;
  metrics: ProviderCapabilityStatus;
  backups: ProviderCapabilityStatus;
}

export interface LegacyCloudResource {
  id: string;
  provider: CloudProviderType;
  accountId: string;
  region: string;
  zone?: string;
  resourceType: 'compute' | 'storage' | 'network' | 'database' | 'kubernetes' | 'iam';
  serviceName: string;
  name: string;
  status: 'running' | 'available' | 'degraded' | 'stopped' | 'unknown';
  environment: Environment;
  monthlyCostEstimated: number;
  tags: Record<string, string>;
  metadata: Record<string, any>;
}

export interface ComputeResource {
  id: string;
  provider: CloudProviderType;
  instanceType: string;
  vCpu: number;
  memoryGb: number;
  region: string;
  status: 'running' | 'stopped';
  utilizationPercent: number;
  monthlyCost: number;
}

export interface StorageResource {
  id: string;
  provider: CloudProviderType;
  storageType: 'object' | 'block' | 'file';
  name: string;
  capacityGb: number;
  usageGb: number;
  region: string;
  encrypted: boolean;
  versioningEnabled: boolean;
  estimatedMonthlyCost: number;
}

export interface NetworkResource {
  id: string;
  provider: CloudProviderType;
  networkType: 'vpc' | 'vnet';
  name: string;
  cidrBlock: string;
  region: string;
  subnetsCount: number;
  natGatewaysCount: number;
  multiAz: boolean;
}

export interface CloudPortabilityKubernetesCluster {
  id: string;
  provider: CloudProviderType;
  clusterName: string;
  k8sVersion: string;
  nodeCount: number;
  podCount: number;
  status: 'healthy' | 'degraded';
  region: string;
  platformType: 'eks' | 'aks' | 'gke';
}

export interface CloudPortabilityScore {
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  containerPortabilityScore: number;
  kubernetesPortabilityScore: number;
  databasePortabilityScore: number;
  infrastructureAsCodeScore: number;
  managedServicesLockInScore: number;
  lockInRisk: 'low' | 'medium' | 'high';
  evaluatedAt: string;
}

export interface MigrationAssessment {
  workloadName: string;
  sourceProvider: CloudProviderType;
  targetProvider: CloudProviderType;
  estimatedComplexity: 'low' | 'medium' | 'high';
  portabilityPercent: number;
  portableComponents: string[];
  nonPortableComponents: string[];
  migrationRisk: 'low' | 'medium' | 'high';
  recommendedSteps: string[];
}

export interface MultiCloudSummary {
  totalProvidersCount: number;
  connectedProvidersCount: number;
  totalResourcesCount: number;
  totalComputeInstances: number;
  totalKubernetesClusters: number;
  portabilityScore: number;
  activeCloudProviders: CloudProviderType[];
  evaluatedAt: string;
}

// ─── Phase 13: Zero-Trust Security, Identity Governance & Policy-as-Code ────

export type IdentityType = 'user' | 'service' | 'role' | 'group' | 'workload';

export interface IdentityRecord {
  id: string;
  name: string;
  type: IdentityType;
  provider: CloudProviderType | 'kubernetes' | 'local';
  accountId: string;
  status: 'active' | 'inactive' | 'stale';
  lastSeenAt: string;
  roles: string[];
  grantedPermissionsCount: number;
  usedPermissionsCount: number;
  riskScore: number; // 0 - 100
  isPrivileged: boolean;
}

export interface GovernanceRole {
  id: string;
  name: string;
  provider: CloudProviderType | 'kubernetes' | 'local';
  scope: string;
  permissions: string[];
  isPrivileged: boolean;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface LeastPrivilegeAnalysis {
  identityId: string;
  identityName: string;
  grantedPermissions: string[];
  usedPermissions: string[];
  unusedPermissions: string[];
  excessivePermissionsRatio: number; // 0.0 - 1.0
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface SecurityPolicyRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  effect: 'ALLOW' | 'DENY';
  resourceTypes: string[];
  conditionDescription: string;
  status: 'active' | 'disabled';
}

export interface PolicySimulationRequest {
  identityId: string;
  resourceId: string;
  action: string;
  context?: Record<string, any> | undefined;
}


export interface PolicySimulationResult {
  decision: 'ALLOW' | 'DENY';
  matchedPolicyId?: string;
  matchedPolicyName?: string;
  reason: string;
  evidence: string[];
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  policyName: string;
  resourceId: string;
  resourceName: string;
  provider: CloudProviderType | 'kubernetes';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'mitigating' | 'resolved' | 'suppressed';
  evidence: string;
  remediation: string;
  detectedAt: string;
}

export interface AccessReviewItem {
  id: string;
  identityId: string;
  identityName: string;
  roleOrPermission: string;
  resource: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  lastUsedAt: string;
  reviewStatus: 'review_required' | 'approved' | 'revoked';
  reviewer?: string;
  reviewedAt?: string;
}

export interface AccessRequestItem {
  id: string;
  requester: string;
  resource: string;
  requestedRoleOrPermission: string;
  reason: string;
  durationMinutes: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approver?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ComplianceControlMapping {
  id: string;
  framework: 'CIS_AWS' | 'NIST_800_53' | 'ISO_27001';
  controlId: string;
  title: string;
  status: 'pass' | 'fail' | 'partial' | 'unknown';
  evaluatedResourceCount: number;
  passingResourceCount: number;
  description: string;
}

export interface GovernanceSummary {
  totalIdentitiesCount: number;
  privilegedIdentitiesCount: number;
  openPolicyViolationsCount: number;
  pendingAccessReviewsCount: number;
  pendingAccessRequestsCount: number;
  averageIdentityRiskScore: number;
  overallComplianceScore: number; // 0 - 100
  evaluatedAt: string;
}

// ─── Phase 14: Advanced Observability, Distributed Tracing & Service Map ────

export type TelemetryPillar = 'metrics' | 'logs' | 'traces';

export interface TraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  startTime: string;
  durationMs: number;
  status: 'ok' | 'error' | 'unset';
  httpStatusCode?: number;
  attributes: Record<string, string | number | boolean>;
  errorMessage?: string;
}

export interface DistributedTrace {
  traceId: string;
  requestId: string;
  rootService: string;
  startTime: string;
  durationMs: number;
  status: 'ok' | 'error' | 'unset';
  serviceCount: number;
  spanCount: number;
  errorCount: number;
  spans: TraceSpan[];
  correlatedLogsCount: number;
  correlatedIncidentId?: string;
}

export interface ServiceMapNode {
  id: string;
  name: string;
  health: 'healthy' | 'degraded' | 'critical';
  requestRatePerSec: number;
  errorRatePercent: number;
  p95LatencyMs: number;
  cpuUtilizationPercent: number;
  memoryUtilizationPercent: number;
  podCount: number;
  cloudProvider: CloudProviderType | 'kubernetes';
}

export interface ServiceMapEdge {
  source: string;
  target: string;
  requestRatePerSec: number;
  errorRatePercent: number;
  p95LatencyMs: number;
  health: 'healthy' | 'degraded' | 'critical';
}

export interface ServiceDependencyGraph {
  nodes: ServiceMapNode[];
  edges: ServiceMapEdge[];
  evaluatedAt: string;
}

export interface RedMetrics {
  service: string;
  ratePerSec: number;
  errorRatePercent: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  timeRange: string;
}

export interface UseMetrics {
  resourceId: string;
  resourceType: string;
  utilizationPercent: number;
  saturationPercent: number;
  errorCount: number;
}

export interface RootCauseHypothesis {
  id: string;
  suspectedRootCause: string;
  affectedService: string;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0.0 - 1.0
  evidenceSignals: string[];
  cascadingFailurePath: string[];
  recommendedMitigation: string;
  detectedAt: string;
}

export interface TelemetryQualityScore {
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  traceCompletenessPercent: number;
  correlationCoveragePercent: number;
  cardinalityHealthPercent: number;
  redactionIntegrityPercent: number;
  timestampAccuracyPercent: number;
  evaluatedAt: string;
}

export interface ObservabilitySummary {
  totalTracesIngested: number;
  totalLogsIngested: number;
  totalMetricsSamples: number;
  activeServicesCount: number;
  degradedServicesCount: number;
  telemetryQualityScore: number;
  telemetryVolumeMbPerHour: number;
  evaluatedAt: string;
}

// ─── Phase 15: Cloud-Native FinOps & Cost Intelligence ───────────────────────

export type CostSourceType =
  | 'live_billing'
  | 'provider_api'
  | 'estimate'
  | 'calculation'
  | 'simulation'
  | 'demo';

export type AllocationConfidence = 'direct' | 'tagged' | 'inferred' | 'unallocated';

export type FinOpsMaturityLevel =
  | 'crawl_visibility'
  | 'walk_allocation'
  | 'run_optimization'
  | 'fly_governance'
  | 'continuous_optimization';

export interface TaggingGovernanceScore {
  totalResources: number;
  taggedResources: number;
  missingTagsCount: number;
  coveragePercent: number;
  mandatoryTags: string[];
  nonCompliantResources: {
    resourceId: string;
    resourceType: string;
    missingTags: string[];
  }[];
}

export interface UnitEconomicsMetric {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
  currency: string;
  totalCost: number;
  totalVolume: number;
  period: string;
  trendPercent: number;
}

export interface KubernetesFinOpsMetrics {
  clusterName: string;
  totalRequestedCpuCores: number;
  totalUsedCpuCores: number;
  cpuEfficiencyPercent: number;
  totalRequestedMemoryGb: number;
  totalUsedMemoryGb: number;
  memoryEfficiencyPercent: number;
  monthlyClusterCost: number;
  estimatedIdleWasteCost: number;
  workloads: {
    workloadName: string;
    namespace: string;
    cost: number;
    cpuEfficiency: number;
    memoryEfficiency: number;
    status: 'underutilized' | 'balanced' | 'overprovisioned';
  }[];
}

export interface CostPolicyRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'budget_threshold' | 'mandatory_tagging' | 'idle_resource_limit' | 'ci_cd_cost_delta';
  severity: 'critical' | 'high' | 'medium' | 'low';
  effect: 'WARN' | 'BLOCK';
  condition: string;
  status: 'active' | 'disabled';
}

export interface FinOpsPlatformSummary {
  currentMonthSpend: number;
  previousMonthSpend: number;
  forecastedMonthSpend: number;
  totalMonthlyBudget: number;
  budgetConsumedPercent: number;
  costEfficiencyScore: number; // 0 - 100
  taggingCoveragePercent: number;
  finopsMaturityLevel: FinOpsMaturityLevel;
  activeAnomaliesCount: number;
  potentialMonthlySavings: number;
  unitCostPerRequest: number;
  currency: CurrencyCode;
  dataSource: CostSourceType;
  evaluatedAt: string;
}

// ─── Phase 16: Chaos Engineering & Resilience Validation ─────────────────────

export type ChaosFailureType =
  | 'service_unavailable'
  | 'high_latency'
  | 'network_partition'
  | 'dependency_failure'
  | 'database_unavailable'
  | 'pod_failure'
  | 'node_drain'
  | 'container_crash'
  | 'cpu_saturation'
  | 'memory_pressure';

export type ChaosSafetyMode = 'simulation' | 'test' | 'staging' | 'live';

export type ChaosExperimentStatus =
  | 'planned'
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'aborted';

export interface ChaosExperiment {
  id: string;
  name: string;
  description: string;
  target: string;
  failureType: ChaosFailureType;
  scope: string;
  environment: string;
  durationSeconds: number;
  safetyMode: ChaosSafetyMode;
  status: ChaosExperimentStatus;
  hypothesis: string;
  steadyStateBaseline: {
    p95LatencyMs: number;
    errorRatePercent: number;
    availabilityPercent: number;
  };
  blastRadius: {
    directImpactServices: string[];
    indirectImpactServices: string[];
    affectedUsersPercent: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  abortConditions: string[];
  rollbackPlan: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  observedRtoSeconds?: number;
  targetRtoSeconds?: number;
  result?: 'passed' | 'failed' | 'aborted';
}

export interface ResilienceProfile {
  id: string;
  service: string;
  provider: string;
  region: string;
  environment: string;
  rtoTargetSeconds: number;
  rpoTargetSeconds: number;
  dependencies: string[];
  backupStrategy: string;
  replicationStrategy: string;
  failoverStrategy: string;
  resilienceScore: number;
  status: 'resilient' | 'partially_resilient' | 'vulnerable';
}

export interface ChaosLabSummary {
  overallResilienceScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalExperimentsCount: number;
  passedExperimentsCount: number;
  failedExperimentsCount: number;
  activeExperimentsCount: number;
  avgObservedRtoSeconds: number;
  spofCount: number;
  backupIntegrityScore: number;
  evaluatedAt: string;
}

// ─── Phase 17: Cloud Security Operations Center (Cloud SOC) ──────────────────

export type SecurityEventSource =
  | 'cloud_audit'
  | 'iam'
  | 'k8s_audit'
  | 'app_security'
  | 'network'
  | 'container'
  | 'config_drift';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  provider: CloudProviderType;
  account: string;

  region: string;
  source: SecurityEventSource;
  eventType: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  actor: string;
  resource: string;
  sourceIP?: string;
  destinationIP?: string;
  action: string;
  status: 'allow' | 'deny' | 'detected' | 'blocked';
  metadata: Record<string, any>;
  rawReference?: string;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  conditions: string[];
  source: SecurityEventSource;
  enabled: boolean;
  version: string;
}

export interface SecuritySequence {
  id: string;
  name: string;
  actor: string;
  events: string[];
  startTime: string;
  endTime: string;
  riskScore: number;
  confidence: 'high' | 'medium' | 'low';
  pattern: string;
}

export type SecurityIncidentStatus =
  | 'new'
  | 'triaged'
  | 'investigating'
  | 'containment'
  | 'eradication'
  | 'recovery'
  | 'resolved'
  | 'closed';

export interface SecurityIncident {
  id: string;
  title: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  status: SecurityIncidentStatus;
  detections: string[];
  affectedAssets: string[];
  timeline: {
    timestamp: string;
    phase: string;
    description: string;
    actor?: string;
  }[];
  riskScore: number;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudSocSummary {
  overallSecurityScore: number;
  threatLevel: 'low' | 'guarded' | 'elevated' | 'high' | 'severe';
  openIncidentsCount: number;
  criticalFindingsCount: number;
  totalEventsIngested24h: number;
  detectionRulesActiveCount: number;
  coveragePercent: number;
  blindSpotsCount: number;
  evaluatedAt: string;
}

// ─── Phase 18: Cloud Governance & Compliance Center ──────────────────────────

export type GovernancePolicyCategory =
  | 'SECURITY'
  | 'IDENTITY'
  | 'NETWORK'
  | 'DATA'
  | 'ENCRYPTION'
  | 'LOGGING'
  | 'OBSERVABILITY'
  | 'COST'
  | 'BACKUP'
  | 'RESILIENCE'
  | 'KUBERNETES'
  | 'INFRASTRUCTURE'
  | 'CI_CD'
  | 'RESOURCE_OWNERSHIP';

export type GovernancePolicyStatus = 'draft' | 'active' | 'disabled' | 'deprecated';

export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  category: GovernancePolicyCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  scope: string;
  version: string;
  status: GovernancePolicyStatus;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ComplianceEvidenceFreshness = 'fresh' | 'stale' | 'expired' | 'unknown';

export interface ComplianceEvidence {
  id: string;
  controlId: string;
  resourceId: string;
  source: string;
  timestamp: string;
  status: 'pass' | 'fail' | 'partial' | 'not_applicable' | 'unknown';
  reference: string;
  metadata: Record<string, any>;
  freshness: ComplianceEvidenceFreshness;
}

export type ComplianceFindingStatus =
  | 'open'
  | 'acknowledged'
  | 'remediation_planned'
  | 'remediated'
  | 'verified'
  | 'accepted_risk'
  | 'false_positive';

export interface GovernanceComplianceFinding {
  id: string;
  controlId: string;
  resourceId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: ComplianceFindingStatus;
  evidence: string;
  description: string;
  recommendation: string;
  createdAt: string;
  updatedAt: string;
}

export type PolicyExceptionStatus = 'active' | 'expired' | 'revoked';

export interface PolicyException {
  id: string;
  policyId: string;
  resourceId: string;
  reason: string;
  owner: string;
  approvedBy: string;
  expiresAt: string;
  status: PolicyExceptionStatus;
}

export type GovernanceRemediationActionType =
  | 'guidance'
  | 'configuration_change'
  | 'terraform_change'
  | 'kubernetes_change'
  | 'iam_change'
  | 'network_change';

export type GovernanceRemediationActionStatus =
  | 'recommended'
  | 'pending_approval'
  | 'approved'
  | 'executed'
  | 'verified';

export interface GovernanceRemediationAction {
  id: string;
  findingId: string;
  type: GovernanceRemediationActionType;
  description: string;
  risk: 'low' | 'medium' | 'high';
  status: GovernanceRemediationActionStatus;
  approval: {
    required: boolean;
    approver?: string;
    approvedAt?: string;
  };
  createdAt: string;
}


export type ComplianceScanStatus = 'queued' | 'running' | 'completed' | 'failed' | 'partial';

export interface ComplianceScan {
  id: string;
  scope: string;
  startedAt: string;
  completedAt?: string;
  status: ComplianceScanStatus;
  resourcesCount: number;
  controlsCount: number;
  findingsCount: number;
}

export interface ComplianceFrameworkDetail {
  id: string;
  name: string;
  version: string;
  description: string;
  controls: string[];
}

export interface GovernancePlatformSummary {
  overallComplianceScore: number;
  governanceRiskScore: {
    overall: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  activePoliciesCount: number;
  totalControlsCount: number;
  passingControlsCount: number;
  failingControlsCount: number;
  openFindingsCount: number;
  activeExceptionsCount: number;
  evidenceFreshnessPercent: number;
  evaluatedAt: string;
}

// ─── Phase 19: Cloud Incident Response & SOAR Platform ─────────────────────────

export type ResponseIncidentPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type ResponseIncidentState =
  | 'NEW'
  | 'TRIAGED'
  | 'INVESTIGATING'
  | 'AWAITING_APPROVAL'
  | 'RESPONDING'
  | 'VERIFYING'
  | 'RECOVERING'
  | 'RESOLVED'
  | 'CLOSED';

export interface ResponseIncident {
  id: string;
  title: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  priority: ResponseIncidentPriority;
  status: ResponseIncidentState;
  source: string;
  detections: string[];
  affectedAssets: string[];
  riskScore: number;
  assignedTo?: string;
  incidentCommander?: string;
  triageDetails?: {
    what: string;
    why: string;
    evidence: string[];
    confidence: 'high' | 'medium' | 'low';
    recommendedPlaybookId?: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export type PlaybookStepType =
  | 'NOTIFY'
  | 'CREATE_TICKET'
  | 'ADD_TAG'
  | 'CAPTURE_CONTEXT'
  | 'INCREASE_MONITORING'
  | 'COLLECT_LOG_REFERENCE'
  | 'RUN_DIAGNOSTIC'
  | 'REQUEST_APPROVAL'
  | 'VERIFY_STATE'
  | 'ISOLATE_HOST'
  | 'ROTATE_SECRET';

export type PlaybookRiskLevel =
  | 'SAFE'
  | 'LOW_RISK'
  | 'MEDIUM_RISK'
  | 'HIGH_RISK'
  | 'CRITICAL_RISK';

export interface PlaybookStep {
  id: string;
  order: number;
  type: PlaybookStepType;
  description: string;
  risk: PlaybookRiskLevel;
  requiresApproval: boolean;
  timeoutSeconds: number;
  onSuccess: string;
  onFailure: string;
}

export interface ResponsePlaybook {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  trigger: string;
  steps: PlaybookStep[];
  approvalPolicy: 'AUTO' | 'APPROVAL_REQUIRED' | 'MANUAL_ONLY';
  version: string;
  status: 'DRAFT' | 'TESTING' | 'ACTIVE' | 'DISABLED' | 'DEPRECATED';
  enabled: boolean;
  successRatePercent: number;
}

export type ResponseActionState =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'SKIPPED';

export interface ResponseActionExecution {
  id: string;
  incidentId: string;
  playbookId: string;
  stepId: string;
  status: ResponseActionState;
  actor: string;
  startedAt: string;
  completedAt?: string;
  result?: string;
  verificationStatus?: 'SUCCESS' | 'FAILED' | 'UNKNOWN';
  approvalId?: string;
}

export type ApprovalRequestState =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface ApprovalRequest {
  id: string;
  incidentId: string;
  actionId: string;
  requestedBy: string;
  requestedAt: string;
  approver?: string;
  decision: ApprovalRequestState;
  decidedAt?: string;
  reason?: string;
  risk: PlaybookRiskLevel;
  expectedImpact: string;
  rollbackSteps?: string;
  expiresAt: string;
}

export interface PostIncidentReview {
  id: string;
  incidentId: string;
  rootCause: string;
  trigger: string;
  impact: string;
  timeline: {
    timestamp: string;
    phase: string;
    description: string;
  }[];
  whatWorked: string[];
  whatFailed: string[];
  lessonsLearned: {
    category: string;
    lesson: string;
  }[];
  correctiveActions: {
    id: string;
    description: string;
    owner: string;
    priority: string;
    status: 'open' | 'in_progress' | 'completed';
    dueDate: string;
  }[];
  createdAt: string;
}

export interface SoarPlatformSummary {
  activeIncidentsCount: number;
  criticalIncidentsCount: number;
  awaitingApprovalCount: number;
  activePlaybooksCount: number;
  automationRatePercent: number;
  playbookSuccessRatePercent: number;
  mttaSeconds: number;
  mttrSeconds: number;
  slaBreachesCount: number;
  responseReadinessScore: number;
  evaluatedAt: string;
}

// ─── Phase 20: Cloud Reliability Command Center & SRE Platform ─────────────────

export type ServiceReliabilityStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  owner: string;
  team: string;
  environment: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  tier: ServiceTier;
  dependencies: string[];
  repository: string;
  deployment: string;
  status: ServiceReliabilityStatus;
  reliabilityScore: number;
}

export type SliType =
  | 'availability'
  | 'latency'
  | 'error_rate'
  | 'throughput'
  | 'success_rate'
  | 'saturation'
  | 'freshness';

export interface SliDefinition {
  id: string;
  serviceId: string;
  name: string;
  type: SliType;
  formula: string;
  unit: string;
  source: string;
  window: string;
  currentValue: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
}

export interface ReliabilitySloDefinition {
  id: string;
  serviceId: string;
  sliId: string;
  name: string;
  target: number;
  window: string;
  warningThreshold: number;
  criticalThreshold: number;
  currentAttainment: number;
  status: 'HEALTHY' | 'AT_RISK' | 'BREACHED' | 'UNKNOWN';
}


export type ErrorBudgetState = 'HEALTHY' | 'LOW' | 'EXHAUSTED' | 'UNKNOWN';

export interface ErrorBudgetStatus {
  serviceId: string;
  sloId: string;
  totalBudgetPercentage: number;
  remainingPercentage: number;
  state: ErrorBudgetState;
  currentBurnRate: number;
  shortWindowBurnRate: number;
  longWindowBurnRate: number;
  burnAlertLevel: 'NONE' | 'SLOW_BURN' | 'FAST_BURN' | 'CRITICAL_BURN';
  exhaustionForecastHours?: number;
}

export interface CapacityProfile {
  serviceId: string;
  cpuUtilizationPercent: number;
  memoryUtilizationPercent: number;
  storageUtilizationPercent: number;
  networkThroughputMbps: number;
  activeConnections: number;
  queueDepth: number;
  cpuHeadroomPercent: number;
  memoryHeadroomPercent: number;
  riskState: 'HEALTHY' | 'LOW_HEADROOM' | 'CAPACITY_RISK' | 'CAPACITY_EXHAUSTION';
  forecastCpu7dPercent: number;
  forecastConfidence: 'high' | 'medium' | 'low';
}

export interface ReliabilityGateDecision {
  decision: 'PASS' | 'WARN' | 'BLOCK';
  serviceId: string;
  reason: string;
  errorBudgetRemainingPercent: number;
  burnRate: number;
  evaluatedAt: string;
}

export interface ReliabilityFinding {
  id: string;
  serviceId: string;
  type:
    | 'SLO_BREACH'
    | 'ERROR_BUDGET_EXHAUSTION'
    | 'HIGH_BURN_RATE'
    | 'CAPACITY_RISK'
    | 'DEPENDENCY_RISK'
    | 'MISSING_OWNER'
    | 'MISSING_OBSERVABILITY';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status:
    | 'OPEN'
    | 'ACKNOWLEDGED'
    | 'PLANNED'
    | 'IN_PROGRESS'
    | 'RESOLVED'
    | 'VERIFIED'
    | 'ACCEPTED_RISK';
  recommendation: string;
  createdAt: string;
}

export interface ReliabilityRunbook {
  id: string;
  name: string;
  serviceId: string;
  type:
    | 'LATENCY'
    | 'ERRORS'
    | 'AVAILABILITY'
    | 'CAPACITY'
    | 'DEPENDENCY'
    | 'DEPLOYMENT'
    | 'DATABASE'
    | 'QUEUE';
  trigger: string;
  steps: {
    order: number;
    action: string;
    automated: boolean;
    risk: 'SAFE' | 'LOW_RISK' | 'HIGH_RISK';
  }[];
  owner: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
}

export interface ReliabilityCommandCenterSummary {
  overallReliabilityScore: number;
  servicesCount: number;
  tier0ServicesCount: number;
  healthyServicesCount: number;
  degradedServicesCount: number;
  criticalServicesCount: number;
  activeSlosCount: number;
  breachedSlosCount: number;
  exhaustedBudgetsCount: number;
  activeBurnAlertsCount: number;
  openReliabilityFindingsCount: number;
  alertFatigueScore: number;
  evaluatedAt: string;
}

// ─── Phase 21: Internal Developer Platform (IDP) ───────────────────────────────

export type GoldenPathCategory =
  | 'WEB_SERVICE'
  | 'API_SERVICE'
  | 'WORKER'
  | 'MICROSERVICE'
  | 'KUBERNETES_SERVICE'
  | 'SERVERLESS'
  | 'DATABASE'
  | 'EVENT_DRIVEN';

export interface IdpGoldenPath {
  id: string;
  name: string;
  description: string;
  category: GoldenPathCategory;
  templateId: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
  owner: string;
}

export interface IdpTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
  category: GoldenPathCategory;
  parameters: string[];
  files: string[];
  policies: string[];
}

export type IdpEnvironmentType = 'LOCAL' | 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
export type IdpEnvironmentStatus =
  | 'REQUESTED'
  | 'PROVISIONING'
  | 'READY'
  | 'DEGRADED'
  | 'DESTROY_PENDING'
  | 'DESTROYED'
  | 'FAILED';

export interface IdpEnvironment {
  id: string;
  name: string;
  serviceId: string;
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
  region: string;
  type: IdpEnvironmentType;
  status: IdpEnvironmentStatus;
  monthlyCostEstimate: number;
  createdAt: string;
  updatedAt: string;
}

export type IdpDeploymentStrategy = 'ROLLING' | 'BLUE_GREEN' | 'CANARY';
export type IdpDeploymentStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'PAUSED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'CANCELLED';

export interface IdpDeploymentRequest {
  id: string;
  serviceId: string;
  environmentId: string;
  version: string;
  strategy: IdpDeploymentStrategy;
  risk: 'SAFE' | 'LOW_RISK' | 'HIGH_RISK';
  status: IdpDeploymentStatus;
  requestedBy: string;
  createdAt: string;
  completedAt?: string;
}

export type IdpPlatformRequestType =
  | 'SERVICE_CREATE'
  | 'ENVIRONMENT_CREATE'
  | 'DEPLOYMENT'
  | 'RESOURCE_CHANGE'
  | 'ACCESS_REQUEST';

export type IdpPlatformRequestStatus =
  | 'SUBMITTED'
  | 'VALIDATING'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface IdpPlatformRequest {
  id: string;
  type: IdpPlatformRequestType;
  requester: string;
  target: string;
  status: IdpPlatformRequestStatus;
  estimatedMonthlyCost?: number;
  createdAt: string;
}

export interface IdpServiceScorecard {
  serviceId: string;
  securityScore: number;
  reliabilityScore: number;
  observabilityScore: number;
  governanceScore: number;
  costEfficiencyScore: number;
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
}

export interface IdpPlatformSummary {
  registeredServicesCount: number;
  activeEnvironmentsCount: number;
  goldenPathsCount: number;
  activeTemplatesCount: number;
  deploymentsTodayCount: number;
  platformMaturityScore: number;
  developerExperienceScore: number;
  platformAvailabilityPercent: number;
  evaluatedAt: string;
}

// ─── Phase 22: Cloud Software Supply Chain Security ────────────────────────────

export interface SupplyChainRepository {
  id: string;
  name: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  url: string;
  owner: string;
  team: string;
  defaultBranch: string;
  language: string;
  framework: string;
  service: string;
  status: 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED';
}

export interface SupplyChainBuild {
  id: string;
  repositoryId: string;
  commit: string;
  branch: string;
  pipeline: string;
  startedAt: string;
  completedAt: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  builder: string;
  environment: string;
  trustScore: number;
}

export interface SupplyChainDependency {
  name: string;
  version: string;
  ecosystem: 'npm' | 'pip' | 'go' | 'cargo' | 'maven';
  repositoryId: string;
  license: string;
  direct: boolean;
  transitive: boolean;
  status: 'CURRENT' | 'OUTDATED' | 'VULNERABLE';
}

export interface SupplyChainVulnerability {
  id: string;
  package: string;
  version: string;
  ecosystem: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  cvss: number;
  source: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'MITIGATING' | 'FIXED' | 'ACCEPTED_RISK' | 'FALSE_POSITIVE';
  fixedVersion?: string;
  affectedServices: string[];
  discoveredAt: string;
}

export interface SupplyChainSbomComponent {
  name: string;
  version: string;
  license: string;
  hash?: string;
}

export interface SupplyChainSbom {
  id: string;
  repositoryId: string;
  buildId: string;
  format: 'CycloneDX' | 'SPDX';
  version: string;
  generatedAt: string;
  packagesCount: number;
  vulnerabilitiesCount: number;
  components: SupplyChainSbomComponent[];
}

export interface SupplyChainContainer {
  repository: string;
  tag: string;
  digest: string;
  registry: string;
  baseImage: string;
  createdAt: string;
  vulnerabilityCounts: { critical: number; high: number; medium: number; low: number };
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface SupplyChainArtifact {
  id: string;
  name: string;
  version: string;
  type: 'CONTAINER' | 'PACKAGE' | 'BINARY' | 'HELM' | 'TERRAFORM' | 'MANIFEST';
  digest: string;
  repositoryId: string;
  buildId: string;
  signatureStatus: 'VALID' | 'INVALID' | 'MISSING' | 'EXPIRED' | 'UNKNOWN';
  provenanceStatus: 'VERIFIED' | 'UNVERIFIED' | 'MISSING';
  status: 'SECURE' | 'AT_RISK' | 'BLOCKED';
}

export interface SupplyChainSignature {
  artifactId: string;
  algorithm: string;
  identity: string;
  issuer: string;
  timestamp: string;
  status: 'VALID' | 'INVALID' | 'MISSING' | 'EXPIRED' | 'UNKNOWN';
}

export interface SupplyChainProvenance {
  artifactId: string;
  sourceRepository: string;
  commit: string;
  builder: string;
  buildEnvironment: string;
  buildTimestamp: string;
  slsaLevel: 'SLSA_BUILD_L1' | 'SLSA_BUILD_L2' | 'SLSA_BUILD_L3';
}

export interface SupplyChainGateDecision {
  decision: 'PASS' | 'WARN' | 'BLOCK';
  target: string;
  reason: string;
  violations: string[];
  evaluatedAt: string;
}

export interface SupplyChainSummary {
  overallSecurityScore: number;
  repositoriesCount: number;
  buildsCount: number;
  sbomCoveragePercent: number;
  signatureCoveragePercent: number;
  provenanceCoveragePercent: number;
  criticalVulnerabilitiesCount: number;
  highVulnerabilitiesCount: number;
  evaluatedAt: string;
}

// ─── Phase 23: Advanced Cloud FinOps & Cost Intelligence ────────────────────────

export interface FinOpsCostRecord {
  id: string;
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
  account: string;
  service: string;
  resource: string;
  region: string;
  environment: 'production' | 'staging' | 'development';
  team: string;
  owner: string;
  costCenter: string;
  currency: string;
  amount: number;
  usage: number;
  usageUnit: string;
  timestamp: string;
  source: 'LIVE' | 'IMPORTED' | 'SIMULATED';
}

export interface FinOpsBudget {
  id: string;
  name: string;
  scope: string;
  period: 'monthly' | 'quarterly' | 'annual';
  amount: number;
  currency: string;
  owner: string;
  spent: number;
  thresholdPercent: number;
  status: 'HEALTHY' | 'WARNING' | 'EXCEEDED' | 'UNKNOWN';
}

export interface FinOpsForecast {
  serviceId: string;
  currentMonthlySpend: number;
  forecastedMonthlySpend: number;
  confidence: 'high' | 'medium' | 'low';
  trendPercent: number;
  model: string;
}

export interface FinOpsAnomaly {
  id: string;
  serviceId: string;
  detectedAt: string;
  expectedAmount: number;
  actualAmount: number;
  variancePercent: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'DETECTED' | 'INVESTIGATING' | 'CONFIRMED' | 'DISMISSED' | 'RESOLVED';
  rootCauseExplanation: string;
}

export interface FinOpsWasteFinding {
  id: string;
  resourceId: string;
  serviceId: string;
  type:
    | 'IDLE_RESOURCE'
    | 'UNDERUTILIZED'
    | 'ORPHANED'
    | 'OVERSIZED'
    | 'UNUSED_STORAGE'
    | 'STALE_ENVIRONMENT';
  currentCost: number;
  estimatedMonthlySavings: number;
  confidence: 'high' | 'medium' | 'low';
  evidence: string;
}

export interface FinOpsRightsizingRecommendation {
  id: string;
  resourceId: string;
  serviceId: string;
  currentSpec: string;
  recommendedSpec: string;
  currentCost: number;
  estimatedMonthlySavings: number;
  risk: 'SAFE' | 'LOW_RISK' | 'HIGH_RISK';
  utilizationPercent: number;
}

export interface FinOpsUnitEconomics {
  metricName: string;
  unit: string;
  volume: number;
  totalCost: number;
  costPerUnit: number;
  trendPercent: number;
}

export interface FinOpsKubernetesCost {
  namespace: string;
  workload: string;
  requestedCpu: number;
  actualCpu: number;
  cpuEfficiencyPercent: number;
  requestedMemoryMb: number;
  actualMemoryMb: number;
  memoryEfficiencyPercent: number;
  monthlyCost: number;
}

export interface FinOpsMultiCloudCost {
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
  monthlySpend: number;
  percentage: number;
  topService: string;
}

export interface FinOpsOptimizationOpportunity {
  id: string;
  type:
    | 'RIGHTSIZE'
    | 'IDLE_RESOURCE'
    | 'STORAGE'
    | 'SCHEDULING'
    | 'ARCHITECTURE'
    | 'KUBERNETES'
    | 'REGION'
    | 'COMMITMENT'
    | 'TAGGING';
  service: string;
  team: string;
  currentCost: number;
  estimatedMonthlySavings: number;
  priority: 'P1' | 'P2' | 'P3';
  status: 'IDENTIFIED' | 'REVIEWING' | 'APPROVED' | 'IMPLEMENTING' | 'VERIFIED' | 'REJECTED';
  recommendation: string;
}

export interface FinOpsCenterSummary {
  totalMonthlyCost: number;
  forecastedMonthlyCost: number;
  budgetTotal: number;
  budgetVariancePercent: number;
  allocationCoveragePercent: number;
  activeAnomaliesCount: number;
  potentialMonthlySavings: number;
  finopsMaturityScore: number;
  evaluatedAt: string;
}

// ─── Phase 24: Enterprise Disaster Recovery & Business Continuity ───────────────

export interface ResilienceService {
  id: string;
  name: string;
  team: string;
  owner: string;
  environment: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dependencies: string[];
  targetRtoSeconds: number;
  measuredRtoSeconds: number;
  targetRpoSeconds: number;
  measuredRpoSeconds: number;
  currentReadiness: 'HIGH' | 'MEDIUM' | 'LOW';
  lastTested: string;
  status: 'ACTIVE' | 'DEGRADED' | 'FAILED';
}

export interface ResilienceRecoveryPlan {
  id: string;
  name: string;
  service: string;
  version: string;
  owner: string;
  steps: string[];
  dependencies: string[];
  estimatedRtoSeconds: number;
  estimatedRpoSeconds: number;
  lastTested: string;
  status: 'DRAFT' | 'READY' | 'TESTING' | 'VALIDATED' | 'OUTDATED' | 'FAILED';
}

export interface ResilienceBackup {
  id: string;
  resource: string;
  type: 'SNAPSHOT' | 'FULL' | 'INCREMENTAL' | 'LOG' | 'REPLICATION';
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
  region: string;
  timestamp: string;
  sizeBytes: number;
  retentionDays: number;
  encrypted: boolean;
  immutable: boolean;
  status: 'SUCCESS' | 'FAILED' | 'STALE' | 'MISSING' | 'UNKNOWN';
}

export interface ResilienceRestoreTest {
  id: string;
  backupId: string;
  resource: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  status: 'PLANNED' | 'RUNNING' | 'PASSED' | 'FAILED' | 'CANCELLED';
  dataIntegrity: 'VERIFIED' | 'CORRUPTED' | 'UNVERIFIED';
  measuredRtoSeconds: number;
  measuredRpoSeconds: number;
  evidence: string;
}

export interface ResilienceFailureScenario {
  id: string;
  name: string;
  type:
    | 'REGION_FAILURE'
    | 'AZ_FAILURE'
    | 'SERVICE_FAILURE'
    | 'DATABASE_FAILURE'
    | 'CACHE_FAILURE'
    | 'QUEUE_FAILURE'
    | 'NETWORK_FAILURE'
    | 'IDENTITY_FAILURE'
    | 'EXTERNAL_DEPENDENCY';
  target: string;
  blastRadius: {
    affectedServices: string[];
    affectedWorkloads: string[];
    estimatedUserImpact: string;
  };
  recoveryPath: string[];
  estimatedRtoSeconds: number;
  estimatedRpoSeconds: number;
  status: 'SIMULATED' | 'READY' | 'RUNNING';
}

export interface ResilienceRecoveryWorkflow {
  id: string;
  planId: string;
  scenarioId: string;
  currentStage:
    | 'PRECHECK'
    | 'BACKUP'
    | 'RESTORE'
    | 'DEPENDENCY_RECOVERY'
    | 'SERVICE_RECOVERY'
    | 'TRAFFIC_RECOVERY'
    | 'VALIDATION';
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  automationLevel: 'MANUAL' | 'ASSISTED' | 'AUTOMATED' | 'SIMULATED';
  requiresApproval: boolean;
  approvedBy?: string;
  timeline: { stage: string; timestamp: string; status: string }[];
}

export interface ResilienceGapFinding {
  id: string;
  serviceId: string;
  type:
    | 'RTO_GAP'
    | 'RPO_GAP'
    | 'BACKUP_GAP'
    | 'RESTORE_GAP'
    | 'DEPENDENCY_GAP'
    | 'REGION_GAP'
    | 'RUNBOOK_GAP';
  problem: string;
  evidence: string;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: string;
  priority: 'P1' | 'P2' | 'P3';
}

export interface ResilienceCommandSummary {
  recoveryReadinessScore: number;
  overallResilienceScore: number;
  rtoCompliancePercent: number;
  rpoCompliancePercent: number;
  backupSuccessPercent: number;
  restoreSuccessPercent: number;
  criticalGapsCount: number;
  activeSimulationsCount: number;
  evaluatedAt: string;
}

// ─── Phase 25: Enterprise Cloud Governance & Continuous Compliance ───────────────

export interface GovPolicy {
  id: string;
  name: string;
  description: string;
  category:
    | 'SECURITY'
    | 'COST'
    | 'RELIABILITY'
    | 'COMPLIANCE'
    | 'IDENTITY'
    | 'NETWORK'
    | 'DATA'
    | 'BACKUP'
    | 'OBSERVABILITY'
    | 'KUBERNETES'
    | 'SUPPLY_CHAIN'
    | 'RESILIENCE';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scope: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'DISABLED' | 'DEPRECATED';
  rule: string;
  evaluationMode: 'CONTINUOUS' | 'SCHEDULED' | 'EVENT_DRIVEN' | 'MANUAL';
  createdAt: string;
  updatedAt: string;
  owner: string;
}

export interface GovResource {
  id: string;
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
  account: string;
  region: string;
  service: string;
  resource: string;
  type: string;
  environment: string;
  owner: string;
  team: string;
  costCenter: string;
  tags: Record<string, string>;
  status: 'HEALTHY' | 'NON_COMPLIANT' | 'DRIFTED' | 'UNKNOWN';
  lastSeen: string;
}

export interface GovEvaluation {
  id: string;
  policyId: string;
  resourceId: string;
  timestamp: string;
  result: 'PASS' | 'FAIL' | 'WARN' | 'NOT_APPLICABLE' | 'UNKNOWN';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string;
  observedValue: string;
  expectedValue: string;
  evaluationVersion: string;
}

export interface GovException {
  id: string;
  policyId: string;
  resourceId: string;
  reason: string;
  owner: string;
  approvedBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
  scope: string;
}

export interface GovViolation {
  id: string;
  policyId: string;
  resourceId: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  owner: string;
  evidence: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'REMEDIATING' | 'RESOLVED' | 'SUPPRESSED';
  exceptionId?: string;
  detectedAt: string;
}

export interface GovRemediationWorkflow {
  id: string;
  violationId: string;
  policyId: string;
  resourceId: string;
  currentStage: 'DETECT' | 'ANALYZE' | 'APPROVE' | 'REMEDIATE' | 'VERIFY' | 'CLOSE';
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  mode: 'MANUAL' | 'ASSISTED' | 'SIMULATED' | 'AUTOMATED';
  approvedBy?: string;
  timeline: { stage: string; timestamp: string; status: string }[];
}

export interface GovEvidenceRecord {
  id: string;
  policyId: string;
  resourceId: string;
  result: 'PASS' | 'FAIL' | 'WARN' | 'NOT_APPLICABLE' | 'UNKNOWN';
  observedConfig: Record<string, any>;
  timestamp: string;
  source: string;
  evaluationVersion: string;
}

export interface GovFrameworkMapping {
  framework: string;
  controlId: string;
  controlName: string;
  policyIds: string[];
  passingCount: number;
  failingCount: number;
  coveragePercent: number;
}

export interface GovCommandSummary {
  governanceScore: number;
  compliancePercent: number;
  totalResourcesCount: number;
  compliantResourcesCount: number;
  nonCompliantResourcesCount: number;
  criticalViolationsCount: number;
  openViolationsCount: number;
  activeExceptionsCount: number;
  policyCoveragePercent: number;
  evaluatedAt: string;
}

// ─── Phase 26: AIOps & Observability Intelligence ─────────────────────────────

export interface AiOpsObservabilityEvent {
  id: string;
  timestamp: string;
  source: 'LIVE' | 'IMPORTED' | 'SIMULATED';
  sourceType: string;
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
  account: string;
  region: string;
  environment: string;
  service: string;
  resource: string;
  resourceType: string;
  eventType:
    | 'METRIC'
    | 'LOG'
    | 'TRACE'
    | 'ALERT'
    | 'INCIDENT'
    | 'DEPLOYMENT'
    | 'CONFIGURATION'
    | 'SECURITY'
    | 'COST'
    | 'KUBERNETES'
    | 'NETWORK'
    | 'DATABASE'
    | 'CLOUD'
    | 'USER';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metadata: Record<string, any>;
  traceId?: string;
  spanId?: string;
  correlationId?: string;
  incidentId?: string;
  status: string;
  createdAt: string;
}

export interface AiOpsCorrelation {
  id: string;
  primaryEventId: string;
  correlatedEventId: string;
  correlationScore: number;
  relationshipReason: string;
  factors: {
    temporalProximity: number;
    serviceMatch: number;
    resourceMatch: number;
    traceRelationship: number;
    deploymentRelationship: number;
    dependencyRelationship: number;
  };
  timestamp: string;
}

export interface AiOpsServiceHealth {
  service: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  healthScore: number;
  availabilityPercent: number;
  p95LatencyMs: number;
  errorRatePercent: number;
  trafficRps: number;
  anomaliesCount: number;
  dependencies: {
    service: string;
    type: string;
    classification: 'OBSERVED' | 'INFERRED' | 'UNKNOWN';
    latencyMs: number;
  }[];
  recentIncidentsCount: number;
  deploymentStatus: string;
  lastUpdated: string;
}

export interface AiOpsRootCauseCandidate {
  id: string;
  incidentId: string;
  candidate: string;
  confidencePercent: number;
  category:
    | 'DEPLOYMENT'
    | 'CONFIGURATION'
    | 'DEPENDENCY'
    | 'DATABASE'
    | 'NETWORK'
    | 'CAPACITY'
    | 'SECURITY';
  evidence: string[];
  affectedServices: string[];
  relatedEventIds: string[];
  reasoning: string;
  status: 'ANALYZED' | 'CONFIRMED' | 'DISMISSED';
}

export interface AiOpsPrediction {
  id: string;
  service: string;
  predictionType:
    | 'CAPACITY_EXHAUSTION'
    | 'LATENCY_DEGRADATION'
    | 'ERROR_SURGE'
    | 'SATURATION';
  timeHorizon: string;
  confidencePercent: number;
  modelStatus: 'ACTIVE_ONLINE' | 'CALIBRATING';
  predictedOutcome: string;
  contributingSignals: string[];
  recommendedMitigation: string;
  createdAt: string;
}

export interface AiOpsObservabilityQuality {
  overallScore: number;
  signalQualityScore: number;
  alertNoiseScore: number;
  telemetryFreshness: 'HEALTHY' | 'DEGRADED' | 'STALE' | 'UNKNOWN';
  metricCoveragePercent: number;
  logCoveragePercent: number;
  traceCoveragePercent: number;
  telemetryGaps: string[];
  evaluatedAt: string;
}

export interface AiOpsCommandSummary {
  activeIncidentsCount: number;
  overallSystemHealthScore: number;
  systemStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  activeAnomaliesCount: number;
  predictedRisksCount: number;
  alertDeduplicationRate: number;
  correlatedEventPairsCount: number;
  observabilityMaturityScore: number;
  evaluatedAt: string;
}

// ─── Phase 27: Agentic Cloud Operations & Controlled Autonomous Remediation ───

export interface AgentSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  objective: string;
  context: Record<string, any>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incidentId?: string;
  createdAt: string;
}

export interface AgentTask {
  id: string;
  sessionId: string;
  type:
    | 'INVESTIGATION'
    | 'INCIDENT_RESPONSE'
    | 'REMEDIATION'
    | 'COST_OPTIMIZATION'
    | 'SECURITY_RESPONSE'
    | 'RELIABILITY'
    | 'CAPACITY'
    | 'GOVERNANCE';
  objective: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface AgentPlan {
  id: string;
  taskId: string;
  objective: string;
  assumptions: string[];
  steps: {
    stepNumber: number;
    actionType: string;
    target: string;
    description: string;
    expectedOutcome: string;
  }[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiredPermissions: string[];
  expectedOutcome: string;
  rollbackStrategy: string;
  verificationPlan: string;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'EXECUTED';
}

export interface AgentAction {
  id: string;
  planId: string;
  actionType: string;
  target: string;
  parameters: Record<string, any>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mode:
    | 'OBSERVE_ONLY'
    | 'SIMULATE'
    | 'DRY_RUN'
    | 'ASSISTED'
    | 'APPROVED_EXECUTION';
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'BLOCKED' | 'CANCELLED';
  executionResult?: string;
  executedBy?: string;
  executedAt?: string;
}

export interface AgentApproval {
  id: string;
  actionId: string;
  planId: string;
  requester: string;
  approver?: string;
  reason: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  requestedAt: string;
  approvedAt?: string;
  expiresAt: string;
}

export interface AgentVerification {
  id: string;
  actionId: string;
  target: string;
  metric: string;
  beforeValue: string;
  afterValue: string;
  expectedOutcome: string;
  actualOutcome: string;
  status: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'FAILED_VERIFICATION' | 'UNKNOWN';
  verifiedAt: string;
}

export interface AgentAuditEvent {
  id: string;
  sessionId: string;
  actor: string;
  action: string;
  target: string;
  reason: string;
  risk: string;
  approvalId?: string;
  result: string;
  verificationStatus: string;
  timestamp: string;
}

export interface AgentOperationsSummary {
  activeSessionsCount: number;
  pendingApprovalsCount: number;
  runningActionsCount: number;
  completedActionsCount: number;
  verifiedRemediationsCount: number;
  safetyEnforcementRate: number;
  dryRunSimulationsCount: number;
  evaluatedAt: string;
}

// ─── Phase 28: Enterprise FinOps, Cloud Cost Intelligence & Business Impact ───

export interface FinOpsCostRecord28 {
  id: string;
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
  account: string;
  subscription?: string;
  project?: string;
  region: string;
  service: string;
  resource: string;
  resourceType: string;
  environment: string;
  team: string;
  application: string;
  category: string;
  usageAmount: number;
  usageUnit: string;
  cost: number;
  currency: string;
  billingPeriod: string;
  source: 'LIVE' | 'IMPORTED' | 'SIMULATED';
  metadata: Record<string, any>;
  createdAt: string;
}

export interface FinOpsUsageRecord {
  resource: string;
  service: string;
  metric: string;
  value: number;
  unit: string;
  timestamp: string;
  provider: string;
  region: string;
  environment: string;
}

export interface FinOpsBusinessImpact {
  service: string;
  application: string;
  incidentId?: string;
  monthlyInfrastructureCost: number;
  estimatedDowntimeCostPerHour: number;
  businessCriticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  userImpact: string;
  confidence: number;
  source: 'CONFIGURED_ESTIMATE' | 'OBSERVED' | 'UNKNOWN';
}

export interface FinOpsEnterpriseSummary {
  totalMonthlySpend: number;
  currency: string;
  projectedMonthEndSpend: number;
  budgetAmount: number;
  budgetUsedPercent: number;
  activeCostAnomaliesCount: number;
  potentialMonthlySavings: number;
  allocationReadinessScore: number;
  costOptimizationScore: number;
  evaluatedAt: string;
}

// ─── Phase 29: Cloud Platform Marketplace & Self-Service Developer Portal ────

export interface MarketplaceCatalogItem {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category:
    | 'COMPUTE'
    | 'DATABASE'
    | 'STORAGE'
    | 'NETWORKING'
    | 'CONTAINERS'
    | 'KUBERNETES'
    | 'SERVERLESS'
    | 'MESSAGING'
    | 'MONITORING'
    | 'SECURITY'
    | 'DATA'
    | 'AI_ML';
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes' | 'multi-cloud';
  supportedRegions: string[];
  supportedEnvironments: string[];
  version: string;
  owner: string;
  documentation: string;
  icon: string;
  status: 'AVAILABLE' | 'PREVIEW' | 'DEPRECATED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  costModel: string;
  provisioningMode: 'AUTOMATED' | 'APPROVAL_GATED';
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceResourceTemplate {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  provider: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    default?: any;
    allowedValues?: any[];
    description: string;
  }[];
  defaults: Record<string, any>;
  constraints: Record<string, any>;
  policies: string[];
  costModel: {
    baseMonthlyCost: number;
    currency: string;
  };
  securityRequirements: string[];
  provisioningWorkflow: string;
  rollbackStrategy: string;
  verificationStrategy: string;
}

export interface MarketplaceProvisioningRequest {
  id: string;
  requester: string;
  team: string;
  application: string;
  service: string;
  template: string;
  version: string;
  parameters: Record<string, any>;
  environment: 'development' | 'test' | 'staging' | 'production';
  region: string;
  estimatedMonthlyCost: number;
  currency: string;
  policyResult: 'PASS' | 'WARNING' | 'BLOCK';
  securityResult: 'PASS' | 'WARNING' | 'BLOCK';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
  provisioningStatus:
    | 'DRAFT'
    | 'VALIDATING'
    | 'BLOCKED'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'PROVISIONING'
    | 'PROVISIONED'
    | 'FAILED'
    | 'CANCELLED'
    | 'REJECTED'
    | 'UNKNOWN';
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceResourceRegistryItem {
  id: string;
  resourceName: string;
  provider: string;
  account: string;
  region: string;
  environment: string;
  team: string;
  application: string;
  owner: string;
  service: string;
  template: string;
  version: string;
  status:
    | 'REQUESTED'
    | 'PROVISIONED'
    | 'ACTIVE'
    | 'DEGRADED'
    | 'SUSPENDED'
    | 'DECOMMISSIONED';
  costMonthly: number;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'UNKNOWN';
  createdAt: string;
}

export interface MarketplaceSummary {
  catalogItemsCount: number;
  activeTemplatesCount: number;
  provisioningRequestsCount: number;
  managedResourcesCount: number;
  pendingApprovalsCount: number;
  policyComplianceRate: number;
  simulatedProvisioningsCount: number;
  evaluatedAt: string;
}

// ─── Phase 30: Multi-Cloud Disaster Recovery, Business Continuity & Resilience ─

export interface DisasterRecoveryPlan30 {
  id: string;
  name: string;
  description: string;
  service: string;
  application: string;
  environment: string;
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes' | 'multi-cloud';
  region: string;
  secondaryRegion: string;
  strategy:
    | 'BACKUP_RESTORE'
    | 'PILOT_LIGHT'
    | 'WARM_STANDBY'
    | 'HOT_STANDBY'
    | 'ACTIVE_ACTIVE'
    | 'MULTI_REGION'
    | 'MULTI_CLOUD';
  targetRpoMinutes: number;
  targetRtoMinutes: number;
  actualRpoMinutes: number;
  actualRtoMinutes: number;
  rpoStatus: 'WITHIN_TARGET' | 'EXCEEDED' | 'NOT_MEASURED';
  rtoStatus: 'WITHIN_TARGET' | 'EXCEEDED' | 'NOT_MEASURED';
  dependencies: string[];
  steps: {
    stepNumber: number;
    action: string;
    target: string;
    estimatedDurationMinutes: number;
  }[];
  rollbackPlan: string;
  verificationPlan: string;
  owner: string;
  status: 'APPROVED' | 'DRAFT' | 'REVIEW' | 'DEPRECATED';
  lastTestedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisasterRecoveryDrill {
  id: string;
  planId: string;
  service: string;
  scenario:
    | 'SERVICE_FAILURE'
    | 'DATABASE_FAILURE'
    | 'REGION_FAILURE'
    | 'ZONE_FAILURE'
    | 'NETWORK_FAILURE'
    | 'IDENTITY_FAILURE'
    | 'STORAGE_FAILURE'
    | 'KUBERNETES_FAILURE'
    | 'CLOUD_PROVIDER_FAILURE'
    | 'EXTERNAL_DEPENDENCY_FAILURE';
  type: 'SIMULATION' | 'TECHNICAL_DRILL' | 'TABLETOP';
  status:
    | 'PLANNED'
    | 'SCHEDULED'
    | 'RUNNING'
    | 'PASSED'
    | 'FAILED'
    | 'PARTIAL'
    | 'CANCELLED';
  durationMinutes: number;
  measuredRtoMinutes: number;
  measuredRpoMinutes: number;
  findings: string[];
  evidence: string[];
  conductedBy: string;
  timestamp: string;
}

export interface DisasterRecoveryBackup {
  id: string;
  resource: string;
  service: string;
  backupType: 'SNAPSHOT' | 'CONTINUOUS_WAL' | 'OBJECT_ARCHIVE';
  frequency: string;
  retentionDays: number;
  lastBackupTimestamp: string;
  backupAgeHours: number;
  healthStatus: 'HEALTHY' | 'STALE' | 'FAILED' | 'EXPIRED';
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'RESTORE_TESTED';
  lastRestoreTestTimestamp: string;
}

export interface DisasterRecoverySummary {
  overallResilienceScore: number;
  criticalServicesCount: number;
  activeRecoveryPlansCount: number;
  spofCount: number;
  rtoComplianceRate: number;
  rpoComplianceRate: number;
  backupVerificationRate: number;
  passedDrillsCount: number;
  evaluatedAt: string;
}

// ─── Phase 31: Cloud Data Intelligence, Event Streaming & Decision Engine ───

export interface CloudEventEnvelope {
  id: string;
  timestamp: string;
  source:
    | 'aws'
    | 'azure'
    | 'gcp'
    | 'kubernetes'
    | 'application'
    | 'security'
    | 'finops'
    | 'resilience'
    | 'internal';
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes' | 'multi-cloud';
  region: string;
  environment: 'development' | 'test' | 'staging' | 'production';
  account: string;
  service: string;
  resource: string;
  resourceId: string;
  eventType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  payload: Record<string, any>;
  correlationId: string;
  traceId: string;
  causationId?: string;
  tenant: string;
  tags: Record<string, string>;
  status:
    | 'INGESTED'
    | 'NORMALIZED'
    | 'ENRICHED'
    | 'CORRELATED'
    | 'DECIDED'
    | 'DISPATCHED'
    | 'FAILED'
    | 'DEAD_LETTERED';
  ingestionMode: 'LIVE' | 'SIMULATED' | 'IMPORTED' | 'REPLAYED' | 'GENERATED';
  processingLatencyMs: number;
}

export interface EventCorrelationGroup {
  id: string;
  correlationId: string;
  name: string;
  ruleId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  service: string;
  eventIds: string[];
  eventsCount: number;
  rootCauseHypothesis: string;
  status: 'ACTIVE' | 'RESOLVED' | 'SUPPRESSED';
  firstEventTimestamp: string;
  lastEventTimestamp: string;
  decisionId?: string;
}

export interface EventDecisionRecord {
  id: string;
  correlationGroupId: string;
  ruleId: string;
  ruleName: string;
  service: string;
  condition: string;
  evidence: string[];
  confidenceScore: number;
  outcome:
    | 'CREATE_INCIDENT'
    | 'SCALE_SERVICE'
    | 'TRIGGER_FAILOVER'
    | 'FINOPS_ALERT'
    | 'SECURITY_BLOCK'
    | 'NO_ACTION';
  recommendedAction: string;
  policyGateStatus:
    | 'APPROVED'
    | 'REQUIRES_OPERATOR_APPROVAL'
    | 'BLOCKED_BY_POLICY';
  status: 'EVALUATED' | 'APPROVED' | 'EXECUTED' | 'DISMISSED';
  timestamp: string;
}

export interface EventSchemaDefinition {
  eventType: string;
  version: string;
  provider: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  status: 'ACTIVE' | 'DEPRECATED';
  compatibility: 'BACKWARD_COMPATIBLE' | 'BREAKING';
}

export interface EventDeadLetterRecord {
  id: string;
  eventId: string;
  reason: string;
  failureStage:
    | 'VALIDATION'
    | 'NORMALIZATION'
    | 'ENRICHMENT'
    | 'CORRELATION'
    | 'DECISION';
  retryCount: number;
  rawPayload: Record<string, any>;
  firstFailureTimestamp: string;
  lastFailureTimestamp: string;
  status: 'QUEUED' | 'RETRYING' | 'RESOLVED' | 'DROPPED';
}

export interface EventIntelligencePipelineSummary {
  healthScore: number;
  eventsPerSecond: number;
  eventsPerMinute: number;
  totalIngestedCount: number;
  totalProcessedCount: number;
  correlatedIncidentsCount: number;
  decisionsCount: number;
  deadLetterQueueCount: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  consumerLag: number;
  evaluatedAt: string;
}

// ─── Phase 32: Cloud Service Mesh & Distributed Traffic Engineering ──────────

export interface MeshService {
  serviceId: string;
  name: string;
  description: string;
  owner: string;
  team: string;
  environment: 'development' | 'test' | 'staging' | 'production';
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes' | 'multi-cloud';
  region: string;
  namespace: string;
  version: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'CONFIG_ERROR' | 'UNKNOWN';
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  healthScore: number;
  replicas: number;
  dependencies: string[];
  endpoints: string[];
  labels: Record<string, string>;
  mTLSEnabled: boolean;
  certificateStatus: 'VALID' | 'EXPIRING' | 'INVALID' | 'DISABLED';
}

export interface MeshServiceInstance {
  instanceId: string;
  serviceId: string;
  version: string;
  region: string;
  zone: string;
  status: 'RUNNING' | 'TERMINATING' | 'CRASHLOOP' | 'UNKNOWN';
  health: 'HEALTHY' | 'UNHEALTHY';
  cpuPercent: number;
  memoryPercent: number;
  latencyMs: number;
  errorRatePercent: number;
  requestRateRps: number;
}

export interface MeshRoute {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ALL';
  service: string;
  version: string;
  weight: number;
  priority: number;
  authRequired: boolean;
  rateLimitRps: number;
  timeoutMs: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
    retryableStatuses: number[];
  };
  circuitBreaker: {
    failureThresholdPercent: number;
    cooldownSeconds: number;
  };
  cachingEnabled: boolean;
  region: string;
  environment: string;
}

export interface MeshTrafficSplit {
  service: string;
  mode: 'STATIC' | 'CANARY' | 'BLUE_GREEN';
  canaryStepPercent?: number;
  splits: {
    version: string;
    weight: number;
    requestsCount: number;
    errorRatePercent: number;
    latencyP95Ms: number;
    estimatedCostPerHour: number;
  }[];
}

export interface MeshCircuitBreaker {
  service: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureThresholdPercent: number;
  consecutiveFailures: number;
  cooldownSeconds: number;
  lastStateChange: string;
}

export interface MeshTrafficPolicy {
  id: string;
  name: string;
  description: string;
  scope:
    | 'PRODUCTION_STRICT'
    | 'DEVELOPMENT_FLEXIBLE'
    | 'PAYMENT_CRITICAL'
    | 'PUBLIC_API';
  timeoutMs: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
  rateLimitRps: number;
  mTLSMode: 'STRICT' | 'PERMISSIVE' | 'DISABLED';
  active: boolean;
}

export interface MeshReleaseGuardEvaluation {
  service: string;
  version: string;
  decision: 'SAFE_TO_PROCEED' | 'CAUTION' | 'BLOCKED' | 'UNKNOWN';
  confidenceScore: number;
  evidence: string[];
  checks: {
    name: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    message: string;
  }[];
  timestamp: string;
}

export interface MeshSummary {
  totalServicesCount: number;
  activeRoutesCount: number;
  circuitBreakersCount: {
    closed: number;
    open: number;
    halfOpen: number;
  };
  activeCanariesCount: number;
  overallMeshHealthScore: number;
  totalThroughputRps: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  mTLSComplianceRate: number;
  evaluatedAt: string;
}

// ─── Phase 33: Kubernetes Platform & Workload Orchestration ──────────────────

export interface K8sCluster {
  clusterId: string;
  name: string;
  provider: 'aws' | 'azure' | 'gcp' | 'bare-metal' | 'kind';
  region: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  healthScore: number;
  controlPlaneStatus: 'READY' | 'DEGRADED';
  nodeCount: number;
  podCount: number;
  namespaceCount: number;
  cpuCapacityCores: number;
  cpuAllocatedCores: number;
  memoryCapacityGb: number;
  memoryAllocatedGb: number;
  storageCapacityGb: number;
  storageAllocatedGb: number;
  ingestionMode: 'LIVE' | 'SIMULATED' | 'IMPORTED' | 'UNKNOWN';
  monthlyCostEstimate: number;
  lastUpdated: string;
}

export interface K8sNode {
  nodeId: string;
  name: string;
  clusterId: string;
  status: 'READY' | 'NOT_READY' | 'CORDONED';
  instanceType: string;
  region: string;
  zone: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  diskUsagePercent: number;
  podCount: number;
  maxPods: number;
  conditions: {
    type: string;
    status: 'True' | 'False';
    reason: string;
  }[];
  taints: {
    key: string;
    value: string;
    effect: string;
  }[];
  labels: Record<string, string>;
  age: string;
}

export interface K8sNamespace {
  namespaceId: string;
  name: string;
  clusterId: string;
  status: 'ACTIVE' | 'TERMINATING';
  owner: string;
  cpuUsageCores: number;
  memoryUsageGb: number;
  podCount: number;
  resourceQuota: {
    cpuLimit: string;
    memoryLimit: string;
    podsLimit: number;
  };
  monthlyCostEstimate: number;
}

export interface K8sWorkload {
  workloadId: string;
  name: string;
  namespace: string;
  kind: 'Deployment' | 'StatefulSet' | 'DaemonSet' | 'Job' | 'CronJob';
  desiredReplicas: number;
  readyReplicas: number;
  availableReplicas: number;
  unavailableReplicas: number;
  image: string;
  cpuRequestCores: number;
  cpuLimitCores: number;
  memoryRequestMb: number;
  memoryLimitMb: number;
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'PROGRESSING';
  restartCount: number;
}

export interface K8sPod {
  podId: string;
  name: string;
  namespace: string;
  node: string;
  workloadName: string;
  status:
    | 'Running'
    | 'Pending'
    | 'Succeeded'
    | 'Failed'
    | 'CrashLoopBackOff'
    | 'ImagePullBackOff'
    | 'Terminating';
  ip: string;
  age: string;
  restarts: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  containers: {
    name: string;
    image: string;
    ready: boolean;
    restarts: number;
    state: string;
  }[];
  failureReason?: string;
}

export interface K8sAutoscaler {
  hpaId: string;
  workload: string;
  namespace: string;
  minReplicas: number;
  maxReplicas: number;
  currentReplicas: number;
  targetCpuUtilization: number;
  currentCpuUtilization: number;
  lastScalingEvent: string;
}

export interface K8sSummary {
  totalClustersCount: number;
  healthyClustersCount: number;
  totalNodesCount: number;
  totalPodsCount: number;
  pendingPodsCount: number;
  failedPodsCount: number;
  restartingPodsCount: number;
  overallClusterHealthScore: number;
  totalCpuUtilizationPercent: number;
  totalMemoryUtilizationPercent: number;
  estimatedMonthlySpend: number;
  evaluatedAt: string;
}

// ─── Phase 34: Cloud Identity, IAM & Zero-Trust Security Control Plane ────────

export interface CloudIdentityRecord {
  identityId: string;
  name: string;
  type: 'HUMAN' | 'SERVICE' | 'WORKLOAD' | 'FEDERATED' | 'TEMPORARY';
  provider: 'aws' | 'azure' | 'gcp' | 'okta' | 'kubernetes' | 'cloudpulse';
  account: string;
  owner: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastUsed: string;
  createdAt: string;
  authenticationMethod: 'SAML' | 'OIDC' | 'PASSWORD' | 'CERTIFICATE' | 'SERVICE_TOKEN';
  mfaStatus: 'ENABLED' | 'DISABLED' | 'EXEMPT';
  privilegeLevel: 'VIEWER' | 'DEVELOPER' | 'OPERATOR' | 'ADMIN';
  environment: 'development' | 'staging' | 'production';
  roles: string[];
  tags: Record<string, string>;
}

export interface CloudIamRole {
  roleId: string;
  name: string;
  provider: string;
  type:
    | 'Human'
    | 'Service'
    | 'Workload'
    | 'Developer'
    | 'Operator'
    | 'Admin'
    | 'Viewer'
    | 'Security'
    | 'FinOps';
  permissions: string[];
  assignedCount: number;
  riskScore: number;
  hasWildcard: boolean;
  status: 'ACTIVE' | 'DEPRECATED';
}

export interface CloudIamPolicy {
  policyId: string;
  name: string;
  version: string;
  effect: 'ALLOW' | 'DENY';
  actions: string[];
  resources: string[];
  conditions: Record<string, any>;
  isAttached: boolean;
}

export interface CloudAccessRequest {
  requestId: string;
  requester: string;
  resource: string;
  permission: string;
  reason: string;
  durationMinutes: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'REVOKED';
  approver?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CloudIamEvaluation {
  decision: 'ALLOW' | 'DENY' | 'CONDITIONAL' | 'UNKNOWN';
  identity: string;
  action: string;
  resource: string;
  matchedPolicies: string[];
  denialReason?: string;
  mfaRequired: boolean;
  approvalRequired: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export interface CloudIdentitySummary {
  totalIdentitiesCount: number;
  humanIdentitiesCount: number;
  serviceIdentitiesCount: number;
  workloadIdentitiesCount: number;
  privilegedIdentitiesCount: number;
  highRiskIdentitiesCount: number;
  mfaCompliancePercent: number;
  leastPrivilegeScore: number;
  activeAccessRequestsCount: number;
  evaluatedAt: string;
}

// ─── Phase 35: Advanced AI/ML & Predictive Cloud Intelligence ─────────────────

export interface PredictiveForecast {
  forecastId: string;
  target: string;
  entity: string;
  currentValue: number;
  forecastHorizon: string;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidencePercent: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OBSERVED' | 'PREDICTED' | 'WHAT_IF';
  timestamp: string;
}

export interface AdvancedPredictiveAnomaly {
  anomalyId: string;
  metric: string;
  entity: string;
  baselineValue: number;
  observedValue: number;
  deviationPercent: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  confidencePercent: number;
  contributingFactors: string[];
  timestamp: string;
}

export interface PredictiveIncidentRisk {
  predictionId: string;
  affectedService: string;
  incidentCategory: string;
  probabilityPercent: number;
  forecastWindow: string;
  contributingSignals: string[];
  recommendedAction: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export interface PredictiveModelRecord {
  modelId: string;
  name: string;
  version: string;
  type: 'TIME_SERIES_FORECAST' | 'ANOMALY_DETECTOR' | 'INCIDENT_PREDICTOR' | 'CAPACITY_PLANNER';
  status: 'ACTIVE' | 'TRAINING' | 'DEGRADED';
  modelTypeLabel: 'SIMULATED MODEL' | 'RULE-BASED PREDICTION' | 'ML_INFERENCE';
  mae: number;
  rmse: number;
  f1Score: number;
  driftStatus: 'HEALTHY' | 'WARNING' | 'DEGRADED';
  lastTrained: string;
}

export interface PredictiveIntelligenceSummary {
  overallPredictiveRiskScore: number;
  activeAnomaliesCount: number;
  highProbabilityIncidentsCount: number;
  budgetBreachPredicted: boolean;
  capacityExhaustionAlertsCount: number;
  registeredModelsCount: number;
  modelDriftAlertsCount: number;
  evaluatedAt: string;
}

// ─── Phase 36: Infrastructure-as-Code & Advanced Platform Automation ──────────

export interface IaCProject {
  projectId: string;
  name: string;
  description: string;
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes' | 'multi-cloud';
  environment: 'development' | 'staging' | 'production';
  stacksCount: number;
  resourcesCount: number;
  monthlyCostEstimate: number;
  lastDeployedAt: string;
  status: 'ACTIVE' | 'DRIFTED' | 'PROVISIONING' | 'FAILED';
}

export interface IaCStack {
  stackId: string;
  projectId: string;
  name: string;
  template: string;
  version: string;
  status: 'SYNCHRONIZED' | 'DRIFTED' | 'APPLYING' | 'DESTROYED';
  resources: string[];
  outputs: Record<string, string>;
  stateVersion: number;
  isLocked: boolean;
}

export interface IaCBlueprint {
  blueprintId: string;
  name: string;
  category: 'Web Application' | 'Microservices' | 'Kubernetes Platform' | 'Data Pipeline' | 'Disaster Recovery';
  description: string;
  resources: string[];
  parameters: Record<string, any>;
  estimatedMonthlyCost: number;
  availabilityTier: 'Single-AZ' | 'Multi-AZ' | 'Multi-Region';
  securityRequirements: string[];
}

export interface IaCPlanChange {
  changeId: string;
  action: 'CREATE' | 'UPDATE' | 'DESTROY';
  resourceType: string;
  resourceName: string;
  oldState?: any;
  newState?: any;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  costImpactMonthly: number;
}

export interface IaCPlan {
  planId: string;
  stackId: string;
  actionCounts: {
    create: number;
    update: number;
    destroy: number;
  };
  changes: IaCPlanChange[];
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  costDeltaMonthly: number;
  policyChecks: {
    passed: number;
    warnings: number;
    blocked: number;
  };
  status: 'PLANNED' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'ROLLED_BACK';
  createdAt: string;
}

export interface IaCDriftRecord {
  driftId: string;
  stackId: string;
  resourceName: string;
  resourceType: string;
  declaredValue: any;
  observedValue: any;
  driftType: 'CONFIG_MISMATCH' | 'MISSING_RESOURCE' | 'UNEXPECTED_RESOURCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  remediationRecommendation: string;
  firstDetected: string;
}

export interface IaCDeploymentExecution {
  deploymentId: string;
  planId: string;
  stackId: string;
  status:
    | 'QUEUED'
    | 'VALIDATING'
    | 'AWAITING_APPROVAL'
    | 'APPROVED'
    | 'EXECUTING'
    | 'VERIFYING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'ROLLED_BACK';
  executionMode: 'DRY_RUN' | 'SIMULATED' | 'LIVE';
  steps: {
    name: string;
    status: string;
    durationMs: number;
  }[];
  triggeredBy: string;
  approvedBy?: string;
  rollbackPlanAvailable: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface IaCCommandSummary {
  totalProjectsCount: number;
  totalManagedResourcesCount: number;
  activeDeploymentsCount: number;
  pendingApprovalsCount: number;
  detectedDriftsCount: number;
  deploymentSuccessRatePercent: number;
  estimatedTotalMonthlySpend: number;
  evaluatedAt: string;
}

// ─── Phase 37: Cloud Compliance + Policy-as-Code Governance Center ─────────────

export interface ComplianceFrameworkRecord {
  frameworkId: string;
  name: string;
  version: string;
  category: 'CIS' | 'NIST' | 'SOC2' | 'ISO27001' | 'PCI-DSS' | 'GDPR' | 'CUSTOM';
  supportLevel: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'CUSTOM';
  totalControlsCount: number;
  passingControlsCount: number;
  compliancePercent: number;
  lastAssessedAt: string;
}

export interface ComplianceControlRecord {
  controlId: string;
  frameworkId: string;
  title: string;
  description: string;
  domain: 'IAM' | 'ENCRYPTION' | 'NETWORK' | 'LOGGING' | 'BACKUP' | 'VULNERABILITY' | 'KUBERNETES' | 'FINOPS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'EXEMPT';
  applicablePolicyId: string;
  owner: string;
}

export interface ComplianceGovernancePolicy {
  policyId: string;
  name: string;
  version: string;
  description: string;
  domain: 'IAM' | 'ENCRYPTION' | 'NETWORK' | 'LOGGING' | 'BACKUP' | 'VULNERABILITY' | 'KUBERNETES' | 'FINOPS';
  enforcementMode: 'BLOCKING' | 'AUDIT' | 'DISABLED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ruleExpression: string;
  remediationGuidance: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
}

export interface ComplianceFindingRecord {
  findingId: string;
  frameworkId: string;
  controlId: string;
  policyId: string;
  resourceId: string;
  resourceType: string;
  resourceName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'REMEDIATED' | 'VERIFIED' | 'WAIVED' | 'EXPIRED';
  evidence: string;
  firstDetected: string;
  lastDetected: string;
  owner: string;
  remediationPlan: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
}

export interface PolicyExceptionRecord {
  exceptionId: string;
  policyId: string;
  resourceId: string;
  scope: string;
  reason: string;
  requester: string;
  approver: string;
  expiresAt: string;
  compensatingControl: string;
  isExpired: boolean;
}

export interface ComplianceEvidenceRecord {
  evidenceId: string;
  findingId: string;
  source: 'CONFIG' | 'IAM' | 'K8S' | 'IAC' | 'LOGS' | 'TELEMETRY' | 'SECURITY';
  provenance: 'OBSERVED' | 'SIMULATED' | 'CALCULATED';
  confidencePercent: number;
  evidenceData: any;
  collectedAt: string;
}

export interface ComplianceGovernanceSummary {
  overallComplianceScorePercent: number;
  totalEvaluatedControlsCount: number;
  passingControlsCount: number;
  openFindingsCount: number;
  criticalFindingsCount: number;
  activeExceptionsCount: number;
  expiredExceptionsCount: number;
  frameworkScores: Record<string, number>;
  evaluatedAt: string;
}

// ─── Phase 38: Advanced FinOps + Sustainability / GreenOps Intelligence ────────

export interface AdvancedFinOpsSummary {
  totalMonthlySpend: number;
  forecastedMonthEndSpend: number;
  budgetCeiling: number;
  budgetUtilizationPercent: number;
  budgetBreachPredicted: boolean;
  allocationCoveragePercent: number;
  resourceEfficiencyScore: number;
  estimatedMonthlyCo2eKg: number;
  verifiedRealizedSavingsMonthly: number;
  activeSavingsOpportunitiesCount: number;
  evaluatedAt: string;
}

export interface GreenOpsMetric {
  region: string;
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes';
  energyKwhMonthly: number;
  carbonIntensityGramsPerKwh: number;
  estimatedCo2eKgMonthly: number;
  resourceEfficiencyPercent: number;
  pueRatio: number;
  cleanEnergyPercent: number;
  provenance: 'ESTIMATED' | 'CALCULATED';
}

export interface AdvancedUnitEconomicsMetric {
  metricName: string;
  unitCost: number;
  businessVolume: number;
  cloudCostTotal: number;
  unitLabel: string;
  period: string;
  efficiencyStatus: 'OPTIMAL' | 'ELEVATED' | 'DEGRADED';
}

export interface SavingsOpportunityRecord {
  opportunityId: string;
  title: string;
  resourceId: string;
  resourceType: string;
  category: 'IDLE_RESOURCE' | 'RIGHTSIZING' | 'STORAGE_TIERING' | 'RESERVATION' | 'K8S_BINPACKING';
  estimatedMonthlySavings: number;
  confidencePercent: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  status: 'IDENTIFIED' | 'APPROVED' | 'IN_PROGRESS' | 'VERIFIED';
}

export interface RealizedSavingsRecord {
  savingId: string;
  opportunityId: string;
  resourceName: string;
  baselineMonthlyCost: number;
  postChangeMonthlyCost: number;
  verifiedSavingsMonthly: number;
  verifiedAt: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'UNKNOWN';
}

export interface GreenOpsScenarioSimulation {
  scenarioId: string;
  name: string;
  trafficMultiplier: number;
  targetRegion: string;
  estimatedSpendDelta: number;
  estimatedCo2eDeltaPercent: number;
  estimatedLatencyDeltaMs: number;
  tradeoffSummary: string;
  provenance: 'SIMULATED';
}

// ─── Phase 39: Enterprise Command Center + Executive Intelligence ─────────────

export interface EnterpriseHealthScorecard {
  overallHealthScore: number;
  scoreTrendPercent: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  contributors: {
    reliability: number;
    security: number;
    compliance: number;
    finops: number;
    resilience: number;
    infrastructure: number;
  };
  evaluatedAt: string;
}

export interface EnterpriseRiskRecord {
  riskId: string;
  title: string;
  category: 'SECURITY' | 'COMPLIANCE' | 'RELIABILITY' | 'COST' | 'RESILIENCE' | 'KUBERNETES' | 'DEPLOYMENT' | 'PREDICTIVE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  affectedAsset: string;
  businessImpact: string;
  evidence: string;
  recommendation: string;
  owner: string;
  status: 'OPEN' | 'MITIGATING' | 'RESOLVED';
  source: 'OBSERVED' | 'CALCULATED' | 'PREDICTED';
}

export interface BusinessImpactMetric {
  impactId: string;
  affectedBusinessUnit: string;
  affectedApplication: string;
  affectedUsersCount: number;
  estimatedRevenueImpactPerHour: number;
  estimatedDowntimeMinutes: number;
  customerImpactSeverity: 'NONE' | 'LOW' | 'DEGRADED' | 'OUTAGE';
  confidencePercent: number;
  provenance: 'CALCULATED' | 'SIMULATED';
}

export interface EnterpriseSituationRoomEvent {
  eventId: string;
  domain: 'INCIDENTS' | 'SECURITY' | 'COMPLIANCE' | 'FINOPS' | 'DEPLOYMENT' | 'PREDICTIVE' | 'RESILIENCE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  affectedResource: string;
  timestamp: string;
  actionRoute: string;
}

export interface ExecutiveBriefingSummary {
  briefingDate: string;
  overallHealth: string;
  biggestRisks: string[];
  activeIncidentsCount: number;
  financialStatus: string;
  securityStatus: string;
  resilienceStatus: string;
  engineeringChangesCount: number;
  sustainabilityStatus: string;
  predictedRisks: string[];
  recommendedPriorities: string[];
  evaluatedAt: string;
}

export interface EnterpriseCommandCenterSummary {
  health: EnterpriseHealthScorecard;
  topRisks: EnterpriseRiskRecord[];
  businessImpact: BusinessImpactMetric;
  situationRoomEvents: EnterpriseSituationRoomEvent[];
  briefing: ExecutiveBriefingSummary;
  activeIncidentsCount: number;
  monthlySpend: number;
  realizedSavingsMonthly: number;
  complianceScorePercent: number;
  resilienceReadinessPercent: number;
  evaluatedAt: string;
}






















// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  ok: true;
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  checks: Record<string, 'ok' | 'error'>;
}

// ─── Phase 41: Real User Identity, Multi-Tenant Workspaces & Real AWS Cloud Connectivity ────

export type RealUserRole = 'OWNER' | 'ADMIN' | 'PLATFORM_ENGINEER' | 'SECURITY' | 'FINOPS' | 'DEVELOPER' | 'READ_ONLY';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: 'google' | 'microsoft' | 'apple' | 'email';
  role: RealUserRole;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  organizationId: string;
  workspaceId: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: 'ENTERPRISE' | 'PRO' | 'FREE';
  createdAt: string;
  ownerId: string;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  workspaceId: string;
  role: RealUserRole;
  joinedAt: string;
}

export interface CloudConnection {
  id: string;
  organizationId: string;
  workspaceId: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  displayName: string;
  accountIdentifier: string;
  accountOrProjectIdentifier?: string | undefined;
  status: 'CONNECTED' | 'DISCONNECTED' | 'AUTHORIZATION_REQUIRED' | 'PERMISSION_ERROR' | 'DEGRADED' | 'ERROR';
  authorizationType: 'ASSUME_ROLE_CROSS_ACCOUNT' | 'IAM_IDENTITY_CENTER' | 'OIDC_FEDERATED' | 'AZURE_ENTRA_APP' | 'AZURE_MANAGED_IDENTITY' | 'AZURE_WORKLOAD_IDENTITY' | 'GCP_SERVICE_ACCOUNT' | 'GCP_WORKLOAD_IDENTITY_FEDERATION' | 'OIDC_CROSS_CLOUD' | string;
  roleArn?: string | undefined;
  externalId?: string | undefined;
  tenantId?: string | undefined;
  subscriptionId?: string | undefined;
  clientId?: string | undefined;
  projectId?: string | undefined;
  projectNumber?: string | undefined;
  clientEmail?: string | undefined;
  accessibleRegions: string[];
  regionsOrLocations?: string[] | undefined;
  cloudScope?: CloudProviderStructure | undefined;
  capabilities?: CloudProviderCapability[] | undefined;
  permissionStatus: {
    totalRequired: number;
    granted: number;
    missing: string[];
  };
  connectedAt: string;
  lastValidatedAt: string;
  lastSyncAt: string;
  createdBy: string;
  metadata?: Record<string, any> | undefined;
  dataSource: 'LIVE' | 'NOT_CONNECTED' | 'PERMISSION_REQUIRED' | 'UNAVAILABLE';
}

export interface AwsPermissionDiagnostic {
  permission: string;
  purpose: string;
  status: 'GRANTED' | 'MISSING' | 'OPTIONAL';
  impact: string;
}

export interface AwsNormalizedResource {
  id: string;
  provider: 'AWS';
  account: string;
  region: string;
  service: 'EC2' | 'S3' | 'RDS' | 'LAMBDA' | 'VPC' | 'EKS' | 'IAM';
  resourceId: string;
  resourceName: string;
  status: string;
  tags: Record<string, string>;
  createdAt?: string;
  metadata: Record<string, any>;
  lastSeen: string;
  dataSource: 'LIVE' | 'NOT_CONNECTED' | 'UNKNOWN';
}

export interface AwsRealAccountData {
  accountIdentity: {
    accountId: string;
    arn: string;
    userId: string;
  };
  regions: string[];
  resources: AwsNormalizedResource[];
  cloudWatchMetrics: {
    ec2CpuUtilization?: number;
    rdsConnections?: number;
    albLatencyMs?: number;
  };
  costData: {
    currentMonthSpend: number;
    currency: string;
    isAvailable: boolean;
    message?: string;
  };
  iamSummary: {
    usersCount: number;
    rolesCount: number;
    mfaEnabledPercent: number;
  };
  permissionDiagnostics: AwsPermissionDiagnostic[];
  provenance: 'LIVE' | 'NOT_CONNECTED' | 'CALCULATED' | 'PERMISSION_REQUIRED';
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  organization: Organization;
  workspace: Workspace;
}

export interface ConfiguredIdentityProvider {
  enabled: boolean;
  name: string;
  configured: boolean;
  allowsRegistration?: boolean | undefined;
  authUrl?: string | undefined;
  reason?: string | undefined;
}

export interface ConfiguredProvidersSummary {
  emailPassword: { enabled: boolean; allowsRegistration: boolean };
  google: ConfiguredIdentityProvider;
  microsoft: ConfiguredIdentityProvider;
  apple: ConfiguredIdentityProvider;
}

export interface OAuthAuthorizationResponse {
  authorizationUrl: string;
  state: string;
}

// ─── Phase 42: Real AWS Cloud Intelligence & Resource Analysis ────────────────

export type AwsServiceType =
  | 'EC2'
  | 'S3'
  | 'RDS'
  | 'LAMBDA'
  | 'EKS'
  | 'VPC'
  | 'ELB'
  | 'CLOUDWATCH'
  | 'IAM'
  | 'DYNAMODB'
  | 'SQS'
  | 'SNS'
  | 'CLOUDFRONT'
  | 'ROUTE53';

export interface AwsCloudResource {
  id: string;
  provider: 'AWS';
  accountId: string;
  region: string;
  service: AwsServiceType;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  status: string;
  healthState: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  healthReasons: string[];
  tags: Record<string, string>;
  metadata: Record<string, any>;
  relationships: {
    type: string;
    targetResourceId: string;
    targetServiceName: string;
  }[];
  securityFindings: {
    id: string;
    ruleId: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    evidence: string;
    remediation: string;
  }[];
  governanceStatus: 'PASS' | 'FAIL' | 'NOT_EVALUATED';
  estimatedMonthlyCost: number;
  dataSource: 'LIVE' | 'CALCULATED' | 'ESTIMATED' | 'UNKNOWN';
  lastSeenAt: string;
}

export interface AwsResourceInventorySummary {
  accountId: string;
  totalResources: number;
  resourcesByService: Record<string, number>;
  resourcesByRegion: Record<string, number>;
  overallHealth: {
    healthy: number;
    warning: number;
    critical: number;
    unknown: number;
  };
  topOptimizationOpportunities: {
    title: string;
    evidence: string;
    potentialBenefit: string;
    confidence: number;
    resourceId: string;
  }[];
  topSecurityFindings: {
    title: string;
    severity: string;
    resourceId: string;
    service: string;
  }[];
  governanceSummary: {
    totalEvaluated: number;
    passCount: number;
    failCount: number;
    complianceScorePercent: number;
  };
  provenance: 'LIVE' | 'NOT_CONNECTED' | 'CALCULATED';
}

export interface AwsSimpleTopologyNode {
  id: string;
  label: string;
  type: 'ACCOUNT' | 'REGION' | 'VPC' | 'SUBNET' | 'SERVICE' | 'RESOURCE';
  service: string;
  status: string;
  parentId?: string;
}

export interface AwsSimpleTopologyGraph {
  nodes: AwsSimpleTopologyNode[];
  edges: {
    source: string;
    target: string;
    relationship: string;
  }[];
  provenance: 'LIVE' | 'NOT_CONNECTED' | 'CALCULATED';
}

export interface AwsSyncStatus {
  status: 'IDLE' | 'SYNCING' | 'SYNC_COMPLETE' | 'SYNC_FAILED';
  lastSyncAt: string;
  durationMs: number;
  recordsSynced: number;
  errorsCount: number;
  servicesSynced: string[];
}

// ─── Phase 43: Real AWS Continuous Monitoring, Event Ingestion & Change Intelligence ──

export type AwsActorType =
  | 'IAM_USER'
  | 'ASSUMED_ROLE'
  | 'FEDERATED'
  | 'AWS_SERVICE'
  | 'ROOT'
  | 'UNKNOWN';

export interface AwsRealEvent {
  id: string;
  workspaceId: string;
  organizationId: string;
  connectionId: string;
  provider: 'AWS';
  accountId: string;
  region: string;
  eventType: string;
  source: 'aws.cloudtrail' | 'aws.eventbridge' | 'aws.cloudwatch' | 'aws.config';
  timestamp: string;
  receivedAt: string;
  actor: {
    name: string;
    type: AwsActorType;
    principalId: string;
    sourceIp?: string;
    userAgent?: string;
  };
  action: string;
  resourceId: string;
  resourceType: string;
  service: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  isHighRisk: boolean;
  riskReason?: string;
  previousState?: Record<string, any>;
  currentState?: Record<string, any>;
  correlationId?: string;
  relatedEventIds?: string[];
  relatedIncidentId?: string;
  impacts: {
    securityImpact?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    costImpact?: 'INCREASE' | 'DECREASE' | 'NEUTRAL' | 'UNKNOWN';
    observabilityImpact?: 'DEGRADED' | 'NORMAL' | 'NONE';
    complianceImpact?: 'VIOLATION' | 'PASS' | 'NONE';
  };
  rawReference?: string;
  provenance: 'LIVE' | 'CALCULATED' | 'CORRELATED' | 'TEST_DATA' | 'NOT_CONNECTED';
  confidence: number;
}

export interface AwsChangeIntelligenceSummary {
  workspaceId: string;
  accountId: string;
  totalEventsCount: number;
  changesTodayCount: number;
  criticalChangesCount: number;
  highRiskChangesCount: number;
  affectedResourcesCount: number;
  affectedServicesCount: number;
  failedOperationsCount: number;
  unknownActorCount: number;
  recentCriticalChanges: AwsRealEvent[];
  correlationGroups: {
    id: string;
    title: string;
    relationship: 'LIKELY_RELATED' | 'CORRELATED' | 'POSSIBLE_CONTRIBUTOR' | 'EVIDENCE_INSUFFICIENT';
    eventsCount: number;
    timelineRange: string;
    summary: string;
    rootCauseCandidate?: string;
  }[];
  pipelineQuality: {
    eventsReceived: number;
    eventsNormalized: number;
    eventsRejected: number;
    duplicatesDropped: number;
    cloudTrailStatus: 'CONNECTED' | 'UNAVAILABLE' | 'PERMISSION_REQUIRED';
    eventBridgeStatus: 'CONNECTED' | 'UNAVAILABLE';
    lastSyncAt: string;
  };
  provenance: 'LIVE' | 'NOT_CONNECTED' | 'CALCULATED';
}

export interface AwsEventSyncCheckpoint {
  connectionId: string;
  workspaceId: string;
  lastSuccessfulSync: string;
  lastEventTimestamp: string;
  cursor: string;
  syncIntervalSeconds: number;
  status: 'HEALTHY' | 'SYNCING' | 'DEGRADED' | 'ERROR';
  errorReason?: string;
}

// ─── Phase 44: Real AWS Security, Audit & Threat Intelligence ─────────────────

export type AwsSecurityFindingSource =
  | 'IAM'
  | 'CloudTrail'
  | 'SecurityHub'
  | 'GuardDuty'
  | 'Config'
  | 'Inspector'
  | 'NetworkAnalysis'
  | 'StorageAnalysis';

export type AwsSecurityFindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type AwsSecurityFindingStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'SUPPRESSED';

export interface AwsSecurityFinding {
  id: string;
  workspaceId: string;
  organizationId: string;
  connectionId: string;
  provider: 'AWS';
  accountId: string;
  region: string;
  source: AwsSecurityFindingSource;
  sourceFindingId?: string;
  title: string;
  description: string;
  severity: AwsSecurityFindingSeverity;
  status: AwsSecurityFindingStatus;
  firstObserved: string;
  lastObserved: string;
  resourceId: string;
  resourceType: string;
  service: string;
  actor?: string;
  evidence: string;
  remediation: string;
  iacRemediation?: string;
  provenance: 'LIVE' | 'CALCULATED' | 'CORRELATED' | 'TEST_DATA' | 'NOT_CONNECTED';
  confidence: number;
  calculatedRisk: {
    score: number;
    level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    rationale: string;
  };
  complianceMappings: {
    framework: string;
    controlId: string;
    title: string;
  }[];
  impacts: {
    securityImpact: string;
    costImpact: string;
    observabilityImpact: string;
  };
  relatedEventIds?: string[];
}

export interface AwsSecurityCapability {
  source: string;
  status: 'AVAILABLE' | 'CONNECTED' | 'NOT_ENABLED' | 'PERMISSION_REQUIRED' | 'UNAVAILABLE';
  lastSync: string;
  supportedRegions: string[];
  reason?: string;
}

export interface AwsSecurityPostureSummary {
  workspaceId: string;
  accountId: string;
  calculatedScore: number;
  scoreType: 'CALCULATED';
  visibilityCoveragePercent: number;
  coverageStatus: 'PARTIAL_SECURITY_VISIBILITY' | 'FULL_VISIBILITY';
  breakdown: {
    iamSecurity: number;
    networkExposure: number;
    dataStorageSecurity: number;
    loggingAndAudit: number;
    vulnerabilityPosture: number;
  };
  findingsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  findingsByStatus: {
    open: number;
    acknowledged: number;
    inProgress: number;
    resolved: number;
    suppressed: number;
  };
  unresolvedHighRiskResources: string[];
  capabilityMatrix: AwsSecurityCapability[];
  provenance: 'CALCULATED' | 'NOT_CONNECTED';
}

export interface AwsPrivilegeEscalationPath {
  id: string;
  identity: string;
  identityType: string;
  permission: string;
  resource: string;
  potentialImpact: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  evidence: string;
  provenance: 'CALCULATED';
}

// ─── Phase 45: Real AWS Multi-Account & AWS Organizations Intelligence ────────

export type AwsAccountAccessStatus =
  | 'ACCESSIBLE'
  | 'PARTIAL_ACCESS'
  | 'PERMISSION_REQUIRED'
  | 'UNAVAILABLE';

export interface AwsAccount {
  accountId: string;
  accountName: string;
  organizationId?: string;
  organizationUnitId?: string;
  organizationUnitName?: string;
  isManagementAccount: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_CLOSURE';
  accessStatus: AwsAccountAccessStatus;
  connectionId: string;
  workspaceId: string;
  regions: string[];
  roleArn: string;
  resourceCount: number;
  securityFindingCount: number;
  monthlyCost: number;
  lastSync: string;
  calculatedHealthScore: number;
  diagnostics: {
    resourceAccess: 'HEALTHY' | 'PERMISSION_REQUIRED' | 'DEGRADED';
    iamAccess: 'HEALTHY' | 'PERMISSION_REQUIRED';
    eventAccess: 'HEALTHY' | 'PERMISSION_REQUIRED';
    securityAccess: 'HEALTHY' | 'PERMISSION_REQUIRED';
    costAccess: 'HEALTHY' | 'PERMISSION_REQUIRED';
    observabilityAccess: 'HEALTHY' | 'PERMISSION_REQUIRED';
    diagnosticNotes?: string;
  };
  provenance: 'LIVE' | 'CALCULATED' | 'NOT_CONNECTED';
}

export interface AwsOrganization {
  organizationId: string;
  managementAccountId: string;
  featureSet: 'ALL' | 'CONSOLIDATED_BILLING';
  accessStatus: 'ACCESSIBLE' | 'PERMISSION_REQUIRED' | 'NOT_ENABLED';
  roots: {
    id: string;
    name: string;
    arn: string;
  }[];
  organizationalUnits: {
    id: string;
    name: string;
    parentId: string;
    accountCount: number;
  }[];
  accounts: AwsAccount[];
  calculatedOrganizationHealth: number;
  visibilityCoveragePercent: number;
  coverageStatus: 'PARTIAL_ORGANIZATION_VISIBILITY' | 'FULL_VISIBILITY';
  provenance: 'LIVE' | 'CALCULATED' | 'NOT_CONNECTED';
}

export interface AwsOrgTreeNode {
  id: string;
  name: string;
  type: 'ROOT' | 'OU' | 'ACCOUNT';
  status?: string;
  accessStatus?: string;
  children?: AwsOrgTreeNode[];
}

// ─── Phase 46: Real AWS FinOps, Cost Forecasting & Resource Economics ─────────

export type AwsCostPricingModel = 'ON_DEMAND' | 'RESERVED' | 'SAVINGS_PLANS' | 'SPOT';

export interface AwsCostRecord {
  id: string;
  workspaceId: string;
  organizationId: string;
  connectionId: string;
  accountId: string;
  accountName: string;
  provider: 'AWS';
  service: string;
  region: string;
  resourceId?: string;
  usageType: string;
  cost: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  pricingModel: AwsCostPricingModel;
  tags: Record<string, string>;
  provenance: 'LIVE' | 'CALCULATED' | 'NOT_CONNECTED';
}

export interface AwsBudgetRecord {
  id: string;
  budgetName: string;
  accountId: string;
  limitAmount: number;
  actualAmount: number;
  forecastedAmount: number;
  currency: string;
  timeUnit: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  status: 'ON_TRACK' | 'AT_RISK' | 'EXCEEDED' | 'UNKNOWN';
  variancePercent: number;
  provenance: 'LIVE';
}

export interface AwsCostForecast {
  accountId: string;
  timeRange: string;
  projectedMonthEndSpend: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidencePercent: number;
  };
  dailyTrendPercent: number;
  methodology: string;
  provenance: 'PREDICTED';
}

export interface AwsOptimizationOpportunity {
  id: string;
  accountId: string;
  resourceId: string;
  resourceType: string;
  service: string;
  category: 'RIGHTSIZING' | 'IDLE_RESOURCE' | 'STORAGE_TIERING' | 'RESERVATION_EXPIRATION';
  currentCostMonthly: number;
  estimatedSavingsMonthly: number;
  recommendation: string;
  evidence: string;
  confidence: number;
  status: 'OPEN' | 'DISMISSED' | 'APPLIED';
  provenance: 'ESTIMATED';
}

export interface AwsFinOpsSummary {
  workspaceId: string;
  monthToDateSpend: number;
  projectedMonthEndSpend: number;
  currency: string;
  lastBillingUpdate: string;
  costByAccount: {
    accountId: string;
    accountName: string;
    cost: number;
    percentage: number;
    status: string;
  }[];
  costByService: {
    service: string;
    cost: number;
    percentage: number;
  }[];
  costByRegion: {
    region: string;
    cost: number;
    percentage: number;
  }[];
  costByTag: {
    tagKey: string;
    tagValue: string;
    cost: number;
  }[];
  untaggedResourceCost: number;
  totalEstimatedMonthlySavings: number;
  budgets: AwsBudgetRecord[];
  forecast: AwsCostForecast;
  optimizations: AwsOptimizationOpportunity[];
  anomalies: {
    service: string;
    baselineCost: number;
    currentCost: number;
    deviationPercent: number;
    date: string;
  }[];
  provenance: 'LIVE' | 'CALCULATED' | 'NOT_CONNECTED';
}

// ─── Phase 47: Real AWS Observability, Metrics & Service Health Intelligence ──

export type AwsMetricStatistic = 'Average' | 'Maximum' | 'Minimum' | 'Sum' | 'p95' | 'p99';

export interface AwsMetricSample {
  id: string;
  workspaceId: string;
  organizationId: string;
  connectionId: string;
  accountId: string;
  region: string;
  namespace: string;
  metricName: string;
  dimensions: Record<string, string>;
  timestamp: string;
  period: number;
  statistic: AwsMetricStatistic;
  value: number;
  unit: string;
  resourceId: string;
  service: string;
  provenance: 'LIVE' | 'CALCULATED' | 'NOT_CONNECTED';
}

export interface AwsCloudWatchAlarm {
  id: string;
  alarmName: string;
  accountId: string;
  region: string;
  state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  metricNamespace: string;
  metricName: string;
  threshold: number;
  comparisonOperator: string;
  resourceId: string;
  lastUpdated: string;
  stateReason: string;
  provenance: 'LIVE';
}

export interface AwsResourceHealthScore {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  accountId: string;
  region: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  healthScore: number;
  evidence: string[];
  goldenSignals: {
    latency?: { value: number; unit: string; status: 'HEALTHY' | 'DEGRADED' };
    traffic?: { value: number; unit: string; status: 'HEALTHY' };
    errors?: { value: number; unit: string; status: 'HEALTHY' | 'DEGRADED' };
    saturation?: { value: number; unit: string; status: 'HEALTHY' | 'DEGRADED' };
  };
  activeAlarmsCount: number;
  provenance: 'CALCULATED';
}

export interface AwsServiceHealthSummary {
  workspaceId: string;
  overallHealthScore: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'PARTIAL_VISIBILITY';
  coveragePercent: number;
  totalMonitoredResources: number;
  healthyResourcesCount: number;
  degradedResourcesCount: number;
  criticalResourcesCount: number;
  activeAlarms: AwsCloudWatchAlarm[];
  resourcesHealth: AwsResourceHealthScore[];
  anomalies: {
    metricName: string;
    resourceId: string;
    baselineValue: number;
    currentValue: number;
    deviationPercent: number;
    timestamp: string;
  }[];
  provenance: 'LIVE' | 'CALCULATED' | 'NOT_CONNECTED';
}

// ─── Phase 48: Real AWS Resource Relationships, Dependency Graph & Blast-Radius ──

export type AwsRelationshipType =
  | 'CONTAINS'
  | 'ATTACHED_TO'
  | 'CONNECTS_TO'
  | 'ROUTES_TO'
  | 'DEPENDS_ON'
  | 'SERVES'
  | 'STORES_IN'
  | 'READS_FROM'
  | 'WRITES_TO'
  | 'TRIGGERS'
  | 'INVOKES'
  | 'HOSTS'
  | 'RUNS_ON'
  | 'EXPOSES'
  | 'PROTECTS'
  | 'MONITORS'
  | 'ENCRYPTED_BY'
  | 'AUTHENTICATES_WITH'
  | 'ASSOCIATED_WITH';

export interface AwsRelationshipEvidence {
  category: 'CONFIRMED' | 'DERIVED' | 'INFERRED' | 'UNKNOWN';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sourceApi: string;
  details: string;
  lastVerifiedAt: string;
}

export interface AwsResourceRelationship {
  relationshipId: string;
  workspaceId: string;
  organizationId: string;
  accountId: string;
  region: string;
  sourceResourceId: string;
  sourceResourceType: string;
  targetResourceId: string;
  targetResourceType: string;
  relationshipType: AwsRelationshipType;
  direction: 'OUTBOUND' | 'INBOUND' | 'BIDIRECTIONAL';
  evidence: AwsRelationshipEvidence;
  provenance: 'LIVE' | 'CALCULATED' | 'NOT_CONNECTED';
}

export interface AwsTopologyNode {
  id: string;
  name: string;
  resourceType: string;
  service: string;
  accountId: string;
  region: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  healthScore: number;
  monthlyCost: number;
  activeAlarmsCount: number;
  activeFindingsCount: number;
  provenance: 'LIVE' | 'CALCULATED' | 'NOT_CONNECTED';
}

export interface AwsTopologyEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: AwsRelationshipType;
  evidenceCategory: 'CONFIRMED' | 'DERIVED' | 'INFERRED' | 'UNKNOWN';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface AwsTopologyGraph {
  workspaceId: string;
  nodes: AwsTopologyNode[];
  edges: AwsTopologyEdge[];
  totalNodes: number;
  totalEdges: number;
  provenance: 'LIVE' | 'CALCULATED' | 'NOT_CONNECTED';
}

export interface AwsBlastRadiusAnalysis {
  targetResourceId: string;
  targetResourceName: string;
  targetResourceType: string;
  directImpactCount: number;
  transitiveImpactCount: number;
  maxDependencyDepth: number;
  affectedResources: {
    resourceId: string;
    resourceName: string;
    resourceType: string;
    impactType: 'DIRECT' | 'TRANSITIVE';
    dependencyDepth: number;
    relationshipType: AwsRelationshipType;
    evidence: string;
  }[];
  affectedAccounts: string[];
  affectedRegions: string[];
  criticalServicesAffected: string[];
  securityImplications: string[];
  financialExposureMonthly: number;
  observabilityCoveragePercent: number;
  resilienceScore: number;
  provenance: 'CALCULATED';
}

// ─── Phase 49: Real AWS Change Impact, Root-Cause & Incident Correlation Engine ──

export type AwsChangeClassification =
  | 'NETWORK'
  | 'IAM'
  | 'COMPUTE'
  | 'STORAGE'
  | 'DATABASE'
  | 'LOAD_BALANCING'
  | 'SERVERLESS'
  | 'KUBERNETES'
  | 'SECURITY'
  | 'CONFIGURATION'
  | 'DEPLOYMENT'
  | 'SCALING'
  | 'DNS'
  | 'COST_RELEVANT'
  | 'UNKNOWN';

export interface AwsIncidentHypothesis {
  id: string;
  title: string;
  summary: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  supportingEvidence: string[];
  contradictingOrMissingEvidence: string[];
  potentialContributingChangeId?: string;
  provenance: 'CALCULATED';
}

export interface AwsIncidentTimelineEvent {
  id: string;
  timestamp: string;
  eventType: 'CHANGE' | 'METRIC_DEVIATION' | 'ALARM_TRIGGERED' | 'HEALTH_DEGRADATION' | 'INCIDENT_DETECTED';
  source: string;
  resourceId: string;
  accountId: string;
  region: string;
  description: string;
  provenance: 'LIVE' | 'CALCULATED';
}

export interface AwsIncidentImpactSummary {
  directAffectedResources: string[];
  transitiveAffectedResources: string[];
  affectedServices: string[];
  affectedAccounts: string[];
  affectedRegions: string[];
  activeAlarms: string[];
  monthlyFinancialExposure: number;
  observabilityStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  resilienceRating: number;
  provenance: 'CALCULATED';
}

export interface AwsCloudIncident {
  id: string;
  workspaceId: string;
  organizationId: string;
  accountId: string;
  region: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'DETECTED' | 'INVESTIGATING' | 'IDENTIFIED' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';
  detectedAt: string;
  updatedAt: string;
  primaryResourceId: string;
  primaryResourceType: string;
  classification: AwsChangeClassification;
  triggerSignal: string;
  impact: AwsIncidentImpactSummary;
  hypotheses: AwsIncidentHypothesis[];
  timeline: AwsIncidentTimelineEvent[];
  provenance: 'LIVE' | 'CALCULATED';
}

// ─── Phase 50: Real AWS Predictive Operations & Early-Warning Intelligence ───

export type AwsPredictionType =
  | 'CAPACITY_RISK'
  | 'PERFORMANCE_RISK'
  | 'AVAILABILITY_RISK'
  | 'COST_RISK'
  | 'SECURITY_RISK'
  | 'INCIDENT_RISK'
  | 'SLO_RISK'
  | 'DEPENDENCY_RISK'
  | 'RESILIENCE_RISK'
  | 'RESOURCE_GROWTH'
  | 'ANOMALY_RISK';

export type AwsPredictionMethodology =
  | 'LINEAR_TREND_EXTRAPOLATION'
  | 'HOLT_WINTERS_EXPONENTIAL_SMOOTHING'
  | 'STATISTICAL_BASELINE_DEVIATION'
  | 'THRESHOLD_PROJECTION'
  | 'ANOMALY_PROBABILITY_SCORING'
  | 'GRAPH_DEPENDENCY_RISK_PROPAGATION';

export type AwsPredictionLifecycleStatus =
  | 'ACTIVE'
  | 'CONFIRMED'
  | 'FALSE_POSITIVE'
  | 'EXPIRED'
  | 'INVALIDATED';

export interface AwsCloudPrediction {
  id: string;
  workspaceId: string;
  organizationId: string;
  accountId: string;
  region: string;
  resourceId: string;
  resourceName: string;
  service: string;
  predictionType: AwsPredictionType;
  createdAt: string;
  predictionWindow: string;
  currentValue: number;
  predictedValue: number;
  unit: string;
  threshold: number;
  estimatedCrossingTime?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  evidence: string[];
  methodology: AwsPredictionMethodology;
  status: AwsPredictionLifecycleStatus;
  dataQualityGatePassed: boolean;
  provenance: 'PREDICTED';
}

export interface AwsPredictiveSummary {
  workspaceId: string;
  totalActivePredictions: number;
  capacityRisksCount: number;
  costRisksCount: number;
  incidentRisksCount: number;
  averageModelConfidence: number;
  dataQualityGateStatus: 'PASSED' | 'INSUFFICIENT_DATA';
  predictions: AwsCloudPrediction[];
  provenance: 'PREDICTED';
}

// ─── Phase 51: Real AWS Automated Cloud Governance & Policy Enforcement Engine ───

export type AwsPolicyCategory =
  | 'SECURITY'
  | 'IAM'
  | 'NETWORK'
  | 'STORAGE'
  | 'COMPUTE'
  | 'DATABASE'
  | 'LOGGING'
  | 'OBSERVABILITY'
  | 'COST'
  | 'RESILIENCE'
  | 'DATA_PROTECTION'
  | 'TAGGING'
  | 'GOVERNANCE'
  | 'ACCESS_CONTROL';

export type AwsEvaluationResult =
  | 'PASS'
  | 'FAIL'
  | 'UNKNOWN'
  | 'NOT_APPLICABLE'
  | 'ERROR';

export type AwsGovernanceFindingStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'PLANNED'
  | 'APPROVED'
  | 'REMEDIATED'
  | 'VERIFIED'
  | 'EXEMPTED'
  | 'RESOLVED';

export interface AwsCloudPolicy {
  id: string;
  workspaceId: string;
  organizationId: string;
  name: string;
  description: string;
  provider: 'AWS';
  category: AwsPolicyCategory;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  ruleDefinition: {
    resourceType: string;
    condition: string;
    expected: any;
  };
  remediationGuidance: string;
  createdAt: string;
  updatedAt: string;
  lastEvaluatedAt: string;
}

export interface AwsPolicyEvaluation {
  id: string;
  policyId: string;
  policyName: string;
  resourceId: string;
  resourceName: string;
  accountId: string;
  region: string;
  result: AwsEvaluationResult;
  evidence: string[];
  evaluatedAt: string;
  provenance: 'LIVE' | 'CALCULATED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface AwsGovernanceFinding {
  id: string;
  policyId: string;
  policyName: string;
  workspaceId: string;
  accountId: string;
  region: string;
  resourceId: string;
  resourceName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: AwsGovernanceFindingStatus;
  evidence: string[];
  recommendedRemediation: {
    action: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    rollbackConcept: string;
    verificationMethod: string;
  };
  detectedAt: string;
  provenance: 'LIVE' | 'CALCULATED';
}

export interface AwsPolicyExemption {
  id: string;
  policyId: string;
  resourceId: string;
  reason: string;
  approvedBy: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface AwsGovernanceSummary {
  workspaceId: string;
  overallComplianceScore: number;
  totalPoliciesEvaluated: number;
  passingEvaluationsCount: number;
  failingEvaluationsCount: number;
  unknownEvaluationsCount: number;
  openFindingsCount: number;
  activeExemptionsCount: number;
  categoryScores: Record<string, number>;
  provenance: 'CALCULATED';
}

// ─── Phase 52: Real AWS Continuous Compliance, Drift Detection & Governance Automation ───

export type AwsDriftType =
  | 'CONFIGURATION_DRIFT'
  | 'SECURITY_DRIFT'
  | 'IAM_DRIFT'
  | 'NETWORK_DRIFT'
  | 'COST_GOVERNANCE_DRIFT'
  | 'OBSERVABILITY_DRIFT'
  | 'RESILIENCE_DRIFT'
  | 'TAGGING_DRIFT'
  | 'POLICY_DRIFT'
  | 'INFRASTRUCTURE_DRIFT'
  | 'UNKNOWN_DRIFT';

export type AwsDriftLifecycleStatus =
  | 'DETECTED'
  | 'INVESTIGATING'
  | 'ACKNOWLEDGED'
  | 'APPROVED_EXCEPTION'
  | 'PLANNED'
  | 'REMEDIATION_PENDING'
  | 'REMEDIATED'
  | 'VERIFIED'
  | 'RESOLVED';

export interface AwsConfigurationBaseline {
  id: string;
  workspaceId: string;
  organizationId: string;
  name: string;
  version: string;
  source: 'ACTIVE_POLICY' | 'APPROVED_BASELINE' | 'IAC_STATE' | 'ORGANIZATION_STANDARD';
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ACTIVE';
  resourceType: string;
  expectedConfiguration: Record<string, any>;
  createdBy: string;
  createdAt: string;
  approvedAt?: string;
}

export interface AwsDriftDiff {
  field: string;
  expected: any;
  actual: any;
  diffType: 'ADDED' | 'REMOVED' | 'CHANGED' | 'MISSING';
}

export interface AwsCloudDrift {
  id: string;
  workspaceId: string;
  organizationId: string;
  accountId: string;
  region: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  driftType: AwsDriftType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: AwsDriftLifecycleStatus;
  detectedAt: string;
  lastObservedAt: string;
  baselineId: string;
  baselineVersion: string;
  diffs: AwsDriftDiff[];
  actor?: string;
  changeSource?: string;
  policyImpact?: string[];
  securityImpact?: string;
  dependencyImpact?: string[];
  costImpact?: number;
  evidence: string[];
  provenance: 'LIVE' | 'CALCULATED';
  freshness: string;
}

export interface AwsDriftSummary {
  workspaceId: string;
  totalDriftsDetected: number;
  criticalDriftsCount: number;
  unresolvedDriftsCount: number;
  activeBaselinesCount: number;
  categoryBreakdown: Record<string, number>;
  reconciliationStatus: 'HEALTHY' | 'STALE' | 'UNKNOWN';
  lastReconciliationAt: string;
  provenance: 'CALCULATED';
}

// ─── Phase 53: Real AWS Governance Baselines, Remediation Orchestration & Verified Compliance ───

export type AwsBaselineStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'EXPIRED'
  | 'ARCHIVED';

export type AwsRemediationActionType =
  | 'READ'
  | 'VALIDATE'
  | 'CHANGE'
  | 'VERIFY';

export type AwsRemediationRiskLevel =
  | 'READ_ONLY'
  | 'LOW_RISK_CHANGE'
  | 'MEDIUM_RISK_CHANGE'
  | 'HIGH_RISK_CHANGE'
  | 'DESTRUCTIVE';

export type AwsRemediationExecutionStatus =
  | 'PLAN_CREATED'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'PREFLIGHT_PASSED'
  | 'EXECUTING'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED'
  | 'FAILED'
  | 'REJECTED';

export interface AwsGovernanceControl {
  id: string;
  name: string;
  resourceType: string;
  field: string;
  expectedValue: any;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  policyId?: string;
  remediationAction: string;
  riskLevel: AwsRemediationRiskLevel;
}

export interface AwsGovernanceBaseline {
  id: string;
  organizationId: string;
  workspaceId: string;
  provider: 'AWS';
  accountId: string;
  region: string;
  name: string;
  description: string;
  version: string;
  status: AwsBaselineStatus;
  source: 'ACTIVE_POLICY' | 'APPROVED_BASELINE' | 'IAC_STATE' | 'ORGANIZATION_STANDARD';
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  effectiveAt?: string;
  expiresAt?: string;
  controls: AwsGovernanceControl[];
  provenance: 'LIVE' | 'CALCULATED';
}

export interface AwsRemediationAction {
  order: number;
  type: AwsRemediationActionType;
  description: string;
  command: string;
  riskLevel: AwsRemediationRiskLevel;
  status: 'PENDING' | 'EXECUTED' | 'VERIFIED' | 'FAILED';
}

export interface AwsRemediationPlan {
  id: string;
  workspaceId: string;
  driftId: string;
  policyId: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  accountId: string;
  region: string;
  riskLevel: AwsRemediationRiskLevel;
  status: AwsRemediationExecutionStatus;
  currentState: Record<string, any>;
  desiredState: Record<string, any>;
  actions: AwsRemediationAction[];
  rollbackStrategy: string;
  verificationCriteria: string;
  requiredApproverRole: string;
  approvedBy?: string;
  approvedAt?: string;
  executedBy?: string;
  executedAt?: string;
  preflightVerifiedAt?: string;
  freshAwsReadVerifiedAt?: string;
  evidence: string[];
  auditTrail: { timestamp: string; actor: string; action: string; outcome: string }[];
  provenance: 'LIVE' | 'CALCULATED';
}

export interface AwsRemediationOrchestrationSummary {
  workspaceId: string;
  totalPlansGenerated: number;
  pendingApprovalsCount: number;
  verifiedRemediationsCount: number;
  failedRemediationsCount: number;
  meanTimeToVerificationMinutes: number;
  verifiedComplianceScore: number;
  plans: AwsRemediationPlan[];
  provenance: 'CALCULATED';
}

// ─── Phase 54: Real AWS Governance Remediation Intelligence, Auto-Healing & Controlled Self-Repair ───

export type AwsAutomationLevel =
  | 'LEVEL_0_OBSERVE'
  | 'LEVEL_1_RECOMMEND'
  | 'LEVEL_2_APPROVAL_REQUIRED'
  | 'LEVEL_3_SAFE_AUTO_REMEDIATE'
  | 'LEVEL_4_GUARDED_AUTOMATION';

export type AwsAutomationPolicyStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'DISABLED'
  | 'EXPIRED';

export interface GovernanceActionDefinition {
  actionId: string;
  name: string;
  provider: 'AWS';
  resourceType: string;
  operation: string;
  riskLevel: 'READ_ONLY' | 'LOW_RISK_CHANGE' | 'MEDIUM_RISK_CHANGE' | 'HIGH_RISK_CHANGE' | 'DESTRUCTIVE';
  reversible: boolean;
  allowedAutomationLevels: AwsAutomationLevel[];
  requiredPermissions: string[];
  preconditions: string[];
  verificationMethod: string;
  description: string;
}

export interface GovernanceAutomationPolicy {
  id: string;
  workspaceId: string;
  organizationId: string;
  name: string;
  description: string;
  status: AwsAutomationPolicyStatus;
  automationLevel: AwsAutomationLevel;
  resourceType: string;
  allowedActions: string[];
  blockedActions: string[];
  cooldownMinutes: number;
  maxConsecutiveFailures: number;
  consecutiveFailures: number;
  isCircuitBroken: boolean;
  isProtectedResourceOverrideBlocked: boolean;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutoRemediationQueueItem {
  id: string;
  workspaceId: string;
  policyId: string;
  actionId: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  riskLevel: 'READ_ONLY' | 'LOW_RISK_CHANGE' | 'MEDIUM_RISK_CHANGE' | 'HIGH_RISK_CHANGE' | 'DESTRUCTIVE';
  status: 'QUEUED' | 'VALIDATING' | 'READY' | 'EXECUTING' | 'VERIFYING' | 'COMPLETED' | 'BLOCKED' | 'FAILED';
  automationLevel: AwsAutomationLevel;
  idempotencyKey: string;
  blockedReason?: string;
  enqueuedAt: string;
  executedAt?: string;
  verifiedAt?: string;
}

export interface GovernanceAutoHealingSummary {
  workspaceId: string;
  totalAutoRemediations: number;
  activeAutomationPoliciesCount: number;
  circuitBreakersTrippedCount: number;
  blockedActionsCount: number;
  meanSelfHealingTimeSeconds: number;
  autoHealingStatus: 'HEALTHY' | 'DEGRADED' | 'PAUSED';
  queueDepth: number;
  recentActivity: { timestamp: string; action: string; resourceName: string; outcome: string }[];
  provenance: 'CALCULATED';
}

// ─── Phase 55: Real AWS CloudPulse Policy Simulator, Governance What-If & Safe Change Impact Engine ───

export type GovernanceSimulationStatus =
  | 'DRAFT'
  | 'ANALYZING'
  | 'COMPLETED'
  | 'STALE'
  | 'INVALID'
  | 'EXPIRED';

export type SimulationRiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'UNKNOWN';

export interface GovernanceSimulationInput {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  accountId: string;
  region: string;
  field: string;
  currentValue: any;
  proposedValue: any;
}

export interface SimulationPolicyResult {
  policyId: string;
  policyName: string;
  evaluation: 'PASS' | 'FAIL' | 'WARNING' | 'UNKNOWN' | 'NOT_APPLICABLE';
  expectedValue: any;
  simulatedValue: any;
  explanation: string;
  provenance: 'SIMULATED';
}

export interface SimulationImpactAnalysis {
  complianceScoreDelta: number;
  controlsPassingDelta: number;
  controlsFailingDelta: number;
  securityImpact: string;
  securitySeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  dependencyImpact: {
    directDependencies: string[];
    downstreamCount: number;
    blastRadiusAssessment: string;
    confidence: 'CONFIRMED' | 'DERIVED' | 'INFERRED' | 'UNKNOWN';
  };
  observabilityImpact: string;
  finopsImpact: {
    currentCostMonthly: number;
    simulatedCostMonthly: number;
    costDeltaMonthly: number;
    costImpactClassification: 'ACTUAL' | 'CALCULATED' | 'ESTIMATED' | 'UNKNOWN';
  };
  resilienceImpact: string;
  predictiveRisk: {
    incidentProbability: number;
    riskClassification: SimulationRiskLevel;
    reasoning: string;
  };
}

export interface GovernanceSimulation {
  id: string;
  organizationId: string;
  workspaceId: string;
  provider: 'AWS';
  accountId: string;
  region: string;
  scenarioName: string;
  description: string;
  sourceStateTimestamp: string;
  baseStateVersion: string;
  inputs: GovernanceSimulationInput[];
  policyResults: SimulationPolicyResult[];
  impact: SimulationImpactAnalysis;
  riskLevel: SimulationRiskLevel;
  recommendations: string[];
  safeAlternative?: string;
  status: GovernanceSimulationStatus;
  createdBy: string;
  createdAt: string;
  provenance: 'SIMULATED';
}

export interface GovernanceSimulatorSummary {
  workspaceId: string;
  totalSimulationsRun: number;
  highRiskScenariosDetected: number;
  safeScenariosCount: number;
  activeSimulationsCount: number;
  recentSimulations: GovernanceSimulation[];
  provenance: 'CALCULATED';
}

// ─── Phase 56: Real AWS Governance Intelligence Center & Continuous Control Optimization ───

export interface GovernanceControlHealth {
  controlId: string;
  controlName: string;
  category: 'SECURITY' | 'COMPLIANCE' | 'OBSERVABILITY' | 'FINOPS' | 'RESILIENCE';
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  affectedResourcesCount: number;
  complianceRate: number; // 0-100
  driftRate: number; // 0-100
  recurrenceRate: number; // 0-100
  remediationSuccessRate: number; // 0-100
  evidenceFreshness: 'FRESH' | 'AGING' | 'STALE' | 'MISSING';
  evidenceConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  activeExceptionsCount: number;
  automationEligibility: 'SAFE_AUTOMATION_CANDIDATE' | 'APPROVAL_REQUIRED' | 'RECOMMEND' | 'NOT_ELIGIBLE';
  automationSafetyScore: 'SAFE' | 'CAUTION' | 'UNSAFE' | 'UNKNOWN';
  evidenceSource: string;
}

export interface GovernanceRisk {
  id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'UNKNOWN';
  title: string;
  description: string;
  category: 'SECURITY' | 'COMPLIANCE' | 'OBSERVABILITY' | 'FINOPS' | 'RESILIENCE';
  affectedResources: string[];
  accountId: string;
  region: string;
  blastRadius: string;
  securityImpact: string;
  remediationDifficulty: 'EASY' | 'MODERATE' | 'COMPLEX';
  suggestedAction: string;
  evidenceConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  provenance: 'CALCULATED';
}

export interface GovernancePolicyEffectiveness {
  policyId: string;
  policyName: string;
  effectivenessRating: 'EFFECTIVE' | 'NEEDS_REVIEW' | 'LOW_COVERAGE' | 'CONFLICTED' | 'UNKNOWN';
  violationsDetected: number;
  recurringViolations: number;
  remediationSuccessRate: number;
  falsePositiveRate: number;
  exceptionFrequency: number;
  policyConflictDetected: boolean;
  automationSuccessRate: number;
  provenance: 'CALCULATED';
}

export interface GovernanceEvidenceCoverage {
  accountId: string;
  region: string;
  service: string;
  coverageLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'MISSING';
  evidenceSources: string[];
  staleIndicatorsCount: number;
  reasonForLowCoverage?: string;
  provenance: 'CALCULATED';
}

export interface GovernanceAutomationOpportunity {
  id: string;
  controlId: string;
  controlName: string;
  targetResourceType: string;
  suggestedActionId: string;
  eligibility: 'SAFE_AUTOMATION_CANDIDATE' | 'APPROVAL_REQUIRED' | 'RECOMMEND' | 'NOT_ELIGIBLE';
  safetyScore: 'SAFE' | 'CAUTION' | 'UNSAFE' | 'UNKNOWN';
  reversibility: boolean;
  historicalSuccessRate: number;
  blastRadius: string;
  rationale: string;
  requiresHumanApproval: boolean;
}

export interface GovernanceRecommendation {
  id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  title: string;
  rationale: string;
  affectedResources: string[];
  suggestedNextStep: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'DISMISSED' | 'RESOLVED' | 'EXPIRED';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  provenance: 'CALCULATED';
  createdAt: string;
}

export interface GovernanceIntelligenceCenterSummary {
  workspaceId: string;
  overallGovernanceHealthScore: number;
  evidenceConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'LIMITED_COVERAGE';
  activeControlsCount: number;
  criticalRisksCount: number;
  highPriorityActionsCount: number;
  activeExceptionsCount: number;
  recurringDriftCount: number;
  automationOpportunitiesCount: number;
  meanTimeToRemediationSeconds: number;
  remediationSuccessRate: number;
  controls: GovernanceControlHealth[];
  risks: GovernanceRisk[];
  policyEffectiveness: GovernancePolicyEffectiveness[];
  coverage: GovernanceEvidenceCoverage[];
  automationOpportunities: GovernanceAutomationOpportunity[];
  recommendations: GovernanceRecommendation[];
  provenance: 'CALCULATED';
}

// ─── Phase 57: Real AWS Governance Decision Engine & Control Optimization Automation ───

export type GovernanceDecisionStatus =
  | 'NEW'
  | 'ANALYZING'
  | 'READY_FOR_DECISION'
  | 'SIMULATION_REQUIRED'
  | 'PLAN_READY'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'BLOCKED'
  | 'UNKNOWN';

export type GovernanceDecisionPriority =
  | 'P0'
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P4'
  | 'UNKNOWN';

export type GovernanceDecisionType =
  | 'CONFIGURATION_REPAIR'
  | 'SECURITY_HARDENING'
  | 'POLICY_OPTIMIZATION'
  | 'BASELINE_UPGRADE'
  | 'EXCEPTION_RETIREMENT'
  | 'TELEMETRY_GAP';

export interface GovernanceDecision {
  id: string;
  tenantId: string;
  workspaceId: string;
  accountId: string;
  region: string;
  scope: string;
  decisionType: GovernanceDecisionType;
  priority: GovernanceDecisionPriority;
  title: string;
  summary: string;
  rationale: string;
  status: GovernanceDecisionStatus;
  evidenceIds: string[];
  controlIds: string[];
  policyIds: string[];
  baselineIds: string[];
  driftIds: string[];
  findingIds: string[];
  resourceIds: string[];
  dependencyIds: string[];
  incidentIds: string[];
  costImpact: string;
  securityImpact: string;
  resilienceImpact: string;
  observabilityImpact: string;
  complianceImpact: string;
  automationLevel: 'SAFE_TO_AUTOMATE' | 'APPROVAL_REQUIRED' | 'MANUAL_ONLY' | 'BLOCKED' | 'UNKNOWN';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  evidenceCoverage: 'HIGH' | 'MEDIUM' | 'LOW' | 'LIMITED_COVERAGE';
  freshness: 'FRESH' | 'AGING' | 'STALE' | 'MISSING';
  rootCauseHypothesis: {
    category: 'MANUAL_CONFIG' | 'IAC_MISMATCH' | 'POLICY_WEAKNESS' | 'BASELINE_WEAKNESS' | 'MISSING_CONTROL' | 'EXPIRED_EXCEPTION' | 'AUTOMATION_FAILURE' | 'UNKNOWN';
    explanation: string;
    confidence: 'CONFIRMED' | 'DERIVED' | 'INFERRED' | 'UNKNOWN';
  };
  recommendedAction: {
    actionId: string;
    actionName: string;
    description: string;
    targetResourceType: string;
    isAllowlisted: boolean;
    isReversible: boolean;
    safetyScore: 'SAFE' | 'CAUTION' | 'UNSAFE' | 'UNKNOWN';
  };
  whatIfSimulationId?: string;
  remediationPlanId?: string;
  approvalId?: string;
  verificationStatus?: 'UNVERIFIED' | 'VERIFIED_COMPLIANT' | 'VERIFICATION_FAILED' | 'UNKNOWN';
  effectivenessScore?: number;
  createdAt: string;
  updatedAt: string;
  provenance: 'CALCULATED';
}

export interface GovernanceDecisionSummary {
  workspaceId: string;
  totalDecisions: number;
  criticalDecisionsCount: number;
  readyForRemediationCount: number;
  awaitingApprovalCount: number;
  completedDecisionsCount: number;
  hotspotsCount: number;
  decisions: GovernanceDecision[];
  provenance: 'CALCULATED';
}

// ─── Phase 58: Real AWS Governance Knowledge Graph & Cross-Domain Risk Intelligence ───

export type CloudKnowledgeNodeType =
  | 'ACCOUNT'
  | 'REGION'
  | 'RESOURCE'
  | 'SERVICE'
  | 'IDENTITY'
  | 'ROLE'
  | 'POLICY'
  | 'CONTROL'
  | 'BASELINE'
  | 'DRIFT'
  | 'SECURITY_FINDING'
  | 'CHANGE'
  | 'METRIC'
  | 'INCIDENT'
  | 'COST_RECORD'
  | 'DEPENDENCY'
  | 'PREDICTION'
  | 'REMEDIATION'
  | 'GOVERNANCE_DECISION'
  | 'EXCEPTION'
  | 'COMPLIANCE_CONTROL';

export type CloudKnowledgeRelationshipType =
  | 'OWNS'
  | 'CONTAINS'
  | 'RUNS'
  | 'DEPENDS_ON'
  | 'CONNECTS_TO'
  | 'ASSUMES'
  | 'AUTHORIZES'
  | 'GOVERNED_BY'
  | 'PROTECTED_BY'
  | 'VIOLATES'
  | 'DRIFTS_FROM'
  | 'CAUSED_BY'
  | 'CORRELATED_WITH'
  | 'AFFECTS'
  | 'IMPACTS'
  | 'COSTS'
  | 'OBSERVED_BY'
  | 'TRIGGERED'
  | 'REMEDIATED_BY'
  | 'PREDICTED_BY'
  | 'EXEMPTED_BY'
  | 'BELONGS_TO';

export type KnowledgeEvidenceStrength = 'CONFIRMED' | 'DERIVED' | 'INFERRED' | 'UNKNOWN';
export type KnowledgeEvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CloudKnowledgeNode {
  id: string;
  name: string;
  type: CloudKnowledgeNodeType;
  service: string;
  accountId: string;
  region: string;
  properties: Record<string, any>;
  riskScore: number;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  provenance: string;
}

export interface CloudKnowledgeEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: CloudKnowledgeRelationshipType;
  evidenceStrength: KnowledgeEvidenceStrength;
  confidence: KnowledgeEvidenceConfidence;
  provenance: string;
  properties?: Record<string, any>;
  firstSeen: string;
  lastSeen: string;
}

export interface CloudKnowledgeGraphSummary {
  workspaceId: string;
  nodeCount: number;
  edgeCount: number;
  criticalNodesCount: number;
  riskConcentration: { domain: string; riskScore: number; nodeCount: number }[];
  highRiskPathsCount: number;
  nodes: CloudKnowledgeNode[];
  edges: CloudKnowledgeEdge[];
  provenance: 'CALCULATED';
}

export interface ResourceRiskProfile {
  resourceId: string;
  resourceName: string;
  service: string;
  accountId: string;
  region: string;
  compositeRiskScore: number;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  riskFactors: { category: string; description: string; severity: string; score: number }[];
  protectingControls: { id: string; name: string; status: 'PASS' | 'FAIL' | 'UNKNOWN'; enforcement: string }[];
  violatingPolicies: { id: string; name: string; severity: string }[];
  activeDrifts: { id: string; property: string; driftType: string }[];
  securityFindings: { id: string; title: string; severity: string }[];
  relatedIdentities: { id: string; name: string; accessLevel: string }[];
  downstreamImpacts: { id: string; name: string; type: string }[];
  historicalChanges: { id: string; changeType: string; timestamp: string }[];
  activeIncidents: { id: string; title: string; severity: string }[];
  costTrend: { monthlyCost: number; anomaly: boolean }[];
  governanceDecisions: { id: string; title: string; status: string }[];
  suggestedRemediations: { id: string; title: string; safetyScore: string }[];
  provenance: 'CALCULATED';
}

export interface GraphPathResult {
  sourceNodeId: string;
  targetNodeId: string;
  pathFound: boolean;
  path: {
    nodes: CloudKnowledgeNode[];
    edges: CloudKnowledgeEdge[];
    totalHops: number;
    overallRisk: number;
  } | null;
  alternativePaths?: {
    nodes: CloudKnowledgeNode[];
    edges: CloudKnowledgeEdge[];
    totalHops: number;
    overallRisk: number;
  }[];
  provenance: 'CALCULATED';
}

export interface GraphDiffResult {
  workspaceId: string;
  timestamp: string;
  addedNodes: CloudKnowledgeNode[];
  removedNodes: CloudKnowledgeNode[];
  modifiedNodes: { node: CloudKnowledgeNode; changes: Record<string, any> }[];
  addedEdges: CloudKnowledgeEdge[];
  removedEdges: CloudKnowledgeEdge[];
  provenance: 'CALCULATED';
}

// ─── Phase 59: Real AWS Cloud Graph Query Engine & Natural-Language Investigation ───

export type CloudQueryOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_EQUAL'
  | 'LESS_EQUAL'
  | 'IN'
  | 'NOT_IN'
  | 'EXISTS'
  | 'MISSING'
  | 'RELATED_TO'
  | 'DEPENDS_ON'
  | 'VIOLATES'
  | 'AFFECTED_BY'
  | 'OBSERVED_BY'
  | 'REMEDIATED_BY';

export interface CloudQueryFilter {
  field: string;
  operator: CloudQueryOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR' | undefined;
}

export interface CloudQueryRelationshipConstraint {
  relationshipType: CloudKnowledgeRelationshipType;
  targetNodeType?: CloudKnowledgeNodeType | 'ANY' | undefined;
  depthLimit?: number | undefined;
  targetFilter?: CloudQueryFilter[] | undefined;
}

export interface CloudQueryAst {
  primaryEntityType: CloudKnowledgeNodeType | 'ANY';
  filters?: CloudQueryFilter[] | undefined;
  relationships?: CloudQueryRelationshipConstraint[] | undefined;
  timeRange?: string | undefined;
  limit?: number | undefined;
  maxTraversalDepth?: number | undefined;
}

export type CloudQueryType =
  | 'STRUCTURED'
  | 'NATURAL_LANGUAGE'
  | 'VISUAL_BUILDER'
  | 'CROSS_DOMAIN'
  | 'PATH_SEARCH';

export interface CloudQuery {
  id: string;
  tenantId: string;
  workspaceId: string;
  scope: string;
  queryType: CloudQueryType;
  queryAst: CloudQueryAst;
  rawPrompt?: string | undefined;
  createdBy: string;
  createdAt: string;
}

export interface CloudQueryExplainPlan {
  steps: {
    order: number;
    operation: string;
    description: string;
    estimatedComplexity: string;
  }[];
  recordsExamined: number;
  recordsReturned: number;
  estimatedExecutionCost: string;
}

export interface CloudQueryResult {
  queryId: string;
  nodes: CloudKnowledgeNode[];
  edges: CloudKnowledgeEdge[];
  evidence: {
    source: string;
    accountId: string;
    region: string;
    evidenceStrength: KnowledgeEvidenceStrength;
    confidence: KnowledgeEvidenceConfidence;
    timestamp: string;
  }[];
  explainPlan: CloudQueryExplainPlan;
  warnings: string[];
  confidence: KnowledgeEvidenceConfidence;
  freshness: string;
  partialCoverage: boolean;
  coverageStatus: 'FULL_COVERAGE' | 'PARTIAL_COVERAGE' | 'NO_MATCH' | 'STALE_DATA' | 'PERMISSION_REQUIRED';
  executionTimeMs: number;
  generatedAt: string;
  provenance: 'CALCULATED';
}

export interface NaturalLanguageInvestigationResponse {
  prompt: string;
  intent: string;
  translatedAst: CloudQueryAst;
  explanation: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  evidenceSummary: string[];
  confidence: KnowledgeEvidenceConfidence;
  freshness: string;
  suggestedNextStep: string;
  queryResult: CloudQueryResult;
  provenance: 'CALCULATED';
}

export type InvestigationStatus =
  | 'OPEN'
  | 'ANALYZING'
  | 'EVIDENCE_COLLECTED'
  | 'HYPOTHESIS_FORMED'
  | 'SIMULATION_REQUIRED'
  | 'DECISION_READY'
  | 'RESOLVED'
  | 'ARCHIVED';

export type InvestigationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface InvestigationTimelineEvent {
  id: string;
  timestamp: string;
  type:
    | 'QUERY'
    | 'DISCOVERY'
    | 'EVIDENCE'
    | 'CHANGE'
    | 'INCIDENT'
    | 'FINDING'
    | 'HYPOTHESIS'
    | 'SIMULATION'
    | 'DECISION'
    | 'REMEDIATION'
    | 'VERIFICATION';
  title: string;
  description: string;
  source: string;
  entityId?: string | undefined;
  provenance: string;
}

export interface CloudInvestigation {
  id: string;
  tenantId: string;
  workspaceId: string;
  title: string;
  description: string;
  severity: InvestigationSeverity;
  status: InvestigationStatus;
  scope: string;
  rootCauseHypothesis?: string | undefined;
  queries: CloudQuery[];
  evidenceNodeIds: string[];
  timeline: InvestigationTimelineEvent[];
  decisionId?: string | undefined;
  simulationId?: string | undefined;
  remediationPlanId?: string | undefined;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  provenance: 'CALCULATED';
}

export interface InvestigationReport {
  investigation: CloudInvestigation;
  executiveSummary: string;
  findings: {
    title: string;
    severity: string;
    evidence: string[];
    affectedEntities: string[];
  }[];
  riskPathSummary: string[];
  recommendedActions: string[];
  exportedAt: string;
  exporter: string;
  provenance: 'CALCULATED';
}

// ============================================================================
// PHASE 60 — REAL AWS CONTINUOUS CLOUD OPERATIONS CONTROL PLANE
// ============================================================================

export type OperationState =
  | 'DETECTED'
  | 'TRIAGED'
  | 'INVESTIGATING'
  | 'IMPACT_ASSESSMENT'
  | 'DECISION_READY'
  | 'SIMULATION_REQUIRED'
  | 'PLAN_READY'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'BLOCKED'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'RESOLVED'
  | 'UNKNOWN';

export type OperationType =
  | 'INCIDENT_MITIGATION'
  | 'SECURITY_CONTAINMENT'
  | 'GOVERNANCE_REMEDIATION'
  | 'DRIFT_RECONCILIATION'
  | 'CAPACITY_REBALANCE'
  | 'FAILOVER_ORCHESTRATION'
  | 'ACCESS_REVOCATION'
  | 'CONFIGURATION_UPGRADE';

export type OperationPriority = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';

export type OperationRiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NEGLIGIBLE';

export type OperationAutomationLevel = 0 | 1 | 2 | 3 | 4;

export type OperationApprovalState = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type OperationExecutionState = 'IDLE' | 'PREFLIGHT_CHECK' | 'EXECUTING' | 'COMPLETED' | 'BLOCKED' | 'FAILED';

export type OperationVerificationState = 'PENDING' | 'VERIFYING' | 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'FAILED' | 'UNKNOWN';

export type OperationRollbackState = 'NOT_APPLICABLE' | 'AVAILABLE' | 'IN_PROGRESS' | 'ROLLED_BACK' | 'FAILED' | 'UNAVAILABLE';

export interface CloudOperationPrecondition {
  name: string;
  category: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  details: string;
}

export interface CloudOperation {
  id: string;
  tenantId: string;
  workspaceId: string;
  accountId: string;
  region: string;
  title: string;
  description: string;
  operationType: OperationType;
  targetResourceIds: string[];
  triggerType: 'EVENT' | 'ALARM' | 'ANOMALY' | 'POLICY_VIOLATION' | 'DRIFT' | 'MANUAL' | 'PREDICTION';
  detectionSource: string;
  incidentId?: string | undefined;
  investigationId?: string | undefined;
  decisionId?: string | undefined;
  simulationId?: string | undefined;
  remediationPlanId?: string | undefined;
  priority: OperationPriority;
  risk: OperationRiskLevel;
  state: OperationState;
  preconditions: CloudOperationPrecondition[];
  approvalState: OperationApprovalState;
  automationLevel: OperationAutomationLevel;
  executionState: OperationExecutionState;
  verificationState: OperationVerificationState;
  rollbackState: OperationRollbackState;
  evidenceIds: string[];
  confidence: KnowledgeEvidenceConfidence;
  freshness: string;
  startedAt?: string | undefined;
  completedAt?: string | undefined;
  createdAt: string;
  updatedAt: string;
  provenance: 'CALCULATED';
}

export interface CloudSituationGlobalHealth {
  accountHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  regionHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  serviceHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  resourceHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  governanceHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  securityHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  observabilityHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  finopsHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  resilienceHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
}

export interface CloudSituationAwsDataHealth {
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'PARTIAL' | 'EXPIRED';
  syncState: 'LIVE_TELEMETRY' | 'SYNCING' | 'STALE' | 'ERROR';
  lastSuccessfulSync: string;
  cloudTrailFreshness: string;
  configFreshness: string;
  cloudWatchFreshness: string;
  securityHubFreshness: string;
  costDataFreshness: string;
  permissionsCoverage: 'FULL_READ_ONLY' | 'PARTIAL_PERMISSIONS' | 'PERMISSION_REQUIRED';
}

export interface CloudSituation {
  workspaceId: string;
  overallHealthScore: number;
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  globalHealth: CloudSituationGlobalHealth;
  activeIncidentsCount: number;
  degradedResourcesCount: number;
  activeSecurityIssuesCount: number;
  governanceRegressionsCount: number;
  costAnomaliesCount: number;
  highRiskChangesCount: number;
  predictedFailuresCount: number;
  activeRemediationsCount: number;
  blockedActionsCount: number;
  verificationQueueCount: number;
  awsDataHealth: CloudSituationAwsDataHealth;
  operations: CloudOperation[];
  recentChanges: {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    resourceId: string;
    risk: OperationRiskLevel;
    impactSummary: string;
  }[];
  degradedResources: {
    id: string;
    type: string;
    name: string;
    health: 'DEGRADED' | 'CRITICAL' | 'UNHEALTHY';
    primaryIssue: string;
    impactedServices: string[];
  }[];
  generatedAt: string;
  provenance: 'CALCULATED';
}

export interface OperationalTimelineItem {
  id: string;
  timestamp: string;
  domain:
    | 'EVENT'
    | 'CHANGE'
    | 'METRIC'
    | 'ALARM'
    | 'INCIDENT'
    | 'SECURITY'
    | 'GOVERNANCE'
    | 'COST'
    | 'SIMULATION'
    | 'DECISION'
    | 'REMEDIATION'
    | 'VERIFICATION';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  entityId?: string | undefined;
  evidence: string;
  provenance: string;
}

export interface OperationalStorylineStage {
  stage:
    | 'BEFORE'
    | 'TRIGGER'
    | 'CHANGE'
    | 'DEGRADATION'
    | 'IMPACT'
    | 'INVESTIGATION'
    | 'DECISION'
    | 'ACTION'
    | 'VERIFICATION'
    | 'AFTER';
  title: string;
  timestamp: string;
  description: string;
  evidence: string[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'SKIPPED';
}

export interface OperationalStoryline {
  operationId: string;
  stages: OperationalStorylineStage[];
  summary: string;
  provenance: 'CALCULATED';
}

export interface SafeActionDefinition {
  actionId: string;
  actionName: string;
  provider: 'AWS';
  targetResourceTypes: string[];
  risk: OperationRiskLevel;
  reversibility: 'FULL_AUTOMATED_REVERSAL' | 'MANUAL_REVERSAL_REQUIRED' | 'IRREVERSIBLE';
  requiredPermissions: string[];
  preconditions: string[];
  verificationMethod: string;
  rollbackCapability: boolean;
  maxAutomationLevel: OperationAutomationLevel;
}

export interface AiOperationsCopilotResponse {
  prompt: string;
  intent: string;
  answer: string;
  relatedOperationId?: string | undefined;
  citedEvidence: {
    source: string;
    entityId: string;
    description: string;
  }[];
  suggestedAction?: {
    actionType: string;
    description: string;
    requiresApproval: boolean;
    simulationRequired: boolean;
  } | undefined;
  confidence: KnowledgeEvidenceConfidence;
  freshness: string;
  provenance: 'CALCULATED';
}

// ─── Phase 61: Real Multi-Cloud Connectivity: Azure + Google Cloud ─────────────

export type CloudProvider = 'AWS' | 'AZURE' | 'GCP';

export type CloudConnectionStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'AUTHORIZATION_REQUIRED'
  | 'PERMISSION_ERROR'
  | 'DEGRADED'
  | 'ERROR';

export type CloudAuthorizationMethod =
  | 'ASSUME_ROLE_CROSS_ACCOUNT'
  | 'IAM_IDENTITY_CENTER'
  | 'OIDC_FEDERATED'
  | 'AZURE_ENTRA_APP'
  | 'AZURE_MANAGED_IDENTITY'
  | 'AZURE_WORKLOAD_IDENTITY'
  | 'GCP_SERVICE_ACCOUNT'
  | 'GCP_WORKLOAD_IDENTITY_FEDERATION'
  | 'OIDC_CROSS_CLOUD';

export type CloudCapabilityType =
  | 'RESOURCE_INVENTORY'
  | 'METRICS'
  | 'LOGS'
  | 'TRACES'
  | 'SECURITY_FINDINGS'
  | 'COST_MANAGEMENT'
  | 'IDENTITY_IAM'
  | 'TOPOLOGY_RELATIONSHIPS'
  | 'REMEDIATION_EXECUTION'
  | 'COMPLIANCE_EVALUATION';

export type CloudCapabilityCoverage =
  | 'SUPPORTED'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'PERMISSION_REQUIRED';

export interface CloudProviderCapability {
  capability: CloudCapabilityType;
  coverage: CloudCapabilityCoverage;
  description: string;
  requiredPermissions: string[];
  grantedPermissions?: string[] | undefined;
  missingPermissions?: string[] | undefined;
  testedAt?: string | undefined;
}

export interface CloudProviderStructure {
  provider: CloudProvider;
  rootLevel: string; // AWS: 'Organization' | Azure: 'Tenant/ManagementGroup' | GCP: 'Organization/Folder'
  containerLevel: string; // AWS: 'Account' | Azure: 'Subscription' | GCP: 'Project'
  groupLevel?: string | undefined; // Azure: 'ResourceGroup' | GCP: 'Folder'
  locationType: string; // AWS: 'Region' | Azure: 'Location/Region' | GCP: 'Region/Zone'
  identityType: string; // AWS: 'IAM' | Azure: 'Entra ID / RBAC' | GCP: 'Cloud IAM'
  scopeId: string; // AccountId | SubscriptionId | ProjectId
  scopeName: string;
  parentScopeId?: string | undefined;
  availableLocations: string[];
}

export type CloudNormalizedServiceType =
  // Compute
  | 'COMPUTE_VM'
  | 'SERVERLESS_FUNCTION'
  | 'CONTAINER_SERVICE'
  | 'KUBERNETES_CLUSTER'
  // Storage
  | 'OBJECT_STORAGE'
  | 'BLOCK_STORAGE'
  | 'FILE_STORAGE'
  // Database
  | 'RELATIONAL_DATABASE'
  | 'NOSQL_DATABASE'
  | 'DATA_WAREHOUSE'
  | 'CACHE_DATABASE'
  // Network
  | 'VIRTUAL_NETWORK'
  | 'LOAD_BALANCER'
  | 'CDN'
  | 'DNS_ZONE'
  | 'GATEWAY'
  // Security & Identity
  | 'KEY_VAULT'
  | 'IAM_ROLE'
  | 'IAM_USER'
  | 'IAM_SERVICE_ACCOUNT'
  | 'FIREWALL_SECURITY_GROUP'
  // Messaging & Events
  | 'EVENT_QUEUE'
  | 'TOPIC_PUBSUB'
  | 'EVENT_BUS'
  // Monitoring & Ops
  | 'LOG_GROUP'
  | 'METRIC_ALARM'
  | 'AUDIT_TRAIL'
  | 'OTHER';

export interface CloudResource {
  id: string; // Global canonical ID: `provider:scope:region:type:id`
  canonicalId: string;
  nativeId: string;
  name: string;
  displayName: string;
  provider: CloudProvider;
  cloudScope: {
    organizationOrTenantId?: string | undefined;
    accountOrSubscriptionOrProjectId: string;
    scopeName: string;
    resourceGroupOrFolder?: string | undefined;
  };
  regionOrLocation: string;
  zoneOrAvailabilityZone?: string | undefined;
  serviceCategory: 'COMPUTE' | 'STORAGE' | 'DATABASE' | 'NETWORKING' | 'SECURITY' | 'MESSAGING' | 'ANALYTICS' | 'MANAGEMENT';
  normalizedServiceType: CloudNormalizedServiceType;
  nativeServiceType: string;
  status: string;
  healthState: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  healthReasons: string[];
  tags: Record<string, string>;
  labels?: Record<string, string> | undefined;
  metadata: Record<string, any>;
  relationships: {
    type: string;
    targetCanonicalId: string;
    targetServiceName: string;
    direction: 'OUTBOUND' | 'INBOUND' | 'BIDIRECTIONAL';
  }[];
  securityFindings: {
    id: string;
    ruleId: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    evidence: string;
    remediation: string;
    source: 'AWS_GUARDDUTY' | 'AWS_SECURITY_HUB' | 'AZURE_DEFENDER' | 'GCP_SCC' | 'CLOUDPULSE_INSPECTION';
  }[];
  governanceStatus: 'PASS' | 'FAIL' | 'NOT_EVALUATED';
  estimatedMonthlyCost: number;
  costCurrency: string;
  dataSource: 'LIVE' | 'CALCULATED' | 'ESTIMATED' | 'NOT_CONNECTED' | 'UNKNOWN';
  provenance: 'LIVE' | 'CALCULATED' | 'ESTIMATED';
  lastSeenAt: string;
  lastSyncedAt: string;
}

export interface CloudProviderIdentity {
  id: string;
  provider: CloudProvider;
  identityType: 'USER' | 'ROLE' | 'SERVICE_PRINCIPAL' | 'SERVICE_ACCOUNT' | 'GROUP';
  name: string;
  principalId: string;
  emailOrUpn?: string | undefined;
  assignedRoles: string[];
  permissions: string[];
  mfaEnabled?: boolean | undefined;
  keyRotationStatus?: 'CURRENT' | 'WARNING' | 'EXPIRED' | 'UNKNOWN' | undefined;
  lastActiveAt?: string | undefined;
  metadata: Record<string, any>;
  dataSource: 'LIVE' | 'CALCULATED';
}

export interface CloudProviderMetrics {
  provider: CloudProvider;
  resourceId: string;
  metrics: {
    metricName: string;
    unit: string;
    value: number;
    timestamp: string;
  }[];
  provenance: 'LIVE';
}

export interface CloudProviderEvent {
  id: string;
  provider: CloudProvider;
  eventName: string;
  eventSource: string; // CloudTrail / Azure Activity Log / GCP Cloud Audit Logs
  timestamp: string;
  actor: string;
  resourceId?: string | undefined;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  details: Record<string, any>;
}

export interface CloudProviderSecurityFinding {
  id: string;
  provider: CloudProvider;
  resourceId: string;
  resourceCanonicalId: string;
  ruleId: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'IAM' | 'NETWORK' | 'DATA_PROTECTION' | 'LOGGING' | 'COMPLIANCE';
  evidence: string;
  remediationRecommendation: string;
  status: 'ACTIVE' | 'RESOLVED' | 'SUPPRESSED';
  detector: string;
  createdAt: string;
}

export interface CloudProviderCostData {
  provider: CloudProvider;
  scopeId: string;
  currentMonthSpend: number;
  forecastMonthSpend: number;
  previousMonthSpend: number;
  currency: string;
  isAvailable: boolean;
  byService: {
    serviceName: string;
    spend: number;
    percentage: number;
  }[];
  byRegion: {
    regionOrLocation: string;
    spend: number;
  }[];
  freshness: string;
  provenance: 'LIVE' | 'CALCULATED' | 'ESTIMATED';
}

export interface CloudProviderIdentitySummary {
  provider: CloudProvider;
  totalIdentities: number;
  usersCount: number;
  rolesOrServicePrincipalsCount: number;
  serviceAccountsCount: number;
  mfaEnabledPercent: number;
  privilegedRolesCount: number;
  overprivilegedCount: number;
  staleKeysCount: number;
}

export interface CloudValidationResult {
  valid: boolean;
  provider: CloudProvider;
  testedAt: string;
  scopeIdentifier: string;
  connectionStatus: CloudConnectionStatus;
  capabilities: CloudProviderCapability[];
  permissionDiagnostics: {
    permission: string;
    category: string;
    status: 'GRANTED' | 'MISSING' | 'OPTIONAL';
    purpose: string;
    impact: string;
  }[];
  errorDetails?: {
    code: string;
    message: string;
    suggestedFix: string;
  } | undefined;
}

export interface MultiCloudScorecardItem {
  provider: CloudProvider;
  displayName: string;
  status: CloudConnectionStatus;
  scopeIdentifier: string;
  scopeName: string;
  totalResources: number;
  healthyResources: number;
  warningResources: number;
  criticalResources: number;
  activeSecurityFindings: number;
  criticalSecurityFindings: number;
  currentSpend: number;
  currency: string;
  governanceCompliancePercent: number;
  identityRiskScore: number; // 0 (safe) to 100 (high risk)
  activeAlerts: number;
  capabilitiesCoverage: {
    supported: number;
    partial: number;
    unavailable: number;
    permissionRequired: number;
  };
  lastSyncedAt: string;
  dataSource: 'LIVE' | 'NOT_CONNECTED';
}

export interface MultiCloudScorecard {
  workspaceId: string;
  organizationId: string;
  evaluatedAt: string;
  providers: MultiCloudScorecardItem[];
  aggregates: {
    totalConnectedClouds: number;
    totalResources: number;
    totalMonthlySpend: number;
    totalCriticalFindings: number;
    overallHealthPercent: number;
    overallCompliancePercent: number;
  };
  provenance: 'CALCULATED';
}

export interface MultiCloudComparison {
  metric: string;
  category: 'HEALTH' | 'SECURITY' | 'GOVERNANCE' | 'COST' | 'IDENTITY' | 'OBSERVABILITY';
  awsValue: string | number;
  azureValue: string | number;
  gcpValue: string | number;
  status: 'BALANCED' | 'AWS_OPTIMIZED' | 'AZURE_OPTIMIZED' | 'GCP_OPTIMIZED' | 'ACTION_NEEDED';
  recommendation: string;
}

export interface AzureSetupGuideStep {
  stepNumber: number;
  title: string;
  description: string;
  cliCommand?: string | undefined;
  portalPath?: string | undefined;
  requiredPermissions?: string[] | undefined;
  verificationHint: string;
}

export interface GcpSetupGuideStep {
  stepNumber: number;
  title: string;
  description: string;
  gcloudCommand?: string | undefined;
  consolePath?: string | undefined;
  requiredRoles?: string[] | undefined;
  verificationHint: string;
}

// ==========================================
// Phase 62 — Kubernetes Types & Models
// ==========================================

export type KubernetesProvider = 'EKS' | 'AKS' | 'GKE' | 'SELF_MANAGED';

export type KubernetesConnectionStatus =
  | 'NOT_CONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'PARTIAL'
  | 'STALE'
  | 'ERROR'
  | 'REAUTH_REQUIRED'
  | 'DISABLED';

export type KubernetesCapabilityType =
  | 'CLUSTER_METADATA'
  | 'NODE_INVENTORY'
  | 'NAMESPACE_INVENTORY'
  | 'WORKLOAD_INVENTORY'
  | 'POD_INVENTORY'
  | 'SERVICE_INVENTORY'
  | 'INGRESS'
  | 'STORAGE'
  | 'NETWORK_POLICY'
  | 'RBAC'
  | 'EVENTS'
  | 'METRICS'
  | 'LOGS'
  | 'SECURITY'
  | 'COST'
  | 'REMEDIATION'
  | 'ROLLOUTS'
  | 'AUTOSCALING';

export type KubernetesCapabilityCoverage =
  | 'SUPPORTED'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'PERMISSION_REQUIRED'
  | 'STALE';

export interface KubernetesCapability {
  type: KubernetesCapabilityType;
  status: KubernetesCapabilityCoverage;
  description: string;
}

export interface KubernetesConnection {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  clusterId: string;
  provider: KubernetesProvider;
  clusterEndpointReference: string;
  authorizationMethod: 'AWS_IAM_IRSA' | 'AZURE_ENTRA_AAD' | 'GCP_IAM' | 'SERVICE_ACCOUNT_TOKEN';
  namespaceScope: string[]; // empty means all accessible namespaces
  status: KubernetesConnectionStatus;
  capabilities: KubernetesCapability[];
  permissions: {
    canReadWorkloads: boolean;
    canReadSecrets: boolean;
    canReadLogs: boolean;
    canReadMetrics: boolean;
    canExecuteSafeRemediation: boolean;
  };
  version: string;
  contextMetadata: {
    regionOrLocation: string;
    cloudAccountOrProject: string;
    oidcIssuerUrl?: string | undefined;
  };
  lastSuccessfulSync?: string | undefined;
  lastAttemptedSync?: string | undefined;
  lastError?: string | undefined;
  freshness: 'LIVE' | 'FRESH' | 'STALE' | 'PARTIAL' | 'UNKNOWN';
  truthInLabelingVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KubernetesCluster {
  id: string;
  canonicalId: string; // k8s:provider:scope:clusterName
  workspaceId: string;
  provider: KubernetesProvider;
  cloudScope: string;
  clusterName: string;
  clusterVersion: string;
  region: string;
  status: 'HEALTHY' | 'DEGRADED' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  nodeCount: number;
  namespaceCount: number;
  workloadCount: number;
  podCount: number;
  apiHealth: 'HEALTHY' | 'DEGRADED' | 'UNREACHABLE';
  cpuCapacityCores: number;
  cpuAllocatableCores: number;
  memoryCapacityBytes: number;
  memoryAllocatableBytes: number;
  capabilities: KubernetesCapability[];
  observedAt: string;
  freshness: 'LIVE' | 'FRESH' | 'STALE' | 'PARTIAL' | 'UNKNOWN';
}

export interface KubernetesNode {
  id: string;
  canonicalId: string;
  clusterId: string;
  name: string;
  status: 'Ready' | 'NotReady' | 'SchedulingDisabled' | 'Unknown';
  roles: string[];
  kubeletVersion: string;
  architecture: string;
  osImage: string;
  instanceType?: string | undefined;
  cloudProviderId?: string | undefined;
  zone: string;
  capacity: {
    cpu: string;
    memory: string;
    pods: string;
  };
  allocatable: {
    cpu: string;
    memory: string;
    pods: string;
  };
  metrics?: {
    cpuUsagePercent: number;
    memoryUsagePercent: number;
    source: string;
  } | undefined;
  conditions: {
    type: string;
    status: 'True' | 'False' | 'Unknown';
    reason?: string | undefined;
    message?: string | undefined;
  }[];
  taints: {
    key: string;
    value?: string | undefined;
    effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
  }[];
  labels: Record<string, string>;
  createdAt: string;
}

export interface KubernetesNamespace {
  id: string;
  name: string;
  clusterId: string;
  status: 'Active' | 'Terminating';
  workloadCount: number;
  podCount: number;
  serviceCount: number;
  resourceQuotas?: {
    cpuLimit?: string | undefined;
    memoryLimit?: string | undefined;
    cpuUsed?: string | undefined;
    memoryUsed?: string | undefined;
  } | undefined;
  networkPolicyCount: number;
  securityFindingsCount: number;
  labels: Record<string, string>;
  createdAt: string;
}

export interface KubernetesWorkload {
  id: string;
  canonicalId: string;
  clusterId: string;
  namespace: string;
  name: string;
  kind: 'Deployment' | 'StatefulSet' | 'DaemonSet' | 'Job' | 'CronJob' | 'ReplicaSet';
  desiredReplicas: number;
  availableReplicas: number;
  readyReplicas: number;
  updatedReplicas: number;
  imageReferences: string[];
  containerCount: number;
  resourceRequests: {
    cpu?: string | undefined;
    memory?: string | undefined;
  };
  resourceLimits: {
    cpu?: string | undefined;
    memory?: string | undefined;
  };
  rolloutState: 'ROLLOUT_SUCCESSFUL' | 'ROLLOUT_IN_PROGRESS' | 'ROLLOUT_STALLED' | 'ROLLOUT_DEGRADED' | 'UNKNOWN';
  rolloutRevision: number;
  updateStrategy: string;
  labels: Record<string, string>;
  selectors: Record<string, string>;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  createdAt: string;
}

export interface KubernetesPod {
  id: string;
  canonicalId: string;
  clusterId: string;
  namespace: string;
  name: string;
  nodeName: string;
  workloadName?: string | undefined;
  workloadKind?: string | undefined;
  phase: 'Running' | 'Pending' | 'Succeeded' | 'Failed' | 'Unknown';
  ready: boolean;
  restartCount: number;
  reasons: ('CrashLoopBackOff' | 'ImagePullBackOff' | 'OOMKilled' | 'Pending' | 'Failed' | 'Unschedulable' | 'Completed')[];
  containers: {
    name: string;
    image: string;
    ready: boolean;
    state: 'running' | 'waiting' | 'terminated';
    stateReason?: string | undefined;
    restartCount: number;
    resourceRequests?: { cpu?: string | undefined; memory?: string | undefined } | undefined;
    resourceLimits?: { cpu?: string | undefined; memory?: string | undefined } | undefined;
    privileged: boolean;
  }[];
  podIp?: string | undefined;
  hostIp?: string | undefined;
  age: string;
  createdAt: string;
}

export interface KubernetesService {
  id: string;
  canonicalId: string;
  clusterId: string;
  namespace: string;
  name: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
  clusterIp: string;
  externalIp?: string | undefined;
  ports: {
    name?: string | undefined;
    protocol: 'TCP' | 'UDP';
    port: number;
    targetPort: number | string;
    nodePort?: number | undefined;
  }[];
  selectors: Record<string, string>;
  exposure: 'PUBLIC' | 'INTERNAL' | 'UNKNOWN';
  targetPodCount: number;
  createdAt: string;
}

export interface KubernetesIngress {
  id: string;
  canonicalId: string;
  clusterId: string;
  namespace: string;
  name: string;
  ingressClass?: string | undefined;
  loadBalancerIps: string[];
  rules: {
    host?: string | undefined;
    paths: {
      path: string;
      pathType: 'Prefix' | 'Exact' | 'ImplementationSpecific';
      serviceName: string;
      servicePort: number | string;
    }[];
  }[];
  tlsConfigured: boolean;
  exposure: 'PUBLIC' | 'INTERNAL' | 'UNKNOWN';
  createdAt: string;
}

export interface KubernetesStorage {
  persistentVolumes: {
    id: string;
    name: string;
    capacity: string;
    accessModes: string[];
    reclaimPolicy: 'Retain' | 'Recycle' | 'Delete';
    storageClass: string;
    status: 'Available' | 'Bound' | 'Released' | 'Failed';
    claimRef?: { namespace: string; name: string } | undefined;
  }[];
  persistentVolumeClaims: {
    id: string;
    namespace: string;
    name: string;
    volumeName?: string | undefined;
    storageClass?: string | undefined;
    status: 'Bound' | 'Pending' | 'Lost';
    requestedCapacity: string;
  }[];
  storageClasses: {
    name: string;
    provisioner: string;
    reclaimPolicy: string;
    volumeBindingMode: string;
  }[];
}

export interface KubernetesAutoscaling {
  hpa: {
    id: string;
    namespace: string;
    name: string;
    targetWorkload: { kind: string; name: string };
    minReplicas: number;
    maxReplicas: number;
    currentReplicas: number;
    desiredReplicas: number;
    targetCpuUtilizationPercentage?: number | undefined;
    currentCpuUtilizationPercentage?: number | undefined;
    status: 'ACTIVE' | 'SCALING_LIMITED' | 'INACTIVE';
  }[];
}

export interface KubernetesRbacSummary {
  serviceAccountsCount: number;
  rolesCount: number;
  clusterRolesCount: number;
  roleBindingsCount: number;
  clusterRoleBindingsCount: number;
  privilegedServiceAccounts: {
    name: string;
    namespace: string;
    clusterRolesBound: string[];
    hasWildcardPermissions: boolean;
    hasSecretsAccess: boolean;
  }[];
}

export interface KubernetesSecurityFinding {
  id: string;
  clusterId: string;
  namespace: string;
  resourceKind: string;
  resourceName: string;
  ruleId: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  evidence: string;
  remediationSuggestion: string;
  status: 'ACTIVE' | 'RESOLVED' | 'SUPPRESSED';
  createdAt: string;
}

export interface KubernetesGovernanceResult {
  clusterId: string;
  evaluatedAt: string;
  overallComplianceScore: number;
  policiesEvaluated: {
    policyId: string;
    policyName: string;
    category: 'SECURITY' | 'RELIABILITY' | 'EFFICIENCY' | 'TAGGING';
    status: 'PASS' | 'WARN' | 'FAIL';
    passingResourcesCount: number;
    violatingResourcesCount: number;
    violations: {
      resourceRef: string;
      reason: string;
    }[];
  }[];
}

export interface KubernetesSafeAction {
  actionId: string;
  name: string;
  description: string;
  targetKind: 'Deployment' | 'StatefulSet' | 'DaemonSet' | 'Node' | 'Pod';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresApproval: boolean;
  reversible: boolean;
  preconditions: string[];
}

export interface KubernetesOperation {
  id: string;
  clusterId: string;
  workspaceId: string;
  title: string;
  actionId: string;
  targetKind: string;
  targetNamespace: string;
  targetName: string;
  status: 'PLANNED' | 'PREFLIGHT_PASS' | 'PREFLIGHT_FAIL' | 'APPROVAL_REQUIRED' | 'APPROVED' | 'EXECUTING' | 'VERIFYING' | 'VERIFIED' | 'FAILED' | 'ROLLED_BACK';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  parameters: Record<string, any>;
  preflightChecks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  simulationSummary?: string | undefined;
  freshReadVerification?: {
    verified: boolean;
    observedState: string;
    timestamp: string;
  } | undefined;
  initiatedBy: string;
  approvedBy?: string | undefined;
  startedAt?: string | undefined;
  completedAt?: string | undefined;
}

export interface KubernetesSimulationResult {
  simulationId: string;
  clusterId: string;
  action: string;
  target: string;
  safeToExecute: boolean;
  predictedImpact: {
    affectedPods: number;
    affectedWorkloads: string[];
    capacityChangePercent: number;
    riskScore: number;
  };
  warnings: string[];
  simulatedAt: string;
}

export interface KubernetesOverviewSummary {
  workspaceId: string;
  totalClusters: number;
  connectedClusters: number;
  totalNodes: number;
  totalNamespaces: number;
  totalWorkloads: number;
  totalPods: number;
  healthyPods: number;
  degradedPods: number;
  stalledRollouts: number;
  activeSecurityFindings: number;
  governanceScore: number;
  clusters: KubernetesCluster[];
}

// ─── PHASE 63: SRE & RELIABILITY CONTROL PLANE ─────────────────────────────────

export type CloudServiceProvider = 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES' | 'HYBRID' | 'MULTI_CLOUD' | 'ON_PREMISES';
export type CloudServiceHealth = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
export type CloudServiceReliabilityState = 'OPTIMAL' | 'AT_RISK' | 'DEGRADED' | 'BREACHED' | 'INSUFFICIENT_DATA' | 'UNKNOWN';
export type CloudServiceCriticality = 'TIER_0_CRITICAL' | 'TIER_1_HIGH' | 'TIER_2_MEDIUM' | 'TIER_3_LOW' | 'UNKNOWN';

export interface CloudService {
  id: string;
  tenantId: string;
  workspaceId: string;
  provider: CloudServiceProvider;
  cloudScope: string;
  name: string;
  serviceType: string;
  environment: 'production' | 'staging' | 'development' | 'unknown';
  owner: string;
  criticality: CloudServiceCriticality;
  tier: string;
  dependencies: string[];
  upstreamDependencies?: string[];
  telemetryCoverage: {
    metrics: boolean;
    logs: boolean;
    traces: boolean;
    events: boolean;
    coveragePercent: number;
  };
  health: CloudServiceHealth;
  reliabilityScore: number;
  reliabilityState: CloudServiceReliabilityState;
  sloIds: string[];
  incidentIds: string[];
  resourceIds: string[];
  goldenSignals: {
    trafficRps?: number;
    errorRatePercent?: number;
    latencyP50Ms?: number;
    latencyP95Ms?: number;
    latencyP99Ms?: number;
    cpuUtilizationPercent?: number;
    memoryUtilizationPercent?: number;
    source: string;
    freshness: string;
  };
  updatedAt: string;
  observedAt: string;
  freshness: 'LIVE' | 'RECENT' | 'STALE' | 'UNKNOWN';
}

export type SliMetricType = 'AVAILABILITY' | 'SUCCESS_RATE' | 'ERROR_RATE' | 'LATENCY' | 'SATURATION' | 'THROUGHPUT' | 'REQUEST_VOLUME' | 'DEPENDENCY_HEALTH';

export interface ServiceLevelIndicator {
  id: string;
  serviceId: string;
  serviceName: string;
  name: string;
  type: SliMetricType;
  definition: string;
  sourceMetrics: string[];
  calculation: string;
  timeWindow: string;
  unit: '%' | 'ms' | 'rps' | 'ratio' | 'count';
  currentValue: number | null;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'INSUFFICIENT_DATA' | 'UNKNOWN';
  freshness: 'LIVE' | 'RECENT' | 'STALE' | 'UNKNOWN';
  coverage: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  lastEvaluatedAt: string;
}

export type SloObjectiveType = 'AVAILABILITY' | 'LATENCY' | 'ERROR_RATE' | 'THROUGHPUT';
export type SloStatusState = 'ACHIEVING' | 'AT_RISK' | 'BREACHED' | 'INSUFFICIENT_DATA' | 'UNKNOWN';
export type SloTargetSource = 'CONFIGURED' | 'RECOMMENDED' | 'DEFAULT_TEMPLATE';

export interface ServiceLevelObjective {
  id: string;
  serviceId: string;
  serviceName: string;
  sliId: string;
  name: string;
  description: string;
  target: number;
  comparison: 'GTE' | 'LTE';
  timeWindow: string;
  objectiveType: SloObjectiveType;
  targetSource: SloTargetSource;
  status: SloStatusState;
  currentValue: number | null;
  errorBudgetTotalMinutes: number;
  errorBudgetConsumedMinutes: number;
  errorBudgetRemainingMinutes: number;
  errorBudgetRemainingPercent: number | null;
  burnRate: number | null;
  burnRateStatus: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  freshness: 'LIVE' | 'RECENT' | 'STALE' | 'UNKNOWN';
  coverage: number;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorBudget {
  sloId: string;
  serviceId: string;
  serviceName: string;
  budgetType: 'AVAILABILITY' | 'ERROR_COUNT' | 'LATENCY_BUDGET';
  totalBudget: number;
  consumedBudget: number;
  remainingBudget: number;
  remainingPercent: number;
  currentBurnRate: number;
  shortWindowBurnRate: number;
  longWindowBurnRate: number;
  burnRateStatus: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  trend: 'STABLE' | 'BURNING_FAST' | 'EXHAUSTED' | 'RECOVERING' | 'UNKNOWN';
  projectedExhaustionHours: number | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  calculatedAt: string;
}

export interface ReliabilityScore {
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'UNKNOWN';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  coverage: number;
  freshness: 'LIVE' | 'RECENT' | 'STALE' | 'UNKNOWN';
  dimensions: {
    sloCompliance: { score: number; weight: number; status: string; detail: string };
    errorRate: { score: number; weight: number; status: string; detail: string };
    latencyPerformance: { score: number; weight: number; status: string; detail: string };
    incidentFrequency: { score: number; weight: number; status: string; detail: string };
    dependencyHealth: { score: number; weight: number; status: string; detail: string };
    changeFailureRate: { score: number; weight: number; status: string; detail: string };
    recoveryEffectiveness: { score: number; weight: number; status: string; detail: string };
    observabilityCoverage: { score: number; weight: number; status: string; detail: string };
  };
  summary: string;
}

export interface DependencyRisk {
  serviceId: string;
  serviceName: string;
  dependencyId: string;
  dependencyName: string;
  dependencyType: 'SERVICE' | 'DATABASE' | 'QUEUE' | 'CACHE' | 'THIRD_PARTY';
  health: CloudServiceHealth;
  activeIncidentsCount: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  criticality: CloudServiceCriticality;
  concentrationRisk: boolean;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CascadingFailurePath {
  id: string;
  originServiceId: string;
  originServiceName: string;
  impactedServices: string[];
  pathDescription: string;
  evidenceRank: 'CONFIRMED' | 'DERIVED' | 'INFERRED';
  blastRadiusScore: number;
  mitigationRecommendation: string;
}

export interface SreSinglePointOfFailure {
  id: string;
  entityId: string;
  entityName: string;
  entityType: 'RESOURCE' | 'AVAILABILITY_ZONE' | 'REGION' | 'K8S_NODE' | 'DATABASE_PRIMARY' | 'SHARED_GATEWAY';
  dependentServices: string[];
  blastRadius: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigationStatus: 'MITIGATED' | 'PARTIALLY_MITIGATED' | 'UNMITIGATED';
  recommendation: string;
}

export interface FailureDomainAnalysis {
  availabilityZoneConcentration: { zone: string; resourceCount: number; percentage: number; risk: 'LOW' | 'HIGH' }[];
  regionConcentration: { region: string; resourceCount: number; percentage: number }[];
  clusterNodeConcentration: { node: string; podCount: number; criticalPodCount: number; risk: 'LOW' | 'HIGH' }[];
  summary: string;
}

export interface ChangeReliabilityCorrelation {
  changeId: string;
  changeType: 'DEPLOYMENT' | 'INFRASTRUCTURE' | 'KUBERNETES_ROLLOUT' | 'CONFIG_UPDATE' | 'POLICY_CHANGE';
  serviceId: string;
  timestamp: string;
  actor: string;
  correlatedSloBreaches: string[];
  correlatedIncidents: string[];
  correlationType: 'TEMPORAL_PROXIMITY' | 'EVIDENCE_BACKED' | 'DIRECT_CAUSAL';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
}

export interface ChangeFailureRateMetrics {
  totalChangesPeriod: number;
  failedChanges: number;
  incidentCorrelatedChanges: number;
  rollbacksCount: number;
  verificationFailureCount: number;
  changeFailureRatePercent: number | null;
  status: 'OBSERVED' | 'CALCULATED' | 'INSUFFICIENT_HISTORY';
}

export interface SreMttMetrics {
  mttdMinutes: number | null;
  mttdStatus: 'CALCULATED' | 'UNKNOWN';
  mttaMinutes: number | null;
  mttaStatus: 'CALCULATED' | 'UNKNOWN';
  mttrMinutes: number | null;
  mttrStatus: 'CALCULATED' | 'UNKNOWN';
  recoveryVerificationRatePercent: number | null;
  activeIncidentsCount: number;
  resolvedIncidentsCount: number;
}

export type ErrorBudgetPolicyState = 'NORMAL' | 'WARNING' | 'FREEZE_RISKY_CHANGES' | 'INCIDENT_MODE';

export interface ErrorBudgetPolicy {
  id: string;
  workspaceId: string;
  serviceId?: string;
  policyState: ErrorBudgetPolicyState;
  warningThresholdPercent: number;
  freezeThresholdPercent: number;
  freezeDeployments: boolean;
  exemptServiceIds: string[];
  activeSince: string;
  reason: string;
}

export interface ReleaseRiskAssessment {
  changeId: string;
  serviceId: string;
  proposedVersion?: string;
  riskLevel: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'BLOCKED' | 'UNKNOWN';
  decision: 'PASS' | 'WARN' | 'BLOCK';
  score: number;
  evaluationFactors: {
    factor: string;
    status: 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN';
    details: string;
  }[];
  sloHealth: SloStatusState;
  errorBudgetRemainingPercent: number | null;
  burnRate: number | null;
  activeIncidents: number;
  dependencyRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  recentChangeFailureRatePercent: number | null;
  recommendation: string;
}

export interface CapacityIntelligence {
  serviceId: string;
  serviceName: string;
  cpuSaturationPercent: number | null;
  memorySaturationPercent: number | null;
  storageSaturationPercent: number | null;
  networkSaturationPercent: number | null;
  podCount: number;
  nodeCount: number;
  scalingPressure: 'NONE' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  forecastDaysToExhaustion: number | null;
  forecastConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_HISTORY';
  forecastWindow: string;
  recommendation?: string;
}

export interface RecoveryVerification {
  id: string;
  incidentId?: string | undefined;
  remediationActionId?: string | undefined;
  serviceId: string;
  serviceName: string;
  executedAt: string;
  verifiedAt?: string | undefined;
  status: 'RECOVERED' | 'PARTIALLY_RECOVERED' | 'NOT_RECOVERED' | 'UNKNOWN';
  verifiedMetrics: {
    metricName: string;
    preRemediationValue: number;
    currentFreshValue: number;
    targetThreshold: number;
    restored: boolean;
  }[];
  freshReadConfirmed: boolean;
  notes: string;
}

export interface SrePlatformSummary {
  workspaceId: string;
  globalReliabilityScore: number;
  globalReliabilityGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'UNKNOWN';
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  criticalServices: number;
  unknownServices: number;
  totalSlos: number;
  achievingSlos: number;
  atRiskSlos: number;
  breachedSlos: number;
  insufficientDataSlos: number;
  overallSloAttainmentPercent: number;
  criticalBurnRateCount: number;
  activeIncidentsCount: number;
  changeFailureRate: ChangeFailureRateMetrics;
  mttMetrics: SreMttMetrics;
  activePolicyState: ErrorBudgetPolicyState;
  observabilityCoveragePercent: number;
  freshness: 'LIVE' | 'RECENT' | 'STALE';
  calculatedAt: string;
}

export interface ServiceReliabilityDetail {
  service: CloudService;
  slis: ServiceLevelIndicator[];
  slos: ServiceLevelObjective[];
  errorBudgets: ErrorBudget[];
  reliabilityScore: ReliabilityScore;
  goldenSignals: CloudService['goldenSignals'];
  dependencies: DependencyRisk[];
  cascadingRisks: CascadingFailurePath[];
  spofs: SreSinglePointOfFailure[];
  recentChanges: ChangeReliabilityCorrelation[];
  capacity: CapacityIntelligence;
  activeIncidents: any[];
  policy: ErrorBudgetPolicy;
  recoveryHistory: RecoveryVerification[];
}

export interface SreInvestigationResult {
  query: string;
  intent: 'SERVICE_HEALTH' | 'SLO_RISK' | 'ERROR_BUDGET' | 'ROOT_CAUSE' | 'DEPENDENCY_RISK' | 'RELEASE_RISK' | 'RECOMMENDED_ACTION' | 'GENERAL_SRE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  primaryDiagnosis: string;
  evidenceCitations: {
    type: 'METRIC' | 'SLO' | 'INCIDENT' | 'CHANGE' | 'DEPENDENCY' | 'KUBERNETES';
    title: string;
    detail: string;
    value?: string | number;
  }[];
  recommendedAction?: {
    actionId: string;
    title: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    safetyType: 'AUTOMATED_SAFE' | 'HUMAN_APPROVAL_REQUIRED';
    reason: string;
  };
  suggestedFollowUps: string[];
  analyzedAt: string;
}

// ─── Phase 64: Enterprise Cloud Workflow, Collaboration & Governed Change Management ────

export type EnterpriseUserRole =
  | 'VIEWER'
  | 'OPERATOR'
  | 'ENGINEER'
  | 'SECURITY_ANALYST'
  | 'SRE'
  | 'FINOPS_ANALYST'
  | 'GOVERNANCE_MANAGER'
  | 'APPROVER'
  | 'WORKSPACE_ADMIN'
  | 'ORG_ADMIN';

export type TeamType =
  | 'SRE'
  | 'SECURITY'
  | 'PLATFORM'
  | 'FINOPS'
  | 'NETWORK'
  | 'APPLICATION'
  | 'COMPLIANCE'
  | 'OPERATIONS'
  | 'DATABASE'
  | 'ARCHITECTURE'
  | 'OTHER';

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: EnterpriseUserRole;
  isLead: boolean;
  joinedAt: string;
}

export interface EscalationPolicyTier {
  level: number;
  delayMinutes: number;
  notifyUserIds: string[];
  notifyTeamIds: string[];
  channelType: 'SLACK' | 'EMAIL' | 'PAGERDUTY' | 'WEBHOOK' | 'IN_APP';
}

export interface EscalationPolicy {
  id: string;
  name: string;
  tiers: EscalationPolicyTier[];
}

export interface CloudTeam {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string;
  teamType: TeamType;
  members: TeamMember[];
  permissions: string[];
  notificationChannels: {
    type: 'SLACK' | 'EMAIL' | 'PAGERDUTY' | 'WEBHOOK' | 'IN_APP';
    target: string;
    enabled: boolean;
  }[];
  escalationPolicy: EscalationPolicy;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceOwnership {
  resourceId: string;
  resourceName: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  ownerUserId?: string | undefined;
  ownerUserName?: string | undefined;
  ownerTeamId?: string | undefined;
  ownerTeamName?: string | undefined;
  serviceOwner?: string | undefined;
  application?: string | undefined;
  environment?: string | undefined;
  source: 'SERVICE_CATALOG' | 'TAGS' | 'KUBERNETES' | 'EXPLICIT_CONFIG' | 'UNKNOWN';
  assignedAt: string;
  assignedBy?: string | undefined;
}

export type WorkItemType =
  | 'INCIDENT'
  | 'INVESTIGATION'
  | 'GOVERNANCE_DECISION'
  | 'SECURITY_FINDING'
  | 'DRIFT'
  | 'REMEDIATION_PLAN'
  | 'OPERATIONAL_OPERATION'
  | 'RELIABILITY_ISSUE'
  | 'FINOPS_ISSUE'
  | 'CHANGE_REQUEST';

export type WorkItemPriority = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';

export type WorkItemStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_APPROVAL'
  | 'WAITING_VERIFICATION'
  | 'BLOCKED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export interface EvidenceReference {
  type: 'RESOURCE' | 'FINDING' | 'INCIDENT' | 'METRIC' | 'EVENT' | 'POLICY' | 'CONTROL' | 'CHANGE' | 'SIMULATION' | 'REMEDIATION' | 'INVESTIGATION' | 'KUBERNETES';
  id: string;
  title: string;
  uri?: string | undefined;
  provider?: string | undefined;
  confidence?: string | undefined;
  snippet?: string | undefined;
}

export interface WorkItemComment {
  id: string;
  workItemId: string;
  tenantId: string;
  workspaceId: string;
  author: {
    userId: string;
    name: string;
    role: EnterpriseUserRole;
    avatarUrl?: string | undefined;
  };
  content: string;
  evidenceReferences: EvidenceReference[];
  mentions: string[];
  parentCommentId?: string | undefined;
  createdAt: string;
  updatedAt?: string | undefined;
  isEdited: boolean;
  isDeleted: boolean;
}

export interface ActivityTimelineEvent {
  id: string;
  workItemId: string;
  tenantId: string;
  workspaceId: string;
  timestamp: string;
  actor: {
    userId: string;
    name: string;
    role?: string | undefined;
  };
  eventType:
    | 'CREATED'
    | 'ASSIGNED'
    | 'REASSIGNED'
    | 'STATUS_CHANGED'
    | 'PRIORITY_CHANGED'
    | 'COMMENT_ADDED'
    | 'APPROVAL_REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'ESCALATED'
    | 'HANDOFF'
    | 'EXECUTED'
    | 'VERIFIED'
    | 'COMPLETED'
    | 'CANCELLED';
  summary: string;
  details?: Record<string, any> | undefined;
  evidenceIds?: string[] | undefined;
}

export interface CloudWorkItem {
  id: string;
  tenantId: string;
  workspaceId: string;
  type: WorkItemType;
  sourceId: string;
  title: string;
  description: string;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  assigneeUserId?: string | undefined;
  assigneeUserName?: string | undefined;
  assigneeTeamId?: string | undefined;
  assigneeTeamName?: string | undefined;
  watchers: string[];
  collaborators: string[];
  escalationStatus: 'NONE' | 'ESCALATED_L1' | 'ESCALATED_L2' | 'ESCALATED_L3';
  dueAt?: string | undefined;
  slaStatus: 'MET' | 'AT_RISK' | 'BREACHED' | 'NO_SLA';
  slaTargetMinutes?: number | undefined;
  actualResponseMinutes?: number | undefined;
  actualResolutionMinutes?: number | undefined;
  linkedEvidence: EvidenceReference[];
  blockedReason?: string | undefined;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | undefined;
}

export type ApprovalSubjectType =
  | 'CHANGE_REQUEST'
  | 'REMEDIATION_ACTION'
  | 'GOVERNANCE_DECISION'
  | 'EMERGENCY_OVERRIDE'
  | 'ACCESS_GRANT'
  | 'POLICY_EXEMPTION'
  | 'KUBERNETES_OPERATION';

export interface ApprovalPolicy {
  policyId: string;
  policyName: string;
  requiresTwoPersonControl: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  minimumApprovalsRequired: number;
  allowedApproverRoles: EnterpriseUserRole[];
  allowedApproverTeamIds?: string[] | undefined;
  autoExpireMinutes: number;
}

export interface ApprovalDecision {
  approverUserId: string;
  approverName: string;
  decision: 'APPROVED' | 'REJECTED';
  comment: string;
  decidedAt: string;
  verifiedRole: EnterpriseUserRole;
}

export interface EnterpriseApprovalRequest {
  id: string;
  tenantId: string;
  workspaceId: string;
  subjectType: ApprovalSubjectType;
  subjectId: string;
  title: string;
  description: string;
  requestedBy: {
    userId: string;
    name: string;
    email: string;
    role: EnterpriseUserRole;
    teamId?: string | undefined;
  };
  requiredApprovers: {
    role?: EnterpriseUserRole | undefined;
    teamId?: string | undefined;
    userId?: string | undefined;
    count: number;
  }[];
  approvalPolicy: ApprovalPolicy;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: EvidenceReference[];
  decisions: ApprovalDecision[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  expiresAt: string;
  decidedAt?: string | undefined;
}

export type ChangeRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'SIMULATION_REQUIRED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'CANCELLED';

export interface ChangeReviewItem {
  reviewType: 'SECURITY' | 'GOVERNANCE' | 'FINOPS' | 'RELIABILITY' | 'IMPACT';
  reviewerUserId?: string | undefined;
  reviewerName?: string | undefined;
  status: 'PASS' | 'WARN' | 'BLOCK' | 'NOT_REQUIRED';
  comments: string;
  reviewedAt: string;
}

export interface MaintenanceWindow {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  timezone: string;
  startTime: string; // e.g. '22:00'
  endTime: string;   // e.g. '04:00'
  daysOfWeek: number[]; // 0 = Sun, 6 = Sat
  allowedActions: string[];
  prohibitedActions: string[];
  isRecurring: boolean;
  ownerTeamId: string;
  active: boolean;
  nextWindowStart?: string | undefined;
  nextWindowEnd?: string | undefined;
}

export interface ChangeFreeze {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  reason: string;
  scope: {
    level: 'ORGANIZATION' | 'WORKSPACE' | 'ENVIRONMENT' | 'ACCOUNT' | 'REGION' | 'SERVICE' | 'RESOURCE';
    targetIds: string[];
  };
  startTime: string;
  endTime: string;
  allowedEmergencyRoles: EnterpriseUserRole[];
  createdBy: string;
  active: boolean;
}

export interface CloudChangeRequest {
  id: string;
  tenantId: string;
  workspaceId: string;
  requester: {
    userId: string;
    name: string;
    teamId?: string | undefined;
    email: string;
  };
  title: string;
  rationale: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES' | 'MULTI_CLOUD';
  targetResources: {
    resourceId: string;
    provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
    name: string;
    type: string;
  }[];
  proposedChange: {
    action: string;
    payload: Record<string, any>;
    summary: string;
  };
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ChangeRequestStatus;
  reviews: ChangeReviewItem[];
  simulationId?: string | undefined;
  simulationResult?: {
    blastRadiusScore: number;
    affectedServices: string[];
    safe: boolean;
    recommendation: string;
  } | undefined;
  approvalRequestId?: string | undefined;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXEMPT' | undefined;
  scheduledStartAt?: string | undefined;
  scheduledEndAt?: string | undefined;
  maintenanceWindowId?: string | undefined;
  freezeEvaluation?: {
    blockedByFreeze: boolean;
    freezeId?: string | undefined;
    reason?: string | undefined;
  } | undefined;
  executionPlan: {
    steps: {
      order: number;
      action: string;
      description: string;
      status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    }[];
  };
  rollbackPlan: {
    steps: string[];
    automated: boolean;
  };
  verificationPlan: {
    criteria: string[];
    freshReadQueries: string[];
  };
  postChangeReview?: {
    status: 'SUCCESS' | 'REGRESSION_DETECTED' | 'UNKNOWN';
    regressionDetails?: string | undefined;
    reviewedAt: string;
    reviewedBy: string;
  } | undefined;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | undefined;
}

export interface EnterpriseNotification {
  id: string;
  tenantId: string;
  workspaceId: string;
  recipientUserId: string;
  type:
    | 'ASSIGNMENT'
    | 'MENTION'
    | 'APPROVAL_REQUEST'
    | 'APPROVAL_DECISION'
    | 'ESCALATION'
    | 'INCIDENT_ALERT'
    | 'VERIFICATION_FAILURE'
    | 'HIGH_RISK_CHANGE'
    | 'GOVERNANCE_ALERT'
    | 'SECURITY_FINDING';
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  workItemId?: string | undefined;
  targetRoute?: string | undefined;
  read: boolean;
  acknowledged: boolean;
  createdAt: string;
  deduplicationKey?: string | undefined;
}

export interface NotificationRule {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  triggerType: string;
  conditions: Record<string, any>;
  targetUserIds?: string[] | undefined;
  targetTeamIds?: string[] | undefined;
  channels: ('SLACK' | 'EMAIL' | 'PAGERDUTY' | 'WEBHOOK' | 'IN_APP')[];
  enabled: boolean;
}

export interface IncidentSwarm {
  incidentId: string;
  commander: { userId: string; name: string };
  opsLead?: { userId: string; name: string } | undefined;
  commsLead?: { userId: string; name: string } | undefined;
  secLead?: { userId: string; name: string } | undefined;
  experts: { userId: string; name: string; domain: string }[];
  channelUri?: string | undefined;
  formedAt: string;
}

export interface IncidentBriefing {
  incidentId: string;
  title: string;
  severity: string;
  whatHappened: string;
  impact: string;
  timeline: { time: string; event: string }[];
  affectedResources: string[];
  rootCauseHypotheses: { hypothesis: string; confidence: string; evidence: string }[];
  currentActions: string[];
  blockers: string[];
  approvals: { request: string; status: string }[];
  nextSteps: string[];
  unknownInformation: string[];
  generatedAt: string;
}

export interface EnterprisePostIncidentReview {
  id: string;
  incidentId: string;
  title: string;
  severity: string;
  impactDurationMinutes: number;
  detectionTime: string;
  acknowledgmentTime: string;
  resolutionTime: string;
  rootCauseAnalysis: string;
  contributingFactors: string[];
  remediationVerification: string;
  actionItemIds: string[];
  lessonsLearned: string[];
  state: 'DRAFT' | 'REVIEWED' | 'PUBLISHED';
  publishedAt?: string | undefined;
}

export interface ActionItem {
  id: string;
  tenantId: string;
  workspaceId: string;
  sourceId: string;
  sourceType: 'INCIDENT' | 'POSTMORTEM' | 'INVESTIGATION' | 'GOVERNANCE' | 'SECURITY' | 'RELIABILITY';
  title: string;
  description: string;
  ownerUserId: string;
  ownerUserName: string;
  teamId?: string | undefined;
  teamName?: string | undefined;
  priority: WorkItemPriority;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueAt?: string | undefined;
  createdAt: string;
  completedAt?: string | undefined;
}

export interface TeamReliabilityMetrics {
  teamId: string;
  teamName: string;
  openWorkItems: number;
  activeIncidents: number;
  avgAckTimeMinutes: number;
  avgResolutionTimeMinutes: number;
  remediationSuccessRatePercent: number;
  overdueCount: number;
  avgApprovalLatencyMinutes: number;
  dataCoveragePercent: number;
  historyWindow: string;
}

export interface WorkloadBalancingView {
  teamId: string;
  teamName: string;
  totalActiveItems: number;
  criticalP0P1Count: number;
  workloadIndexScore: number; // 0-100
  capacityStatus: 'HEALTHY' | 'MODERATE' | 'HEAVY' | 'OVERLOADED';
  recommendedActions: string[];
}

export interface EnterpriseWorkflowSummary {
  workspaceId: string;
  totalTeams: number;
  totalMembers: number;
  activeWorkItems: {
    total: number;
    open: number;
    inProgress: number;
    waitingApproval: number;
    waitingVerification: number;
    blocked: number;
    overdue: number;
    p0p1Count: number;
  };
  pendingApprovalsCount: number;
  activeFreezesCount: number;
  upcomingMaintenanceWindowsCount: number;
  unreadNotificationsCount: number;
  teamMetrics: TeamReliabilityMetrics[];
  workloadBalance: WorkloadBalancingView[];
  calculatedAt: string;
}

export interface AiWorkflowAssistantResult {
  query: string;
  intent:
    | 'RESOURCE_OWNERSHIP'
    | 'INCIDENT_COLLABORATORS'
    | 'WAITING_APPROVALS'
    | 'BLOCKED_CHANGES'
    | 'INCIDENT_SUMMARY'
    | 'CHANGE_REVIEW'
    | 'POSTMORTEM_SUMMARY'
    | 'OVERDUE_WORK'
    | 'WORKLOAD_RECOMMENDATION'
    | 'GENERAL_WORKFLOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  primaryAnswer: string;
  evidenceCitations: EvidenceReference[];
  proposedWorkflowAction?: {
    actionType: 'ASSIGN_WORK_ITEM' | 'REQUEST_APPROVAL' | 'ESCALATE' | 'PROPOSE_CHANGE_REQUEST' | 'CREATE_ACTION_ITEM';
    payload: Record<string, any>;
    requiresConfirmation: boolean;
    safetyNotice: string;
  } | undefined;
  suggestedFollowUps: string[];
  analyzedAt: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 65 — REAL MULTI-CLOUD FINOPS, UNIT ECONOMICS & COST GOVERNANCE
// ══════════════════════════════════════════════════════════════════════════════

export type CostAllocationType =
  | 'DIRECT'
  | 'ALLOCATED'
  | 'SHARED'
  | 'CALCULATED'
  | 'ESTIMATED'
  | 'PREDICTED'
  | 'UNKNOWN';

export type CostChargeType =
  | 'USAGE'
  | 'PURCHASE'
  | 'TAX'
  | 'CREDIT'
  | 'REFUND'
  | 'ADJUSTMENT';

export type CostFreshness = 'LIVE' | 'PROVISIONAL' | 'FINAL' | 'DELAYED';

export type CostCategoryType =
  | 'compute'
  | 'storage'
  | 'database'
  | 'networking'
  | 'observability'
  | 'security'
  | 'platform'
  | 'kubernetes'
  | 'data_analytics'
  | 'messaging'
  | 'ai_ml'
  | 'other';

export type CostShowbackType = 'SHOWBACK' | 'CHARGEBACK';

export type CostBudgetStatus = 'UNDER_BUDGET' | 'AT_RISK' | 'OVER_BUDGET' | 'UNKNOWN';

export type SavingsVerificationStatus =
  | 'PENDING_MEASUREMENT'
  | 'VERIFIED_SAVINGS'
  | 'PARTIAL_SAVINGS'
  | 'NO_SAVINGS'
  | 'UNKNOWN';

export type UnitEconomicsDenominatorSource =
  | 'OPENTELEMETRY'
  | 'PROMETHEUS'
  | 'CLOUDWATCH'
  | 'AZURE_MONITOR'
  | 'GCP_MONITORING'
  | 'MANUAL_CONFIG'
  | 'UNKNOWN';

/**
 * Normalized Cloud Cost Record across AWS, Azure, GCP, and Kubernetes
 */
export interface CloudCostRecord {
  id: string;
  tenantId: string;
  workspaceId: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES' | 'MULTI_CLOUD';
  accountOrSubscriptionOrProject: string;
  accountName?: string | undefined;
  region: string;
  service: string;
  resourceId?: string | undefined;
  resourceName?: string | undefined;
  resourceType?: string | undefined;
  usageType: string;
  operation?: string | undefined;
  chargeType: CostChargeType;
  currency: string;
  amount: number;
  usageQuantity?: number | undefined;
  usageUnit?: string | undefined;
  billingPeriod: string; // e.g. '2026-09'
  startTime: string;
  endTime: string;
  allocationType: CostAllocationType;
  source: 'COST_EXPLORER' | 'BILLING_EXPORT' | 'AZURE_COST_MGMT' | 'GCP_BILLING' | 'KUBERNETES_PROMETHEUS' | 'CALCULATED';
  observedAt: string;
  freshness: CostFreshness;
  tags?: Record<string, string> | undefined;
  costCategory: CostCategoryType;
  confidence: number; // 0.0 - 1.0
  teamId?: string | undefined;
  teamName?: string | undefined;
  application?: string | undefined;
  environment?: 'production' | 'staging' | 'development' | 'shared' | 'unknown' | undefined;
  costCenterId?: string | undefined;
}

export interface MultiCurrencyCost {
  sourceCurrency: string;
  sourceAmount: number;
  targetCurrency: string;
  targetAmount: number;
  exchangeRate: number;
  exchangeRateSource: string;
  conversionBasis: string;
  conversionStatus: 'EXACT' | 'CALCULATED' | 'UNKNOWN';
}

export interface CostCenter {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  code: string;
  owner: string;
  ownerEmail?: string | undefined;
  allocationRules: {
    ruleType: 'TAG_MATCH' | 'ACCOUNT_MATCH' | 'PROJECT_MATCH' | 'NAMESPACE_MATCH';
    matchPattern: string;
    allocatedPercentage: number;
  }[];
  currency: string;
  allocatedSpendMtd: number;
  budgetLimit?: number | undefined;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface RealUnitEconomicsMetric {
  metricId: string;
  serviceId: string;
  serviceName: string;
  unitType: 'REQUEST' | 'TRANSACTION' | 'USER' | 'WORKLOAD' | 'API_CALL' | 'GB_PROCESSED' | 'JOB' | 'DEPLOYMENT' | 'CUSTOMER';
  totalCostMonthly: number;
  unitDenominatorCount: number;
  unitCost: number;
  currency: string;
  calculationType: 'CALCULATED' | 'UNIT_ECONOMICS_UNAVAILABLE';
  denominatorSource: UnitEconomicsDenominatorSource;
  formula: string;
  observedPeriod: string;
  trendPercent: number;
}

export interface KubernetesFinOpsAllocation {
  clusterId: string;
  clusterName: string;
  namespace: string;
  workloadName: string;
  workloadType: 'Deployment' | 'StatefulSet' | 'DaemonSet' | 'Job';
  nodeCostMonthly: number;
  podComputeCostMonthly: number;
  podStorageCostMonthly: number;
  networkCostMonthly: number;
  sharedOverheadCostMonthly: number;
  totalAllocatedCostMonthly: number;
  currency: string;
  efficiencyScore: number; // 0-100
  cpuRequestVsActualRatio: number;
  memoryRequestVsActualRatio: number;
  overprovisionedWasteMonthly: number;
  allocationType: 'ALLOCATED' | 'SHARED' | 'CALCULATED';
}

export interface RealCostAnomaly {
  id: string;
  service: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  accountOrSubscription: string;
  region: string;
  baselineCost: number;
  observedCost: number;
  deltaCost: number;
  deltaPercent: number;
  timeWindow: string;
  source: string;
  confidence: number; // 0.0 - 1.0
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  correlatedChanges?: {
    changeType: 'DEPLOYMENT' | 'SCALING' | 'CONFIG_UPDATE' | 'INCIDENT';
    entityId: string;
    summary: string;
    timestamp: string;
    correlationType: 'TEMPORAL_CORRELATION' | 'CAUSAL_EVIDENCE';
  }[] | undefined;
  detectedAt: string;
}

export interface MultiCloudCostForecast {
  scope: 'WORKSPACE' | 'PROVIDER' | 'SERVICE' | 'TEAM' | 'ACCOUNT';
  scopeId: string;
  scopeName: string;
  actualSpendMtd: number;
  projectedMonthlySpend: number;
  forecastRangeLow: number;
  forecastRangeHigh: number;
  confidenceScore: number; // 0.0 - 1.0
  forecastHorizonDays: number;
  historyWindowDays: number;
  status: 'OK' | 'INSUFFICIENT_HISTORY';
  currency: string;
}

export interface MultiCloudBudget {
  id: string;
  name: string;
  scope: 'ACCOUNT' | 'PROVIDER' | 'SERVICE' | 'TEAM' | 'APPLICATION' | 'ENVIRONMENT' | 'COST_CENTER';
  scopeId: string;
  scopeName: string;
  budgetLimit: number;
  spentAmount: number;
  remainingAmount: number;
  burnRateMultiplier: number;
  projectedExhaustionDate?: string | undefined;
  status: CostBudgetStatus;
  currency: string;
  period: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  alertThresholdPercent: number;
}

export interface RealSavingsOpportunity {
  id: string;
  title: string;
  type:
    | 'IDLE_RESOURCE'
    | 'RIGHTSIZING'
    | 'UNATTACHED_STORAGE'
    | 'UNUSED_IP'
    | 'OVERSIZED_DB'
    | 'COMMITMENT_OPTIMIZATION'
    | 'KUBERNETES_OVERPROVISIONING'
    | 'OBSERVABILITY_RETENTION';
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  resourceId: string;
  resourceName: string;
  resourceType: string;
  currentCostMonthly: number;
  estimatedMonthlySavings: number;
  confidence: number; // 0.0 - 1.0
  evidence: string;
  assumptions: string[];
  operationalRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  reliabilityTradeoff: string;
  securityTradeoff: string;
  governanceImpact: string;
  status: 'IDENTIFIED' | 'REVIEWED' | 'APPROVED' | 'EXECUTED' | 'DISMISSED';
  verificationStatus: SavingsVerificationStatus;
  observedSavingsMonthly?: number | undefined;
  measurementLagDays?: number | undefined;
  suggestedAction?: {
    actionType: string;
    payload: Record<string, any>;
    safeToAutomate: boolean;
  } | undefined;
}

export interface CostTradeoffEvaluation {
  actionTitle: string;
  costDeltaMonthly: number;
  reliabilityImpact: {
    scoreImpact: number; // e.g. -5 points
    capacityRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    resilienceWarning?: string | undefined;
  };
  securityImpact: {
    postureImpact: number;
    auditCoverageRisk: 'NONE' | 'LOW' | 'HIGH';
    securityWarning?: string | undefined;
  };
  governanceImpact: {
    policyCompliance: 'COMPLIANT' | 'NEEDS_EXCEPTION' | 'VIOLATION';
    taggingIntegrity: 'PRESERVED' | 'DEGRADED';
  };
  overallRecommendation: 'RECOMMENDED' | 'CONDITIONAL_APPROVAL' | 'REJECT_RISK_TOO_HIGH';
}

export interface MultiCloudFinOpsScorecard {
  workspaceId: string;
  totalSpendMtd: number;
  currency: string;
  lastBillingSync: string;
  freshness: CostFreshness;
  isBillingDelayed: boolean;
  spendByProvider: { provider: string; amount: number; percentage: number }[];
  spendByCategory: { category: CostCategoryType; amount: number; percentage: number }[];
  spendByEnvironment: { environment: string; amount: number; percentage: number }[];
  spendByTeam: { teamId: string; teamName: string; amount: number; percentage: number; isUnallocated?: boolean | undefined }[];
  allocationCoveragePercent: number;
  unallocatedSpendMtd: number;
  activeAnomaliesCount: number;
  budgetAdherencePercent: number;
  totalEstimatedSavingsMonthly: number;
  totalVerifiedSavingsMonthly: number;
  unitEconomicsSummaries: RealUnitEconomicsMetric[];
  dataQualityMetrics: {
    missingTagsCount: number;
    unallocatedPercentage: number;
    billingDelayHours: number;
    dataQualityScore: number; // 0-100
  };
  calculatedAt: string;
}

export interface AiFinOpsAnalystResult {
  query: string;
  intent:
    | 'SPEND_BREAKDOWN'
    | 'SPEND_INCREASE_ANALYSIS'
    | 'COST_DRIVERS'
    | 'UNIT_ECONOMICS'
    | 'SAVINGS_OPPORTUNITIES'
    | 'ANOMALY_EXPLANATION'
    | 'FORECAST_INQUIRY'
    | 'KUBERNETES_WASTE'
    | 'TRADEOFF_ANALYSIS'
    | 'GENERAL_FINOPS';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  primaryAnswer: string;
  evidenceCitations: {
    type: 'COST_RECORD' | 'METRIC' | 'ANOMALY' | 'BUDGET' | 'SAVINGS_OPPORTUNITY' | 'UNIT_ECONOMICS' | 'KUBERNETES';
    id: string;
    title: string;
    snippet?: string;
    costAmount?: number;
  }[];
  suggestedFollowUps: string[];
  safeActionsRecommended?: {
    actionType: string;
    description: string;
    estimatedSavingsMonthly: number;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  analyzedAt: string;
}

// ─── Phase 66: Advanced Real Cloud Security, Identity & Zero-Trust Control Plane ───

export type CloudIdentityType =
  | 'HUMAN'
  | 'SERVICE'
  | 'WORKLOAD'
  | 'ROLE'
  | 'GROUP'
  | 'FEDERATED_IDENTITY'
  | 'TEMPORARY_IDENTITY'
  | 'DEVICE';

export type CloudIdentityStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'UNKNOWN';

export type IdentityPrivilegeLevel = 'ADMIN' | 'OPERATOR' | 'DEVELOPER' | 'AUDITOR' | 'LIMITED' | 'UNKNOWN';

export type AccessRelationshipType =
  | 'MEMBER_OF'
  | 'ASSUMES'
  | 'ATTACHED_POLICY'
  | 'AUTHORIZES'
  | 'BINDS_TO'
  | 'TRUSTS';

export type RelationshipProvenance = 'CONFIRMED' | 'DERIVED' | 'INFERRED' | 'UNKNOWN';

export type PathRiskClassification = 'CONFIRMED_PATH' | 'POSSIBLE_PATH' | 'UNKNOWN_PATH';

export type SecurityFreshness = 'FRESH' | 'STALE' | 'PARTIAL' | 'UNKNOWN';

export type SecurityCoverageLevel = 'FULL' | 'PARTIAL' | 'LIMITED' | 'UNKNOWN';

export interface RealCloudIdentity {
  id: string;
  tenantId: string;
  workspaceId: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES' | 'OKTA' | 'ENTRA';
  scope: string; // e.g. AWS account ID, Azure subscription ID, GCP project ID, K8s cluster ID
  providerIdentityId: string; // ARN, Object ID, ServiceAccount string, email
  type: CloudIdentityType;
  displayName: string;
  status: CloudIdentityStatus;
  source: string; // 'AWS_IAM' | 'AZURE_ENTRA' | 'GCP_IAM' | 'KUBERNETES_RBAC' | 'OIDC_GITHUB'
  lastObserved: string;
  freshness: SecurityFreshness;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0.0 - 1.0
  privilegeLevel: IdentityPrivilegeLevel;
  mfaStatus: 'ENABLED' | 'DISABLED' | 'EXEMPT' | 'UNKNOWN';
  credentialHygiene: {
    accessKeyAgeDays?: number | undefined;
    hasMultipleActiveKeys?: boolean | undefined;
    lastActivityTimestamp?: string | undefined;
    isStale?: boolean | undefined;
    hasAdminWildcard?: boolean | undefined;
  };
  roles: string[];
  attachedPolicies: string[];
  reachableResourcesCount: number;
  leastPrivilegeScore: number; // 0-100
  excessivePrivilegeFindings: string[];
  governanceExceptions: string[];
  lastReviewedAt?: string | undefined;
  tags?: Record<string, string> | undefined;
}

export interface CloudAccessRelationship {
  id: string;
  sourceId: string;
  sourceType: string;
  relationship: AccessRelationshipType;
  targetId: string;
  targetType: string;
  classification: RelationshipProvenance;
  evidence: string;
  confidence: number;
  observedAt: string;
}

export interface EffectiveAccessRule {
  identityId: string;
  identityName: string;
  resourceId: string;
  resourceType: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  scope: string;
  permission: string;
  accessMode: 'POLICY_PERMITTED' | 'OBSERVED_USAGE' | 'BOTH';
  viaPolicy: string;
  isWildcard: boolean;
  isCrossAccount: boolean;
  riskScore: number; // 0-100
  evidence: string;
}

export interface HighRiskAccessPath {
  id: string;
  title: string;
  pathType: PathRiskClassification;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  steps: {
    nodeId: string;
    nodeType: 'INTERNET' | 'PUBLIC_ENDPOINT' | 'WORKLOAD' | 'SERVICE_IDENTITY' | 'PRIVILEGED_ROLE' | 'POLICY' | 'SENSITIVE_RESOURCE';
    displayName: string;
    provider: string;
    evidence: string;
  }[];
  potentialImpact: string;
  mitigationRecommendation: string;
  confidence: number;
}

export interface PublicExposureEntity {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  exposureVector:
    | 'PUBLIC_IP'
    | 'SECURITY_GROUP_0_0_0_0'
    | 'NSG_INBOUND_ANY'
    | 'GCP_FIREWALL_OPEN'
    | 'S3_PUBLIC_BUCKET'
    | 'K8S_INGRESS'
    | 'K8S_LOADBALANCER'
    | 'K8S_NODEPORT';
  openPorts: number[];
  associatedWorkloads: string[];
  evidence: string;
  confidence: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'OPEN' | 'REMEDIATED' | 'EXCEPTION_ACTIVE';
  observedAt: string;
}

export interface ZeroTrustControlEffectiveness {
  controlId: string;
  controlName: string;
  category: 'IAM' | 'NETWORK' | 'DATA_ENCRYPTION' | 'AUDIT_LOGGING' | 'KUBERNETES_SECURITY' | 'VULNERABILITY';
  framework: string; // 'NIST SP 800-53', 'CIS Benchmarks', 'SOC 2'
  violationsCount: number;
  recurrenceCount: number;
  remediationSuccessRate: number; // 0-100%
  evidenceCoverage: SecurityCoverageLevel;
  detectionLatencySeconds: number;
  verificationRate: number; // 0-100%
  activeExceptionsCount: number;
  effectivenessStatus: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'FAILING_REPEATEDLY';
  trend: 'IMPROVING' | 'DEGRADING' | 'STABLE';
}

export interface SecurityAccessReview {
  id: string;
  title: string;
  scope: 'PRIVILEGED_IDENTITIES' | 'CROSS_ACCOUNT_ACCESS' | 'STALE_PERMISSIONS' | 'SERVICE_IDENTITIES' | 'KUBERNETES_RBAC';
  reviewer: { userId: string; name: string; email: string };
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  identitiesUnderReview: string[];
  decisions: {
    identityId: string;
    action: 'RETAIN' | 'REVOKE_EXCESSIVE' | 'QUARANTINE';
    rationale: string;
    decidedAt: string;
  }[];
  dueAt: string;
  completedAt?: string | undefined;
  createdAt: string;
}

export interface SecurityExceptionRecord {
  id: string;
  findingOrPolicyId: string;
  identityOrResourceId: string;
  reason: string;
  owner: string;
  approvedBy: string;
  compensatingControls: string[];
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface ZeroTrustSecurityScorecard {
  workspaceId: string;
  overallPostureScore: number; // 0-100
  identityRiskScore: number; // 0-100 (lower risk is higher posture)
  leastPrivilegeAttainment: number; // %
  humanMfaAttainment: number; // %
  workloadAuthPosture: string;
  publicExposureCount: number;
  highRiskAccessPathsCount: number;
  crossScopeAccessCount: number;
  activeSecurityFindingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  controlEffectivenessScore: number; // 0-100
  coverage: {
    iam: SecurityCoverageLevel;
    auditLogs: SecurityCoverageLevel;
    securityFindings: SecurityCoverageLevel;
    network: SecurityCoverageLevel;
    kubernetes: SecurityCoverageLevel;
    identityActivity: SecurityCoverageLevel;
  };
  freshness: {
    iam: SecurityFreshness;
    findings: SecurityFreshness;
    auditLogs: SecurityFreshness;
    network: SecurityFreshness;
    kubernetes: SecurityFreshness;
  };
  calculatedAt: string;
}

export interface AiSecurityAnalystResult {
  query: string;
  intent:
    | 'IDENTITY_RISK_EXPLANATION'
    | 'ACCESS_PATH_ANALYSIS'
    | 'LEAST_PRIVILEGE_REVIEW'
    | 'PUBLIC_EXPOSURE_DIAGNOSIS'
    | 'CHANGE_CORRELATION'
    | 'WHAT_IF_SIMULATION'
    | 'CONTROL_EFFECTIVENESS'
    | 'GENERAL_ZERO_TRUST';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  primaryAnswer: string;
  evidenceCitations: {
    type: 'IDENTITY' | 'FINDING' | 'ACCESS_PATH' | 'PUBLIC_EXPOSURE' | 'CONTROL' | 'EVENT' | 'AUDIT_LOG';
    id: string;
    title: string;
    snippet?: string | undefined;
  }[];
  suggestedFollowUps: string[];
  safeActionsRecommended?: {
    actionType: string;
    description: string;
    targetId: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    requiresTwoPersonApproval: boolean;
  }[] | undefined;
  analyzedAt: string;
}

// ─── Phase 67: Real Cloud Resilience, Disaster Recovery & Business Continuity ───

export type CloudResilienceState =
  | 'RESILIENT'
  | 'DEGRADED'
  | 'AT_RISK'
  | 'CRITICAL'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA';

export type FailureDomainType =
  | 'AVAILABILITY_ZONE'
  | 'REGION'
  | 'CLUSTER'
  | 'NODE'
  | 'STORAGE_SYSTEM'
  | 'NETWORK_SEGMENT'
  | 'DEPENDENCY'
  | 'PROVIDER_SERVICE';

export type FailureDomainConcentration =
  | 'SINGLE_DOMAIN'
  | 'MULTI_AZ'
  | 'MULTI_REGION'
  | 'REDUNDANT'
  | 'CONCENTRATED';

export interface FailureDomain {
  id: string;
  name: string;
  type: FailureDomainType;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  scope: string;
  primaryResources: string[];
  redundantResources: string[];
  concentration: FailureDomainConcentration;
  isSinglePointOfFailure: boolean;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string;
  observedAt: string;
}

export type SpofType =
  | 'SINGLE_AZ'
  | 'SINGLE_REGION'
  | 'SINGLE_NODE'
  | 'SINGLE_DEPENDENCY'
  | 'SINGLE_LOAD_BALANCER_PATH'
  | 'SINGLE_STORAGE'
  | 'SINGLE_CONTROL_PLANE';

export interface RealSinglePointOfFailure {
  id: string;
  name: string;
  type: SpofType;
  serviceId: string;
  serviceName: string;
  resourceId: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  failureDomain: string;
  blastRadius: {
    affectedServices: string[];
    userImpact: string;
    estimatedDowntimeMinutes: number;
    financialLossRiskPerHour: number;
  };
  evidence: string;
  confidence: number;
  recommendedMitigation: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED' | 'ACCEPTED_RISK';
  detectedAt: string;
}

export type BackupHealthState =
  | 'HEALTHY'
  | 'STALE'
  | 'FAILED'
  | 'MISSING'
  | 'PARTIAL'
  | 'UNKNOWN';

export interface RealBackupEntity {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  scope: string;
  backupType:
    | 'AWS_BACKUP'
    | 'RDS_SNAPSHOT'
    | 'EBS_SNAPSHOT'
    | 'DYNAMODB_PITR'
    | 'S3_VERSIONING'
    | 'AZURE_RECOVERY_SERVICES'
    | 'GCP_CLOUD_SQL'
    | 'K8S_VELERO_PV';
  isEnabled: boolean;
  lastBackupTimestamp: string;
  lastSuccessfulBackupTimestamp: string;
  retentionDays: number;
  ageHours: number;
  healthState: BackupHealthState;
  coverageStatus: 'PROTECTED' | 'UNPROTECTED' | 'PARTIAL' | 'EXEMPT';
  encryptionStatus: 'ENCRYPTED' | 'UNENCRYPTED';
  immutableLock: boolean;
  failureHistoryCount: number;
  evidence: string;
  observedRpoMinutes?: number | undefined;
  targetRpoMinutes: number;
  confidence: number;
}

export interface CloudResilienceProfile {
  id: string;
  tenantId: string;
  workspaceId: string;
  serviceId: string;
  serviceName: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES' | 'MULTI_CLOUD';
  scope: string;
  resourceIds: string[];
  dependencyIds: string[];
  failureDomains: FailureDomain[];
  redundancy: {
    multiAz: boolean;
    multiRegion: boolean;
    replicaCount: number;
    observedDistribution: string;
    spreadConstraintMet: boolean;
  };
  backupPosture: {
    isProtected: boolean;
    healthState: BackupHealthState;
    backupCount: number;
    lastSuccessfulBackup: string;
    observedRpoMinutes: number;
    targetRpoMinutes: number;
    rpoCompliance: boolean;
  };
  replicationPosture: {
    replicationType: 'SYNCHRONOUS' | 'ASYNCHRONOUS' | 'NONE' | 'UNKNOWN';
    replicationLagSeconds: number;
    replicaHealth: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'NONE';
  };
  recoveryObjectives: {
    targetRtoMinutes: number;
    targetRpoMinutes: number;
    observedRtoMinutes?: number | undefined;
    observedRpoMinutes?: number | undefined;
    lastTestedTimestamp?: string | undefined;
  };
  resilienceState: CloudResilienceState;
  score: number;
  confidence: number;
  coverage: 'FULL' | 'PARTIAL' | 'LIMITED' | 'UNKNOWN';
  freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  lastAssessment: string;
  activeGapsCount: number;
  spofsCount: number;
}

export type RecoveryReadinessState =
  | 'READY'
  | 'PARTIALLY_READY'
  | 'NOT_READY'
  | 'UNKNOWN';

export type RecoveryPlanStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'READY'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'FAILED'
  | 'ARCHIVED';

export interface RecoveryStep {
  stepOrder: number;
  name: string;
  actionType: string;
  targetResourceId: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  automationType: 'AUTOMATED' | 'ASSISTED' | 'MANUAL' | 'UNAVAILABLE';
  riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH';
  preconditions: string[];
  requiresTwoPersonApproval: boolean;
  rollbackAction?: string | undefined;
  estimatedDurationSeconds: number;
  verificationCheck: string;
}

export interface RealRecoveryPlan {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  scope: string;
  scenarioType:
    | 'AZ_FAILURE'
    | 'REGION_FAILURE'
    | 'CLUSTER_FAILURE'
    | 'NODE_FAILURE'
    | 'DATABASE_FAILURE'
    | 'STORAGE_FAILURE'
    | 'NETWORK_FAILURE'
    | 'DEPENDENCY_FAILURE'
    | 'SERVICE_DEGRADATION'
    | 'CREDENTIAL_FAILURE';
  priorityOrder: number;
  targetRtoMinutes: number;
  targetRpoMinutes: number;
  estimatedRtoMinutes: number;
  recoverySteps: RecoveryStep[];
  preconditions: string[];
  verificationSteps: string[];
  rollbackPlan: string;
  owner: string;
  version: string;
  status: RecoveryPlanStatus;
  readinessState: RecoveryReadinessState;
  blockers: string[];
  lastTestedAt?: string | undefined;
  auditTrail: { action: string; actor: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ResilienceWhatIfSimulation {
  simulationId: string;
  scenario: string;
  scope: string;
  failureTrigger: string;
  directImpactResources: string[];
  cascadingImpactServices: string[];
  rtoEstimateMinutes: number;
  rpoEstimateMinutes: number;
  dataLossRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedRecoveryPath: string[];
  unmonitoredGaps: string[];
  requiresFailoverApproval: boolean;
  blastRadiusScore: number;
  calculatedAt: string;
}

export interface RecoveryDrillRecord {
  id: string;
  name: string;
  scenarioType: string;
  scope: string;
  hypothesis: string;
  safetyControls: string[];
  executionMode: 'SIMULATION_ONLY' | 'ISOLATED_STAGE' | 'CONTROLLED_PROD';
  status: 'PLANNED' | 'IN_PROGRESS' | 'PASSED' | 'PARTIALLY_PASSED' | 'FAILED';
  targetRtoMinutes: number;
  observedRtoMinutes: number;
  targetRpoMinutes: number;
  observedRpoMinutes: number;
  blockersIdentified: string[];
  lessonsLearned: string[];
  executedAt: string;
  verifiedBy: string;
}

export interface BusinessContinuityEntity {
  businessServiceId: string;
  businessServiceName: string;
  tier:
    | 'TIER_0_MISSION_CRITICAL'
    | 'TIER_1_BUSINESS_CRITICAL'
    | 'TIER_2_OPERATIONAL'
    | 'TIER_3_SUPPORT';
  businessOwner: string;
  technicalOwner: string;
  directDependencies: string[];
  targetRtoHours: number;
  targetRpoHours: number;
  currentReadiness: RecoveryReadinessState;
  financialImpactPerHour: number;
  recoveryPlanId?: string | undefined;
  status: 'HEALTHY' | 'DEGRADED' | 'AT_RISK';
  lastEvaluated: string;
}

export interface ZeroDowntimeScorecard {
  workspaceId: string;
  overallResilienceScore: number;
  backupProtectionRate: number;
  rtoComplianceRate: number;
  rpoComplianceRate: number;
  multiAzAdoptionRate: number;
  activeSpofCount: number;
  criticalGapsCount: number;
  verifiedRecoveryPlansCount: number;
  drillsConductedCount: number;
  coverage: {
    compute: 'FULL' | 'PARTIAL' | 'LIMITED' | 'UNKNOWN';
    databases: 'FULL' | 'PARTIAL' | 'LIMITED' | 'UNKNOWN';
    storage: 'FULL' | 'PARTIAL' | 'LIMITED' | 'UNKNOWN';
    k8s: 'FULL' | 'PARTIAL' | 'LIMITED' | 'UNKNOWN';
  };
  freshness: {
    backups: 'FRESH' | 'STALE' | 'UNKNOWN';
    topology: 'FRESH' | 'STALE' | 'UNKNOWN';
    drills: 'FRESH' | 'STALE' | 'UNKNOWN';
  };
  calculatedAt: string;
}

export interface AiResilienceAnalystResult {
  query: string;
  intent:
    | 'SPOF_INVESTIGATION'
    | 'SCENARIO_SIMULATION'
    | 'BACKUP_COVERAGE_AUDIT'
    | 'RECOVERY_PLAN_PRIORITIZATION'
    | 'RTO_RPO_ASSESSMENT'
    | 'GENERAL_RESILIENCE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  primaryAnswer: string;
  evidenceCitations: {
    type: 'FAILURE_DOMAIN' | 'SPOF' | 'BACKUP' | 'RECOVERY_PLAN' | 'DRILL' | 'SERVICE';
    id: string;
    title: string;
    snippet?: string | undefined;
  }[];
  suggestedFollowUps: string[];
  safeActionsRecommended?: {
    actionType: string;
    description: string;
    targetId: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    requiresTwoPersonApproval: boolean;
  }[] | undefined;
  analyzedAt: string;
}

// ─── Phase 68: Global Cloud Command Center, Executive Intelligence & Real-Time Enterprise Control ───

export type CloudSituationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type CloudSituationPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type CloudSituationCategory =
  | 'SECURITY'
  | 'RELIABILITY'
  | 'GOVERNANCE'
  | 'FINOPS'
  | 'RESILIENCE'
  | 'OPERATIONS'
  | 'CONNECTIVITY';

export type CloudSituationStatus =
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'INVESTIGATING'
  | 'MITIGATING'
  | 'RESOLVED'
  | 'SUPPRESSED';

export type SituationStage =
  | 'BEFORE'
  | 'TRIGGER'
  | 'CHANGE'
  | 'DETECTION'
  | 'IMPACT'
  | 'INVESTIGATION'
  | 'DECISION'
  | 'ACTION'
  | 'VERIFICATION'
  | 'CURRENT_STATE';

export interface SituationTimelineEvent {
  id: string;
  stage: SituationStage;
  timestamp: string;
  source: string;
  title: string;
  description: string;
  severity?: CloudSituationSeverity | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface EnterpriseCloudSituation {
  id: string;
  tenantId: string;
  workspaceId: string;
  scope: string;
  title: string;
  severity: CloudSituationSeverity;
  priority: CloudSituationPriority;
  category: CloudSituationCategory;
  status: CloudSituationStatus;
  summary: string;
  affectedAccounts: string[];
  affectedProviders: ('AWS' | 'AZURE' | 'GCP' | 'KUBERNETES')[];
  affectedRegions: string[];
  affectedServices: string[];
  affectedResources: string[];
  incidents: string[];
  securityFindings: string[];
  governanceDecisions: string[];
  costAnomalies: string[];
  reliabilityIssues: string[];
  resilienceIssues: string[];
  recentChanges: string[];
  predictions: string[];
  evidence: string[];
  rootCauseHypotheses: { hypothesis: string; probabilityScore: number; evidence: string[] }[];
  businessImpact: {
    tier: string;
    financialImpactPerHour: number;
    slaBreached: boolean;
    customersImpactedScore: number;
    description: string;
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  coverage: 'FULL' | 'HIGH' | 'PARTIAL' | 'LIMITED' | 'UNKNOWN';
  freshness: 'LIVE' | 'FRESH' | 'STALE' | 'PARTIAL' | 'UNKNOWN';
  timeline: SituationTimelineEvent[];
  suggestedDecisions: string[];
  assignedTo?: string | undefined;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | undefined;
}

export type EnterpriseSituation = EnterpriseCloudSituation;

export type RiskHeatmapLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'HEALTHY';

export interface RiskHeatmapCell {
  scopeType: 'PROVIDER' | 'ACCOUNT' | 'REGION' | 'CLUSTER' | 'SERVICE';
  scopeId: string;
  scopeName: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES' | 'MULTI_CLOUD';
  securityRisk: number;
  securityLevel: RiskHeatmapLevel;
  reliabilityRisk: number;
  reliabilityLevel: RiskHeatmapLevel;
  governanceRisk: number;
  governanceLevel: RiskHeatmapLevel;
  finopsRisk: number;
  finopsLevel: RiskHeatmapLevel;
  resilienceRisk: number;
  resilienceLevel: RiskHeatmapLevel;
  operationsRisk: number;
  operationsLevel: RiskHeatmapLevel;
  compositeRiskScore: number;
  compositeRiskLevel: RiskHeatmapLevel;
  topThreatSummary: string;
}

export interface EnterpriseRiskHeatmap {
  cells: RiskHeatmapCell[];
  totalEntitiesEvaluated: number;
  criticalEntitiesCount: number;
  highRiskEntitiesCount: number;
  calculatedAt: string;
}

export interface GlobalCloudHealth {
  overallHealthScore: number;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  domains: {
    cloudInfrastructure: number;
    security: number;
    governance: number;
    reliability: number;
    resilience: number;
    finops: number;
    observability: number;
    operations: number;
  };
  providerHealth: Record<
    string,
    {
      score: number;
      status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'DISCONNECTED';
      resourceCount: number;
      activeIncidents: number;
      lastTelemetrySync: string;
    }
  >;
  calculatedAt: string;
}

export interface CloudCoverageSummary {
  overallCoverageLevel: 'FULL' | 'HIGH' | 'PARTIAL' | 'LIMITED' | 'UNKNOWN';
  overallCoveragePercent: number;
  providers: Record<
    string,
    {
      level: 'FULL' | 'HIGH' | 'PARTIAL' | 'LIMITED' | 'UNKNOWN';
      monitoredResources: number;
      unmonitoredEstimates: number;
      blindSpots: string[];
    }
  >;
  domains: Record<string, 'FULL' | 'HIGH' | 'PARTIAL' | 'LIMITED' | 'UNKNOWN'>;
  telemetrySources: {
    metricPipes: boolean;
    logStreams: boolean;
    traceSpans: boolean;
    auditLogs: boolean;
    k8sMetrics: boolean;
  };
  evaluatedAt: string;
}

export interface GlobalDataFreshnessSummary {
  overallFreshness: 'LIVE' | 'FRESH' | 'STALE' | 'PARTIAL' | 'UNKNOWN';
  subsystems: Record<
    string,
    {
      status: 'LIVE' | 'FRESH' | 'STALE' | 'PARTIAL' | 'UNKNOWN';
      lastSyncAt: string;
      latencyMs: number;
    }
  >;
  evaluatedAt: string;
}

export type ExecutiveDecisionDomain =
  | 'GOVERNANCE'
  | 'FINOPS'
  | 'SECURITY'
  | 'RELIABILITY'
  | 'RESILIENCE'
  | 'OPERATIONS';

export type ExecutiveDecisionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'DISMISSED';

export interface ExecutiveDecision {
  id: string;
  title: string;
  domain: ExecutiveDecisionDomain;
  priority: CloudSituationPriority;
  severity: CloudSituationSeverity;
  situationId?: string | undefined;
  impactSummary: string;
  recommendedAction: string;
  estimatedSavingsOrRiskReduction: string;
  approvalRequired: boolean;
  riskOfInaction: string;
  status: ExecutiveDecisionStatus;
  targetResourceId?: string | undefined;
  targetProvider?: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES' | undefined;
  actionPayload?: Record<string, any> | undefined;
  assignedApprover?: string | undefined;
  decidedBy?: string | undefined;
  decidedAt?: string | undefined;
  createdAt: string;
}

export type GlobalSearchItemType =
  | 'RESOURCE'
  | 'IDENTITY'
  | 'FINDING'
  | 'SITUATION'
  | 'CHANGE'
  | 'INCIDENT'
  | 'DECISION'
  | 'RUNBOOK'
  | 'SERVICE';

export interface GlobalSearchItem {
  id: string;
  type: GlobalSearchItemType;
  title: string;
  subtitle: string;
  provider?: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES' | 'MULTI_CLOUD' | undefined;
  region?: string | undefined;
  status?: string | undefined;
  severity?: string | undefined;
  deepLink: string;
  relevanceScore: number;
}

export interface GlobalSearchResult {
  query: string;
  totalMatches: number;
  items: GlobalSearchItem[];
}

export interface AiEnterpriseAnalystResult {
  query: string;
  intent:
    | 'ESTATE_HEALTH_INQUIRY'
    | 'SITUATION_INVESTIGATION'
    | 'RISK_TRIAGE'
    | 'DECISION_RECOMMENDATION'
    | 'CROSS_CLOUD_ANALYSIS'
    | 'GENERAL_COMMAND_QUERY';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  executiveSummary: string;
  situationAnalysis: string;
  riskAssessment: string;
  businessImpactBreakdown: string;
  recommendedDecisions: {
    priority: CloudSituationPriority;
    action: string;
    rationale: string;
    risk: string;
    approvalRequired: boolean;
  }[];
  evidenceCitations: {
    domain: string;
    id: string;
    title: string;
    snippet?: string | undefined;
  }[];
  suggestedFollowUps: string[];
  strictNoActionEnforced: boolean;
  analyzedAt: string;
}

export interface EnterpriseReport {
  id: string;
  type:
    | 'DAILY_EXECUTIVE_BRIEFING'
    | 'WEEKLY_RISK_REPORT'
    | 'MONTHLY_FINOPS_GOVERNANCE'
    | 'INCIDENT_POSTMORTEM_AGGREGATE';
  title: string;
  generatedAt: string;
  summary: string;
  sections: {
    title: string;
    content: string;
    keyMetrics: Record<string, any>;
  }[];
}

export interface GlobalCommandCenterOverview {
  health: GlobalCloudHealth;
  coverage: CloudCoverageSummary;
  freshness: GlobalDataFreshnessSummary;
  topSituations: EnterpriseCloudSituation[];
  activeSituationsCount: number;
  criticalSituationsCount: number;
  pendingDecisionsCount: number;
  priorityDecisions: ExecutiveDecision[];
  riskHeatmapSummary: {
    totalEntities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  calculatedAt: string;
}

// ─── Phase 69: Real CloudPulse Production Platform & Observability ───────────

export type PlatformEnvironment = 'development' | 'test' | 'staging' | 'production';

export type PlatformHealthStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'PARTIAL'
  | 'STALE'
  | 'UNAVAILABLE'
  | 'MAINTENANCE'
  | 'UNKNOWN';

export interface PlatformComponentHealth {
  id: string;
  name: string;
  category: 'GATEWAY' | 'STORAGE' | 'TELEMETRY_ENGINE' | 'SYNC_WORKER' | 'AI_SUBSYSTEM' | 'SECURITY_GUARD';
  status: PlatformHealthStatus;
  latencyMs: number;
  uptimePercent: number;
  errorRatePercent: number;
  lastChecked: string;
  message: string;
  details?: Record<string, any> | undefined;
}

export interface PlatformDependencyHealth {
  database: {
    status: PlatformHealthStatus;
    latencyMs: number;
    connectionPoolActive: number;
    connectionPoolIdle: number;
    connectionPoolMax: number;
    lastChecked: string;
  };
  telemetryEngine: {
    status: PlatformHealthStatus;
    otlpReceiverPort: number;
    bufferUtilizationPercent: number;
    ingestionRatePerSec: number;
    lastChecked: string;
  };
  inMemoryTsdb: {
    status: PlatformHealthStatus;
    metricsCount: number;
    logsCount: number;
    tracesCount: number;
    memoryUsageMb: number;
    lastChecked: string;
  };
  backgroundWorkers: {
    status: PlatformHealthStatus;
    activeWorkersCount: number;
    healthyWorkersCount: number;
    staleWorkersCount: number;
    dlqJobsCount: number;
    lastChecked: string;
  };
  cloudAdapters: {
    aws: { status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'THROTTLED'; latencyMs: number; lastSync: string };
    azure: { status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'THROTTLED'; latencyMs: number; lastSync: string };
    gcp: { status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'THROTTLED'; latencyMs: number; lastSync: string };
    kubernetes: { status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'THROTTLED'; latencyMs: number; lastSync: string };
  };
}

export interface PlatformHealthCheckResult {
  status: PlatformHealthStatus;
  environment: PlatformEnvironment;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  components: PlatformComponentHealth[];
  dependencies: PlatformDependencyHealth;
  activeMaintenance: boolean;
}

export interface PlatformLatencyPercentiles {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
}

export interface PlatformQueueMetrics {
  name: string;
  depth: number;
  processingRatePerSec: number;
  dlqDepth: number;
  avgWaitTimeMs: number;
  maxRetries: number;
}

export interface PlatformSyncWorkerStatus {
  id: string;
  name: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  status: 'RUNNING' | 'IDLE' | 'ERROR' | 'BACKOFF' | 'STALE';
  lastRunAt: string;
  nextRunAt: string;
  runDurationMs: number;
  successRate: number;
  consecutiveFailures: number;
  dlqCount: number;
  lastError?: string | undefined;
  checkpointId?: string | undefined;
}

export interface PlatformAiUsageMetrics {
  totalRequests: number;
  totalTokens: number;
  estimatedCostUsd: number;
  avgLatencyMs: number;
  throttledCount: number;
  errorCount: number;
  activeModel: string;
  costCapExceeded: boolean;
}

export interface PlatformMetrics {
  requestsPerSecond: number;
  errorRatePercent: number;
  apiLatency: PlatformLatencyPercentiles;
  databaseLatency: PlatformLatencyPercentiles;
  cpuUsagePercent: number;
  memoryUsageMb: number;
  memoryUsagePercent: number;
  activeWebsockets: number;
  queues: PlatformQueueMetrics[];
  workers: PlatformSyncWorkerStatus[];
  aiUsage: PlatformAiUsageMetrics;
  measuredAt: string;
}

export type PlatformErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'STALE_DATA'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_PERMISSION_DENIED'
  | 'PROVIDER_THROTTLED'
  | 'CIRCUIT_OPEN'
  | 'INTERNAL_ERROR'
  | 'MAINTENANCE_MODE';

export interface PlatformStandardError {
  code: PlatformErrorCode;
  message: string;
  details?: Record<string, any> | undefined;
  requestId?: string | undefined;
  correlationId?: string | undefined;
  timestamp: string;
  retryAfterSeconds?: number | undefined;
}

export interface PlatformSlo {
  id: string;
  name: string;
  targetPercent: number;
  actualPercent: number;
  status: 'HEALTHY' | 'AT_RISK' | 'BREACHED';
  windowDays: number;
  errorBudgetRemainingPercent: number;
  burnRate1h: number;
  burnRate24h: number;
  metricQuery: string;
  tier: 'TIER_0_CRITICAL' | 'TIER_1_STANDARD' | 'TIER_2_BACKGROUND';
}

export interface PlatformIncident {
  id: string;
  title: string;
  severity: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  affectedComponent: string;
  impactSummary: string;
  createdAt: string;
  resolvedAt?: string | undefined;
  rootCause?: string | undefined;
  remediationAction?: string | undefined;
}

export interface PlatformMaintenanceWindow {
  id: string;
  title: string;
  reason: string;
  scope: 'FULL_PLATFORM' | 'BACKGROUND_SYNC' | 'AI_SUBSYSTEM' | 'DATABASE_MIGRATION';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startTime: string;
  endTime: string;
  createdBy: string;
}

export interface PlatformCostRecord {
  id: string;
  category: 'COMPUTE' | 'DATABASE' | 'STORAGE' | 'OBSERVABILITY_TSDB' | 'AI_INFERENCE' | 'NETWORK_EGRESS';
  resourceName: string;
  costUsdPerHour: number;
  costUsdMonthToDate: number;
  provenance: 'ACTUAL' | 'CALCULATED' | 'ESTIMATED';
  trendPercent: number;
}

export interface PlatformRateLimitStatus {
  tier: string;
  limitPerMinute: number;
  remainingTokens: number;
  resetSeconds: number;
  circuitBreakers: {
    target: string;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    lastFailureTime?: string | undefined;
  }[];
}

export interface PlatformOverviewSummary {
  health: PlatformHealthCheckResult;
  metrics: PlatformMetrics;
  slos: PlatformSlo[];
  activeIncidents: PlatformIncident[];
  activeMaintenance: PlatformMaintenanceWindow | null;
  workers: PlatformSyncWorkerStatus[];
  costs: {
    totalMonthToDateUsd: number;
    breakdown: PlatformCostRecord[];
  };
  rateLimits: PlatformRateLimitStatus;
  environment: PlatformEnvironment;
  calculatedAt: string;
}

