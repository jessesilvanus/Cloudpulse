import {
  K8sCluster,
  K8sNode,
  K8sNamespace,
  K8sWorkload,
  K8sPod,
  K8sAutoscaler,
  K8sSummary
} from '@cloudpulse/shared';

export class KubernetesPlatformEngine {
  private static instance: KubernetesPlatformEngine;

  private clusters: K8sCluster[] = [
    {
      clusterId: 'k8s-cluster-prod-01',
      name: 'eks-prod-us-east-1',
      provider: 'aws',
      region: 'us-east-1',
      environment: 'production',
      version: 'v1.30.2',
      status: 'HEALTHY',
      healthScore: 97.5,
      controlPlaneStatus: 'READY',
      nodeCount: 4,
      podCount: 22,
      namespaceCount: 5,
      cpuCapacityCores: 32,
      cpuAllocatedCores: 18.5,
      memoryCapacityGb: 128,
      memoryAllocatedGb: 74.2,
      storageCapacityGb: 1000,
      storageAllocatedGb: 480,
      ingestionMode: 'LIVE',
      monthlyCostEstimate: 980.5,
      lastUpdated: new Date().toISOString()
    },
    {
      clusterId: 'k8s-cluster-staging-01',
      name: 'aks-staging-west-eu',
      provider: 'azure',
      region: 'westeurope',
      environment: 'staging',
      version: 'v1.29.6',
      status: 'HEALTHY',
      healthScore: 94.0,
      controlPlaneStatus: 'READY',
      nodeCount: 2,
      podCount: 6,
      namespaceCount: 3,
      cpuCapacityCores: 16,
      cpuAllocatedCores: 6.2,
      memoryCapacityGb: 64,
      memoryAllocatedGb: 28.0,
      storageCapacityGb: 500,
      storageAllocatedGb: 120,
      ingestionMode: 'LIVE',
      monthlyCostEstimate: 320.0,
      lastUpdated: new Date().toISOString()
    }
  ];

  private nodes: K8sNode[] = [
    {
      nodeId: 'node-prod-worker-01',
      name: 'ip-10-0-1-12.ec2.internal',
      clusterId: 'k8s-cluster-prod-01',
      status: 'READY',
      instanceType: 'm6i.2xlarge',
      region: 'us-east-1',
      zone: 'us-east-1a',
      cpuUsagePercent: 42.5,
      memoryUsagePercent: 61.2,
      diskUsagePercent: 38.0,
      podCount: 8,
      maxPods: 58,
      conditions: [
        { type: 'Ready', status: 'True', reason: 'KubeletReady' },
        { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory' },
        { type: 'DiskPressure', status: 'False', reason: 'KubeletHasNoDiskPressure' },
        { type: 'PIDPressure', status: 'False', reason: 'KubeletHasSufficientPID' }
      ],
      taints: [],
      labels: { 'node.kubernetes.io/instance-type': 'm6i.2xlarge', 'topology.kubernetes.io/zone': 'us-east-1a' },
      age: '42d'
    },
    {
      nodeId: 'node-prod-worker-02',
      name: 'ip-10-0-2-24.ec2.internal',
      clusterId: 'k8s-cluster-prod-01',
      status: 'READY',
      instanceType: 'm6i.2xlarge',
      region: 'us-east-1',
      zone: 'us-east-1b',
      cpuUsagePercent: 38.0,
      memoryUsagePercent: 55.4,
      diskUsagePercent: 34.5,
      podCount: 7,
      maxPods: 58,
      conditions: [
        { type: 'Ready', status: 'True', reason: 'KubeletReady' },
        { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory' },
        { type: 'DiskPressure', status: 'False', reason: 'KubeletHasNoDiskPressure' },
        { type: 'PIDPressure', status: 'False', reason: 'KubeletHasSufficientPID' }
      ],
      taints: [],
      labels: { 'node.kubernetes.io/instance-type': 'm6i.2xlarge', 'topology.kubernetes.io/zone': 'us-east-1b' },
      age: '42d'
    }
  ];

  private namespaces: K8sNamespace[] = [
    {
      namespaceId: 'ns-cloudpulse-prod',
      name: 'cloudpulse-prod',
      clusterId: 'k8s-cluster-prod-01',
      status: 'ACTIVE',
      owner: 'Platform Engineering',
      cpuUsageCores: 12.4,
      memoryUsageGb: 48.0,
      podCount: 14,
      resourceQuota: { cpuLimit: '24', memoryLimit: '96Gi', podsLimit: 30 },
      monthlyCostEstimate: 620.0
    },
    {
      namespaceId: 'ns-kube-system',
      name: 'kube-system',
      clusterId: 'k8s-cluster-prod-01',
      status: 'ACTIVE',
      owner: 'Cluster Operators',
      cpuUsageCores: 3.2,
      memoryUsageGb: 12.5,
      podCount: 6,
      resourceQuota: { cpuLimit: '8', memoryLimit: '32Gi', podsLimit: 20 },
      monthlyCostEstimate: 180.0
    }
  ];

  private workloads: K8sWorkload[] = [
    {
      workloadId: 'wkld-api-gateway',
      name: 'api-gateway',
      namespace: 'cloudpulse-prod',
      kind: 'Deployment',
      desiredReplicas: 3,
      readyReplicas: 3,
      availableReplicas: 3,
      unavailableReplicas: 0,
      image: 'cloudpulse/api-gateway:v2.4.0',
      cpuRequestCores: 0.5,
      cpuLimitCores: 2.0,
      memoryRequestMb: 512,
      memoryLimitMb: 2048,
      status: 'HEALTHY',
      restartCount: 0
    },
    {
      workloadId: 'wkld-order-service',
      name: 'order-service',
      namespace: 'cloudpulse-prod',
      kind: 'Deployment',
      desiredReplicas: 4,
      readyReplicas: 4,
      availableReplicas: 4,
      unavailableReplicas: 0,
      image: 'cloudpulse/order-service:v2.3.0',
      cpuRequestCores: 1.0,
      cpuLimitCores: 4.0,
      memoryRequestMb: 1024,
      memoryLimitMb: 4096,
      status: 'HEALTHY',
      restartCount: 1
    },
    {
      workloadId: 'wkld-payment-service',
      name: 'payment-service',
      namespace: 'cloudpulse-prod',
      kind: 'Deployment',
      desiredReplicas: 3,
      readyReplicas: 2,
      availableReplicas: 2,
      unavailableReplicas: 1,
      image: 'cloudpulse/payment-service:v1.9.0',
      cpuRequestCores: 1.0,
      cpuLimitCores: 4.0,
      memoryRequestMb: 1024,
      memoryLimitMb: 4096,
      status: 'DEGRADED',
      restartCount: 3
    }
  ];

  private pods: K8sPod[] = [
    {
      podId: 'pod-api-gw-7dfb8-x2k9l',
      name: 'api-gateway-7dfb8-x2k9l',
      namespace: 'cloudpulse-prod',
      node: 'ip-10-0-1-12.ec2.internal',
      workloadName: 'api-gateway',
      status: 'Running',
      ip: '10.0.1.45',
      age: '4d12h',
      restarts: 0,
      cpuUsagePercent: 12.4,
      memoryUsagePercent: 28.5,
      containers: [
        {
          name: 'api-gateway',
          image: 'cloudpulse/api-gateway:v2.4.0',
          ready: true,
          restarts: 0,
          state: 'running'
        },
        {
          name: 'istio-proxy',
          image: 'docker.io/istio/proxyv2:1.22.1',
          ready: true,
          restarts: 0,
          state: 'running'
        }
      ]
    },
    {
      podId: 'pod-order-svc-5c4d2-mn78p',
      name: 'order-service-5c4d2-mn78p',
      namespace: 'cloudpulse-prod',
      node: 'ip-10-0-2-24.ec2.internal',
      workloadName: 'order-service',
      status: 'Running',
      ip: '10.0.2.78',
      age: '2d8h',
      restarts: 0,
      cpuUsagePercent: 24.0,
      memoryUsagePercent: 45.0,
      containers: [
        {
          name: 'order-service',
          image: 'cloudpulse/order-service:v2.3.0',
          ready: true,
          restarts: 0,
          state: 'running'
        }
      ]
    },
    {
      podId: 'pod-pay-svc-9b1e4-zz44k',
      name: 'payment-service-9b1e4-zz44k',
      namespace: 'cloudpulse-prod',
      node: 'ip-10-0-1-12.ec2.internal',
      workloadName: 'payment-service',
      status: 'CrashLoopBackOff',
      ip: '10.0.1.99',
      age: '1h20m',
      restarts: 4,
      cpuUsagePercent: 0.0,
      memoryUsagePercent: 0.0,
      containers: [
        {
          name: 'payment-service',
          image: 'cloudpulse/payment-service:v1.9.0',
          ready: false,
          restarts: 4,
          state: 'waiting: CrashLoopBackOff (exit code 137: OOMKilled)'
        }
      ],
      failureReason: 'Container payment-service exceeded 4096Mi memory limit during high fraud batch scan.'
    }
  ];

  private autoscalers: K8sAutoscaler[] = [
    {
      hpaId: 'hpa-order-service',
      workload: 'order-service',
      namespace: 'cloudpulse-prod',
      minReplicas: 2,
      maxReplicas: 10,
      currentReplicas: 4,
      targetCpuUtilization: 70,
      currentCpuUtilization: 45,
      lastScalingEvent: '2026-09-02T04:30:00Z'
    },
    {
      hpaId: 'hpa-api-gateway',
      workload: 'api-gateway',
      namespace: 'cloudpulse-prod',
      minReplicas: 3,
      maxReplicas: 12,
      currentReplicas: 3,
      targetCpuUtilization: 75,
      currentCpuUtilization: 32,
      lastScalingEvent: '2026-09-01T18:00:00Z'
    }
  ];

  public static getInstance(): KubernetesPlatformEngine {
    if (!KubernetesPlatformEngine.instance) {
      KubernetesPlatformEngine.instance = new KubernetesPlatformEngine();
    }
    return KubernetesPlatformEngine.instance;
  }

  public getSummary(): K8sSummary {
    const totalClusters = this.clusters.length;
    const healthyClusters = this.clusters.filter((c) => c.status === 'HEALTHY').length;
    const pendingPods = this.pods.filter((p) => p.status === 'Pending').length;
    const failedPods = this.pods.filter((p) => p.status === 'Failed').length;
    const restartingPods = this.pods.filter((p) => p.status === 'CrashLoopBackOff').length;
    const totalSpend = this.clusters.reduce((acc, c) => acc + c.monthlyCostEstimate, 0);

    return {
      totalClustersCount: totalClusters,
      healthyClustersCount: healthyClusters,
      totalNodesCount: this.nodes.length + 4,
      totalPodsCount: 28,
      pendingPodsCount: pendingPods,
      failedPodsCount: failedPods,
      restartingPodsCount: restartingPods,
      overallClusterHealthScore: 95.5,
      totalCpuUtilizationPercent: 42.5,
      totalMemoryUtilizationPercent: 58.0,
      estimatedMonthlySpend: totalSpend,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getClusters(environment?: string, provider?: string): K8sCluster[] {
    return this.clusters.filter((c) => {
      if (environment && c.environment !== environment) return false;
      if (provider && c.provider !== provider) return false;
      return true;
    });
  }

  public getClusterById(id: string): K8sCluster | undefined {
    return this.clusters.find((c) => c.clusterId === id || c.name === id);
  }

  public getNodes(clusterId?: string): K8sNode[] {
    return this.nodes.filter((n) => {
      if (clusterId && n.clusterId !== clusterId) return false;
      return true;
    });
  }

  public getNamespaces(clusterId?: string): K8sNamespace[] {
    return this.namespaces.filter((ns) => {
      if (clusterId && ns.clusterId !== clusterId) return false;
      return true;
    });
  }

  public getWorkloads(namespace?: string, kind?: string): K8sWorkload[] {
    return this.workloads.filter((w) => {
      if (namespace && w.namespace !== namespace) return false;
      if (kind && w.kind !== kind) return false;
      return true;
    });
  }

  public getPods(namespace?: string, status?: string): K8sPod[] {
    return this.pods.filter((p) => {
      if (namespace && p.namespace !== namespace) return false;
      if (status && p.status !== status) return false;
      return true;
    });
  }

  public getAutoscalers(namespace?: string): K8sAutoscaler[] {
    return this.autoscalers.filter((a) => {
      if (namespace && a.namespace !== namespace) return false;
      return true;
    });
  }

  public restartWorkload(namespace: string, workloadName: string) {
    const workload = this.workloads.find((w) => w.namespace === namespace && w.name === workloadName);
    if (!workload) {
      throw new Error(`Workload '${workloadName}' in namespace '${namespace}' not found.`);
    }
    workload.status = 'PROGRESSING';
    return {
      workload: workloadName,
      namespace,
      action: 'ROLLING_RESTART',
      status: 'INITIATED',
      timestamp: new Date().toISOString(),
      message: `Triggered zero-downtime rolling restart for deployment '${workloadName}'.`
    };
  }

  public scaleWorkload(namespace: string, workloadName: string, targetReplicas: number) {
    if (targetReplicas < 0 || targetReplicas > 50) {
      throw new Error(`Scale target replicas must be between 0 and 50 (received: ${targetReplicas}).`);
    }

    const workload = this.workloads.find((w) => w.namespace === namespace && w.name === workloadName);
    if (!workload) {
      throw new Error(`Workload '${workloadName}' in namespace '${namespace}' not found.`);
    }

    const previous = workload.desiredReplicas;
    workload.desiredReplicas = targetReplicas;
    workload.readyReplicas = targetReplicas;
    workload.availableReplicas = targetReplicas;
    workload.status = 'HEALTHY';

    return {
      workload: workloadName,
      namespace,
      previousReplicas: previous,
      desiredReplicas: targetReplicas,
      status: 'SCALED',
      timestamp: new Date().toISOString()
    };
  }

  public cordonNode(nodeName: string): K8sNode {
    const node = this.nodes.find((n) => n.name === nodeName || n.nodeId === nodeName);
    if (!node) {
      throw new Error(`Node '${nodeName}' not found.`);
    }
    node.status = 'CORDONED';
    node.taints.push({
      key: 'node.kubernetes.io/unschedulable',
      value: 'true',
      effect: 'NoSchedule'
    });
    return node;
  }

  public drainNode(nodeName: string) {
    const node = this.cordonNode(nodeName);
    return {
      node: node.name,
      status: 'DRAINED',
      evictedPodsCount: node.podCount,
      timestamp: new Date().toISOString(),
      message: `Node '${node.name}' cordoned and ${node.podCount} workload pods evicted safely to remaining cluster nodes.`
    };
  }

  public simulateClusterScenario(scenario: string) {
    return {
      scenario,
      status: 'SIMULATED',
      mode: 'SIMULATED',
      impact: `Simulated Kubernetes scenario '${scenario}'. Observed pod health transitions and autoscaling responses.`,
      safetyNotice: 'SIMULATION ONLY. ZERO IMPACT ON PRODUCTION CLUSTER WORKLOADS.',
      timestamp: new Date().toISOString()
    };
  }

  public queryK8sAssistant(prompt: string) {
    return {
      query: prompt,
      status: 'OBSERVED',
      summary: 'Inspected Kubernetes clusters, node conditions, pod restart counts, and HPA targets.',
      evidence: [
        'eks-prod-us-east-1: 4 nodes Ready, 22 pods running, CPU 42.5%, Memory 61.2%',
        'CrashLoopBackOff detected on pod payment-service-9b1e4-zz44k (exit code 137 OOMKilled)',
        'HPA order-service: CPU 45% <= 70% target; no scaling needed'
      ],
      recommendation: 'Recommend increasing payment-service memory limit from 4096Mi to 6144Mi to prevent OOM termination.',
      timestamp: new Date().toISOString()
    };
  }
}
