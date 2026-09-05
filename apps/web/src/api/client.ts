import type {
  ApiResponse,
  OverviewData,
  Service,
  MetricSummary,
  LogEntry,
  Trace,
  Alert,
  Incident,
  SloDefinition,
  InfrastructureResource,
  SystemComponentStatus,
  FaultInjectionConfig,
  CloudConnection,
  CloudResource,
  MultiCloudScorecard,
  MultiCloudComparison,
  AzureSetupGuideStep,
  GcpSetupGuideStep,
  KubernetesOverviewSummary,
  KubernetesSafeAction,
  KubernetesSimulationResult,
  KubernetesOperation,
  CloudService,
  ServiceLevelIndicator,
  ServiceLevelObjective,
  ErrorBudget,
  ReliabilityScore,
  DependencyRisk,
  CascadingFailurePath,
  SreSinglePointOfFailure,
  FailureDomainAnalysis,
  ChangeReliabilityCorrelation,
  ReleaseRiskAssessment,
  CapacityIntelligence,
  RecoveryVerification,
  SrePlatformSummary,
  ServiceReliabilityDetail,
  SreInvestigationResult,
  EnterpriseUserRole,
  TeamType,
  CloudTeam,
  ResourceOwnership,
  CloudWorkItem,
  WorkItemComment,
  ActivityTimelineEvent,
  EnterpriseApprovalRequest,
  CloudChangeRequest,
  MaintenanceWindow,
  ChangeFreeze,
  EnterpriseNotification,
  IncidentBriefing,
  ActionItem,
  EnterpriseWorkflowSummary,
  AiWorkflowAssistantResult,
  MultiCloudFinOpsScorecard,
  CloudCostRecord,
  RealUnitEconomicsMetric,
  KubernetesFinOpsAllocation,
  RealCostAnomaly,
  MultiCloudCostForecast,
  MultiCloudBudget,
  RealSavingsOpportunity,
  CostTradeoffEvaluation,
  CostCenter,
  AiFinOpsAnalystResult,
  RealCloudIdentity,
  CloudAccessRelationship,
  EffectiveAccessRule,
  HighRiskAccessPath,
  PublicExposureEntity,
  ZeroTrustControlEffectiveness,
  SecurityAccessReview,
  SecurityExceptionRecord,
  ZeroTrustSecurityScorecard,
  AiSecurityAnalystResult,
  CloudResilienceProfile,
  FailureDomain,
  RealSinglePointOfFailure,
  RealBackupEntity,
  RealRecoveryPlan,
  ResilienceWhatIfSimulation,
  RecoveryDrillRecord,
  BusinessContinuityEntity,
  ZeroDowntimeScorecard,
  AiResilienceAnalystResult,
  RecoveryStep,
  EnterpriseCloudSituation,
  EnterpriseRiskHeatmap,
  GlobalCloudHealth,
  CloudCoverageSummary,
  GlobalDataFreshnessSummary,
  ExecutiveDecision,
  GlobalSearchResult,
  AiEnterpriseAnalystResult,
  EnterpriseReport,
  GlobalCommandCenterOverview,
  PlatformOverviewSummary,
  PlatformHealthCheckResult,
  PlatformDependencyHealth,
  PlatformMetrics,
  PlatformSlo,
  PlatformSyncWorkerStatus,
  PlatformRateLimitStatus,
  PlatformIncident,
  PlatformMaintenanceWindow,
  PlatformCostRecord,
} from '@cloudpulse/shared';

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API_BASE = `${RAW_BASE}/api/v1`;

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('cloudpulse_token') : null;
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('cloudpulse_workspace_id') : null;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = errorText || response.statusText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed?.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch {
      // Keep errorText
    }
    throw new Error(errorMsg || `API Error [${response.status}]`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

export interface ServiceFilterParams {
  environment?: string | undefined;
  status?: string | undefined;
  team?: string | undefined;
}

export interface MetricFilterParams {
  metric?: string | undefined;
  service?: string | undefined;
}

export interface LogFilterParams {
  service?: string | undefined;
  level?: string | undefined;
  traceId?: string | undefined;
  q?: string | undefined;
}

export interface TraceFilterParams {
  service?: string | undefined;
  status?: string | undefined;
  minDuration?: string | undefined;
}

export interface AlertFilterParams {
  severity?: string | undefined;
  state?: string | undefined;
  service?: string | undefined;
}

export interface IncidentFilterParams {
  severity?: string | undefined;
  state?: string | undefined;
  service?: string | undefined;
}

export interface SloFilterParams {
  status?: string | undefined;
  service?: string | undefined;
}

export interface InfraFilterParams {
  type?: string | undefined;
  category?: string | undefined;
}

export const api = {
  getOverview: () => fetchJson<OverviewData>('/overview'),

  getServices: (params?: ServiceFilterParams) => {
    const query = new URLSearchParams();
    if (params?.environment) query.set('environment', params.environment);
    if (params?.status) query.set('status', params.status);
    if (params?.team) query.set('team', params.team);
    const qs = query.toString();
    return fetchJson<Service[]>(`/services${qs ? `?${qs}` : ''}`);
  },

  getServiceById: (id: string) => fetchJson<Service>(`/services/${id}`),

  getMetrics: (params?: MetricFilterParams) => {
    const query = new URLSearchParams();
    if (params?.metric) query.set('metric', params.metric);
    if (params?.service) query.set('service', params.service);
    const qs = query.toString();
    return fetchJson<MetricSummary[]>(`/metrics${qs ? `?${qs}` : ''}`);
  },

  getLogs: (params?: LogFilterParams) => {
    const query = new URLSearchParams();
    if (params?.service) query.set('service', params.service);
    if (params?.level) query.set('level', params.level);
    if (params?.traceId) query.set('traceId', params.traceId);
    if (params?.q) query.set('q', params.q);
    const qs = query.toString();
    return fetchJson<LogEntry[]>(`/logs${qs ? `?${qs}` : ''}`);
  },

  getTraces: (params?: TraceFilterParams) => {
    const query = new URLSearchParams();
    if (params?.service) query.set('service', params.service);
    if (params?.status) query.set('status', params.status);
    if (params?.minDuration) query.set('minDuration', params.minDuration);
    const qs = query.toString();
    return fetchJson<Trace[]>(`/traces${qs ? `?${qs}` : ''}`);
  },

  getTraceById: (id: string) => fetchJson<Trace>(`/traces/${id}`),

  getAlerts: (params?: AlertFilterParams) => {
    const query = new URLSearchParams();
    if (params?.severity) query.set('severity', params.severity);
    if (params?.state) query.set('state', params.state);
    if (params?.service) query.set('service', params.service);
    const qs = query.toString();
    return fetchJson<Alert[]>(`/alerts${qs ? `?${qs}` : ''}`);
  },

  evaluateAlerts: () =>
    fetchJson<{ evaluated: number; firing: number }>('/alerts/evaluate', { method: 'POST' }),

  getIncidents: (params?: IncidentFilterParams) => {
    const query = new URLSearchParams();
    if (params?.severity) query.set('severity', params.severity);
    if (params?.state) query.set('state', params.state);
    if (params?.service) query.set('service', params.service);
    const qs = query.toString();
    return fetchJson<Incident[]>(`/incidents${qs ? `?${qs}` : ''}`);
  },

  getIncidentById: (id: string) => fetchJson<Incident>(`/incidents/${id}`),

  getSlos: (params?: SloFilterParams) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.service) query.set('service', params.service);
    const qs = query.toString();
    return fetchJson<SloDefinition[]>(`/slos${qs ? `?${qs}` : ''}`);
  },

  getSloById: (id: string) => fetchJson<SloDefinition>(`/slos/${id}`),

  getInfrastructure: (params?: InfraFilterParams) => {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    const qs = query.toString();
    return fetchJson<InfrastructureResource[]>(`/infrastructure${qs ? `?${qs}` : ''}`);
  },

  getSystemStatus: () => fetchJson<SystemComponentStatus[]>('/system-status'),

  getSimulation: () => fetchJson<FaultInjectionConfig>('/simulation'),

  updateSimulation: (config: Partial<FaultInjectionConfig>) =>
    fetchJson<FaultInjectionConfig>('/simulation', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  // Phase 7 Advanced SRE APIs
  getSreMetrics: () => fetchJson<any>('/sre/metrics'),
  getRunbooks: () => fetchJson<any[]>('/sre/runbooks'),
  getRunbookById: (id: string) => fetchJson<any>(`/sre/runbooks/${id}`),
  getRemediations: () => fetchJson<{ actions: any[]; auditLog: any[] }>('/sre/remediations'),
  executeRemediation: (actionId: string, triggeredBy?: string) =>
    fetchJson<any>('/sre/remediations/execute', {
      method: 'POST',
      body: JSON.stringify({ actionId, triggeredBy }),
    }),
  getPostmortems: () => fetchJson<any[]>('/sre/postmortems'),
  getPostmortemById: (id: string) => fetchJson<any>(`/sre/postmortems/${id}`),
  getDeployments: () => fetchJson<any[]>('/sre/deployments'),
  getNotifications: () => fetchJson<any[]>('/sre/notifications'),

  // Phase 8 & Phase 17 Cloud Security & SOC APIs
  getSecurityPosture: () => fetchJson<any>('/security/posture'),
  getCloudSocSummary: () => fetchJson<any>('/security/soc-summary'),
  getSecurityEvents: (source?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (source) params.append('source', source);
    if (severity) params.append('severity', severity);
    const qs = params.toString();
    return fetchJson<any[]>(`/security/events${qs ? `?${qs}` : ''}`);
  },
  getDetectionRules: () => fetchJson<any[]>('/security/detection-rules'),
  getSecuritySequences: () => fetchJson<any[]>('/security/sequences'),
  getSecurityIncidents: () => fetchJson<any[]>('/security/incidents'),
  getSecurityIncidentById: (id: string) => fetchJson<any>(`/security/incidents/${id}`),
  getSecurityFindings: () => fetchJson<any[]>('/security/findings'),
  getSecurityFindingById: (id: string) => fetchJson<any>(`/security/findings/${id}`),
  updateSecurityFinding: (id: string, status: string) =>
    fetchJson<any>(`/security/findings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getSecurityAuditLog: () => fetchJson<any[]>('/security/audit-log'),
  getSecurityRunbooks: () => fetchJson<any[]>('/security/runbooks'),
  getComplianceControls: () => fetchJson<any[]>('/security/compliance'),
  loginAsRole: (role: 'viewer' | 'operator' | 'admin') =>
    fetchJson<{ token: string; user: any }>('/security/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  getCurrentUser: () => fetchJson<{ user: any }>('/security/auth/me'),

  // Phase 9 & Phase 15 FinOps & Cost Intelligence APIs
  getFinOpsSummary: () => fetchJson<any>('/finops/summary'),
  getFinOpsPlatformSummary: () => fetchJson<any>('/finops/platform-summary'),
  getCostTrends: (days?: number) => fetchJson<any[]>(`/finops/trends${days ? `?days=${days}` : ''}`),
  getServiceCosts: () => fetchJson<any[]>('/finops/services'),
  getResourceCosts: () => fetchJson<any[]>('/finops/resources'),
  getCostAllocations: () => fetchJson<any[]>('/finops/allocation'),
  getCostBudgets: () => fetchJson<any[]>('/finops/budgets'),
  getCostForecast: () => fetchJson<any>('/finops/forecast'),
  getCostAnomalies: () => fetchJson<any[]>('/finops/anomalies'),
  getOptimizationRecommendations: () => fetchJson<any[]>('/finops/recommendations'),
  updateOptimizationRecommendation: (id: string, status: string) =>
    fetchJson<any>(`/finops/recommendations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getTaggingGovernance: () => fetchJson<any>('/finops/tagging'),
  getUnitEconomics: () => fetchJson<any[]>('/finops/unit-economics'),
  getKubernetesFinOps: () => fetchJson<any>('/finops/kubernetes'),
  getCostPolicies: () => fetchJson<any[]>('/finops/policies'),


  // Phase 10 AI/ML-Powered SRE & Predictive Intelligence APIs
  getIntelligenceSummary: () => fetchJson<any>('/intelligence/summary'),
  getPredictiveAnomalies: () => fetchJson<any[]>('/intelligence/anomalies'),
  getCapacityForecasts: () => fetchJson<any[]>('/intelligence/forecasts/capacity'),
  getSloRiskPredictions: () => fetchJson<any[]>('/intelligence/forecasts/slo-risk'),
  getRootCauseAnalysis: (incidentId: string) => fetchJson<any>(`/intelligence/incidents/${incidentId}/root-cause`),
  getDeploymentRisk: (deploymentId: string) => fetchJson<any>(`/intelligence/deployments/${deploymentId}/risk`),
  getAiRecommendations: () => fetchJson<any[]>('/intelligence/recommendations'),
  updateAiRecommendation: (id: string, status: string) =>
    fetchJson<any>(`/intelligence/recommendations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Phase 11 & Phase 16 Disaster Recovery, Resilience & Chaos Engineering APIs
  getResilienceSummary: () => fetchJson<any>('/resilience/summary'),
  getChaosLabSummary: () => fetchJson<any>('/resilience/chaos-summary'),
  getServiceDependencies: () => fetchJson<any[]>('/resilience/dependencies'),
  getSinglePointsOfFailure: () => fetchJson<any[]>('/resilience/spof'),
  getRtoRpoMetrics: () => fetchJson<any[]>('/resilience/rto-rpo'),
  getBackups: () => fetchJson<any[]>('/resilience/backups'),
  getDisasterScenarios: () => fetchJson<any[]>('/resilience/scenarios'),
  simulateScenario: (id: string) =>
    fetchJson<any>(`/resilience/scenarios/${id}/simulate`, {
      method: 'POST',
    }),
  getChaosExperiments: () => fetchJson<any[]>('/resilience/experiments'),
  executeChaosExperiment: (id: string) =>
    fetchJson<any>(`/resilience/experiments/${id}/execute`, {
      method: 'POST',
    }),
  getResilienceProfiles: () => fetchJson<any[]>('/resilience/profiles'),
  getResilienceHistory: () => fetchJson<any[]>('/resilience/history'),
  getResilienceRunbooks: () => fetchJson<any[]>('/resilience/runbooks'),


  // Phase 12 Multi-Cloud & Provider Abstraction APIs
  getMultiCloudSummary: () => fetchJson<any>('/multicloud/summary'),
  getCloudAccounts: () => fetchJson<any[]>('/multicloud/accounts'),
  getProviderCapabilities: () => fetchJson<any[]>('/multicloud/capabilities'),
  getCloudResources: (provider?: string) =>
    fetchJson<any[]>(`/multicloud/resources${provider ? `?provider=${provider}` : ''}`),
  getComputeResources: (provider?: string) =>
    fetchJson<any[]>(`/multicloud/compute${provider ? `?provider=${provider}` : ''}`),
  getStorageResources: (provider?: string) =>
    fetchJson<any[]>(`/multicloud/storage${provider ? `?provider=${provider}` : ''}`),
  getNetworkResources: (provider?: string) =>
    fetchJson<any[]>(`/multicloud/networking${provider ? `?provider=${provider}` : ''}`),
  getKubernetesClusters: (provider?: string) =>
    fetchJson<any[]>(`/multicloud/kubernetes${provider ? `?provider=${provider}` : ''}`),
  getCloudPortabilityScore: () => fetchJson<any>('/multicloud/portability'),
  getMigrationAssessment: () => fetchJson<any>('/multicloud/migration-assessment'),

  // Phase 13 & Phase 18 Cloud Governance, Compliance & Policy-as-Code APIs
  getGovernanceSummary: () => fetchJson<any>('/governance/summary'),
  getGovernancePlatformSummary: () => fetchJson<any>('/governance/platform-summary'),
  getGovernancePoliciesCatalog: () => fetchJson<any[]>('/governance/policies/catalog'),
  getComplianceEvidence: () => fetchJson<any[]>('/governance/evidence'),
  getComplianceFindings: () => fetchJson<any[]>('/governance/findings'),
  getPolicyExceptions: () => fetchJson<any[]>('/governance/exceptions'),
  getRemediationActions: () => fetchJson<any[]>('/governance/remediations'),
  approveRemediationAction: (id: string, approver?: string) =>
    fetchJson<any>(`/governance/remediations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approver }),
    }),
  getComplianceScans: () => fetchJson<any[]>('/governance/scans'),
  triggerComplianceScan: (scope?: string) =>
    fetchJson<any>('/governance/scans/trigger', {
      method: 'POST',
      body: JSON.stringify({ scope }),
    }),
  getComplianceFrameworks: () => fetchJson<any[]>('/governance/frameworks'),
  getIdentities: () => fetchJson<any[]>('/governance/identities'),
  getGovernanceRoles: () => fetchJson<any[]>('/governance/roles'),
  getLeastPrivilegeAnalysis: () => fetchJson<any[]>('/governance/least-privilege'),
  getSecurityPolicies: () => fetchJson<any[]>('/governance/policies'),
  simulatePolicy: (req: any) =>
    fetchJson<any>('/governance/policies/simulate', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  getPolicyViolations: () => fetchJson<any[]>('/governance/violations'),
  getAccessReviews: () => fetchJson<any[]>('/governance/access-reviews'),
  updateAccessReviewDecision: (id: string, decision: string, reviewer?: string) =>
    fetchJson<any>(`/governance/access-reviews/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reviewer }),
    }),
  getAccessRequests: () => fetchJson<any[]>('/governance/access-requests'),
  createAccessRequest: (req: any) =>
    fetchJson<any>('/governance/access-requests', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  approveAccessRequest: (id: string, approver?: string) =>
    fetchJson<any>(`/governance/access-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approver }),
    }),
  getGovernanceComplianceControls: () => fetchJson<any[]>('/governance/compliance'),


  // Phase 14 Advanced Observability & Distributed Tracing APIs
  getObservabilitySummary: () => fetchJson<any>('/observability/summary'),
  getDistributedTraces: (page?: number, limit?: number, service?: string, status?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    if (service) params.append('service', service);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any>(`/observability/traces${qs ? `?${qs}` : ''}`);
  },
  getDistributedTraceById: (id: string) => fetchJson<any>(`/observability/traces/${id}`),
  getServiceDependencyMap: () => fetchJson<any>('/observability/service-map'),
  getRedMetrics: (service?: string) =>
    fetchJson<any[]>(`/observability/red-metrics${service ? `?service=${service}` : ''}`),
  getUseMetrics: () => fetchJson<any[]>('/observability/use-metrics'),
  getRootCauseHypotheses: () => fetchJson<any[]>('/observability/root-cause'),
  getTelemetryQualityScore: () => fetchJson<any>('/observability/quality'),

  // Phase 19 Cloud Incident Response & SOAR APIs
  getSoarSummary: () => fetchJson<any>('/soar/summary'),
  getSoarIncidents: (priority?: string, severity?: string, status?: string) => {
    const params = new URLSearchParams();
    if (priority) params.append('priority', priority);
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/soar/incidents${qs ? `?${qs}` : ''}`);
  },
  getSoarIncidentById: (id: string) => fetchJson<any>(`/soar/incidents/${id}`),
  triageSoarIncident: (id: string) =>
    fetchJson<any>(`/soar/incidents/${id}/triage`, { method: 'POST' }),
  getSoarPlaybooks: () => fetchJson<any[]>('/soar/playbooks'),
  getSoarPlaybookById: (id: string) => fetchJson<any>(`/soar/playbooks/${id}`),
  executeSoarPlaybook: (id: string, payload: { incidentId: string; dryRun?: boolean; actor?: string }) =>
    fetchJson<any>(`/soar/playbooks/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSoarActions: (incidentId?: string) =>
    fetchJson<any[]>(`/soar/actions${incidentId ? `?incidentId=${incidentId}` : ''}`),
  getSoarApprovals: () => fetchJson<any[]>('/soar/approvals'),
  decideSoarApproval: (id: string, payload: { decision: 'APPROVED' | 'REJECTED'; approver?: string; reason?: string }) =>
    fetchJson<any>(`/soar/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSoarPirs: () => fetchJson<any[]>('/soar/pir'),
  getSoarPirByIncidentId: (incidentId: string) => fetchJson<any>(`/soar/pir/${incidentId}`),
  createSoarPir: (data: any) =>
    fetchJson<any>('/soar/pir', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Phase 20 Cloud Reliability Command Center APIs
  getReliabilitySummary: () => fetchJson<any>('/reliability/summary'),
  getReliabilityServices: (tier?: string, status?: string) => {
    const params = new URLSearchParams();
    if (tier) params.append('tier', tier);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/reliability/services${qs ? `?${qs}` : ''}`);
  },
  getReliabilityServiceById: (id: string) => fetchJson<any>(`/reliability/services/${id}`),
  getReliabilitySlis: (serviceId?: string) =>
    fetchJson<any[]>(`/reliability/slis${serviceId ? `?serviceId=${serviceId}` : ''}`),
  getReliabilitySlos: (serviceId?: string) =>
    fetchJson<any[]>(`/reliability/slos${serviceId ? `?serviceId=${serviceId}` : ''}`),
  getReliabilityErrorBudgets: (serviceId?: string) =>
    fetchJson<any[]>(`/reliability/error-budgets${serviceId ? `?serviceId=${serviceId}` : ''}`),
  getReliabilityCapacity: (serviceId?: string) =>
    fetchJson<any[]>(`/reliability/capacity${serviceId ? `?serviceId=${serviceId}` : ''}`),
  evaluateReliabilityGate: (serviceId: string) =>
    fetchJson<any>(`/reliability/gate/${serviceId}`, { method: 'POST' }),
  getReliabilityFindings: (serviceId?: string) =>
    fetchJson<any[]>(`/reliability/findings${serviceId ? `?serviceId=${serviceId}` : ''}`),
  getReliabilityRunbooks: (serviceId?: string) =>
    fetchJson<any[]>(`/reliability/runbooks${serviceId ? `?serviceId=${serviceId}` : ''}`),
  executeReliabilityRunbook: (id: string, mode?: 'DRY_RUN' | 'SIMULATION' | 'LIVE') =>
    fetchJson<any>(`/reliability/runbooks/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),

  // Phase 21 Internal Developer Platform (IDP) APIs
  getIdpSummary: () => fetchJson<any>('/idp/summary'),
  getIdpGoldenPaths: () => fetchJson<any[]>('/idp/golden-paths'),
  getIdpGoldenPathById: (id: string) => fetchJson<any>(`/idp/golden-paths/${id}`),
  getIdpTemplates: () => fetchJson<any[]>('/idp/templates'),
  getIdpTemplateById: (id: string) => fetchJson<any>(`/idp/templates/${id}`),
  getIdpEnvironments: (serviceId?: string, type?: string) => {
    const params = new URLSearchParams();
    if (serviceId) params.append('serviceId', serviceId);
    if (type) params.append('type', type);
    const qs = params.toString();
    return fetchJson<any[]>(`/idp/environments${qs ? `?${qs}` : ''}`);
  },
  provisionIdpEnvironment: (payload: any) =>
    fetchJson<any>('/idp/environments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getIdpDeployments: (serviceId?: string) =>
    fetchJson<any[]>(`/idp/deployments${serviceId ? `?serviceId=${serviceId}` : ''}`),
  triggerIdpDeployment: (payload: any) =>
    fetchJson<any>('/idp/deployments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getIdpRequests: () => fetchJson<any[]>('/idp/requests'),
  getIdpScorecards: () => fetchJson<any[]>('/idp/scorecards'),
  getIdpScorecardByServiceId: (serviceId: string) => fetchJson<any>(`/idp/scorecards/${serviceId}`),

  // Phase 22 Cloud Software Supply Chain Security APIs
  getSupplyChainSummary: () => fetchJson<any>('/supply-chain/summary'),
  getSupplyChainRepositories: () => fetchJson<any[]>('/supply-chain/repositories'),
  getSupplyChainRepositoryById: (id: string) => fetchJson<any>(`/supply-chain/repositories/${id}`),
  getSupplyChainBuilds: (repositoryId?: string) =>
    fetchJson<any[]>(`/supply-chain/builds${repositoryId ? `?repositoryId=${repositoryId}` : ''}`),
  getSupplyChainDependencies: (repositoryId?: string) =>
    fetchJson<any[]>(`/supply-chain/dependencies${repositoryId ? `?repositoryId=${repositoryId}` : ''}`),
  getSupplyChainVulnerabilities: (severity?: string, status?: string) => {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/supply-chain/vulnerabilities${qs ? `?${qs}` : ''}`);
  },
  getSupplyChainSboms: (repositoryId?: string, buildId?: string) => {
    const params = new URLSearchParams();
    if (repositoryId) params.append('repositoryId', repositoryId);
    if (buildId) params.append('buildId', buildId);
    const qs = params.toString();
    return fetchJson<any[]>(`/supply-chain/sboms${qs ? `?${qs}` : ''}`);
  },
  diffSupplyChainSboms: (baseSbomId: string, targetSbomId: string) =>
    fetchJson<any>('/supply-chain/sboms/diff', {
      method: 'POST',
      body: JSON.stringify({ baseSbomId, targetSbomId }),
    }),
  getSupplyChainContainers: () => fetchJson<any[]>('/supply-chain/containers'),
  getSupplyChainArtifacts: () => fetchJson<any[]>('/supply-chain/artifacts'),
  getSupplyChainSignatures: () => fetchJson<any[]>('/supply-chain/signatures'),
  getSupplyChainProvenance: (artifactId?: string) =>
    fetchJson<any[]>(`/supply-chain/provenance${artifactId ? `?artifactId=${artifactId}` : ''}`),
  evaluateSupplyChainGate: (artifactId: string) =>
    fetchJson<any>(`/supply-chain/gate/${artifactId}`, { method: 'POST' }),

  // Phase 23 Advanced Cloud FinOps APIs
  getFinOpsCenterSummary: () => fetchJson<any>('/finops-center/summary'),
  getFinOpsCenterCosts: (provider?: string, team?: string, environment?: string) => {
    const params = new URLSearchParams();
    if (provider) params.append('provider', provider);
    if (team) params.append('team', team);
    if (environment) params.append('environment', environment);
    const qs = params.toString();
    return fetchJson<any[]>(`/finops-center/costs${qs ? `?${qs}` : ''}`);
  },
  getFinOpsCenterBudgets: () => fetchJson<any[]>('/finops-center/budgets'),
  getFinOpsCenterForecasts: () => fetchJson<any[]>('/finops-center/forecasts'),
  getFinOpsCenterAnomalies: (status?: string) =>
    fetchJson<any[]>(`/finops-center/anomalies${status ? `?status=${status}` : ''}`),
  getFinOpsCenterWaste: () => fetchJson<any[]>('/finops-center/waste'),
  getFinOpsCenterRightsizing: () => fetchJson<any[]>('/finops-center/rightsizing'),
  getFinOpsCenterUnitEconomics: () => fetchJson<any[]>('/finops-center/unit-economics'),
  getFinOpsCenterKubernetes: () => fetchJson<any[]>('/finops-center/kubernetes'),
  getFinOpsCenterMultiCloud: () => fetchJson<any[]>('/finops-center/multicloud'),
  getFinOpsCenterOpportunities: (status?: string) =>
    fetchJson<any[]>(`/finops-center/opportunities${status ? `?status=${status}` : ''}`),
  approveFinOpsOpportunity: (id: string) =>
    fetchJson<any>(`/finops-center/opportunities/${id}/approve`, { method: 'POST' }),

  // Phase 24 Enterprise Disaster Recovery & Business Continuity APIs
  getResilienceCenterSummary: () => fetchJson<any>('/resilience-center/summary'),
  getResilienceCenterServices: (criticality?: string) =>
    fetchJson<any[]>(`/resilience-center/services${criticality ? `?criticality=${criticality}` : ''}`),
  getResilienceCenterPlans: (service?: string) =>
    fetchJson<any[]>(`/resilience-center/plans${service ? `?service=${service}` : ''}`),
  getResilienceCenterBackups: (resource?: string, status?: string) => {
    const params = new URLSearchParams();
    if (resource) params.append('resource', resource);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/resilience-center/backups${qs ? `?${qs}` : ''}`);
  },
  getResilienceCenterRestores: (status?: string) =>
    fetchJson<any[]>(`/resilience-center/restores${status ? `?status=${status}` : ''}`),
  getResilienceCenterScenarios: () => fetchJson<any[]>('/resilience-center/scenarios'),
  simulateResilienceScenario: (id: string) =>
    fetchJson<any>(`/resilience-center/scenarios/${id}/simulate`, { method: 'POST' }),
  getResilienceCenterWorkflows: () => fetchJson<any[]>('/resilience-center/workflows'),
  executeResilienceWorkflow: (id: string) =>
    fetchJson<any>(`/resilience-center/workflows/${id}/execute`, { method: 'POST' }),
  getResilienceCenterGaps: (priority?: string) =>
    fetchJson<any[]>(`/resilience-center/gaps${priority ? `?priority=${priority}` : ''}`),

  // Phase 25 Enterprise Cloud Governance APIs
  getGovernanceCenterSummary: () => fetchJson<any>('/governance-center/summary'),
  getGovernanceCenterPolicies: (category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/governance-center/policies${qs ? `?${qs}` : ''}`);
  },
  getGovernanceCenterResources: (provider?: string, team?: string, status?: string) => {
    const params = new URLSearchParams();
    if (provider) params.append('provider', provider);
    if (team) params.append('team', team);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/governance-center/resources${qs ? `?${qs}` : ''}`);
  },
  getGovernanceCenterEvaluations: (policyId?: string, resourceId?: string) => {
    const params = new URLSearchParams();
    if (policyId) params.append('policyId', policyId);
    if (resourceId) params.append('resourceId', resourceId);
    const qs = params.toString();
    return fetchJson<any[]>(`/governance-center/evaluations${qs ? `?${qs}` : ''}`);
  },
  getGovernanceCenterViolations: (status?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    const qs = params.toString();
    return fetchJson<any[]>(`/governance-center/violations${qs ? `?${qs}` : ''}`);
  },
  getGovernanceCenterExceptions: (status?: string) =>
    fetchJson<any[]>(`/governance-center/exceptions${status ? `?status=${status}` : ''}`),
  requestGovernanceException: (payload: any) =>
    fetchJson<any>('/governance-center/exceptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getGovernanceCenterRemediations: () => fetchJson<any[]>('/governance-center/remediations'),
  executeGovernanceRemediation: (id: string) =>
    fetchJson<any>(`/governance-center/remediations/${id}/execute`, { method: 'POST' }),
  getGovernanceCenterEvidence: (policyId?: string) =>
    fetchJson<any[]>(`/governance-center/evidence${policyId ? `?policyId=${policyId}` : ''}`),
  getGovernanceCenterFrameworks: () => fetchJson<any[]>('/governance-center/frameworks'),

  // Phase 26 AIOps & Observability Intelligence APIs
  getAiOpsSummary: () => fetchJson<any>('/aiops-center/summary'),
  getAiOpsEvents: (service?: string, eventType?: string, severity?: string, source?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    if (eventType) params.append('eventType', eventType);
    if (severity) params.append('severity', severity);
    if (source) params.append('source', source);
    if (limit) params.append('limit', limit.toString());
    const qs = params.toString();
    return fetchJson<any[]>(`/aiops-center/events${qs ? `?${qs}` : ''}`);
  },
  getAiOpsCorrelations: (eventId?: string) =>
    fetchJson<any[]>(`/aiops-center/correlations${eventId ? `?eventId=${eventId}` : ''}`),
  getAiOpsServices: (service?: string) =>
    fetchJson<any[]>(`/aiops-center/services${service ? `?service=${service}` : ''}`),
  getAiOpsRootCauses: (incidentId?: string) =>
    fetchJson<any[]>(`/aiops-center/root-causes${incidentId ? `?incidentId=${incidentId}` : ''}`),
  getAiOpsPredictions: (service?: string) =>
    fetchJson<any[]>(`/aiops-center/predictions${service ? `?service=${service}` : ''}`),
  getAiOpsQuality: () => fetchJson<any>('/aiops-center/quality'),
  searchAiOpsSimilarIncidents: (query: any) =>
    fetchJson<any[]>('/aiops-center/similar-incidents', {
      method: 'POST',
      body: JSON.stringify(query),
    }),
  queryAiOpsAssistant: (prompt: string) =>
    fetchJson<any>('/aiops-center/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 27 Agentic Cloud Operations APIs
  getAgentOperationsSummary: () => fetchJson<any>('/agent-operations/summary'),
  getAgentSessions: (status?: string) =>
    fetchJson<any[]>(`/agent-operations/sessions${status ? `?status=${status}` : ''}`),
  createAgentSession: (payload: any) =>
    fetchJson<any>('/agent-operations/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAgentTasks: (sessionId?: string) =>
    fetchJson<any[]>(`/agent-operations/tasks${sessionId ? `?sessionId=${sessionId}` : ''}`),
  getAgentPlans: (taskId?: string) =>
    fetchJson<any[]>(`/agent-operations/plans${taskId ? `?taskId=${taskId}` : ''}`),
  simulateAgentPlan: (id: string) =>
    fetchJson<any>(`/agent-operations/plans/${id}/simulate`, { method: 'POST' }),
  getAgentApprovals: (status?: string) =>
    fetchJson<any[]>(`/agent-operations/approvals${status ? `?status=${status}` : ''}`),
  approveAgentAction: (id: string) =>
    fetchJson<any>(`/agent-operations/approvals/${id}/approve`, { method: 'POST' }),
  rejectAgentAction: (id: string, reason?: string) =>
    fetchJson<any>(`/agent-operations/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  executeAgentAction: (id: string) =>
    fetchJson<any>(`/agent-operations/actions/${id}/execute`, { method: 'POST' }),
  getAgentVerifications: (actionId?: string) =>
    fetchJson<any[]>(`/agent-operations/verifications${actionId ? `?actionId=${actionId}` : ''}`),
  getAgentAuditTrail: (sessionId?: string) =>
    fetchJson<any[]>(`/agent-operations/audit${sessionId ? `?sessionId=${sessionId}` : ''}`),
  queryAgentOperations: (prompt: string, context?: any) =>
    fetchJson<any>('/agent-operations/query', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    }),

  // Phase 28 Enterprise FinOps & Business Impact APIs
  getEnterpriseFinOpsSummary: () => fetchJson<any>('/finops-enterprise/summary'),
  getEnterpriseFinOpsCosts: (provider?: string, team?: string, service?: string, environment?: string) => {
    const params = new URLSearchParams();
    if (provider) params.append('provider', provider);
    if (team) params.append('team', team);
    if (service) params.append('service', service);
    if (environment) params.append('environment', environment);
    const qs = params.toString();
    return fetchJson<any[]>(`/finops-enterprise/costs${qs ? `?${qs}` : ''}`);
  },
  getEnterpriseFinOpsUsage: (service?: string) =>
    fetchJson<any[]>(`/finops-enterprise/usage${service ? `?service=${service}` : ''}`),
  getEnterpriseFinOpsImpacts: () => fetchJson<any[]>('/finops-enterprise/impacts'),
  getEnterpriseFinOpsBudgets: () => fetchJson<any[]>('/finops-enterprise/budgets'),
  getEnterpriseFinOpsForecasts: () => fetchJson<any[]>('/finops-enterprise/forecasts'),
  getEnterpriseFinOpsOptimizations: () => fetchJson<any[]>('/finops-enterprise/optimizations'),
  simulateFinOpsWhatIf: (scenario: any) =>
    fetchJson<any>('/finops-enterprise/simulate-what-if', {
      method: 'POST',
      body: JSON.stringify(scenario),
    }),
  queryFinOpsAssistant: (prompt: string) =>
    fetchJson<any>('/finops-enterprise/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 29 Cloud Platform Marketplace & Developer Portal APIs
  getMarketplaceSummary: () => fetchJson<any>('/marketplace-portal/summary'),
  getMarketplaceCatalog: (category?: string, provider?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (provider) params.append('provider', provider);
    const qs = params.toString();
    return fetchJson<any[]>(`/marketplace-portal/catalog${qs ? `?${qs}` : ''}`);
  },
  getMarketplaceTemplates: (category?: string) =>
    fetchJson<any[]>(`/marketplace-portal/templates${category ? `?category=${category}` : ''}`),
  getMarketplaceRequests: (team?: string, status?: string) => {
    const params = new URLSearchParams();
    if (team) params.append('team', team);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/marketplace-portal/requests${qs ? `?${qs}` : ''}`);
  },
  createMarketplaceRequest: (payload: any) =>
    fetchJson<any>('/marketplace-portal/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  approveMarketplaceRequest: (id: string) =>
    fetchJson<any>(`/marketplace-portal/requests/${id}/approve`, { method: 'POST' }),
  rejectMarketplaceRequest: (id: string, reason?: string) =>
    fetchJson<any>(`/marketplace-portal/requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getMarketplaceRegistry: (team?: string, environment?: string) => {
    const params = new URLSearchParams();
    if (team) params.append('team', team);
    if (environment) params.append('environment', environment);
    const qs = params.toString();
    return fetchJson<any[]>(`/marketplace-portal/registry${qs ? `?${qs}` : ''}`);
  },
  decommissionMarketplaceResource: (id: string) =>
    fetchJson<any>(`/marketplace-portal/registry/${id}/decommission`, { method: 'POST' }),
  simulateMarketplaceProvisioning: (payload: any) =>
    fetchJson<any>('/marketplace-portal/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  queryMarketplacePortal: (prompt: string) =>
    fetchJson<any>('/marketplace-portal/query', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 30 Multi-Cloud Disaster Recovery & Resilience APIs
  getDisasterRecoverySummary: () => fetchJson<any>('/disaster-recovery-center/summary'),
  getDisasterRecoveryPlans: (service?: string, strategy?: string) => {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    if (strategy) params.append('strategy', strategy);
    const qs = params.toString();
    return fetchJson<any[]>(`/disaster-recovery-center/plans${qs ? `?${qs}` : ''}`);
  },
  getDisasterRecoveryDrills: (planId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (planId) params.append('planId', planId);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/disaster-recovery-center/drills${qs ? `?${qs}` : ''}`);
  },
  simulateDisasterRecoveryDrill: (payload: any) =>
    fetchJson<any>('/disaster-recovery-center/drills/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDisasterRecoveryBackups: (service?: string, healthStatus?: string) => {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    if (healthStatus) params.append('healthStatus', healthStatus);
    const qs = params.toString();
    return fetchJson<any[]>(`/disaster-recovery-center/backups${qs ? `?${qs}` : ''}`);
  },
  getDisasterRecoverySpofs: () => fetchJson<any[]>('/disaster-recovery-center/spofs'),
  getDisasterRecoveryHeatmap: () => fetchJson<any[]>('/disaster-recovery-center/heatmap'),
  executeDisasterRecoveryFailover: (id: string) =>
    fetchJson<any>(`/disaster-recovery-center/plans/${id}/failover`, { method: 'POST' }),
  executeDisasterRecoveryFailback: (id: string) =>
    fetchJson<any>(`/disaster-recovery-center/plans/${id}/failback`, { method: 'POST' }),
  queryDisasterRecoveryAssistant: (prompt: string) =>
    fetchJson<any>('/disaster-recovery-center/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 31 Cloud Data Intelligence & Real-Time Decision APIs
  getEventIntelligenceSummary: () => fetchJson<any>('/event-intelligence/summary'),
  getEventIntelligenceEvents: (source?: string, provider?: string, service?: string, severity?: string, status?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (source) params.append('source', source);
    if (provider) params.append('provider', provider);
    if (service) params.append('service', service);
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    const qs = params.toString();
    return fetchJson<any[]>(`/event-intelligence/events${qs ? `?${qs}` : ''}`);
  },
  getEventIntelligenceEventById: (id: string) => fetchJson<any>(`/event-intelligence/events/${id}`),
  ingestEventIntelligenceEvent: (payload: any) =>
    fetchJson<any>('/event-intelligence/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getEventIntelligenceCorrelations: (service?: string, status?: string) => {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/event-intelligence/correlations${qs ? `?${qs}` : ''}`);
  },
  getEventIntelligenceDecisions: (service?: string, status?: string) => {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/event-intelligence/decisions${qs ? `?${qs}` : ''}`);
  },
  getEventIntelligenceSchemas: () => fetchJson<any[]>('/event-intelligence/schemas'),
  getEventIntelligenceDeadLetters: (status?: string) =>
    fetchJson<any[]>(`/event-intelligence/dlq${status ? `?status=${status}` : ''}`),
  retryEventIntelligenceDeadLetter: (id: string) =>
    fetchJson<any>(`/event-intelligence/dlq/${id}/retry`, { method: 'POST' }),
  simulateEventIntelligenceScenario: (payload: any) =>
    fetchJson<any>('/event-intelligence/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  replayEventIntelligenceEvents: (payload: any) =>
    fetchJson<any>('/event-intelligence/replay', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  queryEventIntelligenceAssistant: (prompt: string) =>
    fetchJson<any>('/event-intelligence/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 32 Cloud Service Mesh & Distributed Traffic Engineering APIs
  getServiceMeshSummary: () => fetchJson<any>('/service-mesh/summary'),
  getServiceMeshServices: (environment?: string, provider?: string) => {
    const params = new URLSearchParams();
    if (environment) params.append('environment', environment);
    if (provider) params.append('provider', provider);
    const qs = params.toString();
    return fetchJson<any[]>(`/service-mesh/services${qs ? `?${qs}` : ''}`);
  },
  getServiceMeshServiceById: (id: string) => fetchJson<any>(`/service-mesh/services/${id}`),
  getServiceMeshInstances: (serviceId?: string) =>
    fetchJson<any[]>(`/service-mesh/instances${serviceId ? `?serviceId=${serviceId}` : ''}`),
  getServiceMeshRoutes: (service?: string, method?: string) => {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    if (method) params.append('method', method);
    const qs = params.toString();
    return fetchJson<any[]>(`/service-mesh/routes${qs ? `?${qs}` : ''}`);
  },
  getServiceMeshTrafficSplits: (service?: string) =>
    fetchJson<any[]>(`/service-mesh/traffic-splits${service ? `?service=${service}` : ''}`),
  updateServiceMeshTrafficSplit: (payload: any) =>
    fetchJson<any>('/service-mesh/traffic-splits', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  startServiceMeshCanary: (payload: any) =>
    fetchJson<any>('/service-mesh/canary/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  advanceServiceMeshCanary: (service: string) =>
    fetchJson<any>('/service-mesh/canary/advance', {
      method: 'POST',
      body: JSON.stringify({ service }),
    }),
  rollbackServiceMeshCanary: (service: string) =>
    fetchJson<any>('/service-mesh/canary/rollback', {
      method: 'POST',
      body: JSON.stringify({ service }),
    }),
  getServiceMeshCircuitBreakers: (service?: string) =>
    fetchJson<any[]>(`/service-mesh/circuit-breakers${service ? `?service=${service}` : ''}`),
  tripServiceMeshCircuitBreaker: (service: string) =>
    fetchJson<any>(`/service-mesh/circuit-breakers/${service}/trip`, { method: 'POST' }),
  resetServiceMeshCircuitBreaker: (service: string) =>
    fetchJson<any>(`/service-mesh/circuit-breakers/${service}/reset`, { method: 'POST' }),
  getServiceMeshPolicies: () => fetchJson<any[]>('/service-mesh/policies'),
  evaluateServiceMeshReleaseGuard: (service: string, version: string) =>
    fetchJson<any>(`/service-mesh/release-guard?service=${service}&version=${version}`),
  simulateServiceMeshFaultInjection: (payload: any) =>
    fetchJson<any>('/service-mesh/fault-injection', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  queryServiceMeshAssistant: (prompt: string) =>
    fetchJson<any>('/service-mesh/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 33 Kubernetes Platform & Workload Orchestration APIs
  getKubernetesSummary: () => fetchJson<any>('/kubernetes/summary'),
  getKubernetesPlatformClusters: (environment?: string, provider?: string) => {
    const params = new URLSearchParams();
    if (environment) params.append('environment', environment);
    if (provider) params.append('provider', provider);
    const qs = params.toString();
    return fetchJson<any[]>(`/kubernetes/clusters${qs ? `?${qs}` : ''}`);
  },
  getKubernetesClusterById: (id: string) => fetchJson<any>(`/kubernetes/clusters/${id}`),
  getKubernetesNodes: (clusterId?: string) =>
    fetchJson<any[]>(`/kubernetes/nodes${clusterId ? `?clusterId=${clusterId}` : ''}`),
  getKubernetesNamespaces: (clusterId?: string) =>
    fetchJson<any[]>(`/kubernetes/namespaces${clusterId ? `?clusterId=${clusterId}` : ''}`),
  getKubernetesWorkloads: (namespace?: string, kind?: string) => {
    const params = new URLSearchParams();
    if (namespace) params.append('namespace', namespace);
    if (kind) params.append('kind', kind);
    const qs = params.toString();
    return fetchJson<any[]>(`/kubernetes/workloads${qs ? `?${qs}` : ''}`);
  },
  getKubernetesPods: (namespace?: string, status?: string) => {
    const params = new URLSearchParams();
    if (namespace) params.append('namespace', namespace);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/kubernetes/pods${qs ? `?${qs}` : ''}`);
  },
  getKubernetesAutoscalers: (namespace?: string) =>
    fetchJson<any[]>(`/kubernetes/autoscalers${namespace ? `?namespace=${namespace}` : ''}`),
  restartKubernetesWorkload: (namespace: string, name: string) =>
    fetchJson<any>(`/kubernetes/workloads/${namespace}/${name}/restart`, { method: 'POST' }),
  scaleKubernetesWorkload: (namespace: string, name: string, targetReplicas: number) =>
    fetchJson<any>(`/kubernetes/workloads/${namespace}/${name}/scale`, {
      method: 'POST',
      body: JSON.stringify({ targetReplicas }),
    }),
  cordonKubernetesNode: (name: string) =>
    fetchJson<any>(`/kubernetes/nodes/${name}/cordon`, { method: 'POST' }),
  drainKubernetesNode: (name: string) =>
    fetchJson<any>(`/kubernetes/nodes/${name}/drain`, { method: 'POST' }),
  simulateKubernetesScenario: (scenario: string) =>
    fetchJson<any>('/kubernetes/simulate', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }),
  queryKubernetesAssistant: (prompt: string) =>
    fetchJson<any>('/kubernetes/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 34 Cloud Identity, IAM & Zero-Trust Security Control Plane APIs
  getCloudIdentitySummary: () => fetchJson<any>('/identity-iam/summary'),
  getCloudIdentities: (type?: string, risk?: string, provider?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (risk) params.append('risk', risk);
    if (provider) params.append('provider', provider);
    const qs = params.toString();
    return fetchJson<any[]>(`/identity-iam/identities${qs ? `?${qs}` : ''}`);
  },
  getCloudIdentityById: (id: string) => fetchJson<any>(`/identity-iam/identities/${id}`),
  getCloudIamRoles: () => fetchJson<any[]>('/identity-iam/roles'),
  getCloudIamPolicies: () => fetchJson<any[]>('/identity-iam/policies'),
  evaluateCloudIamAccess: (payload: { identity: string; action: string; resource: string; context?: any }) =>
    fetchJson<any>('/identity-iam/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCloudAccessRequests: (status?: string) =>
    fetchJson<any[]>(`/identity-iam/access-requests${status ? `?status=${status}` : ''}`),
  createCloudAccessRequest: (payload: any) =>
    fetchJson<any>('/identity-iam/access-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  approveCloudAccessRequest: (id: string, approver?: string) =>
    fetchJson<any>(`/identity-iam/access-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approver }),
    }),
  denyCloudAccessRequest: (id: string, reason?: string) =>
    fetchJson<any>(`/identity-iam/access-requests/${id}/deny`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getLeastPrivilegeFindings: () => fetchJson<any[]>('/identity-iam/least-privilege'),
  queryCloudIamAssistant: (prompt: string) =>
    fetchJson<any>('/identity-iam/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 35 Advanced AI/ML & Predictive Cloud Intelligence APIs
  getPredictiveSummary: () => fetchJson<any>('/predictive/summary'),
  getPredictiveForecasts: (target?: string, risk?: string) => {
    const params = new URLSearchParams();
    if (target) params.append('target', target);
    if (risk) params.append('risk', risk);
    const qs = params.toString();
    return fetchJson<any[]>(`/predictive/forecasts${qs ? `?${qs}` : ''}`);
  },
  getAdvancedPredictiveAnomalies: (severity?: string) =>
    fetchJson<any[]>(`/predictive/anomalies${severity ? `?severity=${severity}` : ''}`),
  getPredictiveIncidents: () => fetchJson<any[]>('/predictive/incidents'),
  getPredictiveCapacity: () => fetchJson<any[]>('/predictive/capacity'),
  getPredictiveCost: () => fetchJson<any>('/predictive/cost'),
  getPredictiveModels: () => fetchJson<any[]>('/predictive/models'),
  submitPredictionFeedback: (predictionId: string, feedback: 'CORRECT' | 'INCORRECT' | 'PARTIALLY_CORRECT', notes?: string) =>
    fetchJson<any>('/predictive/feedback', {
      method: 'POST',
      body: JSON.stringify({ predictionId, feedback, notes }),
    }),
  simulatePredictiveScenario: (payload: { trafficMultiplier?: number; storageGrowthMultiplier?: number; nodeFailureCount?: number }) =>
    fetchJson<any>('/predictive/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  queryPredictiveAssistant: (prompt: string) =>
    fetchJson<any>('/predictive/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 36 Infrastructure-as-Code & Advanced Platform Automation APIs
  getIaCSummary: () => fetchJson<any>('/iac/summary'),
  getIaCProjects: () => fetchJson<any[]>('/iac/projects'),
  getIaCStacks: (projectId?: string) =>
    fetchJson<any[]>(`/iac/stacks${projectId ? `?projectId=${projectId}` : ''}`),
  getIaCBlueprints: () => fetchJson<any[]>('/iac/blueprints'),
  getIaCPlans: (stackId?: string) =>
    fetchJson<any[]>(`/iac/plans${stackId ? `?stackId=${stackId}` : ''}`),
  createIaCPlan: (payload: any) =>
    fetchJson<any>('/iac/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  validateIaCPlan: (id: string) =>
    fetchJson<any>(`/iac/plans/${id}/validate`, {
      method: 'POST',
    }),
  approveIaCPlan: (id: string, approver?: string) =>
    fetchJson<any>(`/iac/plans/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approver }),
    }),
  executeIaCDeployment: (id: string, mode?: 'DRY_RUN' | 'SIMULATED') =>
    fetchJson<any>(`/iac/plans/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
  rollbackIaCDeployment: (id: string) =>
    fetchJson<any>(`/iac/deployments/${id}/rollback`, {
      method: 'POST',
    }),
  getIaCDrifts: (stackId?: string) =>
    fetchJson<any[]>(`/iac/drifts${stackId ? `?stackId=${stackId}` : ''}`),
  reconcileIaCDrift: (id: string) =>
    fetchJson<any>(`/iac/drifts/${id}/reconcile`, {
      method: 'POST',
    }),
  queryIaCAssistant: (prompt: string) =>
    fetchJson<any>('/iac/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 37 Cloud Compliance & Policy-as-Code Governance Center APIs
  getComplianceGovernanceSummary: () => fetchJson<any>('/compliance-governance/summary'),
  getComplianceGovernanceFrameworks: () => fetchJson<any[]>('/compliance-governance/frameworks'),
  getComplianceGovernanceControls: (frameworkId?: string, domain?: string) => {
    const params = new URLSearchParams();
    if (frameworkId) params.append('frameworkId', frameworkId);
    if (domain) params.append('domain', domain);
    const qs = params.toString();
    return fetchJson<any[]>(`/compliance-governance/controls${qs ? `?${qs}` : ''}`);
  },
  getComplianceGovernancePolicies: (domain?: string) =>
    fetchJson<any[]>(`/compliance-governance/policies${domain ? `?domain=${domain}` : ''}`),
  evaluateComplianceGovernancePolicy: (policyId: string, resource: any) =>
    fetchJson<any>('/compliance-governance/policies/evaluate', {
      method: 'POST',
      body: JSON.stringify({ policyId, resource }),
    }),
  simulateComplianceGovernancePolicyImpact: (policyId: string, newMode?: 'BLOCKING' | 'AUDIT') =>
    fetchJson<any>('/compliance-governance/policies/simulate', {
      method: 'POST',
      body: JSON.stringify({ policyId, newMode }),
    }),
  getComplianceGovernanceFindings: (severity?: string, status?: string) => {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);
    const qs = params.toString();
    return fetchJson<any[]>(`/compliance-governance/findings${qs ? `?${qs}` : ''}`);
  },
  getComplianceGovernanceFindingEvidence: (findingId: string) =>
    fetchJson<any>(`/compliance-governance/findings/${findingId}/evidence`),
  remediateComplianceGovernanceFinding: (findingId: string) =>
    fetchJson<any>(`/compliance-governance/findings/${findingId}/remediate`, {
      method: 'POST',
    }),
  getComplianceGovernanceExceptions: () => fetchJson<any[]>('/compliance-governance/exceptions'),
  createComplianceGovernanceException: (payload: any) =>
    fetchJson<any>('/compliance-governance/exceptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  queryComplianceGovernanceAssistant: (prompt: string) =>
    fetchJson<any>('/compliance-governance/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 38 Advanced FinOps & Sustainability / GreenOps APIs
  getAdvancedFinOpsSummary: () => fetchJson<any>('/finops-greenops/summary'),
  getGreenOpsMetrics: () => fetchJson<any[]>('/finops-greenops/greenops'),
  getAdvancedUnitEconomics: () => fetchJson<any[]>('/finops-greenops/unit-economics'),
  getAdvancedSavingsOpportunities: () => fetchJson<any[]>('/finops-greenops/savings/opportunities'),
  getAdvancedRealizedSavings: () => fetchJson<any[]>('/finops-greenops/savings/realized'),
  reconcileAdvancedRealizedSavings: (opportunityId: string) =>
    fetchJson<any>(`/finops-greenops/savings/opportunities/${opportunityId}/reconcile`, {
      method: 'POST',
    }),
  simulateGreenOpsScenario: (payload: any) =>
    fetchJson<any>('/finops-greenops/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  queryFinOpsGreenOpsAssistant: (prompt: string) =>
    fetchJson<any>('/finops-greenops/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 39 Enterprise Command Center & Executive Intelligence APIs
  getEnterpriseCommandCenterSummary: () => fetchJson<any>('/enterprise-command-center/summary'),
  getEnterpriseHealth: () => fetchJson<any>('/enterprise-command-center/health'),
  getEnterpriseRisks: (category?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (severity) params.append('severity', severity);
    const qs = params.toString();
    return fetchJson<any[]>(`/enterprise-command-center/risks${qs ? `?${qs}` : ''}`);
  },
  getEnterpriseBusinessImpact: () => fetchJson<any>('/enterprise-command-center/business-impact'),
  getEnterpriseSituationRoom: (domain?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (domain) params.append('domain', domain);
    if (severity) params.append('severity', severity);
    const qs = params.toString();
    return fetchJson<any[]>(`/enterprise-command-center/situation-room${qs ? `?${qs}` : ''}`);
  },
  getExecutiveBriefing: () => fetchJson<any>('/enterprise-command-center/briefing'),
  getGlobalCloudEstate: () => fetchJson<any>('/enterprise-command-center/estate'),
  simulateExecutiveScenario: (payload: any) =>
    fetchJson<any>('/enterprise-command-center/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  searchEnterpriseEstate: (q: string) =>
    fetchJson<any>(`/enterprise-command-center/search?q=${encodeURIComponent(q)}`),
  queryExecutiveAssistant: (prompt: string) =>
    fetchJson<any>('/enterprise-command-center/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};

// ─── Phase 41: Real Auth & Cloud Connections Client SDK ───────────────────────

export const authApi = {
  getConfiguredProviders: () => fetchJson<any>('/auth/providers'),
  getAuthorizationUrl: (provider: 'google' | 'microsoft' | 'apple', returnUrl?: string) =>
    fetchJson<{ authorizationUrl: string; state: string }>(
      `/auth/authorize/${provider}${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`
    ),
  exchangeTicket: (ticket: string) =>
    fetchJson<any>('/auth/exchange-ticket', {
      method: 'POST',
      body: JSON.stringify({ ticket }),
    }),
  register: (payload: { name: string; email: string; password?: string; provider?: string; role?: string }) =>
    fetchJson<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password?: string }) =>
    fetchJson<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  loginWithGoogle: (payload: { email: string; name: string }) =>
    fetchJson<any>('/auth/oauth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  loginWithMicrosoft: (payload: { email: string; name: string }) =>
    fetchJson<any>('/auth/oauth/microsoft', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  loginWithApple: (payload: { email: string; name: string }) =>
    fetchJson<any>('/auth/oauth/apple', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (email: string) =>
    fetchJson<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (payload: { token: string; newPassword: string }) =>
    fetchJson<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCurrentUser: () => fetchJson<any>('/auth/me'),
  getWorkspaces: () => fetchJson<any[]>('/auth/workspaces'),
  createWorkspace: (name: string) =>
    fetchJson<any>('/auth/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateProfile: (updates: { name?: string; avatarUrl?: string }) =>
    fetchJson<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  logout: () =>
    fetchJson<any>('/auth/logout', {
      method: 'POST',
    }),
};

export const cloudConnectionsApi = {
  getConnections: () => fetchJson<any[]>('/cloud-connections'),
  getAwsSetupInfo: () => fetchJson<any>('/cloud-connections/aws/setup-info'),
  connectAws: (payload: { displayName?: string; roleArn: string; externalId: string }) =>
    fetchJson<any>('/cloud-connections/aws/connect', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  validateConnection: (id: string) =>
    fetchJson<any>(`/cloud-connections/${id}/validate`, {
      method: 'POST',
    }),
  syncConnection: (id: string) =>
    fetchJson<any>(`/cloud-connections/${id}/sync`, {
      method: 'POST',
    }),
  disconnectConnection: (id: string) =>
    fetchJson<any>(`/cloud-connections/${id}/disconnect`, {
      method: 'POST',
    }),
  getAwsLiveData: () => fetchJson<any>('/cloud-connections/aws/live-data'),
  getAwsInventory: () => fetchJson<any[]>('/cloud-connections/aws/inventory'),
  getAwsInventorySummary: () => fetchJson<any>('/cloud-connections/aws/inventory/summary'),
  getAwsResource: (id: string) => fetchJson<any>(`/cloud-connections/aws/resources/${encodeURIComponent(id)}`),
  getAwsTopology: () => fetchJson<any>('/cloud-connections/aws/topology'),
  getAwsSyncStatus: () => fetchJson<any>('/cloud-connections/aws/sync-status'),
  getAwsEvents: (params?: {
    service?: string | undefined;
    eventType?: string | undefined;
    severity?: string | undefined;
    actor?: string | undefined;
    search?: string | undefined;
    timeRange?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.service) qs.append('service', params.service);
    if (params?.eventType) qs.append('eventType', params.eventType);
    if (params?.severity) qs.append('severity', params.severity);
    if (params?.actor) qs.append('actor', params.actor);
    if (params?.search) qs.append('search', params.search);
    if (params?.timeRange) qs.append('timeRange', params.timeRange);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/events${query}`);
  },
  getAwsEvent: (id: string) => fetchJson<any>(`/cloud-connections/aws/events/${encodeURIComponent(id)}`),
  getAwsChangeIntelligence: () => fetchJson<any>('/cloud-connections/aws/change-intelligence'),
  getAwsChangeCorrelations: () => fetchJson<any[]>('/cloud-connections/aws/change-intelligence/correlations'),
  syncAwsEvents: (window: string = '24h') =>
    fetchJson<any>('/cloud-connections/aws/events/sync', {
      method: 'POST',
      body: JSON.stringify({ window }),
    }),
  getAwsEventsCheckpoint: () => fetchJson<any>('/cloud-connections/aws/events-checkpoint'),
  getAwsSecurityPosture: () => fetchJson<any>('/cloud-connections/aws/security/posture'),
  getAwsSecurityFindings: (params?: {
    severity?: string | undefined;
    source?: string | undefined;
    status?: string | undefined;
    search?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.severity) qs.append('severity', params.severity);
    if (params?.source) qs.append('source', params.source);
    if (params?.status) qs.append('status', params.status);
    if (params?.search) qs.append('search', params.search);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/security/findings${query}`);
  },
  getAwsSecurityFinding: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/security/findings/${encodeURIComponent(id)}`),
  updateAwsSecurityFindingStatus: (id: string, status: string, reason?: string) =>
    fetchJson<any>(`/cloud-connections/aws/security/findings/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),
  getAwsPrivilegeEscalationPaths: () => fetchJson<any[]>('/cloud-connections/aws/security/privilege-escalation'),
  getAwsSecurityCapabilities: () => fetchJson<any[]>('/cloud-connections/aws/security/capabilities'),
  createAwsSecurityException: (findingId: string, reason: string, expiry: string = '30d') =>
    fetchJson<any>(`/cloud-connections/aws/security/findings/${encodeURIComponent(findingId)}/exception`, {
      method: 'POST',
      body: JSON.stringify({ reason, expiry }),
    }),
  getAwsOrganization: () => fetchJson<any>('/cloud-connections/aws/organization'),
  getAwsAccounts: (params?: {
    status?: string | undefined;
    accessStatus?: string | undefined;
    search?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.accessStatus) qs.append('accessStatus', params.accessStatus);
    if (params?.search) qs.append('search', params.search);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/accounts${query}`);
  },
  getAwsAccount: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/accounts/${encodeURIComponent(id)}`),
  getAwsOrganizationTree: () => fetchJson<any>('/cloud-connections/aws/organization/tree'),
  syncAwsAccounts: () =>
    fetchJson<any>('/cloud-connections/aws/accounts/sync', {
      method: 'POST',
    }),
  getAwsFinOpsSummary: () => fetchJson<any>('/cloud-connections/aws/finops/summary'),
  getAwsFinOpsRecords: (params?: {
    service?: string | undefined;
    accountId?: string | undefined;
    region?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.service) qs.append('service', params.service);
    if (params?.accountId) qs.append('accountId', params.accountId);
    if (params?.region) qs.append('region', params.region);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/finops/records${query}`);
  },
  getAwsFinOpsBudgets: () => fetchJson<any[]>('/cloud-connections/aws/finops/budgets'),
  getAwsFinOpsForecast: () => fetchJson<any>('/cloud-connections/aws/finops/forecast'),
  getAwsFinOpsOptimizations: () => fetchJson<any[]>('/cloud-connections/aws/finops/optimizations'),
  simulateAwsFinOpsWhatIf: (params: {
    ec2ScaleMultiplier?: number;
    s3GrowthMultiplier?: number;
    downsizeInstancesCount?: number;
  }) =>
    fetchJson<any>('/cloud-connections/aws/finops/what-if', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  getAwsObservabilitySummary: () => fetchJson<any>('/cloud-connections/aws/observability/summary'),
  getAwsObservabilityMetrics: (params?: {
    resourceId?: string | undefined;
    namespace?: string | undefined;
    metricName?: string | undefined;
    accountId?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.resourceId) qs.append('resourceId', params.resourceId);
    if (params?.namespace) qs.append('namespace', params.namespace);
    if (params?.metricName) qs.append('metricName', params.metricName);
    if (params?.accountId) qs.append('accountId', params.accountId);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/observability/metrics${query}`);
  },
  getAwsResourceHealth: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/observability/resources/${encodeURIComponent(id)}/health`),
  getAwsObservabilityAlarms: () => fetchJson<any[]>('/cloud-connections/aws/observability/alarms'),
  getAwsTopologyGraph: (params?: {
    service?: string | undefined;
    accountId?: string | undefined;
    relationshipType?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.service) qs.append('service', params.service);
    if (params?.accountId) qs.append('accountId', params.accountId);
    if (params?.relationshipType) qs.append('relationshipType', params.relationshipType);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any>(`/cloud-connections/aws/topology${query}`);
  },
  getAwsRelationships: (params?: {
    relationshipType?: string | undefined;
    confidence?: string | undefined;
    evidenceCategory?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.relationshipType) qs.append('relationshipType', params.relationshipType);
    if (params?.confidence) qs.append('confidence', params.confidence);
    if (params?.evidenceCategory) qs.append('evidenceCategory', params.evidenceCategory);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/relationships${query}`);
  },
  getAwsResourceDependencies: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/resources/${encodeURIComponent(id)}/dependencies`),
  getAwsBlastRadius: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/resources/${encodeURIComponent(id)}/blast-radius`),
  getAwsIncidents: (params?: {
    severity?: string | undefined;
    status?: string | undefined;
    classification?: string | undefined;
    accountId?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.severity) qs.append('severity', params.severity);
    if (params?.status) qs.append('status', params.status);
    if (params?.classification) qs.append('classification', params.classification);
    if (params?.accountId) qs.append('accountId', params.accountId);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/incidents${query}`);
  },
  getAwsIncidentById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/incidents/${encodeURIComponent(id)}`),
  getAwsIncidentImpactGraph: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/incidents/${encodeURIComponent(id)}/impact-graph`),
  correlateAwsIncidentChange: (id: string, changeId: string) =>
    fetchJson<any>(`/cloud-connections/aws/incidents/${encodeURIComponent(id)}/correlate`, {
      method: 'POST',
      body: JSON.stringify({ changeId }),
    }),
  getAwsPredictiveSummary: () => fetchJson<any>('/cloud-connections/aws/predictions/summary'),
  getAwsEarlyWarnings: () => fetchJson<any>('/cloud-connections/aws/predictions/early-warnings'),
  getAwsPredictions: (params?: {
    predictionType?: string | undefined;
    status?: string | undefined;
    accountId?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.predictionType) qs.append('predictionType', params.predictionType);
    if (params?.status) qs.append('status', params.status);
    if (params?.accountId) qs.append('accountId', params.accountId);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/predictions${query}`);
  },
  getAwsPredictionById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/predictions/${encodeURIComponent(id)}`),
  simulateAwsPredictiveWhatIf: (params: {
    trafficGrowthMultiplier?: number;
    storageGrowthMultiplier?: number;
    instanceScalingFactor?: number;
  }) =>
    fetchJson<any>('/cloud-connections/aws/predictions/what-if', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  getAwsGovernanceSummary: () => fetchJson<any>('/cloud-connections/aws/governance/summary'),
  getAwsGovernancePolicies: (params?: {
    category?: string | undefined;
    status?: string | undefined;
    severity?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.append('category', params.category);
    if (params?.status) qs.append('status', params.status);
    if (params?.severity) qs.append('severity', params.severity);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/governance/policies${query}`);
  },
  getAwsGovernancePolicyById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance/policies/${encodeURIComponent(id)}`),
  getAwsGovernanceEvaluations: (params?: {
    result?: string | undefined;
    policyId?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.result) qs.append('result', params.result);
    if (params?.policyId) qs.append('policyId', params.policyId);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/governance/evaluations${query}`);
  },
  getAwsGovernanceFindings: (params?: {
    status?: string | undefined;
    severity?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.severity) qs.append('severity', params.severity);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/governance/findings${query}`);
  },
  getAwsGovernanceExemptions: () => fetchJson<any[]>('/cloud-connections/aws/governance/exemptions'),
  testAwsGovernancePolicy: (policyDef: { resourceType: string; condition: string }) =>
    fetchJson<any>('/cloud-connections/aws/governance/test-policy', {
      method: 'POST',
      body: JSON.stringify(policyDef),
    }),
  createAwsGovernanceExemption: (exemption: {
    policyId: string;
    resourceId: string;
    reason: string;
    durationDays?: number;
  }) =>
    fetchJson<any>('/cloud-connections/aws/governance/exemptions', {
      method: 'POST',
      body: JSON.stringify(exemption),
    }),
  updateAwsGovernanceFindingStatus: (id: string, status: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance/findings/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAwsDriftSummary: () => fetchJson<any>('/cloud-connections/aws/drift/summary'),
  getAwsDrifts: (params?: {
    driftType?: string | undefined;
    status?: string | undefined;
    severity?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.driftType) qs.append('driftType', params.driftType);
    if (params?.status) qs.append('status', params.status);
    if (params?.severity) qs.append('severity', params.severity);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/drift/items${query}`);
  },
  getAwsDriftById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/drift/items/${encodeURIComponent(id)}`),
  getAwsDriftBaselines: () => fetchJson<any[]>('/cloud-connections/aws/drift/baselines'),
  getAwsDriftBaselineById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/drift/baselines/${encodeURIComponent(id)}`),
  reconcileAwsResourceDrift: (resourceId?: string) =>
    fetchJson<any>('/cloud-connections/aws/drift/reconcile', {
      method: 'POST',
      body: JSON.stringify({ resourceId }),
    }),
  updateAwsDriftStatus: (id: string, status: string) =>
    fetchJson<any>(`/cloud-connections/aws/drift/items/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  createAwsDriftBaseline: (baseline: {
    name: string;
    resourceType: string;
    expectedConfiguration: Record<string, any>;
    source?: string;
  }) =>
    fetchJson<any>('/cloud-connections/aws/drift/baselines', {
      method: 'POST',
      body: JSON.stringify(baseline),
    }),
  approveAwsDriftBaseline: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/drift/baselines/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    }),
  getAwsRemediationSummary: () => fetchJson<any>('/cloud-connections/aws/governance-orchestration/summary'),
  getAwsRemediationBaselines: (params?: { status?: string | undefined }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/governance-orchestration/baselines${query}`);
  },
  getAwsRemediationBaselineById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance-orchestration/baselines/${encodeURIComponent(id)}`),
  createAwsRemediationBaseline: (baseline: {
    name: string;
    description: string;
    accountId?: string;
    region?: string;
    controls: any[];
  }) =>
    fetchJson<any>('/cloud-connections/aws/governance-orchestration/baselines', {
      method: 'POST',
      body: JSON.stringify(baseline),
    }),
  approveAwsRemediationBaseline: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance-orchestration/baselines/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    }),
  getAwsRemediationPlans: (params?: {
    status?: string | undefined;
    riskLevel?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.riskLevel) qs.append('riskLevel', params.riskLevel);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/governance-orchestration/plans${query}`);
  },
  getAwsRemediationPlanById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance-orchestration/plans/${encodeURIComponent(id)}`),
  approveAwsRemediationPlan: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance-orchestration/plans/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    }),
  executeAwsRemediationPlan: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance-orchestration/plans/${encodeURIComponent(id)}/execute`, {
      method: 'POST',
    }),
  getAwsAutoHealingSummary: () => fetchJson<any>('/cloud-connections/aws/auto-healing/summary'),
  getAwsAutoHealingPolicies: (params?: { status?: string | undefined; level?: string | undefined }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.level) qs.append('level', params.level);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/auto-healing/policies${query}`);
  },
  getAwsAutoHealingPolicyById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/auto-healing/policies/${encodeURIComponent(id)}`),
  createAwsAutoHealingPolicy: (policy: {
    name: string;
    description: string;
    automationLevel: string;
    resourceType: string;
    allowedActions: string[];
  }) =>
    fetchJson<any>('/cloud-connections/aws/auto-healing/policies', {
      method: 'POST',
      body: JSON.stringify(policy),
    }),
  pauseAwsAutoHealingPolicy: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/auto-healing/policies/${encodeURIComponent(id)}/pause`, {
      method: 'POST',
    }),
  resumeAwsAutoHealingPolicy: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/auto-healing/policies/${encodeURIComponent(id)}/resume`, {
      method: 'POST',
    }),
  getAwsAutoHealingActionAllowlist: () => fetchJson<any[]>('/cloud-connections/aws/auto-healing/actions-allowlist'),
  getAwsAutoHealingQueue: () => fetchJson<any[]>('/cloud-connections/aws/auto-healing/queue'),
  triggerAwsAutoHealing: (params: {
    resourceId?: string;
    resourceName?: string;
    resourceType?: string;
    actionId?: string;
  }) =>
    fetchJson<any>('/cloud-connections/aws/auto-healing/trigger', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  getAwsSimulatorSummary: () => fetchJson<any>('/cloud-connections/aws/simulator/summary'),
  getAwsSimulations: (params?: { riskLevel?: string | undefined }) => {
    const qs = new URLSearchParams();
    if (params?.riskLevel) qs.append('riskLevel', params.riskLevel);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/simulator/simulations${query}`);
  },
  getAwsSimulationById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/simulator/simulations/${encodeURIComponent(id)}`),
  runAwsSimulation: (simulation: {
    scenarioName: string;
    description: string;
    inputs: any[];
  }) =>
    fetchJson<any>('/cloud-connections/aws/simulator/run', {
      method: 'POST',
      body: JSON.stringify(simulation),
    }),
  deleteAwsSimulation: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/simulator/simulations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  getAwsGovernanceIntelligenceSummary: () =>
    fetchJson<any>('/cloud-connections/aws/governance-intelligence/summary'),
  getAwsGovernanceControlHealth: () =>
    fetchJson<any[]>('/cloud-connections/aws/governance-intelligence/controls'),
  getAwsGovernanceRisks: (params?: { priority?: string | undefined }) => {
    const qs = new URLSearchParams();
    if (params?.priority) qs.append('priority', params.priority);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/governance-intelligence/risks${query}`);
  },
  getAwsGovernancePolicyEffectiveness: () =>
    fetchJson<any[]>('/cloud-connections/aws/governance-intelligence/policy-effectiveness'),
  getAwsGovernanceEvidenceCoverage: () =>
    fetchJson<any[]>('/cloud-connections/aws/governance-intelligence/coverage'),
  getAwsGovernanceAutomationOpportunities: () =>
    fetchJson<any[]>('/cloud-connections/aws/governance-intelligence/automation-opportunities'),
  getAwsGovernanceRecommendations: (params?: { status?: string | undefined }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/governance-intelligence/recommendations${query}`);
  },
  updateAwsGovernanceRecommendationStatus: (id: string, status: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance-intelligence/recommendations/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  getAwsGovernanceDecisionSummary: () =>
    fetchJson<any>('/cloud-connections/aws/governance-decisions/summary'),
  getAwsGovernanceDecisions: (params?: { priority?: string | undefined; status?: string | undefined; type?: string | undefined }) => {
    const qs = new URLSearchParams();
    if (params?.priority) qs.append('priority', params.priority);
    if (params?.status) qs.append('status', params.status);
    if (params?.type) qs.append('type', params.type);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/governance-decisions${query}`);
  },
  getAwsGovernanceDecisionById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance-decisions/${encodeURIComponent(id)}`),
  transitionAwsGovernanceDecisionStatus: (id: string, status: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance-decisions/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  createRemediationPlanFromGovernanceDecision: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/governance-decisions/${encodeURIComponent(id)}/create-plan`, {
      method: 'POST',
    }),
  getAwsKnowledgeGraphSummary: () =>
    fetchJson<any>('/cloud-connections/aws/knowledge-graph/summary'),
  getAwsKnowledgeGraphNodes: (params?: {
    type?: string | undefined;
    service?: string | undefined;
    criticality?: string | undefined;
    minRiskScore?: number | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.append('type', params.type);
    if (params?.service) qs.append('service', params.service);
    if (params?.criticality) qs.append('criticality', params.criticality);
    if (params?.minRiskScore !== undefined) qs.append('minRiskScore', params.minRiskScore.toString());
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/knowledge-graph/nodes${query}`);
  },
  getAwsKnowledgeGraphEdges: (params?: {
    relationshipType?: string | undefined;
    evidenceStrength?: string | undefined;
    confidence?: string | undefined;
  }) => {
    const qs = new URLSearchParams();
    if (params?.relationshipType) qs.append('relationshipType', params.relationshipType);
    if (params?.evidenceStrength) qs.append('evidenceStrength', params.evidenceStrength);
    if (params?.confidence) qs.append('confidence', params.confidence);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/knowledge-graph/edges${query}`);
  },
  getAwsKnowledgeGraphPath: (sourceNodeId: string, targetNodeId: string) =>
    fetchJson<any>(`/cloud-connections/aws/knowledge-graph/path?sourceNodeId=${encodeURIComponent(sourceNodeId)}&targetNodeId=${encodeURIComponent(targetNodeId)}`),
  getAwsResourceRiskProfile: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/knowledge-graph/resource-profile/${encodeURIComponent(id)}`),
  getAwsKnowledgeGraphDiff: (sinceTimestamp?: string) => {
    const qs = sinceTimestamp ? `?sinceTimestamp=${encodeURIComponent(sinceTimestamp)}` : '';
    return fetchJson<any>(`/cloud-connections/aws/knowledge-graph/diff${qs}`);
  },
  executeAwsQuery: (payload: {
    queryAst: any;
    queryType?: string;
    scope?: string;
    rawPrompt?: string;
  }) =>
    fetchJson<any>('/cloud-connections/aws/query/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  explainAwsQuery: (queryAst: any) =>
    fetchJson<any>('/cloud-connections/aws/query/explain', {
      method: 'POST',
      body: JSON.stringify({ queryAst }),
    }),
  queryAwsNaturalLanguage: (prompt: string) =>
    fetchJson<any>('/cloud-connections/aws/query/natural-language', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
  getAwsInvestigations: (params?: { status?: string | undefined }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJson<any[]>(`/cloud-connections/aws/investigations${query}`);
  },
  getAwsInvestigationById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/investigations/${encodeURIComponent(id)}`),
  createAwsInvestigation: (payload: {
    title: string;
    description: string;
    severity?: string;
    scope?: string;
    rootCauseHypothesis?: string;
    evidenceNodeIds?: string[];
  }) =>
    fetchJson<any>('/cloud-connections/aws/investigations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAwsInvestigationStatus: (id: string, status: string, rootCauseHypothesis?: string) =>
    fetchJson<any>(`/cloud-connections/aws/investigations/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rootCauseHypothesis }),
    }),
  addAwsInvestigationTimelineEvent: (id: string, event: {
    type: string;
    title: string;
    description: string;
    source?: string;
    entityId?: string;
  }) =>
    fetchJson<any>(`/cloud-connections/aws/investigations/${encodeURIComponent(id)}/timeline`, {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  getAwsInvestigationReport: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/investigations/${encodeURIComponent(id)}/report`),
  convertAwsInvestigationToDecision: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/investigations/${encodeURIComponent(id)}/create-decision`, {
      method: 'POST',
    }),
  getAwsQueryHistory: () =>
    fetchJson<any[]>('/cloud-connections/aws/query/history'),
  getAwsQuerySuggestions: () =>
    fetchJson<any[]>('/cloud-connections/aws/query/suggestions'),

  // Phase 60: Real AWS Continuous Cloud Operations Control Plane APIs
  getAwsOperationsSituation: () =>
    fetchJson<any>('/cloud-connections/aws/operations/situation'),
  getAwsOperations: (params?: { priority?: string; state?: string; type?: string }) => {
    const q = new URLSearchParams();
    if (params?.priority) q.append('priority', params.priority);
    if (params?.state) q.append('state', params.state);
    if (params?.type) q.append('type', params.type);
    const qs = q.toString();
    return fetchJson<any[]>(`/cloud-connections/aws/operations${qs ? `?${qs}` : ''}`);
  },
  getAwsOperationById: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/operations/${encodeURIComponent(id)}`),
  transitionAwsOperationState: (id: string, targetState: string, notes?: string) =>
    fetchJson<any>(`/cloud-connections/aws/operations/${encodeURIComponent(id)}/state`, {
      method: 'PATCH',
      body: JSON.stringify({ targetState, notes }),
    }),
  getAwsOperationPreflight: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/operations/${encodeURIComponent(id)}/preflight`),
  executeAwsOperation: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/operations/${encodeURIComponent(id)}/execute`, {
      method: 'POST',
    }),
  rollbackAwsOperation: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/operations/${encodeURIComponent(id)}/rollback`, {
      method: 'POST',
    }),
  getAwsOperationalTimeline: (hours?: number) =>
    fetchJson<any[]>(`/cloud-connections/aws/operations/timeline${hours ? `?hours=${hours}` : ''}`),
  getAwsOperationalStoryline: (id: string) =>
    fetchJson<any>(`/cloud-connections/aws/operations/${encodeURIComponent(id)}/storyline`),
  getAwsSafeActionCatalog: () =>
    fetchJson<any[]>('/cloud-connections/aws/operations/safe-actions'),
  askAwsOperationsCopilot: (prompt: string) =>
    fetchJson<any>('/cloud-connections/aws/operations/copilot', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Phase 61: Real Multi-Cloud Connectivity (AWS, Azure, GCP) APIs
  getCloudConnections: () =>
    fetchJson<CloudConnection[]>('/cloud-connections'),
  getAzureSetupInfo: () =>
    fetchJson<{ steps: AzureSetupGuideStep[] }>('/cloud-connections/azure/setup-info'),
  connectAzure: (payload: { displayName: string; tenantId: string; subscriptionId: string; clientId?: string }) =>
    fetchJson<CloudConnection>('/cloud-connections/azure/connect', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getGcpSetupInfo: () =>
    fetchJson<{ steps: GcpSetupGuideStep[] }>('/cloud-connections/gcp/setup-info'),
  connectGcp: (payload: { displayName: string; projectId: string; clientEmail?: string; projectNumber?: string }) =>
    fetchJson<CloudConnection>('/cloud-connections/gcp/connect', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  validateCloudConnection: (id: string) =>
    fetchJson<{ connection: CloudConnection; validation: any }>(`/cloud-connections/${encodeURIComponent(id)}/validate`, {
      method: 'POST',
    }),
  syncCloudConnection: (id: string) =>
    fetchJson<any>(`/cloud-connections/${encodeURIComponent(id)}/sync`, {
      method: 'POST',
    }),
  disconnectCloudConnection: (id: string) =>
    fetchJson<any>(`/cloud-connections/${encodeURIComponent(id)}/disconnect`, {
      method: 'POST',
    }),
  getMultiCloudResources: (provider?: string) =>
    fetchJson<CloudResource[]>(`/cloud-connections/multicloud/resources${provider ? `?provider=${encodeURIComponent(provider)}` : ''}`),
  getMultiCloudScorecard: () =>
    fetchJson<MultiCloudScorecard>('/cloud-connections/multicloud/scorecard'),
  getMultiCloudComparison: () =>
    fetchJson<MultiCloudComparison[]>('/cloud-connections/multicloud/comparison'),
  searchMultiCloud: (q: string) =>
    fetchJson<{ resources: CloudResource[]; query: string; totalMatches: number }>(`/cloud-connections/multicloud/search?q=${encodeURIComponent(q)}`),
};

export const kubernetesOperationsApi = {
  getKubernetesOverview: () =>
    fetchJson<KubernetesOverviewSummary>('/kubernetes/overview'),
  getKubernetesConnections: () =>
    fetchJson<any[]>('/kubernetes/clusters'),
  connectKubernetesCluster: (data: any) =>
    fetchJson<any>('/kubernetes/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getKubernetesSafeActions: () =>
    fetchJson<KubernetesSafeAction[]>('/kubernetes/safe-actions'),
  getKubernetesClusterDetail: (clusterId: string) =>
    fetchJson<any>(`/kubernetes/clusters/${encodeURIComponent(clusterId)}`),
  getKubernetesClusterGraph: (clusterId: string) =>
    fetchJson<{ nodes: any[]; edges: any[] }>(`/kubernetes/clusters/${encodeURIComponent(clusterId)}/graph`),
  simulateKubernetesOperation: (clusterId: string, actionId: string, target: string, parameters?: any) =>
    fetchJson<KubernetesSimulationResult>(`/kubernetes/clusters/${encodeURIComponent(clusterId)}/operations/simulate`, {
      method: 'POST',
      body: JSON.stringify({ actionId, target, parameters }),
    }),
  executeKubernetesOperation: (clusterId: string, operationId: string) =>
    fetchJson<KubernetesOperation>(`/kubernetes/clusters/${encodeURIComponent(clusterId)}/operations/execute`, {
      method: 'POST',
      body: JSON.stringify({ operationId }),
    }),
  investigateKubernetes: (prompt: string) =>
    fetchJson<any>('/kubernetes/investigate', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};

export const sreControlApi = {
  getSreOverview: (workspaceId: string = 'ws-production') =>
    fetchJson<SrePlatformSummary>('/sre/overview', {
      headers: { 'x-workspace-id': workspaceId },
    }),

  getSreServices: (params?: { tier?: string; health?: string }) => {
    const query = new URLSearchParams();
    if (params?.tier) query.set('tier', params.tier);
    if (params?.health) query.set('health', params.health);
    const qs = query.toString();
    return fetchJson<CloudService[]>(`/sre/services${qs ? `?${qs}` : ''}`);
  },

  getSreServiceDetail: (serviceId: string) =>
    fetchJson<ServiceReliabilityDetail>(`/sre/services/${serviceId}`),

  getSreSlis: (serviceId?: string) =>
    fetchJson<ServiceLevelIndicator[]>(`/sre/slis${serviceId ? `?serviceId=${serviceId}` : ''}`),

  getSreSlos: (params?: { serviceId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.serviceId) query.set('serviceId', params.serviceId);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return fetchJson<ServiceLevelObjective[]>(`/sre/slos${qs ? `?${qs}` : ''}`);
  },

  getSreSloDetail: (sloId: string) =>
    fetchJson<ServiceLevelObjective>(`/sre/slos/${sloId}`),

  getSreErrorBudgets: (serviceId?: string) =>
    fetchJson<ErrorBudget[]>(`/sre/error-budgets${serviceId ? `?serviceId=${serviceId}` : ''}`),

  getSreDependencies: (serviceId?: string) =>
    fetchJson<DependencyRisk[]>(`/sre/dependencies${serviceId ? `?serviceId=${serviceId}` : ''}`),

  getSreCascadingRisks: (serviceId?: string) =>
    fetchJson<CascadingFailurePath[]>(`/sre/cascading-risks${serviceId ? `?serviceId=${serviceId}` : ''}`),

  getSreSpofs: () =>
    fetchJson<SreSinglePointOfFailure[]>('/sre/spofs'),

  getSreFailureDomains: () =>
    fetchJson<FailureDomainAnalysis>('/sre/failure-domains'),

  getSreChangeCorrelations: (serviceId?: string) =>
    fetchJson<ChangeReliabilityCorrelation[]>(`/sre/changes/correlations${serviceId ? `?serviceId=${serviceId}` : ''}`),

  getSreCapacity: (serviceId?: string) =>
    fetchJson<CapacityIntelligence[]>(`/sre/capacity${serviceId ? `?serviceId=${serviceId}` : ''}`),

  evaluateReleaseRisk: (payload: { serviceId: string; proposedVersion?: string; changeType?: string }) =>
    fetchJson<ReleaseRiskAssessment>('/sre/release-guard/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyRemediationRecovery: (payload: { serviceId: string; actionId?: string; incidentId?: string }) =>
    fetchJson<RecoveryVerification>('/sre/remediation/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  investigateSre: (prompt: string, serviceId?: string) =>
    fetchJson<SreInvestigationResult>('/sre/investigate', {
      method: 'POST',
      body: JSON.stringify({ prompt, serviceId }),
    }),
};

export const enterpriseWorkflowApi = {
  getWorkflowSummary: () =>
    fetchJson<EnterpriseWorkflowSummary>('/workflow/overview'),

  getWorkflowTeams: () =>
    fetchJson<CloudTeam[]>('/workflow/teams'),

  getWorkflowWorkItems: (filters?: { section?: string; priority?: string; status?: string; type?: string; teamId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.section) params.set('section', filters.section);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.teamId) params.set('teamId', filters.teamId);
    const qs = params.toString();
    return fetchJson<CloudWorkItem[]>(`/workflow/work-items${qs ? `?${qs}` : ''}`);
  },

  getWorkflowWorkItemById: (id: string) =>
    fetchJson<CloudWorkItem>(`/workflow/work-items/${id}`),

  assignWorkItem: (id: string, payload: { assigneeUserId?: string; assigneeUserName?: string; assigneeTeamId?: string; assigneeTeamName?: string }) =>
    fetchJson<CloudWorkItem>(`/workflow/work-items/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateWorkItemStatus: (id: string, status: string, blockedReason?: string) =>
    fetchJson<CloudWorkItem>(`/workflow/work-items/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, blockedReason }),
    }),

  escalateWorkItem: (id: string, reason: string) =>
    fetchJson<CloudWorkItem>(`/workflow/work-items/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  handoffWorkItem: (id: string, payload: { targetTeamId: string; targetTeamName: string; targetUserId?: string; targetUserName?: string; handoffNotes: string }) =>
    fetchJson<CloudWorkItem>(`/workflow/work-items/${id}/handoff`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getWorkItemComments: (id: string) =>
    fetchJson<WorkItemComment[]>(`/workflow/work-items/${id}/comments`),

  addWorkItemComment: (id: string, content: string) =>
    fetchJson<WorkItemComment>(`/workflow/work-items/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getWorkItemTimeline: (id: string) =>
    fetchJson<ActivityTimelineEvent[]>(`/workflow/work-items/${id}/timeline`),

  getApprovalRequests: () =>
    fetchJson<EnterpriseApprovalRequest[]>('/workflow/approvals'),

  getApprovalRequestById: (id: string) =>
    fetchJson<EnterpriseApprovalRequest>(`/workflow/approvals/${id}`),

  decideApproval: (id: string, payload: { decision: 'APPROVED' | 'REJECTED'; comment: string; approverUserId?: string; approverName?: string; approverRole?: string }) =>
    fetchJson<{ approval: EnterpriseApprovalRequest; decisionMade: any }>(`/workflow/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getChangeRequests: () =>
    fetchJson<CloudChangeRequest[]>('/workflow/changes'),

  getChangeRequestById: (id: string) =>
    fetchJson<CloudChangeRequest>(`/workflow/changes/${id}`),

  createChangeRequest: (payload: any) =>
    fetchJson<CloudChangeRequest>('/workflow/changes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMaintenanceWindows: () =>
    fetchJson<MaintenanceWindow[]>('/workflow/maintenance-windows'),

  getChangeFreezes: () =>
    fetchJson<ChangeFreeze[]>('/workflow/change-freezes'),

  getNotifications: () =>
    fetchJson<EnterpriseNotification[]>('/workflow/notifications'),

  markNotificationRead: (id: string) =>
    fetchJson<{ ok: boolean; success: boolean }>(`/workflow/notifications/${id}/read`, {
      method: 'POST',
    }),

  getIncidentBriefing: (incidentId: string) =>
    fetchJson<IncidentBriefing>(`/workflow/incident-briefings/${incidentId}`),

  getActionItems: () =>
    fetchJson<ActionItem[]>('/workflow/action-items'),

  investigateWorkflow: (prompt: string) =>
    fetchJson<AiWorkflowAssistantResult>('/workflow/ai-copilot', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};

export const realFinopsApi = {
  getFinOpsScorecard: (currency?: string) =>
    fetchJson<MultiCloudFinOpsScorecard>(`/finops/scorecard${currency ? `?currency=${currency}` : ''}`),

  getFinOpsRecords: (filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters);
    const qs = params.toString();
    return fetchJson<CloudCostRecord[]>(`/finops/records${qs ? `?${qs}` : ''}`);
  },

  getFinOpsAllocation: (currency?: string) =>
    fetchJson<any>(`/finops/allocation${currency ? `?currency=${currency}` : ''}`),

  getFinOpsUnitEconomics: () =>
    fetchJson<RealUnitEconomicsMetric[]>('/finops/unit-economics'),

  getFinOpsKubernetes: (clusterId?: string) =>
    fetchJson<KubernetesFinOpsAllocation[]>(`/finops/kubernetes${clusterId ? `?clusterId=${clusterId}` : ''}`),

  getFinOpsAnomalies: () =>
    fetchJson<RealCostAnomaly[]>('/finops/anomalies'),

  getFinOpsForecasts: () =>
    fetchJson<MultiCloudCostForecast[]>('/finops/forecasts'),

  getFinOpsBudgets: () =>
    fetchJson<MultiCloudBudget[]>('/finops/budgets'),

  getFinOpsOpportunities: () =>
    fetchJson<RealSavingsOpportunity[]>('/finops/opportunities'),

  verifyFinOpsSavings: (id: string, payload: { observedSavingsMonthly: number; notes?: string }) =>
    fetchJson<RealSavingsOpportunity>(`/finops/opportunities/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  simulateFinOpsTradeoff: (payload: {
    actionTitle: string;
    resourceType?: string;
    costReductionMonthly: number;
    capacityDeltaPercent?: number;
    redundancyReduced?: boolean;
    logsReducedPercent?: number;
  }) =>
    fetchJson<CostTradeoffEvaluation>('/finops/tradeoffs/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getFinOpsCostCenters: () =>
    fetchJson<CostCenter[]>('/finops/cost-centers'),

  createFinOpsCostCenter: (payload: { name: string; code: string; owner: string; ownerEmail?: string; budgetLimit?: number; currency?: string }) =>
    fetchJson<CostCenter>('/finops/cost-centers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getFinOpsDataQuality: () =>
    fetchJson<any>('/finops/data-quality'),

  investigateFinOps: (prompt: string) =>
    fetchJson<AiFinOpsAnalystResult>('/finops/ai-analyst', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};

export const realSecurityApi = {
  getSecurityScorecard: () =>
    fetchJson<ZeroTrustSecurityScorecard>('/security/scorecard'),

  getRealIdentities: (filters?: {
    provider?: string;
    type?: string;
    privilegeLevel?: string;
    isStale?: boolean;
    mfaEnabled?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.provider) params.set('provider', filters.provider);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.privilegeLevel) params.set('privilegeLevel', filters.privilegeLevel);
    if (filters?.isStale !== undefined) params.set('isStale', String(filters.isStale));
    if (filters?.mfaEnabled !== undefined) params.set('mfaEnabled', String(filters.mfaEnabled));
    const qs = params.toString();
    return fetchJson<RealCloudIdentity[]>(`/security/identities${qs ? `?${qs}` : ''}`);
  },

  getRealIdentityById: (id: string) =>
    fetchJson<RealCloudIdentity>(`/security/identities/${encodeURIComponent(id)}`),

  getEffectiveAccess: (filters?: {
    identityId?: string;
    resourceId?: string;
    provider?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.identityId) params.set('identityId', filters.identityId);
    if (filters?.resourceId) params.set('resourceId', filters.resourceId);
    if (filters?.provider) params.set('provider', filters.provider);
    const qs = params.toString();
    return fetchJson<EffectiveAccessRule[]>(`/security/effective-access${qs ? `?${qs}` : ''}`);
  },

  getAccessRelationships: (filters?: {
    sourceId?: string;
    targetId?: string;
    relationshipType?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.sourceId) params.set('sourceId', filters.sourceId);
    if (filters?.targetId) params.set('targetId', filters.targetId);
    if (filters?.relationshipType) params.set('relationshipType', filters.relationshipType);
    const qs = params.toString();
    return fetchJson<CloudAccessRelationship[]>(`/security/relationships${qs ? `?${qs}` : ''}`);
  },

  getHighRiskAccessPaths: (filters?: {
    targetResourceId?: string;
    sourceIdentityId?: string;
    classification?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.targetResourceId) params.set('targetResourceId', filters.targetResourceId);
    if (filters?.sourceIdentityId) params.set('sourceIdentityId', filters.sourceIdentityId);
    if (filters?.classification) params.set('classification', filters.classification);
    const qs = params.toString();
    return fetchJson<HighRiskAccessPath[]>(`/security/paths/high-risk${qs ? `?${qs}` : ''}`);
  },

  getPublicExposureEntities: (filters?: {
    provider?: string;
    resourceType?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.provider) params.set('provider', filters.provider);
    if (filters?.resourceType) params.set('resourceType', filters.resourceType);
    const qs = params.toString();
    return fetchJson<PublicExposureEntity[]>(`/security/exposure/public${qs ? `?${qs}` : ''}`);
  },

  getControlEffectiveness: () =>
    fetchJson<ZeroTrustControlEffectiveness[]>('/security/control-effectiveness'),

  getSecurityAccessReviews: (filters?: {
    status?: string;
    identityId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.identityId) params.set('identityId', filters.identityId);
    const qs = params.toString();
    return fetchJson<SecurityAccessReview[]>(`/security/reviews${qs ? `?${qs}` : ''}`);
  },

  createSecurityAccessReview: (payload: {
    identityId: string;
    reviewerUserId: string;
    reviewerName: string;
    decision: 'CERTIFIED' | 'REVOKED' | 'MODIFIED_PRIVILEGES';
    notes?: string | undefined;
    revokedRoles?: string[] | undefined;
  }) =>
    fetchJson<SecurityAccessReview>('/security/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSecurityExceptions: (filters?: {
    status?: string | undefined;
    identityId?: string | undefined;
    riskPathId?: string | undefined;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.identityId) params.set('identityId', filters.identityId);
    if (filters?.riskPathId) params.set('riskPathId', filters.riskPathId);
    const qs = params.toString();
    return fetchJson<SecurityExceptionRecord[]>(`/security/exceptions${qs ? `?${qs}` : ''}`);
  },

  createSecurityException: (payload: {
    title: string;
    targetIdentityId?: string | undefined;
    targetResourceId?: string | undefined;
    riskPathId?: string | undefined;
    justification: string;
    compensatingControls: string[];
    riskAcceptedBy: string;
    expiresInDays?: number | undefined;
  }) =>
    fetchJson<SecurityExceptionRecord>('/security/exceptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  simulateSecurityWhatIf: (payload: {
    name: string;
    description: string;
    changeType: 'REVOKE_ROLE' | 'REMOVE_SG_RULE' | 'ENFORCE_MFA' | 'RESTRICT_ASSUME_ROLE' | 'ROTATE_KEY';
    targetIdentityId?: string | undefined;
    targetResourceId?: string | undefined;
    policyOrRuleToModify?: string | undefined;
  }) =>
    fetchJson<any>('/security/what-if/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  investigateSecurity: (prompt: string) =>
    fetchJson<AiSecurityAnalystResult>('/security/ai-analyst', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};

export const realResilienceApi = {
  getScorecard: (workspaceId?: string) =>
    fetchJson<ZeroDowntimeScorecard>(`/resilience/scorecard${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`),

  getProfiles: (workspaceId?: string) =>
    fetchJson<CloudResilienceProfile[]>(`/resilience/profiles${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`),

  getProfileByServiceId: (serviceId: string, workspaceId?: string) =>
    fetchJson<CloudResilienceProfile>(`/resilience/profiles/${encodeURIComponent(serviceId)}${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`),

  getFailureDomains: (workspaceId?: string) =>
    fetchJson<FailureDomain[]>(`/resilience/failure-domains${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`),

  getSpofs: (workspaceId?: string) =>
    fetchJson<RealSinglePointOfFailure[]>(`/resilience/spofs${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`),

  getBackups: (workspaceId?: string) =>
    fetchJson<RealBackupEntity[]>(`/resilience/backups${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`),

  getRecoveryPlans: (workspaceId?: string) =>
    fetchJson<RealRecoveryPlan[]>(`/resilience/recovery-plans${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`),

  createRecoveryPlan: (plan: Partial<RealRecoveryPlan>) =>
    fetchJson<RealRecoveryPlan>('/resilience/recovery-plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    }),

  getDrills: (workspaceId?: string) =>
    fetchJson<RecoveryDrillRecord[]>(`/resilience/drills${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`),

  recordDrill: (drill: Partial<RecoveryDrillRecord>) =>
    fetchJson<RecoveryDrillRecord>('/resilience/drills', {
      method: 'POST',
      body: JSON.stringify(drill),
    }),

  getBusinessContinuity: (workspaceId?: string) =>
    fetchJson<BusinessContinuityEntity[]>(`/resilience/business-continuity${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`),

  simulateResilienceWhatIf: (payload: {
    scenario: string;
    scope?: string;
    failureTrigger: string;
    affectedFailureDomainIds: string[];
    affectedServiceIds: string[];
    parameters?: Record<string, any>;
  }) =>
    fetchJson<ResilienceWhatIfSimulation>('/resilience/what-if/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  investigateResilience: (prompt: string, workspaceId?: string) =>
    fetchJson<AiResilienceAnalystResult>('/resilience/ai-analyst', {
      method: 'POST',
      body: JSON.stringify({ prompt, workspaceId }),
    }),
};

// ─── Phase 68: Global Cloud Command Center APIs ──────────────────────────────
export const globalCommandCenterApi = {
  getOverview: (workspaceId?: string) =>
    fetchJson<GlobalCommandCenterOverview>(
      `/global-command-center/overview${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`
    ),

  getSituations: (filters?: {
    severity?: string;
    priority?: string;
    category?: string;
    status?: string;
    provider?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.provider) params.append('provider', filters.provider);
    const qs = params.toString();
    return fetchJson<EnterpriseCloudSituation[]>(`/global-command-center/situations${qs ? `?${qs}` : ''}`);
  },

  getSituationById: (id: string) =>
    fetchJson<EnterpriseCloudSituation>(`/global-command-center/situations/${encodeURIComponent(id)}`),

  getRiskHeatmap: () => fetchJson<EnterpriseRiskHeatmap>('/global-command-center/risk-heatmap'),

  getGlobalHealth: () => fetchJson<GlobalCloudHealth>('/global-command-center/health'),

  getCoverage: () => fetchJson<CloudCoverageSummary>('/global-command-center/coverage'),

  getFreshness: () => fetchJson<GlobalDataFreshnessSummary>('/global-command-center/freshness'),

  getDecisions: (filters?: { domain?: string; status?: string; priority?: string }) => {
    const params = new URLSearchParams();
    if (filters?.domain) params.append('domain', filters.domain);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    const qs = params.toString();
    return fetchJson<ExecutiveDecision[]>(`/global-command-center/decisions${qs ? `?${qs}` : ''}`);
  },

  executeDecisionAction: (
    id: string,
    action: 'APPROVE' | 'REJECT' | 'EXECUTE' | 'DISMISS',
    actor?: string,
    reason?: string
  ) =>
    fetchJson<{ success: boolean; decision: ExecutiveDecision; workflowItemId?: string }>(
      `/global-command-center/decisions/${encodeURIComponent(id)}/action`,
      {
        method: 'POST',
        body: JSON.stringify({ action, actor, reason }),
      }
    ),

  searchGlobal: (query: string) =>
    fetchJson<GlobalSearchResult>(`/global-command-center/search?q=${encodeURIComponent(query)}`),

  getReports: () => fetchJson<EnterpriseReport[]>('/global-command-center/reports'),

  generateReport: (type: string) =>
    fetchJson<EnterpriseReport>('/global-command-center/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),

  queryAiAnalyst: (prompt: string) =>
    fetchJson<AiEnterpriseAnalystResult>('/global-command-center/ai-analyst', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};

export const platformApi = {
  getPlatformOverview: () => fetchJson<PlatformOverviewSummary>('/platform/overview'),
  getPlatformHealth: () => fetchJson<PlatformHealthCheckResult>('/platform/health'),
  getPlatformDependencies: () => fetchJson<PlatformDependencyHealth>('/platform/health/dependencies'),
  getPlatformMetrics: () => fetchJson<PlatformMetrics>('/platform/metrics'),
  getPlatformSlos: () => fetchJson<PlatformSlo[]>('/platform/slos'),
  getPlatformWorkers: () => fetchJson<PlatformSyncWorkerStatus[]>('/platform/workers'),
  getPlatformDlq: () => fetchJson<any[]>('/platform/workers/dlq'),
  retryPlatformDlqJob: (id: string) =>
    fetchJson<any>(`/platform/workers/dlq/${id}/retry`, {
      method: 'POST',
    }),
  getPlatformRateLimits: () => fetchJson<PlatformRateLimitStatus>('/platform/rate-limits'),
  getPlatformIncidents: () => fetchJson<PlatformIncident[]>('/platform/incidents'),
  getPlatformMaintenance: () => fetchJson<PlatformMaintenanceWindow | null>('/platform/maintenance'),
  schedulePlatformMaintenance: (body: any) =>
    fetchJson<PlatformMaintenanceWindow>('/platform/maintenance', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cancelPlatformMaintenance: () =>
    fetchJson<any>('/platform/maintenance', {
      method: 'DELETE',
    }),
  getPlatformCosts: () =>
    fetchJson<{ totalMonthToDateUsd: number; breakdown: PlatformCostRecord[] }>('/platform/costs'),
};

Object.assign(api, cloudConnectionsApi);
Object.assign(api, kubernetesOperationsApi);
Object.assign(api, sreControlApi);
Object.assign(api, enterpriseWorkflowApi);
Object.assign(api, realFinopsApi);
Object.assign(api, realSecurityApi);
Object.assign(api, realResilienceApi);
Object.assign(api, globalCommandCenterApi);
Object.assign(api, platformApi);



































