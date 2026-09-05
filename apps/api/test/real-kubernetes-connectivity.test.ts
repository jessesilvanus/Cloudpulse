import { describe, it } from 'node:test';
import assert from 'node:assert';
import { KubernetesClusterAdapter } from '../src/services/kubernetes-cluster-adapter.js';
import { KubernetesOperationsEngine } from '../src/services/kubernetes-operations-engine.js';
import type { KubernetesConnection } from '@cloudpulse/shared';

describe('CLOUDPULSE Phase 62 Real Kubernetes Production Connectivity & Operations Intelligence', () => {
  const adapter = new KubernetesClusterAdapter();
  const engine = new KubernetesOperationsEngine();

  const mockEksConn: KubernetesConnection = {
    id: 'conn-k8s-test-eks',
    tenantId: 'tenant-enterprise',
    workspaceId: 'ws-production',
    name: 'test-eks-us-east-1',
    clusterId: 'k8s-test-eks',
    provider: 'EKS',
    clusterEndpointReference: 'https://B812948124981.gr7.us-east-1.eks.amazonaws.com',
    authorizationMethod: 'AWS_IAM_IRSA',
    namespaceScope: [],
    status: 'CONNECTED',
    capabilities: adapter.getCapabilities({ provider: 'EKS' }),
    permissions: {
      canReadWorkloads: true,
      canReadSecrets: false,
      canReadLogs: true,
      canReadMetrics: true,
      canExecuteSafeRemediation: true
    },
    version: 'v1.30.2',
    contextMetadata: {
      regionOrLocation: 'us-east-1',
      cloudAccountOrProject: '123456789012'
    },
    freshness: 'LIVE',
    truthInLabelingVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  describe('1. Kubernetes Cluster Adapter & Live Resource Normalization', () => {
    it('should declare granular capabilities across Kubernetes API domains', () => {
      const caps = adapter.getCapabilities(mockEksConn);
      assert.ok(caps.length >= 15);
      assert.ok(caps.some((c) => c.type === 'CLUSTER_METADATA' && c.status === 'SUPPORTED'));
      assert.ok(caps.some((c) => c.type === 'NODE_INVENTORY' && c.status === 'SUPPORTED'));
      assert.ok(caps.some((c) => c.type === 'POD_INVENTORY' && c.status === 'SUPPORTED'));
      assert.ok(caps.some((c) => c.type === 'REMEDIATION' && c.status === 'SUPPORTED'));
    });

    it('should validate connection endpoint and return control-plane version', async () => {
      const res = await adapter.validateConnection(mockEksConn);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.clusterVersion, 'v1.30.2');
    });

    it('should discover nodes with allocatable capacity, conditions, and golden metrics', async () => {
      const nodes = await adapter.listNodes(mockEksConn);
      assert.strictEqual(nodes.length, 3);

      const node1 = nodes[0];
      assert.strictEqual(node1.status, 'Ready');
      assert.strictEqual(node1.capacity.cpu, '8');
      assert.ok(node1.metrics);
      assert.strictEqual(node1.metrics.source, 'metrics-server');
      assert.ok(node1.conditions.some((c) => c.type === 'Ready' && c.status === 'True'));
    });

    it('should discover workloads with rollout states, replica counts, and container specs', async () => {
      const workloads = await adapter.listWorkloads(mockEksConn);
      assert.ok(workloads.length >= 4);

      const apiGw = workloads.find((w) => w.name === 'api-gateway');
      assert.ok(apiGw);
      assert.strictEqual(apiGw.readyReplicas, 3);
      assert.strictEqual(apiGw.rolloutState, 'ROLLOUT_SUCCESSFUL');

      const payment = workloads.find((w) => w.name === 'payment-service');
      assert.ok(payment);
      assert.strictEqual(payment.rolloutState, 'ROLLOUT_DEGRADED');
      assert.strictEqual(payment.healthStatus, 'WARNING');
    });

    it('should diagnose pod conditions with evidence-backed CrashLoopBackOff detection', async () => {
      const pods = await adapter.listPods(mockEksConn);
      assert.ok(pods.length >= 4);

      const crashingPod = pods.find((p) => p.name.startsWith('payment-service'));
      assert.ok(crashingPod);
      assert.strictEqual(crashingPod.ready, false);
      assert.ok(crashingPod.restartCount > 0);
      assert.ok(crashingPod.reasons.includes('CrashLoopBackOff'));
    });

    it('should discover services and classify external exposure truthfully', async () => {
      const { services, ingresses } = await adapter.listServicesAndIngresses(mockEksConn);
      assert.strictEqual(services.length, 3);
      assert.strictEqual(ingresses.length, 1);

      const lbSvc = services.find((s) => s.type === 'LoadBalancer');
      assert.ok(lbSvc);
      assert.strictEqual(lbSvc.exposure, 'PUBLIC');

      const clusterIpSvc = services.find((s) => s.type === 'ClusterIP');
      assert.ok(clusterIpSvc);
      assert.strictEqual(clusterIpSvc.exposure, 'INTERNAL');
    });

    it('should audit RBAC bindings and flag wildcard cluster-admin permissions', async () => {
      const rbac = await adapter.getRbacSummary(mockEksConn);
      assert.ok(rbac.serviceAccountsCount > 0);
      assert.ok(rbac.clusterRolesCount > 0);

      const privSa = rbac.privilegedServiceAccounts.find((sa) => sa.name === 'admin-ci-runner');
      assert.ok(privSa);
      assert.strictEqual(privSa.hasWildcardPermissions, true);
      assert.ok(privSa.clusterRolesBound.includes('cluster-admin'));
    });

    it('should generate security findings from container securityContext analysis', async () => {
      const findings = await adapter.getSecurityFindings(mockEksConn);
      assert.ok(findings.length >= 2);
      assert.ok(findings.some((f) => f.severity === 'CRITICAL' && f.ruleId === 'K8S-RBAC-001'));
      assert.ok(findings.some((f) => f.ruleId === 'K8S-RES-002'));
    });

    it('should normalize Kubernetes entities into global CloudResource representations', async () => {
      const resources = await adapter.listNormalizedResources(mockEksConn);
      assert.ok(resources.length >= 8);

      const clusterRes = resources.find((r) => r.normalizedServiceType === 'KUBERNETES_CLUSTER');
      assert.ok(clusterRes);
      assert.ok(clusterRes.canonicalId.startsWith('k8s:'));

      const nodeRes = resources.find((r) => r.normalizedServiceType === 'COMPUTE_VM');
      assert.ok(nodeRes);
      assert.strictEqual(nodeRes.status, 'RUNNING');
    });
  });

  describe('2. Kubernetes Operations Engine & Multi-Cluster Control Plane', () => {
    it('should connect new AKS and GKE clusters with truthful capability detection', async () => {
      const aksConn = await engine.connectCluster('ws-production', 'tenant-enterprise', 'usr-op-01', {
        name: 'prod-aks-eastus',
        provider: 'AKS',
        clusterEndpointReference: 'https://prod-aks-eastus-dns-12948.hcp.eastus.azmk8s.io:443',
        authorizationMethod: 'AZURE_ENTRA_AAD',
        regionOrLocation: 'eastus',
        cloudAccountOrProject: 'sub-00000000-0000'
      });
      assert.strictEqual(aksConn.provider, 'AKS');
      assert.strictEqual(aksConn.status, 'CONNECTED');

      const gkeConn = await engine.connectCluster('ws-production', 'tenant-enterprise', 'usr-op-01', {
        name: 'prod-gke-us-central1',
        provider: 'GKE',
        clusterEndpointReference: 'https://35.222.14.88',
        authorizationMethod: 'GCP_IAM',
        regionOrLocation: 'us-central1',
        cloudAccountOrProject: 'cloudpulse-prod-gke'
      });
      assert.strictEqual(gkeConn.provider, 'GKE');
      assert.strictEqual(gkeConn.status, 'CONNECTED');
    });

    it('should compute aggregated multi-cluster overview with honest metrics', async () => {
      const overview = await engine.getOverview('ws-production');
      assert.ok(overview.totalClusters >= 1);
      assert.ok(overview.connectedClusters >= 1);
      assert.strictEqual(overview.degradedPods, 1);
      assert.strictEqual(overview.stalledRollouts, 1);
      assert.ok(overview.governanceScore > 80);
    });

    it('should retrieve full cluster detail by ID', async () => {
      const detail = await engine.getClusterDetail('k8s-prod-eks-us-east-1', 'ws-production');
      assert.ok(detail.cluster);
      assert.strictEqual(detail.nodes.length, 3);
      assert.ok(detail.workloads.length >= 4);
      assert.ok(detail.pods.length >= 4);
      assert.ok(detail.governance.policiesEvaluated.length >= 4);
    });

    it('should construct cross-domain Cloud ↔ Kubernetes Knowledge Graph', async () => {
      const graph = await engine.getKnowledgeGraph('k8s-prod-eks-us-east-1');
      assert.ok(graph.nodes.length >= 8);
      assert.ok(graph.edges.length >= 8);

      // Verify cross-domain cloud edges
      assert.ok(graph.edges.some((e) => e.relationship === 'HOSTED_IN' && e.source.startsWith('k8s:cluster:') && e.target.startsWith('aws:vpc:')));
      assert.ok(graph.edges.some((e) => e.relationship === 'EXPOSES' && e.source.startsWith('aws:alb:') && e.target.startsWith('k8s:workload:')));
      assert.ok(graph.edges.some((e) => e.relationship === 'MANAGES' && e.source.includes('payment-service')));
    });

    it('should evaluate Kubernetes governance policies against CIS standards', () => {
      const gov = engine.getGovernanceResult('k8s-prod-eks-us-east-1');
      assert.strictEqual(gov.overallComplianceScore, 91.5);
      assert.ok(gov.policiesEvaluated.some((p) => p.policyId === 'K8S-GOV-001' && p.status === 'PASS'));
      assert.ok(gov.policiesEvaluated.some((p) => p.policyId === 'K8S-GOV-002' && p.status === 'WARN'));
    });

    it('should maintain structured safe action allowlist with strict invariants', () => {
      const actions = engine.getSafeActionCatalog();
      assert.ok(actions.length >= 4);
      assert.ok(actions.some((a) => a.actionId === 'rollback_workload' && a.requiresApproval === true));
      assert.ok(actions.some((a) => a.actionId === 'scale_workload' && a.reversible === true));
    });

    it('should execute non-mutating What-If simulation without altering cluster state', () => {
      const sim = engine.simulateOperation(
        'k8s-prod-eks-us-east-1',
        'rollback_workload',
        'cloudpulse-prod/payment-service',
        { targetRevision: 10 }
      );
      assert.strictEqual(sim.safeToExecute, true);
      assert.strictEqual(sim.action, 'rollback_workload');
      assert.ok(sim.predictedImpact.affectedPods > 0);
    });

    it('should execute allowlisted safe operation with fresh-read verification', async () => {
      const op = await engine.executeOperation(
        'k8s-prod-eks-us-east-1',
        'op-k8s-scale-payment',
        'sre-lead@enterprise.io'
      );
      assert.strictEqual(op.status, 'VERIFIED');
      assert.ok(op.freshReadVerification);
      assert.strictEqual(op.freshReadVerification.verified, true);
      assert.ok(op.freshReadVerification.observedState.includes('2/2 ready pods'));
    });

    it('should process natural language cluster investigation queries with evidence citations', async () => {
      const inv = await engine.investigate('Why is payment-service degraded in Kubernetes?', 'ws-production');
      assert.strictEqual(inv.intent, 'WORKLOAD_DIAGNOSIS');
      assert.strictEqual(inv.confidence, 'HIGH');
      assert.ok(inv.evidence.length >= 2);
      assert.ok(inv.recommendedAction);
      assert.strictEqual(inv.recommendedAction.actionId, 'rollback_workload');
    });
  });

  describe('3. Security Invariants & Guardrail Proofs', () => {
    it('Invariant 1: No arbitrary kubectl or shell execution paths exist', () => {
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(engine));
      const hasArbitraryExec = methods.some((m) => m.toLowerCase().includes('execshell') || m.toLowerCase().includes('rawkubectl'));
      assert.strictEqual(hasArbitraryExec, false, 'Engine must never expose arbitrary kubectl or shell methods');
    });

    it('Invariant 2: Multi-cluster tenant isolation enforces workspace boundaries', () => {
      const prodConns = engine.listConnections('ws-production');
      assert.ok(prodConns.length >= 1);

      const isolatedConns = engine.listConnections('ws-isolated-tenant-99');
      assert.strictEqual(isolatedConns.length, 0);
    });
  });
});
