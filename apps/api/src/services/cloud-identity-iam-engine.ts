import {
  CloudIdentityRecord,
  CloudIamRole,
  CloudIamPolicy,
  CloudAccessRequest,
  CloudIamEvaluation,
  CloudIdentitySummary
} from '@cloudpulse/shared';

export class CloudIdentityIamEngine {
  private static instance: CloudIdentityIamEngine;

  private identities: CloudIdentityRecord[] = [
    {
      identityId: 'id-human-alice',
      name: 'alice.chen@enterprise.io',
      type: 'HUMAN',
      provider: 'okta',
      account: 'acc-aws-prod-01',
      owner: 'Core Backend Team',
      status: 'ACTIVE',
      risk: 'LOW',
      lastUsed: '2026-09-02T06:30:00Z',
      createdAt: '2026-01-15T08:00:00Z',
      authenticationMethod: 'OIDC',
      mfaStatus: 'ENABLED',
      privilegeLevel: 'DEVELOPER',
      environment: 'production',
      roles: ['Role-Developer'],
      tags: { department: 'Engineering', team: 'Backend' }
    },
    {
      identityId: 'id-human-bob',
      name: 'bob.operator@enterprise.io',
      type: 'HUMAN',
      provider: 'okta',
      account: 'acc-aws-prod-01',
      owner: 'Platform Operations',
      status: 'ACTIVE',
      risk: 'LOW',
      lastUsed: '2026-09-02T07:15:00Z',
      createdAt: '2026-01-10T08:00:00Z',
      authenticationMethod: 'SAML',
      mfaStatus: 'ENABLED',
      privilegeLevel: 'OPERATOR',
      environment: 'production',
      roles: ['Role-Operator'],
      tags: { department: 'Platform', oncall: 'primary' }
    },
    {
      identityId: 'id-human-charlie',
      name: 'charlie.admin@enterprise.io',
      type: 'HUMAN',
      provider: 'okta',
      account: 'acc-aws-prod-01',
      owner: 'Cloud Security Office',
      status: 'ACTIVE',
      risk: 'HIGH',
      lastUsed: '2026-09-01T14:20:00Z',
      createdAt: '2025-11-01T08:00:00Z',
      authenticationMethod: 'SAML',
      mfaStatus: 'ENABLED',
      privilegeLevel: 'ADMIN',
      environment: 'production',
      roles: ['Role-Admin'],
      tags: { department: 'Security', tier: 'break-glass' }
    },
    {
      identityId: 'id-svc-api-gw',
      name: 'svc-api-gateway',
      type: 'SERVICE',
      provider: 'cloudpulse',
      account: 'acc-aws-prod-01',
      owner: 'Platform Engineering',
      status: 'ACTIVE',
      risk: 'LOW',
      lastUsed: '2026-09-02T07:45:00Z',
      createdAt: '2026-02-01T00:00:00Z',
      authenticationMethod: 'CERTIFICATE',
      mfaStatus: 'EXEMPT',
      privilegeLevel: 'OPERATOR',
      environment: 'production',
      roles: ['Role-Service-Ingress'],
      tags: { app: 'api-gateway', mesh: 'istio' }
    },
    {
      identityId: 'id-svc-order',
      name: 'svc-order-orchestrator',
      type: 'SERVICE',
      provider: 'cloudpulse',
      account: 'acc-aws-prod-01',
      owner: 'Core Backend Team',
      status: 'ACTIVE',
      risk: 'LOW',
      lastUsed: '2026-09-02T07:45:00Z',
      createdAt: '2026-02-01T00:00:00Z',
      authenticationMethod: 'CERTIFICATE',
      mfaStatus: 'EXEMPT',
      privilegeLevel: 'DEVELOPER',
      environment: 'production',
      roles: ['Role-Service-Order'],
      tags: { app: 'order-service' }
    },
    {
      identityId: 'id-svc-payment',
      name: 'svc-payment-processor',
      type: 'SERVICE',
      provider: 'cloudpulse',
      account: 'acc-aws-prod-01',
      owner: 'FinOps & Payments',
      status: 'ACTIVE',
      risk: 'MEDIUM',
      lastUsed: '2026-09-02T07:40:00Z',
      createdAt: '2026-02-01T00:00:00Z',
      authenticationMethod: 'CERTIFICATE',
      mfaStatus: 'EXEMPT',
      privilegeLevel: 'OPERATOR',
      environment: 'production',
      roles: ['Role-Service-Payment'],
      tags: { app: 'payment-service', pci: 'scope' }
    },
    {
      identityId: 'id-wkld-order-sa',
      name: 'system:serviceaccount:cloudpulse-prod:order-sa',
      type: 'WORKLOAD',
      provider: 'kubernetes',
      account: 'eks-prod-us-east-1',
      owner: 'Core Backend Team',
      status: 'ACTIVE',
      risk: 'LOW',
      lastUsed: '2026-09-02T07:45:00Z',
      createdAt: '2026-03-01T00:00:00Z',
      authenticationMethod: 'SERVICE_TOKEN',
      mfaStatus: 'EXEMPT',
      privilegeLevel: 'DEVELOPER',
      environment: 'production',
      roles: ['Role-K8s-Workload'],
      tags: { namespace: 'cloudpulse-prod' }
    },
    {
      identityId: 'id-wkld-gateway-sa',
      name: 'system:serviceaccount:cloudpulse-prod:gateway-sa',
      type: 'WORKLOAD',
      provider: 'kubernetes',
      account: 'eks-prod-us-east-1',
      owner: 'Platform Core',
      status: 'ACTIVE',
      risk: 'LOW',
      lastUsed: '2026-09-02T07:45:00Z',
      createdAt: '2026-03-01T00:00:00Z',
      authenticationMethod: 'SERVICE_TOKEN',
      mfaStatus: 'EXEMPT',
      privilegeLevel: 'OPERATOR',
      environment: 'production',
      roles: ['Role-K8s-Workload'],
      tags: { namespace: 'cloudpulse-prod' }
    }
  ];

  private roles: CloudIamRole[] = [
    {
      roleId: 'role-admin',
      name: 'Role-Admin',
      provider: 'cloudpulse',
      type: 'Admin',
      permissions: ['*'],
      assignedCount: 1,
      riskScore: 92.0,
      hasWildcard: true,
      status: 'ACTIVE'
    },
    {
      roleId: 'role-operator',
      name: 'Role-Operator',
      provider: 'cloudpulse',
      type: 'Operator',
      permissions: ['k8s:workloads:restart', 'k8s:workloads:scale', 'mesh:traffic:split', 'sre:runbooks:execute'],
      assignedCount: 2,
      riskScore: 35.0,
      hasWildcard: false,
      status: 'ACTIVE'
    },
    {
      roleId: 'role-developer',
      name: 'Role-Developer',
      provider: 'cloudpulse',
      type: 'Developer',
      permissions: ['k8s:pods:get', 'k8s:logs:get', 'traces:get', 'metrics:get'],
      assignedCount: 2,
      riskScore: 12.0,
      hasWildcard: false,
      status: 'ACTIVE'
    }
  ];

  private policies: CloudIamPolicy[] = [
    {
      policyId: 'pol-deny-prod-db-delete',
      name: 'DenyProductionDatabaseDeletion',
      version: 'v1.0.0',
      effect: 'DENY',
      actions: ['rds:DeleteDBInstance', 'dynamodb:DeleteTable', 'database:delete'],
      resources: ['arn:aws:rds:*:*:db/order-db-primary', 'arn:aws:dynamodb:*:*:table/payments-*'],
      conditions: { environment: 'production' },
      isAttached: true
    },
    {
      policyId: 'pol-allow-k8s-read',
      name: 'AllowKubernetesReadTelemetry',
      version: 'v1.1.0',
      effect: 'ALLOW',
      actions: ['k8s:pods:get', 'k8s:logs:get', 'metrics:get', 'traces:get'],
      resources: ['*'],
      conditions: {},
      isAttached: true
    }
  ];

  private accessRequests: CloudAccessRequest[] = [
    {
      requestId: 'req-jit-2026-081',
      requester: 'alice.chen@enterprise.io',
      resource: 'arn:aws:rds:us-east-1:123456789012:db/order-db-primary',
      permission: 'database:read-schema',
      reason: 'Emergency database migration schema debugging for v2.4 rollout.',
      durationMinutes: 30,
      risk: 'MEDIUM',
      status: 'PENDING',
      createdAt: '2026-09-02T07:20:00Z'
    }
  ];

  public static getInstance(): CloudIdentityIamEngine {
    if (!CloudIdentityIamEngine.instance) {
      CloudIdentityIamEngine.instance = new CloudIdentityIamEngine();
    }
    return CloudIdentityIamEngine.instance;
  }

  public getSummary(): CloudIdentitySummary {
    const humans = this.identities.filter((i) => i.type === 'HUMAN').length;
    const services = this.identities.filter((i) => i.type === 'SERVICE').length;
    const workloads = this.identities.filter((i) => i.type === 'WORKLOAD').length;
    const privileged = this.identities.filter((i) => i.privilegeLevel === 'ADMIN' || i.privilegeLevel === 'OPERATOR').length;
    const highRisk = this.identities.filter((i) => i.risk === 'HIGH' || i.risk === 'CRITICAL').length;
    const humanMfaEnabled = this.identities.filter((i) => i.type === 'HUMAN' && i.mfaStatus === 'ENABLED').length;
    const mfaCompliance = humans > 0 ? (humanMfaEnabled / humans) * 100 : 100;

    return {
      totalIdentitiesCount: this.identities.length,
      humanIdentitiesCount: humans,
      serviceIdentitiesCount: services,
      workloadIdentitiesCount: workloads,
      privilegedIdentitiesCount: privileged,
      highRiskIdentitiesCount: highRisk,
      mfaCompliancePercent: mfaCompliance,
      leastPrivilegeScore: 94.2,
      activeAccessRequestsCount: this.accessRequests.filter((r) => r.status === 'PENDING').length,
      evaluatedAt: new Date().toISOString()
    };
  }

  public getIdentities(type?: string, risk?: string, provider?: string): CloudIdentityRecord[] {
    return this.identities.filter((i) => {
      if (type && i.type !== type) return false;
      if (risk && i.risk !== risk) return false;
      if (provider && i.provider !== provider) return false;
      return true;
    });
  }

  public getIdentityById(id: string): CloudIdentityRecord | undefined {
    return this.identities.find((i) => i.identityId === id || i.name === id);
  }

  public getRoles(): CloudIamRole[] {
    return this.roles;
  }

  public getPolicies(): CloudIamPolicy[] {
    return this.policies;
  }

  public evaluateAccess(identityName: string, action: string, resource: string, _context?: any): CloudIamEvaluation {
    const identity = this.identities.find((i) => i.name === identityName || i.identityId === identityName);
    if (!identity) {
      return {
        decision: 'DENY',
        identity: identityName,
        action,
        resource,
        matchedPolicies: [],
        denialReason: `Identity '${identityName}' not recognized.`,
        mfaRequired: true,
        approvalRequired: false,
        riskLevel: 'HIGH',
        timestamp: new Date().toISOString()
      };
    }

    // Check explicit deny policies (e.g. database delete in prod)
    if (action.toLowerCase().includes('delete') && resource.toLowerCase().includes('order-db-primary')) {
      return {
        decision: 'DENY',
        identity: identity.name,
        action,
        resource,
        matchedPolicies: ['DenyProductionDatabaseDeletion'],
        denialReason: 'Explicit DENY: Production database deletion is strictly prohibited by policy DenyProductionDatabaseDeletion.',
        mfaRequired: true,
        approvalRequired: true,
        riskLevel: 'CRITICAL',
        timestamp: new Date().toISOString()
      };
    }

    // Check admin privilege
    if (identity.privilegeLevel === 'ADMIN') {
      return {
        decision: 'ALLOW',
        identity: identity.name,
        action,
        resource,
        matchedPolicies: ['Role-Admin-FullAccess'],
        mfaRequired: true,
        approvalRequired: false,
        riskLevel: 'LOW',
        timestamp: new Date().toISOString()
      };
    }

    // Check operator privileges
    if (identity.privilegeLevel === 'OPERATOR') {
      if (action.startsWith('k8s:workloads') || action.startsWith('mesh:traffic') || action.startsWith('sre:')) {
        return {
          decision: 'ALLOW',
          identity: identity.name,
          action,
          resource,
          matchedPolicies: ['Role-Operator-ExecutionPolicy'],
          mfaRequired: true,
          approvalRequired: false,
          riskLevel: 'LOW',
          timestamp: new Date().toISOString()
        };
      }
    }

    // Check developer read privileges
    if (action.includes(':get') || action.includes(':read') || action === 'metrics:get' || action === 'traces:get') {
      return {
        decision: 'ALLOW',
        identity: identity.name,
        action,
        resource,
        matchedPolicies: ['AllowKubernetesReadTelemetry'],
        mfaRequired: false,
        approvalRequired: false,
        riskLevel: 'LOW',
        timestamp: new Date().toISOString()
      };
    }

    return {
      decision: 'CONDITIONAL',
      identity: identity.name,
      action,
      resource,
      matchedPolicies: [],
      denialReason: 'Action requires elevated Just-In-Time approval request.',
      mfaRequired: true,
      approvalRequired: true,
      riskLevel: 'MEDIUM',
      timestamp: new Date().toISOString()
    };
  }

  public getAccessRequests(status?: string): CloudAccessRequest[] {
    return this.accessRequests.filter((r) => {
      if (status && r.status !== status) return false;
      return true;
    });
  }

  public createAccessRequest(payload: {
    requester: string;
    resource: string;
    permission: string;
    reason: string;
    durationMinutes: number;
  }): CloudAccessRequest {
    const req: CloudAccessRequest = {
      requestId: `req-jit-${Date.now()}`,
      requester: payload.requester,
      resource: payload.resource,
      permission: payload.permission,
      reason: payload.reason,
      durationMinutes: payload.durationMinutes || 30,
      risk: payload.resource.includes('production') || payload.permission.includes('admin') ? 'HIGH' : 'MEDIUM',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    this.accessRequests.push(req);
    return req;
  }

  public approveAccessRequest(requestId: string, approver: string): CloudAccessRequest {
    const req = this.accessRequests.find((r) => r.requestId === requestId);
    if (!req) {
      throw new Error(`Access request '${requestId}' not found.`);
    }
    if (req.requester === approver) {
      throw new Error(`Separation of duties violation: Requester '${req.requester}' cannot self-approve access request.`);
    }

    req.status = 'APPROVED';
    req.approver = approver;
    const expiry = new Date(Date.now() + req.durationMinutes * 60 * 1000);
    req.expiresAt = expiry.toISOString();
    return req;
  }

  public denyAccessRequest(requestId: string, reason?: string): CloudAccessRequest {
    const req = this.accessRequests.find((r) => r.requestId === requestId);
    if (!req) {
      throw new Error(`Access request '${requestId}' not found.`);
    }
    req.status = 'DENIED';
    if (reason) {
      req.reason = `${req.reason} (Denial rationale: ${reason})`;
    }
    return req;
  }

  public getLeastPrivilegeFindings() {
    return [
      {
        findingId: 'find-iam-01',
        role: 'Role-Admin',
        type: 'WILDCARD_PERMISSION',
        severity: 'HIGH',
        recommendation: 'Replace wildcard Action "*" with scoped resource-specific IAM actions.',
        unusedPermissionsPercent: 45.0
      },
      {
        findingId: 'find-iam-02',
        role: 'Role-Developer',
        type: 'UNUSED_PERMISSION',
        severity: 'LOW',
        recommendation: 'Remove unused permission "cloudwatch:PutMetricData" (not exercised in 90 days).',
        unusedPermissionsPercent: 12.5
      }
    ];
  }

  public queryIamAssistant(prompt: string) {
    return {
      query: prompt,
      status: 'OBSERVED',
      summary: 'Evaluated cloud identity inventory, least privilege risk scores, and JIT access records.',
      evidence: [
        '8 active identities: 3 humans (100% MFA enabled), 3 services, 2 Kubernetes workload SAs',
        '1 pending JIT access request: alice.chen requesting 30min schema read for order-db-primary',
        'Explicit deny policy active: Production database deletion blocked for all non-emergency roles'
      ],
      recommendation: 'Approve JIT request req-jit-2026-081 after verifying change ticket approval.',
      timestamp: new Date().toISOString()
    };
  }
}
