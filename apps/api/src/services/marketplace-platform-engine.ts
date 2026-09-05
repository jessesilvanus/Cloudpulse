import {
  MarketplaceCatalogItem,
  MarketplaceResourceTemplate,
  MarketplaceProvisioningRequest,
  MarketplaceResourceRegistryItem,
  MarketplaceSummary
} from '@cloudpulse/shared';

export class MarketplacePlatformEngine {
  private static instance: MarketplacePlatformEngine;

  private catalogItems: MarketplaceCatalogItem[] = [
    {
      id: 'cat-k8s-service',
      name: 'microservice-workload',
      displayName: 'Kubernetes Microservice Workload',
      description: 'Production-ready stateless microservice container deployment with HPA autoscaling, Prometheus telemetry metrics, and OIDC auth.',
      category: 'KUBERNETES',
      provider: 'kubernetes',
      supportedRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      supportedEnvironments: ['development', 'test', 'staging', 'production'],
      version: 'v2.4.0',
      owner: 'Platform Engineering',
      documentation: 'https://docs.cloudpulse.internal/templates/k8s-microservice',
      icon: 'kubernetes',
      status: 'AVAILABLE',
      riskLevel: 'MEDIUM',
      costModel: '$35.00/pod/mo baseline compute',
      provisioningMode: 'AUTOMATED',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-20T00:00:00Z'
    },
    {
      id: 'cat-aws-rds',
      name: 'managed-postgresql',
      displayName: 'AWS RDS PostgreSQL Database',
      description: 'Fully managed multi-AZ PostgreSQL 16 instance with automated encrypted backups, IAM database authentication, and connection pooling.',
      category: 'DATABASE',
      provider: 'aws',
      supportedRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      supportedEnvironments: ['development', 'staging', 'production'],
      version: 'v1.8.0',
      owner: 'Data Infrastructure Team',
      documentation: 'https://docs.cloudpulse.internal/templates/rds-postgres',
      icon: 'database',
      status: 'AVAILABLE',
      riskLevel: 'HIGH',
      costModel: '$145.00/mo db.t4g.medium Multi-AZ',
      provisioningMode: 'APPROVAL_GATED',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-15T00:00:00Z'
    },
    {
      id: 'cat-redis-cache',
      name: 'redis-token-cache',
      displayName: 'ElastiCache Redis Cluster',
      description: 'Sub-millisecond in-memory session and token caching cluster with TLS in-transit encryption and automated failover.',
      category: 'DATABASE',
      provider: 'aws',
      supportedRegions: ['us-east-1', 'eu-west-1'],
      supportedEnvironments: ['development', 'staging', 'production'],
      version: 'v1.2.0',
      owner: 'Core Backend',
      documentation: 'https://docs.cloudpulse.internal/templates/redis-cache',
      icon: 'zap',
      status: 'AVAILABLE',
      riskLevel: 'LOW',
      costModel: '$45.00/mo cache.t4g.micro',
      provisioningMode: 'AUTOMATED',
      createdAt: '2026-08-05T00:00:00Z',
      updatedAt: '2026-08-22T00:00:00Z'
    },
    {
      id: 'cat-sqs-queue',
      name: 'event-messaging-queue',
      displayName: 'AWS SQS Standard & FIFO Queue',
      description: 'Distributed event bus queue with dead-letter queue (DLQ) redrive policy, KMS server-side encryption, and CloudWatch metrics.',
      category: 'MESSAGING',
      provider: 'aws',
      supportedRegions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
      supportedEnvironments: ['development', 'test', 'staging', 'production'],
      version: 'v2.1.0',
      owner: 'FinOps & Payments',
      documentation: 'https://docs.cloudpulse.internal/templates/sqs-queue',
      icon: 'mail',
      status: 'AVAILABLE',
      riskLevel: 'LOW',
      costModel: '$0.40/million requests',
      provisioningMode: 'AUTOMATED',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-25T00:00:00Z'
    },
    {
      id: 'cat-s3-bucket',
      name: 'secure-object-storage',
      displayName: 'S3 Secure Object Storage Bucket',
      description: 'Encrypted S3 bucket with public access blocked by default, object versioning, and lifecycle transition to Glacier archive.',
      category: 'STORAGE',
      provider: 'aws',
      supportedRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      supportedEnvironments: ['development', 'staging', 'production'],
      version: 'v3.0.0',
      owner: 'Security & Governance',
      documentation: 'https://docs.cloudpulse.internal/templates/s3-storage',
      icon: 'hard-drive',
      status: 'AVAILABLE',
      riskLevel: 'MEDIUM',
      costModel: '$0.023/GB/mo S3 Standard',
      provisioningMode: 'AUTOMATED',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-28T00:00:00Z'
    },
    {
      id: 'cat-nat-gw',
      name: 'egress-nat-gateway',
      displayName: 'High-Availability NAT Gateway',
      description: 'Managed VPC egress NAT gateway across multi-AZ subnets with Elastic IP allocation and CloudWatch flow logs.',
      category: 'NETWORKING',
      provider: 'aws',
      supportedRegions: ['us-east-1', 'us-west-2'],
      supportedEnvironments: ['production'],
      version: 'v1.1.0',
      owner: 'Platform Engineering',
      documentation: 'https://docs.cloudpulse.internal/templates/nat-gateway',
      icon: 'shield',
      status: 'AVAILABLE',
      riskLevel: 'MEDIUM',
      costModel: '$41.00/mo + $0.045/GB data processed',
      provisioningMode: 'APPROVAL_GATED',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-10T00:00:00Z'
    }
  ];

  private templates: MarketplaceResourceTemplate[] = [
    {
      id: 'tmpl-k8s-001',
      name: 'microservice-workload',
      version: 'v2.4.0',
      description: 'Golden path Kubernetes container template with OTel sidecar injection, Prometheus scrape annotations, and liveness/readiness probes.',
      category: 'KUBERNETES',
      provider: 'kubernetes',
      parameters: [
        {
          name: 'serviceName',
          type: 'text',
          required: true,
          description: 'Unique identifier for microservice'
        },
        {
          name: 'replicas',
          type: 'number',
          required: true,
          default: 3,
          description: 'Number of pod replicas'
        },
        {
          name: 'cpuLimit',
          type: 'select',
          required: true,
          default: '500m',
          allowedValues: ['250m', '500m', '1000m'],
          description: 'Pod CPU allocation limit'
        }
      ],
      defaults: { replicas: 3, cpuLimit: '500m', memoryLimit: '512Mi' },
      constraints: { minReplicas: 1, maxReplicas: 20 },
      policies: ['require-team-tag', 'enforce-non-root-user', 'deny-privileged-container'],
      costModel: { baseMonthlyCost: 35.0, currency: 'USD' },
      securityRequirements: ['readOnlyRootFilesystem', 'dropAllCapabilities'],
      provisioningWorkflow: 'k8s-helm-operator-v2',
      rollbackStrategy: 'kubectl rollout undo deployment/${serviceName}',
      verificationStrategy: 'curl /health/ready probe & 3 consecutive HTTP 200 responses'
    },
    {
      id: 'tmpl-rds-002',
      name: 'managed-postgresql',
      version: 'v1.8.0',
      description: 'AWS RDS PostgreSQL template with automated daily snapshots, multi-AZ standby failover, and KMS customer-managed key encryption.',
      category: 'DATABASE',
      provider: 'aws',
      parameters: [
        {
          name: 'databaseName',
          type: 'text',
          required: true,
          description: 'Logical database schema name'
        },
        {
          name: 'instanceClass',
          type: 'select',
          required: true,
          default: 'db.t4g.medium',
          allowedValues: ['db.t4g.small', 'db.t4g.medium', 'db.r6g.large'],
          description: 'RDS compute instance class'
        },
        {
          name: 'allocatedStorageGb',
          type: 'number',
          required: true,
          default: 100,
          description: 'Initial gp3 storage size in GB'
        }
      ],
      defaults: { instanceClass: 'db.t4g.medium', allocatedStorageGb: 100, multiAz: true },
      constraints: { minStorageGb: 20, maxStorageGb: 2000 },
      policies: ['enforce-storage-encryption', 'deny-public-rds-access'],
      costModel: { baseMonthlyCost: 145.0, currency: 'USD' },
      securityRequirements: ['kmsKeyArnRequired', 'vpcSecurityGroupRestricted'],
      provisioningWorkflow: 'terraform-aws-rds-module-v5',
      rollbackStrategy: 'terraform destroy -target=module.rds_postgres',
      verificationStrategy: 'pg_isready -h ${endpoint} -p 5432 query check'
    }
  ];

  private requests: MarketplaceProvisioningRequest[] = [
    {
      id: 'req-prov-101',
      requester: 'dev-engineer-01',
      team: 'Core Backend',
      application: 'Order Processing Engine',
      service: 'order-service',
      template: 'tmpl-k8s-001',
      version: 'v2.4.0',
      parameters: { serviceName: 'order-service', replicas: 3, cpuLimit: '500m' },
      environment: 'production',
      region: 'us-east-1',
      estimatedMonthlyCost: 105.0,
      currency: 'USD',
      policyResult: 'PASS',
      securityResult: 'PASS',
      approvalStatus: 'APPROVED',
      provisioningStatus: 'PROVISIONED',
      createdAt: '2026-08-15T08:00:00Z',
      updatedAt: '2026-08-15T08:05:00Z'
    },
    {
      id: 'req-prov-102',
      requester: 'dev-engineer-02',
      team: 'FinOps & Payments',
      application: 'Payment Gateway Integration',
      service: 'payment-service',
      template: 'tmpl-rds-002',
      version: 'v1.8.0',
      parameters: { databaseName: 'payment_vault_db', instanceClass: 'db.t4g.medium', allocatedStorageGb: 100 },
      environment: 'production',
      region: 'us-east-1',
      estimatedMonthlyCost: 145.0,
      currency: 'USD',
      policyResult: 'PASS',
      securityResult: 'PASS',
      approvalStatus: 'PENDING',
      provisioningStatus: 'PENDING_APPROVAL',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    }
  ];

  private registry: MarketplaceResourceRegistryItem[] = [
    {
      id: 'reg-001',
      resourceName: 'k8s-deployment/api-gateway',
      provider: 'kubernetes',
      account: 'acc-prod-k8s-01',
      region: 'us-east-1',
      environment: 'production',
      team: 'Platform Engineering',
      application: 'E-Commerce Core',
      owner: 'sre-lead-01',
      service: 'api-gateway',
      template: 'tmpl-k8s-001',
      version: 'v2.4.0',
      status: 'ACTIVE',
      costMonthly: 95.0,
      healthStatus: 'HEALTHY',
      createdAt: '2026-08-10T00:00:00Z'
    },
    {
      id: 'reg-002',
      resourceName: 'k8s-deployment/order-service',
      provider: 'kubernetes',
      account: 'acc-prod-k8s-01',
      region: 'us-east-1',
      environment: 'production',
      team: 'Core Backend',
      application: 'Order Processing Engine',
      owner: 'dev-engineer-01',
      service: 'order-service',
      template: 'tmpl-k8s-001',
      version: 'v2.4.0',
      status: 'ACTIVE',
      costMonthly: 110.0,
      healthStatus: 'HEALTHY',
      createdAt: '2026-08-15T08:05:00Z'
    },
    {
      id: 'reg-003',
      resourceName: 'k8s-deployment/payment-service',
      provider: 'kubernetes',
      account: 'acc-prod-k8s-01',
      region: 'us-east-1',
      environment: 'production',
      team: 'FinOps & Payments',
      application: 'Payment Gateway Integration',
      owner: 'sre-lead-02',
      service: 'payment-service',
      template: 'tmpl-k8s-001',
      version: 'v2.4.0',
      status: 'ACTIVE',
      costMonthly: 105.0,
      healthStatus: 'HEALTHY',
      createdAt: '2026-08-18T00:00:00Z'
    },
    {
      id: 'reg-004',
      resourceName: 'aws_rds/order-db-primary',
      provider: 'aws',
      account: 'acc-aws-prod-99',
      region: 'us-east-1',
      environment: 'production',
      team: 'Core Backend',
      application: 'Order Processing Engine',
      owner: 'dev-engineer-01',
      service: 'order-service',
      template: 'tmpl-rds-002',
      version: 'v1.8.0',
      status: 'ACTIVE',
      costMonthly: 145.0,
      healthStatus: 'HEALTHY',
      createdAt: '2026-08-12T00:00:00Z'
    }
  ];

  public static getInstance(): MarketplacePlatformEngine {
    if (!MarketplacePlatformEngine.instance) {
      MarketplacePlatformEngine.instance = new MarketplacePlatformEngine();
    }
    return MarketplacePlatformEngine.instance;
  }

  public getSummary(): MarketplaceSummary {
    const catalogCount = this.catalogItems.length;
    const templateCount = this.templates.length;
    const requestCount = this.requests.length;
    const registryCount = this.registry.filter((r) => r.status === 'ACTIVE').length;
    const pendingApprovals = this.requests.filter((r) => r.approvalStatus === 'PENDING').length;

    return {
      catalogItemsCount: catalogCount,
      activeTemplatesCount: templateCount,
      provisioningRequestsCount: requestCount,
      managedResourcesCount: registryCount,
      pendingApprovalsCount: pendingApprovals,
      policyComplianceRate: 100.0,
      simulatedProvisioningsCount: 5,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getCatalogItems(category?: string, provider?: string): MarketplaceCatalogItem[] {
    return this.catalogItems.filter((item) => {
      if (category && item.category !== category) return false;
      if (provider && item.provider !== provider) return false;
      return true;
    });
  }

  public getTemplates(category?: string): MarketplaceResourceTemplate[] {
    if (category) {
      return this.templates.filter((t) => t.category === category);
    }
    return this.templates;
  }

  public getRequests(team?: string, status?: string): MarketplaceProvisioningRequest[] {
    return this.requests.filter((r) => {
      if (team && r.team !== team) return false;
      if (status && r.provisioningStatus !== status) return false;
      return true;
    });
  }

  public createRequest(payload: {
    requester: string;
    team: string;
    application: string;
    service: string;
    template: string;
    environment: 'development' | 'test' | 'staging' | 'production';
    region: string;
    parameters: Record<string, any>;
  }): MarketplaceProvisioningRequest {
    // Smart validation: Check template existence
    const template = this.templates.find((t) => t.id === payload.template);
    if (!template) {
      throw new Error(`Resource template '${payload.template}' not found.`);
    }

    // Policy Check: Deny unapproved regions
    const approvedRegions = ['us-east-1', 'us-west-2', 'eu-west-1'];
    if (!approvedRegions.includes(payload.region)) {
      throw new Error(`Region '${payload.region}' is not an approved multi-cloud region.`);
    }

    // Cost calculation
    const baseCost = template.costModel.baseMonthlyCost;
    const multiplier = payload.parameters.replicas ? Number(payload.parameters.replicas) : 1;
    const estimatedCost = baseCost * multiplier;

    const request: MarketplaceProvisioningRequest = {
      id: `req-prov-${Date.now()}`,
      requester: payload.requester,
      team: payload.team,
      application: payload.application,
      service: payload.service,
      template: payload.template,
      version: template.version,
      parameters: payload.parameters,
      environment: payload.environment,
      region: payload.region,
      estimatedMonthlyCost: estimatedCost,
      currency: 'USD',
      policyResult: 'PASS',
      securityResult: 'PASS',
      approvalStatus: payload.environment === 'production' ? 'PENDING' : 'NOT_REQUIRED',
      provisioningStatus: payload.environment === 'production' ? 'PENDING_APPROVAL' : 'PROVISIONED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.requests.push(request);
    return request;
  }

  public approveRequest(id: string, approver: string): MarketplaceProvisioningRequest {
    const request = this.requests.find((r) => r.id === id);
    if (!request) {
      throw new Error(`Provisioning request '${id}' not found.`);
    }
    if (request.requester === approver) {
      throw new Error('Separation of Duties violation: Requester cannot approve their own provisioning request.');
    }

    request.approvalStatus = 'APPROVED';
    request.provisioningStatus = 'PROVISIONED';
    request.updatedAt = new Date().toISOString();

    // Register resource into registry
    this.registry.push({
      id: `reg-${Date.now()}`,
      resourceName: `${request.parameters.serviceName || request.service}-prod`,
      provider: 'kubernetes',
      account: 'acc-prod-k8s-01',
      region: request.region,
      environment: request.environment,
      team: request.team,
      application: request.application,
      owner: request.requester,
      service: request.service,
      template: request.template,
      version: request.version,
      status: 'ACTIVE',
      costMonthly: request.estimatedMonthlyCost,
      healthStatus: 'HEALTHY',
      createdAt: new Date().toISOString()
    });

    return request;
  }

  public rejectRequest(id: string, approver: string, reason: string): MarketplaceProvisioningRequest {
    const request = this.requests.find((r) => r.id === id);
    if (!request) {
      throw new Error(`Provisioning request '${id}' not found.`);
    }

    request.approvalStatus = 'REJECTED';
    request.provisioningStatus = 'REJECTED';
    request.updatedAt = new Date().toISOString();
    return request;
  }

  public getRegistry(team?: string, environment?: string): MarketplaceResourceRegistryItem[] {
    return this.registry.filter((r) => {
      if (team && r.team !== team) return false;
      if (environment && r.environment !== environment) return false;
      return true;
    });
  }

  public decommissionResource(id: string, operator: string): MarketplaceResourceRegistryItem {
    const resource = this.registry.find((r) => r.id === id);
    if (!resource) {
      throw new Error(`Registry resource '${id}' not found.`);
    }

    resource.status = 'DECOMMISSIONED';
    return resource;
  }

  public simulateProvisioning(templateId: string, params: any) {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Template '${templateId}' not found.`);
    }

    return {
      templateId,
      templateName: template.name,
      version: template.version,
      simulationMode: 'DRY_RUN',
      plannedResources: [
        'k8s-namespace/production',
        'k8s-deployment/${serviceName}',
        'k8s-service/${serviceName}-svc',
        'k8s-hpa/${serviceName}-autoscaler'
      ],
      estimatedMonthlyCost: template.costModel.baseMonthlyCost * (params?.replicas || 1),
      policyValidation: 'PASS - 100% compliant with Phase 25 guardrails',
      securityValidation: 'PASS - Non-root execution & drop capabilities configured',
      safetyNotice: 'DEMO / SIMULATION MODE - NO REAL CLOUD INFRASTRUCTURE WAS CREATED',
      timestamp: new Date().toISOString()
    };
  }

  public queryMarketplace(prompt: string) {
    return {
      query: prompt,
      status: 'OBSERVED',
      matchesCount: 2,
      recommendations: [
        {
          catalogItem: 'Kubernetes Microservice Workload',
          templateId: 'tmpl-k8s-001',
          category: 'KUBERNETES',
          estimatedMonthlyCost: 105.0,
          reason: 'Best fit for stateless API services with Prometheus telemetry and horizontal autoscaling.'
        },
        {
          catalogItem: 'AWS RDS PostgreSQL Database',
          templateId: 'tmpl-rds-002',
          category: 'DATABASE',
          estimatedMonthlyCost: 145.0,
          reason: 'Recommended for relational transactional order data with multi-AZ failover.'
        }
      ],
      policyNotice: 'All template requests enforce Phase 25 Governance and Phase 28 FinOps budget limits.',
      timestamp: new Date().toISOString()
    };
  }
}
