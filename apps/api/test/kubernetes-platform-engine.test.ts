import { describe, it } from 'node:test';
import assert from 'node:assert';
import { KubernetesPlatformEngine } from '../src/services/kubernetes-platform-engine.js';

describe('CLOUDPULSE Phase 33 Kubernetes Platform & Workload Orchestration Engine', () => {
  const engine = KubernetesPlatformEngine.getInstance();

  it('should return Kubernetes platform summary with health score and resource allocations', () => {
    const summary = engine.getSummary();
    assert.strictEqual(summary.overallClusterHealthScore, 95.5);
    assert.strictEqual(summary.totalClustersCount, 2);
    assert.strictEqual(summary.healthyClustersCount, 2);
    assert.strictEqual(summary.totalNodesCount, 6);
    assert.strictEqual(summary.totalPodsCount, 28);
    assert.strictEqual(summary.restartingPodsCount, 1);
    assert.strictEqual(summary.totalCpuUtilizationPercent, 42.5);
  });

  it('should list clusters with node counts, versions, and honest LIVE/SIMULATED ingestion modes', () => {
    const clusters = engine.getClusters('production');
    assert.strictEqual(clusters.length, 1);

    const eks = clusters[0];
    assert.ok(eks);
    assert.strictEqual(eks.name, 'eks-prod-us-east-1');
    assert.strictEqual(eks.provider, 'aws');
    assert.strictEqual(eks.version, 'v1.30.2');
    assert.strictEqual(eks.status, 'HEALTHY');
    assert.strictEqual(eks.nodeCount, 4);
    assert.strictEqual(eks.ingestionMode, 'LIVE');
  });

  it('should retrieve specific cluster by ID with capacity breakdown', () => {
    const cluster = engine.getClusterById('k8s-cluster-prod-01');
    assert.ok(cluster);
    assert.strictEqual(cluster.name, 'eks-prod-us-east-1');
    assert.strictEqual(cluster.cpuCapacityCores, 32);
    assert.strictEqual(cluster.memoryCapacityGb, 128);
    assert.ok(cluster.monthlyCostEstimate > 0);
  });

  it('should query cluster nodes with Ready conditions, instance types, and pod counts', () => {
    const nodes = engine.getNodes('k8s-cluster-prod-01');
    assert.ok(nodes.length >= 2);

    const worker = nodes[0];
    assert.ok(worker);
    assert.strictEqual(worker.status, 'READY');
    assert.strictEqual(worker.instanceType, 'm6i.2xlarge');
    assert.ok(worker.conditions.some((c) => c.type === 'Ready' && c.status === 'True'));
  });

  it('should list namespaces with resource quotas and monthly cost estimates', () => {
    const namespaces = engine.getNamespaces('k8s-cluster-prod-01');
    assert.ok(namespaces.length >= 2);

    const prodNs = namespaces.find((n) => n.name === 'cloudpulse-prod');
    assert.ok(prodNs);
    assert.strictEqual(prodNs.status, 'ACTIVE');
    assert.strictEqual(prodNs.resourceQuota.cpuLimit, '24');
    assert.strictEqual(prodNs.monthlyCostEstimate, 620.0);
  });

  it('should query workloads across Deployments with desired and available replicas', () => {
    const workloads = engine.getWorkloads('cloudpulse-prod', 'Deployment');
    assert.ok(workloads.length >= 3);

    const gw = workloads.find((w) => w.name === 'api-gateway');
    assert.ok(gw);
    assert.strictEqual(gw.desiredReplicas, 3);
    assert.strictEqual(gw.availableReplicas, 3);
    assert.strictEqual(gw.status, 'HEALTHY');
  });

  it('should query pods and identify CrashLoopBackOff failure reason and exit code', () => {
    const pods = engine.getPods('cloudpulse-prod');
    assert.ok(pods.length >= 3);

    const crashingPod = pods.find((p) => p.status === 'CrashLoopBackOff');
    assert.ok(crashingPod);
    assert.strictEqual(crashingPod.workloadName, 'payment-service');
    assert.ok(crashingPod.failureReason?.includes('exit code 137: OOMKilled') || crashingPod.failureReason?.includes('4096Mi'));
    assert.strictEqual(crashingPod.restarts, 4);
  });

  it('should query Horizontal Pod Autoscalers (HPA) with CPU utilization targets', () => {
    const hpas = engine.getAutoscalers('cloudpulse-prod');
    assert.ok(hpas.length >= 2);

    const orderHpa = hpas.find((h) => h.workload === 'order-service');
    assert.ok(orderHpa);
    assert.strictEqual(orderHpa.minReplicas, 2);
    assert.strictEqual(orderHpa.maxReplicas, 10);
    assert.strictEqual(orderHpa.targetCpuUtilization, 70);
  });

  it('should trigger zero-downtime rolling restart for a deployment', () => {
    const result = engine.restartWorkload('cloudpulse-prod', 'order-service');
    assert.strictEqual(result.action, 'ROLLING_RESTART');
    assert.strictEqual(result.status, 'INITIATED');
    assert.ok(result.message.includes('order-service'));
  });

  it('should scale workload replicas with validation safeguards', () => {
    const scaled = engine.scaleWorkload('cloudpulse-prod', 'api-gateway', 5);
    assert.strictEqual(scaled.desiredReplicas, 5);
    assert.strictEqual(scaled.status, 'SCALED');

    // Invalid replicas (> 50)
    assert.throws(
      () => {
        engine.scaleWorkload('cloudpulse-prod', 'api-gateway', 100);
      },
      /Scale target replicas must be between 0 and 50/
    );
  });

  it('should cordon and drain worker nodes safely', () => {
    const cordoned = engine.cordonNode('ip-10-0-1-12.ec2.internal');
    assert.strictEqual(cordoned.status, 'CORDONED');
    assert.ok(cordoned.taints.some((t) => t.key === 'node.kubernetes.io/unschedulable'));

    const drained = engine.drainNode('ip-10-0-1-12.ec2.internal');
    assert.strictEqual(drained.status, 'DRAINED');
    assert.ok(drained.evictedPodsCount >= 0);
  });

  it('should simulate cluster scenario with honest SIMULATED notice', () => {
    const sim = engine.simulateClusterScenario('Worker node disk pressure');
    assert.strictEqual(sim.mode, 'SIMULATED');
    assert.strictEqual(sim.status, 'SIMULATED');
    assert.ok(sim.safetyNotice.includes('SIMULATION ONLY'));
  });

  it('should answer natural language cluster queries with grounded evidence citations', () => {
    const ans = engine.queryK8sAssistant('Why is payment-service pod restarting?');
    assert.strictEqual(ans.status, 'OBSERVED');
    assert.ok(ans.evidence.length >= 3);
    assert.ok(ans.recommendation.includes('payment-service memory limit'));
  });
});
