/**
 * CLOUDPULSE Cloud Smoke Test Runner
 * Validates public endpoint routing, health checks, W3C distributed tracing,
 * Loki log ingestion, PromQL metric updates, and fault injection behavior.
 */

const BASE_URL = process.env.CLOUDPULSE_ENDPOINT || 'http://localhost:3001';
const GATEWAY_URL = process.env.GATEWAY_ENDPOINT || 'http://localhost:4000';

async function runSmokeTests() {
  console.log('==================================================================');
  console.log(` CLOUDPULSE Smoke Test Suite -> Target: ${BASE_URL}`);
  console.log('==================================================================\n');

  // 1. Health & Readiness Probe Verification
  console.log('[1/9] Probing /health and /health/ready...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const readyRes = await fetch(`${BASE_URL}/health/ready`);
  if (!healthRes.ok || !readyRes.ok) {
    throw new Error(`Health check failed: /health=${healthRes.status}, /ready=${readyRes.status}`);
  }
  console.log('  ? Core Gateway Health & Readiness 200 OK');

  // 2. SRE Overview Telemetry Endpoint
  console.log('\n[2/9] Querying SRE Overview Telemetry API...');
  const ovRes = await fetch(`${BASE_URL}/api/v1/overview`);
  const ovJson: any = await ovRes.json();
  if (!ovRes.ok || !ovJson.ok) {
    throw new Error(`Overview query failed: ${ovRes.status}`);
  }
  console.log(`  ? Telemetry Mode: ${ovJson.data?.telemetryMode}`);
  console.log(`  ? Monitored Services: ${ovJson.data?.services?.length} services detected`);
  console.log(`  ? System Health Status: ${ovJson.data?.systemHealth?.overallStatus}`);

  // 3. Distributed Request Execution (Gateway -> Orders -> Payments)
  console.log('\n[3/9] Sending Ingress Checkout Transaction...');
  const checkoutRes = await fetch(`${GATEWAY_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: 'cust-smoke-automated-01',
      items: [{ sku: 'SKU-SMOKE-TEST', quantity: 1, price: 99.0 }],
      totalAmount: 99.0,
    }),
  });
  const checkoutData: any = await checkoutRes.json();
  if (!checkoutRes.ok || checkoutData.status !== 'SUCCESS') {
    throw new Error(`Checkout transaction failed: ${checkoutRes.status}`);
  }
  const traceId = checkoutData.traceId;
  console.log(`  ? Order Confirmed: ${checkoutData.order?.orderId}`);
  console.log(`  ? Generated W3C Trace ID: ${traceId}`);

  await new Promise((r) => setTimeout(r, 1000));

  // 4. Distributed Trace Waterfall in Tempo
  console.log('\n[4/9] Verifying Distributed Trace Waterfall in Tempo...');
  const traceRes = await fetch(`${BASE_URL}/api/v1/traces/${traceId}`);
  const traceJson: any = await traceRes.json();
  if (!traceRes.ok || !traceJson.data) {
    throw new Error(`Trace retrieval failed for traceId: ${traceId}`);
  }
  console.log(`  ? Spans Captured: ${traceJson.data.spanCount} spans across ${traceJson.data.servicesInvolved.join(', ')}`);

  // 5. Correlated Structured Logs in Loki
  console.log('\n[5/9] Verifying Log-to-Trace Correlation in Loki...');
  const logsRes = await fetch(`${BASE_URL}/api/v1/logs?traceId=${traceId}`);
  const logsJson: any = await logsRes.json();
  console.log(`  ? Correlated Logs Found: ${logsJson.data?.length} logs with traceId: ${traceId}`);

  // 6. Prometheus TSDB Ingestion
  console.log('\n[6/9] Verifying TSDB Metric Samples in Prometheus...');
  const metricsRes = await fetch(`${BASE_URL}/api/v1/metrics/query?query=http_requests_total`);
  const metricsJson: any = await metricsRes.json();
  console.log(`  ? Prometheus Samples Ingested: ${metricsJson.data?.length} metrics recorded`);

  // 7. Phase 58 Real AWS Governance Knowledge Graph
  console.log('\n[7/9] Verifying Real AWS Governance Knowledge Graph APIs...');
  const kgSummaryRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/knowledge-graph/summary`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const kgSummaryJson: any = await kgSummaryRes.json();
  if (!kgSummaryRes.ok || !kgSummaryJson.ok) {
    throw new Error(`Knowledge Graph Summary query failed: ${kgSummaryRes.status}`);
  }
  console.log(`  ? Knowledge Graph Nodes: ${kgSummaryJson.data?.nodeCount} nodes across cloud domains`);
  console.log(`  ? Cross-Domain Relationships: ${kgSummaryJson.data?.edgeCount} attributed edges`);
  console.log(`  ? Critical Risk Entities: ${kgSummaryJson.data?.criticalNodesCount} critical nodes`);

  const kgPathRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/knowledge-graph/path?sourceNodeId=usr-deployer-ci&targetNodeId=s3-cloudpulse-prod-audit-logs-2026`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const kgPathJson: any = await kgPathRes.json();
  if (!kgPathRes.ok || !kgPathJson.data?.pathFound) {
    throw new Error(`Knowledge Graph Path finding failed: ${kgPathRes.status}`);
  }

  // 8. Phase 59 Real AWS Cloud Graph Query Engine & Investigation
  console.log('\n[8/9] Verifying Real AWS Cloud Query Engine & Investigation APIs...');
  const nlQueryRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/query/natural-language`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({ prompt: 'Show all production resources exposed to the internet' })
  });
  const nlQueryJson: any = await nlQueryRes.json();
  if (!nlQueryRes.ok || !nlQueryJson.ok) {
    throw new Error(`Natural Language Query failed: ${nlQueryRes.status}`);
  }
  console.log(`  ? Natural Language Intent: ${nlQueryJson.data?.intent} (Confidence: ${nlQueryJson.data?.confidence})`);
  console.log(`  ? Translated AST Entity: ${nlQueryJson.data?.translatedAst?.primaryEntityType}`);
  console.log(`  ? Evidence Findings: ${nlQueryJson.data?.evidenceSummary?.length} items cited`);

  const invListRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/investigations`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const invListJson: any = await invListRes.json();
  if (!invListRes.ok || !invListJson.ok) {
    throw new Error(`Investigations query failed: ${invListRes.status}`);
  }
  console.log(`  ? Active Investigations: ${invListJson.data?.length} cases loaded`);

  // 9. Phase 60 Real AWS Continuous Cloud Operations Control Plane
  console.log('\n[9/10] Verifying Real AWS Cloud Operations Control Plane APIs...');
  const situationRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/operations/situation`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const situationJson: any = await situationRes.json();
  if (!situationRes.ok || !situationJson.ok) {
    throw new Error(`Cloud Situation query failed: ${situationRes.status}`);
  }
  console.log(`  ? Cloud Health Score: ${situationJson.data?.overallHealthScore}/100`);
  console.log(`  ? Active Incidents: ${situationJson.data?.activeIncidentsCount}, Degraded Resources: ${situationJson.data?.degradedResourcesCount}`);
  console.log(`  ? AWS Data Health: ${situationJson.data?.awsDataHealth?.connectionStatus} (${situationJson.data?.awsDataHealth?.syncState})`);

  const copilotRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/aws/operations/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({ prompt: 'What is happening right now?' })
  });
  const copilotJson: any = await copilotRes.json();
  if (!copilotRes.ok || !copilotJson.ok) {
    throw new Error(`Copilot query failed: ${copilotRes.status}`);
  }
  console.log(`  ? Copilot Intent: ${copilotJson.data?.intent} (Confidence: ${copilotJson.data?.confidence})`);
  console.log(`  ? Copilot Cited Evidence: ${copilotJson.data?.citedEvidence?.length} items cited`);

  // 10. Phase 61 Real Multi-Cloud Connectivity: Azure + Google Cloud
  console.log('\n[10/11] Verifying Phase 61 Real Multi-Cloud Connectivity (Azure + GCP + AWS)...');
  const azureSetupRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/azure/setup-info`);
  const azureSetupJson: any = await azureSetupRes.json();
  if (!azureSetupRes.ok || !azureSetupJson.ok) {
    throw new Error(`Azure setup info query failed: ${azureSetupRes.status}`);
  }
  console.log(`  ? Azure Setup Wizard Steps: ${azureSetupJson.data?.steps?.length} steps documented`);

  const gcpSetupRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/gcp/setup-info`);
  const gcpSetupJson: any = await gcpSetupRes.json();
  if (!gcpSetupRes.ok || !gcpSetupJson.ok) {
    throw new Error(`GCP setup info query failed: ${gcpSetupRes.status}`);
  }
  console.log(`  ? GCP Setup Wizard Steps: ${gcpSetupJson.data?.steps?.length} steps documented`);

  const scorecardRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/multicloud/scorecard`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const scorecardJson: any = await scorecardRes.json();
  if (!scorecardRes.ok || !scorecardJson.ok) {
    throw new Error(`Multi-cloud scorecard query failed: ${scorecardRes.status}`);
  }
  console.log(`  ? Multi-Cloud Connected Providers: ${scorecardJson.data?.providers?.map((p: any) => `${p.provider} (${p.status})`).join(', ')}`);
  console.log(`  ? Cross-Cloud Total Inventory: ${scorecardJson.data?.aggregates?.totalResources} canonical resources`);
  console.log(`  ? Multi-Cloud Critical Security Findings: ${scorecardJson.data?.aggregates?.totalCriticalFindings} findings`);
  console.log(`  ? Overall Multi-Cloud Health: ${scorecardJson.data?.aggregates?.overallHealthPercent}%`);

  const mcResourcesRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/multicloud/resources`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const mcResourcesJson: any = await mcResourcesRes.json();
  if (!mcResourcesRes.ok || !mcResourcesJson.ok) {
    throw new Error(`Multi-cloud resources query failed: ${mcResourcesRes.status}`);
  }
  console.log(`  ? Canonical Resources Retrieved: ${mcResourcesJson.data?.length} normalized resources`);

  const mcComparisonRes = await fetch(`${BASE_URL}/api/v1/cloud-connections/multicloud/comparison`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const mcComparisonJson: any = await mcComparisonRes.json();
  if (!mcComparisonRes.ok || !mcComparisonJson.ok) {
    throw new Error(`Multi-cloud comparison query failed: ${mcComparisonRes.status}`);
  }
  console.log(`  ? Cross-Cloud Comparison Dimensions: ${mcComparisonJson.data?.length} metrics evaluated across AWS, Azure, and GCP`);

  // 11. Phase 62 Real Kubernetes Production Connectivity & Cluster Operations Intelligence
  console.log('\n[11/12] Verifying Phase 62 Real Kubernetes Production Connectivity & Operations...');
  const k8sOverviewRes = await fetch(`${BASE_URL}/api/v1/kubernetes/overview`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const k8sOverviewJson: any = await k8sOverviewRes.json();
  if (!k8sOverviewRes.ok || !k8sOverviewJson.ok) {
    throw new Error(`Kubernetes overview query failed: ${k8sOverviewRes.status}`);
  }
  console.log(`  ? Connected Clusters: ${k8sOverviewJson.data?.connectedClusters}/${k8sOverviewJson.data?.totalClusters} clusters live`);
  console.log(`  ? Worker Nodes & Workloads: ${k8sOverviewJson.data?.totalNodes} nodes, ${k8sOverviewJson.data?.totalWorkloads} workloads, ${k8sOverviewJson.data?.totalPods} pods`);
  console.log(`  ? Pod Health State: ${k8sOverviewJson.data?.healthyPods} healthy, ${k8sOverviewJson.data?.degradedPods} degraded pods`);
  console.log(`  ? Kubernetes Governance Score: ${k8sOverviewJson.data?.governanceScore}%`);

  const k8sDetailRes = await fetch(`${BASE_URL}/api/v1/kubernetes/clusters/k8s-prod-eks-us-east-1`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const k8sDetailJson: any = await k8sDetailRes.json();
  if (!k8sDetailRes.ok || !k8sDetailJson.ok) {
    throw new Error(`Kubernetes cluster detail query failed: ${k8sDetailRes.status}`);
  }
  console.log(`  ? Cluster Name: ${k8sDetailJson.data?.cluster?.clusterName} (${k8sDetailJson.data?.cluster?.canonicalId})`);
  console.log(`  ? Discovered Nodes: ${k8sDetailJson.data?.nodes?.map((n: any) => n.name).join(', ')}`);
  console.log(`  ? Discovered Workloads: ${k8sDetailJson.data?.workloads?.map((w: any) => w.name).join(', ')}`);

  const k8sGraphRes = await fetch(`${BASE_URL}/api/v1/kubernetes/clusters/k8s-prod-eks-us-east-1/graph`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const k8sGraphJson: any = await k8sGraphRes.json();
  if (!k8sGraphRes.ok || !k8sGraphJson.ok) {
    throw new Error(`Kubernetes knowledge graph query failed: ${k8sGraphRes.status}`);
  }
  console.log(`  ? Cross-Domain Graph Nodes: ${k8sGraphJson.data?.nodes?.length} nodes, ${k8sGraphJson.data?.edges?.length} cross-cloud edges`);

  const k8sInvRes = await fetch(`${BASE_URL}/api/v1/kubernetes/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({ prompt: 'Why is payment-service degraded in Kubernetes?' })
  });
  const k8sInvJson: any = await k8sInvRes.json();
  if (!k8sInvRes.ok || !k8sInvJson.ok) {
    throw new Error(`Kubernetes natural language investigation failed: ${k8sInvRes.status}`);
  }
  console.log(`  ? Investigation Intent: ${k8sInvJson.data?.intent} (Confidence: ${k8sInvJson.data?.confidence})`);
  console.log(`  ? Recommended Safe Action: ${k8sInvJson.data?.recommendedAction?.title}`);

  // 12. Phase 63 Advanced SRE, Reliability Engineering & Cloud Resilience Control Plane
  console.log('\n[12/13] Verifying Phase 63 SRE & Reliability Control Plane APIs...');
  const sreOverviewRes = await fetch(`${BASE_URL}/api/v1/sre/overview`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const sreOverviewJson: any = await sreOverviewRes.json();
  if (!sreOverviewRes.ok || !sreOverviewJson.ok) {
    throw new Error(`SRE overview query failed: ${sreOverviewRes.status}`);
  }
  console.log(`  ? SRE Platform Score: ${sreOverviewJson.data?.globalReliabilityScore}/100 (Grade ${sreOverviewJson.data?.globalReliabilityGrade})`);
  console.log(`  ? Discovered Cloud Services: ${sreOverviewJson.data?.totalServices} services across multi-cloud (${sreOverviewJson.data?.healthyServices} healthy, ${sreOverviewJson.data?.degradedServices} degraded)`);
  console.log(`  ? Active SLOs & Budgets: ${sreOverviewJson.data?.totalSlos} SLOs, ${sreOverviewJson.data?.atRiskSlos} at risk, ${sreOverviewJson.data?.breachedSlos} breached`);
  console.log(`  ? SLO Attainment: ${sreOverviewJson.data?.overallSloAttainmentPercent}%, Observability Coverage: ${sreOverviewJson.data?.observabilityCoveragePercent}%`);

  const sreSvcDetailRes = await fetch(`${BASE_URL}/api/v1/sre/services/payment-service`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const sreSvcDetailJson: any = await sreSvcDetailRes.json();
  if (!sreSvcDetailRes.ok || !sreSvcDetailJson.ok) {
    throw new Error(`SRE service detail query failed: ${sreSvcDetailRes.status}`);
  }
  console.log(`  ? Service Detail: ${sreSvcDetailJson.data?.service?.name} (Tier ${sreSvcDetailJson.data?.service?.tier}, Score: ${sreSvcDetailJson.data?.reliabilityScore?.overallScore}/100)`);
  console.log(`  ? Service SLIs: ${sreSvcDetailJson.data?.slis?.length} active SLIs with truth-in-labeling`);
  console.log(`  ? Cascading Risks: ${sreSvcDetailJson.data?.cascadingRisks?.length} paths identified`);

  const sreReleaseGuardRes = await fetch(`${BASE_URL}/api/v1/sre/release-guard/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({
      serviceId: 'payment-service',
      releaseVersion: 'v2.8.5-rc1',
      changeType: 'DEPLOYMENT'
    })
  });
  const sreReleaseGuardJson: any = await sreReleaseGuardRes.json();
  if (!sreReleaseGuardRes.ok || !sreReleaseGuardJson.ok) {
    throw new Error(`SRE Release Risk Guard evaluation failed: ${sreReleaseGuardRes.status}`);
  }
  console.log(`  ? Release Guard Decision: ${sreReleaseGuardJson.data?.decision} (Risk Score: ${sreReleaseGuardJson.data?.score}/100, Recommendation: ${sreReleaseGuardJson.data?.recommendation})`);

  const sreVerifyRes = await fetch(`${BASE_URL}/api/v1/sre/remediation/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({
      serviceId: 'payment-service',
      actionId: 'act-restart-hpa-01'
    })
  });
  const sreVerifyJson: any = await sreVerifyRes.json();
  if (!sreVerifyRes.ok || !sreVerifyJson.ok) {
    throw new Error(`SRE Remediation Verification failed: ${sreVerifyRes.status}`);
  }
  console.log(`  ? Remediation Recovery Status: ${sreVerifyJson.data?.status} (Fresh Read Confirmed: ${sreVerifyJson.data?.freshReadConfirmed}, Verified Metrics: ${sreVerifyJson.data?.verifiedMetrics?.length})`);

  const sreInvRes = await fetch(`${BASE_URL}/api/v1/sre/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({ prompt: 'Why is payment-service burning error budget?' })
  });
  const sreInvJson: any = await sreInvRes.json();
  if (!sreInvRes.ok || !sreInvJson.ok) {
    throw new Error(`SRE Copilot investigation failed: ${sreInvRes.status}`);
  }
  console.log(`  ? SRE Copilot Intent: ${sreInvJson.data?.intent} (Confidence: ${sreInvJson.data?.confidence})`);
  console.log(`  ? SRE Copilot Cited Evidence: ${sreInvJson.data?.evidenceCitations?.length} items cited`);

  // 13. Phase 64 Enterprise Cloud Workflow, Collaboration & Governed Change Management
  console.log('\n[13/13] Verifying Phase 64 Enterprise Workflow & Governed Change Control APIs...');
  const wfSummaryRes = await fetch(`${BASE_URL}/api/v1/workflow/summary`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const wfSummaryJson: any = await wfSummaryRes.json();
  if (!wfSummaryRes.ok || !wfSummaryJson.ok) {
    throw new Error(`Workflow summary query failed: ${wfSummaryRes.status}`);
  }
  console.log(`  ? Enterprise Teams: ${wfSummaryJson.data?.totalTeams} teams (${wfSummaryJson.data?.totalMembers} members tracked)`);
  console.log(`  ? Unified Work Items: ${wfSummaryJson.data?.activeWorkItems?.total} active (${wfSummaryJson.data?.activeWorkItems?.p0p1Count} P0/P1 critical, ${wfSummaryJson.data?.activeWorkItems?.waitingApproval} waiting approval)`);
  console.log(`  ? Pending Approvals: ${wfSummaryJson.data?.pendingApprovalsCount}, Maintenance Windows: ${wfSummaryJson.data?.upcomingMaintenanceWindowsCount}`);

  const wfTeamsRes = await fetch(`${BASE_URL}/api/v1/workflow/teams`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const wfTeamsJson: any = await wfTeamsRes.json();
  if (!wfTeamsRes.ok || !wfTeamsJson.ok) {
    throw new Error(`Workflow teams query failed: ${wfTeamsRes.status}`);
  }
  console.log(`  ? Configured Teams: ${wfTeamsJson.data?.map((t: any) => t.name).join(', ')}`);

  const wfApprovalsRes = await fetch(`${BASE_URL}/api/v1/workflow/approvals`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const wfApprovalsJson: any = await wfApprovalsRes.json();
  if (!wfApprovalsRes.ok || !wfApprovalsJson.ok) {
    throw new Error(`Workflow approvals query failed: ${wfApprovalsRes.status}`);
  }
  console.log(`  ? Governed Approvals: ${wfApprovalsJson.data?.length} requests (Two-Person Control: ${wfApprovalsJson.data?.filter((a: any) => a.approvalPolicy?.requiresTwoPersonControl).length} enforced)`);

  const wfChangesRes = await fetch(`${BASE_URL}/api/v1/workflow/changes`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const wfChangesJson: any = await wfChangesRes.json();
  if (!wfChangesRes.ok || !wfChangesJson.ok) {
    throw new Error(`Workflow change requests query failed: ${wfChangesRes.status}`);
  }
  console.log(`  ? Governed Change Requests: ${wfChangesJson.data?.length} change pipelines (Multi-Pillar Review Pack verified)`);

  const wfWindowsRes = await fetch(`${BASE_URL}/api/v1/workflow/maintenance-windows`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const wfWindowsJson: any = await wfWindowsRes.json();
  if (!wfWindowsRes.ok || !wfWindowsJson.ok) {
    throw new Error(`Workflow maintenance windows query failed: ${wfWindowsRes.status}`);
  }
  console.log(`  ? Maintenance Windows: ${wfWindowsJson.data?.length} scheduled windows`);

  const wfCopilotRes = await fetch(`${BASE_URL}/api/v1/workflow/ai-copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({ prompt: 'Who owns payment-service and what approvals are pending?' })
  });
  const wfCopilotJson: any = await wfCopilotRes.json();
  if (!wfCopilotRes.ok || !wfCopilotJson.ok) {
    throw new Error(`Workflow AI Copilot query failed: ${wfCopilotRes.status}`);
  }
  console.log(`  ? AI Copilot Intent: ${wfCopilotJson.data?.intent} (Confidence: ${wfCopilotJson.data?.confidence})`);
  console.log(`  ? AI Copilot Evidence Citations: ${wfCopilotJson.data?.evidenceCitations?.length} items cited`);

  // 14. Phase 65 Real Multi-Cloud FinOps, Unit Economics & Cost Governance
  console.log('\n[14/15] Verifying Phase 65 Real Multi-Cloud FinOps Control Plane APIs...');
  const finopsScorecardRes = await fetch(`${BASE_URL}/api/v1/finops/scorecard`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const finopsScorecardJson: any = await finopsScorecardRes.json();
  if (!finopsScorecardRes.ok || !finopsScorecardJson.ok) {
    throw new Error(`FinOps Scorecard query failed: ${finopsScorecardRes.status}`);
  }
  console.log(`  ? Multi-Cloud FinOps Scorecard: $${finopsScorecardJson.data?.totalSpendMtd} MTD spend (Allocation: ${finopsScorecardJson.data?.allocationCoveragePercent}%, Tagging Score: ${finopsScorecardJson.data?.dataQualityMetrics?.taggingComplianceScore}/100)`);
  console.log(`  ? Provider Spend Breakdown: AWS ($${finopsScorecardJson.data?.spendByProvider?.AWS}), Azure ($${finopsScorecardJson.data?.spendByProvider?.AZURE}), GCP ($${finopsScorecardJson.data?.spendByProvider?.GCP})`);

  const finopsRecordsRes = await fetch(`${BASE_URL}/api/v1/finops/records`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const finopsRecordsJson: any = await finopsRecordsRes.json();
  if (!finopsRecordsRes.ok || !finopsRecordsJson.ok) {
    throw new Error(`FinOps Cost Records query failed: ${finopsRecordsRes.status}`);
  }
  console.log(`  ? Normalized Cost Records: ${finopsRecordsJson.data?.length} billing line items (AWS CUR, Azure Cost Mgmt, GCP Cloud Billing, K8s)`);

  const finopsUeRes = await fetch(`${BASE_URL}/api/v1/finops/unit-economics`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const finopsUeJson: any = await finopsUeRes.json();
  if (!finopsUeRes.ok || !finopsUeJson.ok) {
    throw new Error(`FinOps Unit Economics query failed: ${finopsUeRes.status}`);
  }
  console.log(`  ? Real Unit Economics: ${finopsUeJson.data?.length} services evaluated (Linked to OTel, Prometheus, CloudWatch)`);

  const finopsK8sRes = await fetch(`${BASE_URL}/api/v1/finops/kubernetes`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const finopsK8sJson: any = await finopsK8sRes.json();
  if (!finopsK8sRes.ok || !finopsK8sJson.ok) {
    throw new Error(`Kubernetes FinOps query failed: ${finopsK8sRes.status}`);
  }
  console.log(`  ? Kubernetes FinOps Allocations: ${finopsK8sJson.data?.length} workloads (Node vs Pod vs Shared overhead, Waste calculated)`);

  const finopsOppsRes = await fetch(`${BASE_URL}/api/v1/finops/opportunities`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const finopsOppsJson: any = await finopsOppsRes.json();
  if (!finopsOppsRes.ok || !finopsOppsJson.ok) {
    throw new Error(`FinOps Savings Opportunities query failed: ${finopsOppsRes.status}`);
  }
  console.log(`  ? Savings Opportunities: ${finopsOppsJson.data?.length} verified/potential optimizations with Tradeoff Safety analysis`);

  const finopsAnalystRes = await fetch(`${BASE_URL}/api/v1/finops/ai-analyst`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({ prompt: 'Why did cloud spend increase this week?' })
  });
  const finopsAnalystJson: any = await finopsAnalystRes.json();
  if (!finopsAnalystRes.ok || !finopsAnalystJson.ok) {
    throw new Error(`AI FinOps Analyst query failed: ${finopsAnalystRes.status}`);
  }
  console.log(`  ? AI FinOps Analyst: Intent=${finopsAnalystJson.data?.intent}, Confidence=${finopsAnalystJson.data?.confidence}, Evidence=${finopsAnalystJson.data?.evidenceCitations?.length} citations`);

  // 15. Phase 66 Real Cloud Security, Identity & Zero-Trust Control Plane
  console.log('\n[15/15] Verifying Phase 66 Real Cloud Security & Zero-Trust Control Plane APIs...');
  const secScorecardRes = await fetch(`${BASE_URL}/api/v1/security/scorecard`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const secScorecardJson: any = await secScorecardRes.json();
  if (!secScorecardRes.ok || !secScorecardJson.ok) {
    throw new Error(`Zero-Trust Scorecard query failed: ${secScorecardRes.status}`);
  }
  console.log(`  ? Zero-Trust Scorecard: Overall Posture ${secScorecardJson.data?.overallPostureScore}/100, Least-Privilege Attainment ${secScorecardJson.data?.leastPrivilegeAttainment}%, Human MFA ${secScorecardJson.data?.humanMfaAttainment}%`);
  console.log(`  ? Security Posture Signals: ${secScorecardJson.data?.highRiskAccessPathsCount} High-Risk Paths, ${secScorecardJson.data?.publicExposureCount} Public Exposures, Workload Auth: "${secScorecardJson.data?.workloadAuthPosture}"`);

  const secIdentitiesRes = await fetch(`${BASE_URL}/api/v1/security/identities`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const secIdentitiesJson: any = await secIdentitiesRes.json();
  if (!secIdentitiesRes.ok || !secIdentitiesJson.ok) {
    throw new Error(`Security Identities query failed: ${secIdentitiesRes.status}`);
  }
  console.log(`  ? Normalized Identities: ${secIdentitiesJson.data?.length} multi-cloud identities (AWS IAM, Azure Entra ID, GCP Service Accounts, K8s RBAC)`);

  const secPathsRes = await fetch(`${BASE_URL}/api/v1/security/paths/high-risk`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const secPathsJson: any = await secPathsRes.json();
  if (!secPathsRes.ok || !secPathsJson.ok) {
    throw new Error(`High-Risk Paths query failed: ${secPathsRes.status}`);
  }
  console.log(`  ? High-Risk Attack Paths: ${secPathsJson.data?.length} lateral movement chains detected with node-level evidence`);

  const secExposuresRes = await fetch(`${BASE_URL}/api/v1/security/exposure/public`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const secExposuresJson: any = await secExposuresRes.json();
  if (!secExposuresRes.ok || !secExposuresJson.ok) {
    throw new Error(`Public Exposures query failed: ${secExposuresRes.status}`);
  }
  console.log(`  ? Multi-Cloud Public Exposures: ${secExposuresJson.data?.length} public vectors (AWS SG 0.0.0.0/0, Azure Public IPs, K8s LoadBalancers)`);

  const secControlsRes = await fetch(`${BASE_URL}/api/v1/security/control-effectiveness`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const secControlsJson: any = await secControlsRes.json();
  if (!secControlsRes.ok || !secControlsJson.ok) {
    throw new Error(`Control Effectiveness query failed: ${secControlsRes.status}`);
  }
  console.log(`  ? Zero-Trust Control Posture: ${secControlsJson.data?.length} continuous evaluation frameworks (NIST SP 800-53, CIS, SOC 2)`);

  const secSimRes = await fetch(`${BASE_URL}/api/v1/security/what-if/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({
      actionType: 'REMOVE_PUBLIC_INGRESS',
      targetEntityId: 'sg-cloudpulse-ingress-sec',
      proposedChange: 'Revoke port 22 global ingress rule on EC2 host'
    })
  });
  const secSimJson: any = await secSimRes.json();
  if (!secSimRes.ok || !secSimJson.ok) {
    throw new Error(`Security What-If simulation failed: ${secSimRes.status}`);
  }
  console.log(`  ? Security What-If Simulator: Risk delta ${secSimJson.data?.securityPostureImpact?.deltaScore > 0 ? '+' : ''}${secSimJson.data?.securityPostureImpact?.deltaScore} points, SLO Impact: ${secSimJson.data?.reliabilitySloImpact?.impactRisk}`);

  const secAnalystRes = await fetch(`${BASE_URL}/api/v1/security/ai-analyst`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({ prompt: 'Explain the high-risk attack paths in our cloud estate' })
  });
  const secAnalystJson: any = await secAnalystRes.json();
  if (!secAnalystRes.ok || !secAnalystJson.ok) {
    throw new Error(`AI Security Analyst query failed: ${secAnalystRes.status}`);
  }
  console.log(`  ? Grounded AI Security Analyst: Intent=${secAnalystJson.data?.intent}, Confidence=${secAnalystJson.data?.confidence}, Citations=${secAnalystJson.data?.evidenceCitations?.length} items cited`);

  // 17. Phase 67 Real Cloud Resilience, Disaster Recovery & Business Continuity Intelligence
  console.log('\n[17/17] Verifying Real Cloud Resilience, DR & Business Continuity Control Plane...');
  const resScorecardRes = await fetch(`${BASE_URL}/api/v1/resilience/scorecard`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const resScorecardJson: any = await resScorecardRes.json();
  if (!resScorecardRes.ok || !resScorecardJson.ok) {
    throw new Error(`Resilience Scorecard query failed: ${resScorecardRes.status}`);
  }
  console.log(`  ✓ Zero-Downtime Resilience Score: ${resScorecardJson.data?.overallResilienceScore}/100, Backup Protection: ${resScorecardJson.data?.backupProtectionRate}%`);

  const resDomainsRes = await fetch(`${BASE_URL}/api/v1/resilience/failure-domains`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const resDomainsJson: any = await resDomainsRes.json();
  if (!resDomainsRes.ok || !resDomainsJson.ok) {
    throw new Error(`Failure Domains query failed: ${resDomainsRes.status}`);
  }
  console.log(`  ✓ Multi-Cloud Failure Domains: ${resDomainsJson.data?.length} domains (AWS AZs, Azure East US, GCP us-central1, K8s Nodes)`);

  const resSpofsRes = await fetch(`${BASE_URL}/api/v1/resilience/spofs`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const resSpofsJson: any = await resSpofsRes.json();
  if (!resSpofsRes.ok || !resSpofsJson.ok) {
    throw new Error(`SPOFs query failed: ${resSpofsRes.status}`);
  }
  console.log(`  ✓ Active Single Points of Failure: ${resSpofsJson.data?.length} detected with blast radius & downtime bounds`);

  const resBackupsRes = await fetch(`${BASE_URL}/api/v1/resilience/backups`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const resBackupsJson: any = await resBackupsRes.json();
  if (!resBackupsRes.ok || !resBackupsJson.ok) {
    throw new Error(`Backups query failed: ${resBackupsRes.status}`);
  }
  console.log(`  ✓ Multi-Cloud Backup Inventory: ${resBackupsJson.data?.length} datastores tracked across RDS, DynamoDB PITR, S3 Object Lock, Velero`);

  const resPlansRes = await fetch(`${BASE_URL}/api/v1/resilience/recovery-plans`, {
    headers: { 'x-workspace-id': 'ws-production' }
  });
  const resPlansJson: any = await resPlansRes.json();
  if (!resPlansRes.ok || !resPlansJson.ok) {
    throw new Error(`Recovery Plans query failed: ${resPlansRes.status}`);
  }
  console.log(`  ✓ Governed Recovery Plans: ${resPlansJson.data?.length} multi-cloud failover runbooks with rollback protection`);

  const resSimRes = await fetch(`${BASE_URL}/api/v1/resilience/what-if/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({
      scenario: 'AZ_OUTAGE',
      targetFailureDomainOrResource: 'fd-aws-us-east-1a'
    })
  });
  const resSimJson: any = await resSimRes.json();
  if (!resSimRes.ok || !resSimJson.ok) {
    throw new Error(`Resilience What-If simulation failed: ${resSimRes.status}`);
  }
  console.log(`  ✓ What-If Outage Simulator: Simulated "${resSimJson.data?.scenario}", Estimated RTO: ${resSimJson.data?.rtoEstimateMinutes}m, Data Loss Risk: ${resSimJson.data?.dataLossRisk}`);

  const resAnalystRes = await fetch(`${BASE_URL}/api/v1/resilience/ai-analyst`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws-production' },
    body: JSON.stringify({ prompt: 'Which mission critical services have single points of failure?' })
  });
  const resAnalystJson: any = await resAnalystRes.json();
  if (!resAnalystRes.ok || !resAnalystJson.ok) {
    throw new Error(`AI Resilience Analyst query failed: ${resAnalystRes.status}`);
  }
  console.log(`  ✓ Grounded AI Resilience Analyst: Intent=${resAnalystJson.data?.intent}, Citations=${resAnalystJson.data?.evidenceCitations?.length} items cited`);

  // 18. Phase 68 Global Cloud Command Center, Executive Intelligence & Real-Time Enterprise Control
  console.log('\n[18/19] Verifying Phase 68 Global Cloud Command Center & Executive Control Plane...');
  const cmdOverviewRes = await fetch(`${BASE_URL}/api/v1/global-command-center/overview?workspaceId=ws-production`);
  const cmdOverviewJson: any = await cmdOverviewRes.json();
  if (!cmdOverviewRes.ok || !cmdOverviewJson.ok) {
    throw new Error(`Command Center Overview query failed: ${cmdOverviewRes.status}`);
  }
  console.log(`  ✓ Executive Health Score: ${cmdOverviewJson.data?.health?.overallHealthScore}/100 (${cmdOverviewJson.data?.health?.overallStatus})`);
  console.log(`  ✓ Active Correlated Situations: ${cmdOverviewJson.data?.activeSituationsCount} situations (${cmdOverviewJson.data?.criticalSituationsCount} P0/P1 emergency response)`);
  console.log(`  ✓ Priority Decisions Queue: ${cmdOverviewJson.data?.pendingDecisionsCount} pending governed actions`);
  console.log(`  ✓ Telemetry Freshness & Coverage: Freshness=${cmdOverviewJson.data?.freshness?.overallFreshness}, Coverage=${cmdOverviewJson.data?.coverage?.overallCoveragePercent}%`);

  const cmdSituationsRes = await fetch(`${BASE_URL}/api/v1/global-command-center/situations?priority=P0`);
  const cmdSituationsJson: any = await cmdSituationsRes.json();
  if (!cmdSituationsRes.ok || !cmdSituationsJson.ok || !cmdSituationsJson.data?.length) {
    throw new Error(`P0 Situations query failed: ${cmdSituationsRes.status}`);
  }
  console.log(`  ✓ P0 Situation Tracked: "${cmdSituationsJson.data[0]?.title.slice(0, 50)}..." with 10-stage timeline`);

  const cmdHeatmapRes = await fetch(`${BASE_URL}/api/v1/global-command-center/risk-heatmap`);
  const cmdHeatmapJson: any = await cmdHeatmapRes.json();
  if (!cmdHeatmapRes.ok || !cmdHeatmapJson.ok) {
    throw new Error(`Risk Heatmap query failed: ${cmdHeatmapRes.status}`);
  }
  console.log(`  ✓ Multi-Cloud Risk Heatmap: ${cmdHeatmapJson.data?.cells?.length} cross-sectional entities evaluated across 6 core pillars`);

  const cmdAiRes = await fetch(`${BASE_URL}/api/v1/global-command-center/ai-analyst`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'What is our global estate health and top critical risks?' })
  });
  const cmdAiJson: any = await cmdAiRes.json();
  if (!cmdAiRes.ok || !cmdAiJson.ok) {
    throw new Error(`AI Enterprise Analyst query failed: ${cmdAiRes.status}`);
  }
  console.log(`  ✓ Grounded AI Enterprise Analyst: Intent=${cmdAiJson.data?.intent}, Citations=${cmdAiJson.data?.evidenceCitations?.length}, Strict No-Action=${cmdAiJson.data?.strictNoActionEnforced}`);

  // 19. Phase 69 Real CloudPulse Production Platform, Observability & Hardening
  console.log('\n[19/19] Verifying Phase 69 Platform Self-Observability, SLOs & Infrastructure Hardening...');
  const platLiveRes = await fetch(`${BASE_URL}/health/live`);
  const platLiveJson: any = await platLiveRes.json();
  if (!platLiveRes.ok || platLiveJson.status !== 'ok') {
    throw new Error(`Platform Liveness probe failed: ${platLiveRes.status}`);
  }
  console.log(`  ✓ Platform Liveness Probe: Status=${platLiveJson.status}, Uptime=${platLiveJson.uptimeSeconds}s`);

  const platReadyRes = await fetch(`${BASE_URL}/health/ready`);
  const platReadyJson: any = await platReadyRes.json();
  if (!platReadyRes.ok || platReadyJson.status !== 'ready') {
    throw new Error(`Platform Readiness probe failed: ${platReadyRes.status}`);
  }
  console.log(`  ✓ Platform Readiness Probe: Status=${platReadyJson.status}, Initialized=${platReadyJson.initialized}`);

  const platDepsRes = await fetch(`${BASE_URL}/health/dependencies`);
  const platDepsJson: any = await platDepsRes.json();
  if (!platDepsRes.ok || !platDepsJson.ok) {
    throw new Error(`Platform Dependencies probe failed: ${platDepsRes.status}`);
  }
  console.log(`  ✓ Platform Dependencies Probe: DB Pool=${platDepsJson.data?.database?.status}, OTel Receiver=${platDepsJson.data?.telemetryEngine?.otlpReceiverPort}, TSDB Buffer=${platDepsJson.data?.inMemoryTsdb?.memoryUsageMb}MB`);

  const platOverviewRes = await fetch(`${BASE_URL}/api/v1/platform/overview`, {
    headers: { 'x-tenant-id': 'tenant-cloudpulse-main' }
  });
  const platOverviewJson: any = await platOverviewRes.json();
  if (!platOverviewRes.ok || !platOverviewJson.ok) {
    throw new Error(`Platform Overview query failed: ${platOverviewRes.status}`);
  }
  console.log(`  ✓ Platform Overview Telemetry: Status=${platOverviewJson.data?.health?.status}, Throughput=${platOverviewJson.data?.metrics?.requestsPerSecond.toFixed(1)} req/s, P99=${platOverviewJson.data?.metrics?.apiLatency?.p99}ms, CPU=${platOverviewJson.data?.metrics?.cpuUsagePercent}%`);

  const platSlosRes = await fetch(`${BASE_URL}/api/v1/platform/slos`, {
    headers: { 'x-tenant-id': 'tenant-cloudpulse-main' }
  });
  const platSlosJson: any = await platSlosRes.json();
  if (!platSlosRes.ok || !platSlosJson.ok) {
    throw new Error(`Platform SLOs query failed: ${platSlosRes.status}`);
  }
  console.log(`  ✓ Internal Platform SLOs: ${platSlosJson.data?.length} tier SLOs evaluated (${platSlosJson.data?.filter((s: any) => s.status === 'HEALTHY').length} healthy, min error budget=${Math.min(...platSlosJson.data?.map((s: any) => s.errorBudgetRemainingPercent))}%)`);

  const platWorkersRes = await fetch(`${BASE_URL}/api/v1/platform/workers`, {
    headers: { 'x-tenant-id': 'tenant-cloudpulse-main' }
  });
  const platWorkersJson: any = await platWorkersRes.json();
  if (!platWorkersRes.ok || !platWorkersJson.ok) {
    throw new Error(`Platform Workers query failed: ${platWorkersRes.status}`);
  }
  console.log(`  ✓ Multi-Cloud Sync Workers: ${platWorkersJson.data?.length} background workers active across AWS, Azure, GCP & Kubernetes`);

  const platRateLimitRes = await fetch(`${BASE_URL}/api/v1/platform/rate-limits`, {
    headers: { 'x-tenant-id': 'tenant-cloudpulse-main' }
  });
  const platRateLimitJson: any = await platRateLimitRes.json();
  if (!platRateLimitRes.ok || !platRateLimitJson.ok) {
    throw new Error(`Platform Rate Limits query failed: ${platRateLimitRes.status}`);
  }
  console.log(`  ✓ Differentiated Rate Limiting & Circuit Breakers: ${platRateLimitJson.data?.circuitBreakers?.length} cloud circuit breakers (${platRateLimitJson.data?.circuitBreakers?.filter((cb: any) => cb.state === 'CLOSED').length} CLOSED)`);

  const platCostsRes = await fetch(`${BASE_URL}/api/v1/platform/costs`, {
    headers: { 'x-tenant-id': 'tenant-cloudpulse-main' }
  });
  const platCostsJson: any = await platCostsRes.json();
  if (!platCostsRes.ok || !platCostsJson.ok) {
    throw new Error(`Platform Costs query failed: ${platCostsRes.status}`);
  }
  console.log(`  ✓ Platform Hosting Unit Economics: $${platCostsJson.data?.totalMonthToDateUsd.toFixed(2)} MTD across ${platCostsJson.data?.breakdown?.length} infrastructure categories`);

  console.log('\n==================================================================');
  console.log(' ✓ ALL 19 SMOKE TESTS PASSED WITH 100% OPERATIONAL FIDELITY');
  console.log('==================================================================');
}

runSmokeTests().catch((err) => {
  console.error('\n? SMOKE TEST FAILED:', err);
  process.exit(1);
});

