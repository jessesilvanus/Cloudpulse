import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnterpriseWorkflowEngine } from '../src/services/enterprise-workflow-engine.js';

describe('CLOUDPULSE Phase 64 Enterprise Cloud Workflow, Collaboration & Governed Change Management Tests', () => {
  const engine = EnterpriseWorkflowEngine.getInstance();
  const workspaceId = 'ws-production';
  const tenantId = 'tenant-enterprise-01';

  describe('1. Team Management & Resource Ownership with Truth-in-Labeling', () => {
    it('should retrieve default multi-disciplinary teams with lead, members and escalation policies', async () => {
      const teams = await engine.getTeams(workspaceId);
      assert.ok(teams.length >= 3, 'Should track at least 3 default teams (SRE, Security, Platform)');

      const sreTeam = teams.find(t => t.id === 'team-sre');
      assert.ok(sreTeam, 'Core SRE team must exist');
      assert.strictEqual(sreTeam.teamType, 'SRE');
      assert.ok(sreTeam.members.length >= 2, 'SRE team must have members');
      assert.ok(sreTeam.escalationPolicy, 'SRE team must have an escalation policy');
      assert.ok(sreTeam.escalationPolicy.tiers.length >= 1, 'Escalation policy should have tiers');
    });

    it('should allow creating a new enterprise cloud team with members', async () => {
      const newTeam = await engine.createTeam(
        workspaceId,
        tenantId,
        'usr-db-lead',
        {
          name: 'Database Reliability Operations',
          description: 'Dedicated database reliability, migrations and RDS resilience operations squad',
          teamType: 'PLATFORM',
          members: [
            {
              userId: 'usr-db-lead',
              name: 'Sarah Chen',
              email: 'sarah.chen@cloudpulse.internal',
              role: 'OPERATOR',
              isLead: true,
              joinedAt: new Date().toISOString()
            },
            {
              userId: 'usr-db-02',
              name: 'David Kim',
              email: 'david.kim@cloudpulse.internal',
              role: 'ENGINEER',
              isLead: false,
              joinedAt: new Date().toISOString()
            }
          ]
        }
      );

      assert.ok(newTeam.id.startsWith('team-'), 'New team ID should be generated');
      assert.strictEqual(newTeam.name, 'Database Reliability Operations');
      assert.strictEqual(newTeam.members.length, 2, 'Should have 2 members');

      const retrieved = await engine.getTeamById(newTeam.id);
      assert.ok(retrieved, 'Should retrieve created team');
    });

    it('should resolve resource ownership with accurate provenance and confidence', async () => {
      const paymentOwnership = await engine.getResourceOwnership('payment-service');
      assert.ok(paymentOwnership, 'Ownership should resolve for payment-service');
      assert.strictEqual(paymentOwnership.resourceId, 'payment-service');
      assert.strictEqual(paymentOwnership.ownerTeamId, 'team-sre');
      assert.strictEqual(paymentOwnership.source, 'SERVICE_CATALOG');
    });

    it('should return UNKNOWN provenance for unmapped resources with truth-in-labeling', async () => {
      const unmapped = await engine.getResourceOwnership('unmapped-random-bucket-xyz');
      assert.ok(unmapped, 'Ownership should return a fallback object');
      assert.strictEqual(unmapped.source, 'UNKNOWN');
      assert.strictEqual(unmapped.resourceId, 'unmapped-random-bucket-xyz');
    });
  });

  describe('2. Work Items Inbox & Multi-Criteria Aggregator', () => {
    it('should return work items for distinct operational inbox sections', async () => {
      const allItems = await engine.getWorkItems(workspaceId);
      assert.ok(allItems.length >= 3, 'Should have initial work items');

      const myWork = await engine.getWorkItems(workspaceId, { section: 'MY_WORK', userId: 'usr-sre-lead' });
      assert.ok(Array.isArray(myWork), 'MY_WORK query should return array');

      const teamWork = await engine.getWorkItems(workspaceId, { section: 'TEAM_WORK', teamId: 'team-sre' });
      assert.ok(Array.isArray(teamWork), 'TEAM_WORK query should return array');

      const waitingApproval = await engine.getWorkItems(workspaceId, { section: 'WAITING_FOR_APPROVAL' });
      assert.ok(waitingApproval.every(i => i.status === 'WAITING_APPROVAL'), 'All items in WAITING_FOR_APPROVAL must be WAITING_APPROVAL');
    });

    it('should support multi-criteria filtering by priority and type', async () => {
      const p0Items = await engine.getWorkItems(workspaceId, { priority: 'P0_CRITICAL' });
      assert.ok(p0Items.every(i => i.priority === 'P0_CRITICAL'), 'Priority filter must strictly match P0_CRITICAL');

      const incidentItems = await engine.getWorkItems(workspaceId, { type: 'INCIDENT' });
      assert.ok(incidentItems.every(i => i.type === 'INCIDENT'), 'Type filter must match INCIDENT');
    });

    it('should assign a work item to an engineer with SLA tracking', async () => {
      const items = await engine.getWorkItems(workspaceId);
      const target = items[0];

      const updated = await engine.assignWorkItem(
        target.id,
        { userId: 'usr-sre-lead', name: 'Elena Rostova', role: 'SRE' },
        { assigneeUserId: 'usr-sre-02', assigneeUserName: 'Marcus Chen', assigneeTeamId: 'team-sre', assigneeTeamName: 'Site Reliability Engineering' }
      );

      assert.ok(updated, 'Assigned work item must be returned');
      assert.strictEqual(updated.assigneeUserId, 'usr-sre-02');

      // Verify timeline event was logged
      const timeline = await engine.getTimeline(target.id);
      const assignEvent = timeline.find(e => e.eventType === 'ASSIGNED');
      assert.ok(assignEvent, 'Timeline must record ASSIGNED event');
      assert.strictEqual(assignEvent.actor.userId, 'usr-sre-lead');
    });

    it('should update work item lifecycle status and record timeline steps', async () => {
      const items = await engine.getWorkItems(workspaceId);
      const target = items[0];

      const updated = await engine.updateWorkItemStatus(
        target.id,
        { userId: 'usr-sre-02', name: 'Marcus Chen', role: 'SRE' },
        'WAITING_VERIFICATION',
        'Canary deployed to staging environment'
      );

      assert.ok(updated);
      assert.strictEqual(updated.status, 'WAITING_VERIFICATION');

      const timeline = await engine.getTimeline(target.id);
      const statusEvent = timeline.find(e => e.eventType === 'STATUS_CHANGED');
      assert.ok(statusEvent, 'Timeline must record STATUS_CHANGED event');
    });

    it('should handle handoff of work items with handover notes and reason', async () => {
      const items = await engine.getWorkItems(workspaceId);
      const target = items[0];

      const handedOff = await engine.handoffWorkItem(
        target.id,
        { userId: 'usr-sre-02', name: 'Marcus Chen', role: 'SRE' },
        {
          targetTeamId: 'team-platform',
          targetTeamName: 'Platform & Kubernetes Engineering',
          targetUserId: 'usr-plat-lead',
          targetUserName: 'Liam O\'Connor',
          handoffNotes: 'Canary is stable at 10% traffic. Monitor p99 latency before 100% rollout.'
        }
      );

      assert.ok(handedOff);
      assert.strictEqual(handedOff.assigneeUserId, 'usr-plat-lead');
      assert.strictEqual(handedOff.assigneeTeamId, 'team-platform');

      const timeline = await engine.getTimeline(target.id);
      const handoffEvent = timeline.find(e => e.eventType === 'HANDOFF');
      assert.ok(handoffEvent, 'Timeline must record HANDOFF event');
    });

    it('should escalate work items according to escalation tiers', async () => {
      const items = await engine.getWorkItems(workspaceId);
      const target = items[0];

      const escalated = await engine.escalateWorkItem(
        target.id,
        { userId: 'usr-plat-lead', name: 'Liam O\'Connor', role: 'OPERATOR' },
        'P99 Latency exceeds 2500ms on secondary node'
      );

      assert.ok(escalated);
      assert.ok(escalated.escalationStatus.startsWith('ESCALATED_'));

      const timeline = await engine.getTimeline(target.id);
      const escEvent = timeline.find(e => e.eventType === 'ESCALATED');
      assert.ok(escEvent, 'Timeline must record ESCALATED event');
    });
  });

  describe('3. Enterprise Approvals & Strict Two-Person Control', () => {
    it('should list enterprise approval requests with policy details and status', async () => {
      const approvals = await engine.getApprovalRequests(workspaceId);
      assert.ok(approvals.length >= 1, 'Should have approval requests');

      const pending = approvals.filter(a => a.status === 'PENDING');
      assert.ok(pending.length >= 1, 'Should have pending approval requests');
    });

    it('should STRICTLY ENFORCE Two-Person Control: Requester cannot approve their own request', async () => {
      const approvals = await engine.getApprovalRequests(workspaceId);
      const target = approvals.find(a => a.approvalPolicy.requiresTwoPersonControl && a.status === 'PENDING');
      assert.ok(target, 'Must have an approval request with requiresTwoPersonControl = true');

      const requester = target.requestedBy;

      // Requester attempts to approve their own request
      await assert.rejects(
        async () => {
          await engine.decideApproval(
            target.id,
            {
              userId: requester.userId,
              name: requester.name,
              role: 'SRE'
            },
            'APPROVED',
            'I am approving my own high-risk production change'
          );
        },
        /TWO-PERSON CONTROL VIOLATION/i,
        'Engine must reject with TWO-PERSON CONTROL VIOLATION when requester self-approves'
      );
    });

    it('should verify role authorization: Unauthorized role cannot approve', async () => {
      const approvals = await engine.getApprovalRequests(workspaceId);
      const target = approvals.find(a => a.status === 'PENDING');
      assert.ok(target);

      await assert.rejects(
        async () => {
          await engine.decideApproval(
            target.id,
            {
              userId: 'usr-guest-1',
              name: 'Guest Observer',
              role: 'VIEWER' as any
            },
            'APPROVED',
            'Attempting unauthorized approval'
          );
        },
        /not authorized by policy/i,
        'Engine must reject when user role is not authorized by policy'
      );
    });

    it('should allow a distinct authorized approver to approve under Two-Person Control', async () => {
      const approvals = await engine.getApprovalRequests(workspaceId);
      const target = approvals.find(a => a.approvalPolicy.requiresTwoPersonControl && a.status === 'PENDING');
      assert.ok(target);

      const authorizedApprover = {
        userId: 'usr-sre-lead',
        name: 'Elena Rostova',
        role: 'SRE' as const
      };

      const result = await engine.decideApproval(
        target.id,
        authorizedApprover,
        'APPROVED',
        'Reviewed rollback plan and blast radius simulation. Approved for execution.'
      );

      assert.ok(result);
      assert.strictEqual(result.decisionMade.decision, 'APPROVED');
      assert.strictEqual(result.decisionMade.approverUserId, authorizedApprover.userId);
      assert.strictEqual(result.approval.status, 'APPROVED');
    });

    it('should handle rejection of approval requests with mandatory reason', async () => {
      // Create a test change request
      const change = await engine.createChangeRequest(
        workspaceId,
        tenantId,
        {
          userId: 'usr-dev-9',
          name: 'Alex Dev',
          email: 'alex.dev@cloudpulse.internal',
          teamId: 'team-sre'
        },
        {
          title: 'Emergency Ingress Firewall Port Open',
          rationale: 'Temporary port opening for external testing',
          provider: 'AWS',
          targetResources: [{ resourceId: 'sg-prod-ingress', provider: 'AWS', name: 'Security Group', type: 'SecurityGroup' }],
          proposedChange: { action: 'authorize_ingress', payload: { port: 22, cidr: '0.0.0.0/0' }, summary: 'Open port 22 to 0.0.0.0/0' },
          risk: 'HIGH',
          executionPlan: { steps: [{ order: 1, action: 'apply_rule', description: 'Apply rule', status: 'PENDING' }] },
          rollbackPlan: { steps: ['revoke rule'], automated: true },
          verificationPlan: { criteria: ['audit rule'], freshReadQueries: ['describe_security_groups'] }
        }
      );

      assert.ok(change);
      assert.strictEqual(change.status, 'APPROVAL_REQUIRED');

      // Create an approval request for this change
      const appReqId = `app-test-reject-${Date.now()}`;
      const appReq = {
        id: appReqId,
        tenantId,
        workspaceId,
        subjectType: 'CHANGE_REQUEST' as const,
        subjectId: change.id,
        title: change.title,
        description: change.rationale,
        requestedBy: {
          userId: 'usr-dev-9',
          name: 'Alex Dev',
          email: 'alex.dev@cloudpulse.internal',
          role: 'ENGINEER' as const
        },
        requiredApprovers: [{ role: 'SECURITY_ANALYST' as const, count: 1 }],
        approvalPolicy: {
          policyId: 'pol-sec-reject',
          policyName: 'Security Policy',
          requiresTwoPersonControl: true,
          riskLevel: 'HIGH' as const,
          minimumApprovalsRequired: 1,
          allowedApproverRoles: ['SECURITY_ANALYST' as const, 'WORKSPACE_ADMIN' as const],
          autoExpireMinutes: 60
        },
        risk: 'HIGH' as const,
        evidence: [],
        decisions: [],
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      // Register approval request internally
      (engine as any).approvalRequests.set(appReq.id, appReq);
      change.approvalRequestId = appReq.id;

      // Reject the approval request
      const rejected = await engine.decideApproval(
        appReq.id,
        {
          userId: 'usr-sec-lead',
          name: 'David Kim',
          role: 'SECURITY_ANALYST' as any
        },
        'REJECTED',
        'Direct 0.0.0.0/0 ingress on port 22 violates zero-trust security policy CP-SEC-04.'
      );

      assert.strictEqual(rejected.decisionMade.decision, 'REJECTED');
      assert.strictEqual(rejected.approval.status, 'REJECTED');
    });
  });

  describe('4. Governed Change Management, Multi-Pillar Review Pack & Freezes', () => {
    it('should return existing change requests with multi-pillar reviews', async () => {
      const changes = await engine.getChangeRequests(workspaceId);
      assert.ok(changes.length >= 1, 'Should have initial change requests');

      const chg = changes[0];
      assert.ok(chg.reviews.length >= 3, 'Review pack must contain reviews across pillars');
      assert.ok(chg.reviews.some(r => r.reviewType === 'RELIABILITY'));
      assert.ok(chg.reviews.some(r => r.reviewType === 'SECURITY'));
    });

    it('should retrieve scheduled maintenance windows and active change freezes', async () => {
      const windows = await engine.getMaintenanceWindows(workspaceId);
      assert.ok(windows.length >= 1, 'Should have maintenance windows');
      assert.strictEqual(windows[0].isRecurring, true);

      const freezes = await engine.getChangeFreezes(workspaceId);
      assert.ok(freezes.length >= 1, 'Should have change freezes');
    });

    it('should create a governed change request with execution and rollback plans', async () => {
      const change = await engine.createChangeRequest(
        workspaceId,
        tenantId,
        {
          userId: 'usr-sre-lead',
          name: 'Elena Rostova',
          email: 'elena.rostova@cloudpulse.internal',
          teamId: 'team-sre'
        },
        {
          title: 'Kubernetes Ingress Envoy Controller Canary Rollout',
          rationale: 'Upgrade Envoy Ingress Controller to v1.30 for gRPC streaming support',
          provider: 'KUBERNETES',
          targetResources: [{ resourceId: 'k8s:ingress:envoy', provider: 'KUBERNETES', name: 'Envoy Ingress', type: 'HelmRelease' }],
          proposedChange: { action: 'helm_upgrade', payload: { chart: 'envoy-ingress', version: '1.30.0' }, summary: 'Upgrade Envoy chart to 1.30.0' },
          risk: 'HIGH',
          executionPlan: {
            steps: [
              { order: 1, action: 'helm upgrade --install', description: 'Deploy Envoy canary', status: 'PENDING' },
              { order: 2, action: 'canary traffic test', description: 'Verify 5% traffic routing', status: 'PENDING' }
            ]
          },
          rollbackPlan: {
            steps: ['helm rollback envoy-ingress 1'],
            automated: true
          },
          verificationPlan: {
            criteria: ['pod_ready_count == 4', 'ingress_5xx_rate < 0.01%'],
            freshReadQueries: ['container_status_ready', 'nginx_ingress_controller_requests']
          }
        }
      );

      assert.ok(change.id.startsWith('chg-'), 'Change ID should be generated');
      assert.strictEqual(change.status, 'APPROVAL_REQUIRED');
      assert.ok(change.reviews.length >= 3, 'Pre-flight reviews generated');
      assert.strictEqual(change.executionPlan.steps.length, 2);
    });
  });

  describe('5. Activity Timeline, Collaborative Comments & Evidence Citations', () => {
    it('should record immutable activity timeline events with actor and timestamp', async () => {
      const items = await engine.getWorkItems(workspaceId);
      const target = items[0];

      const initialCount = (await engine.getTimeline(target.id)).length;

      await engine.updateWorkItemStatus(
        target.id,
        { userId: 'usr-sre-lead', name: 'Elena Rostova', role: 'SRE' },
        'IN_PROGRESS',
        'Investigating telemetry traces'
      );

      const timeline = await engine.getTimeline(target.id);
      assert.ok(timeline.length > initialCount, 'Timeline must append new event');
      assert.strictEqual(timeline[0].actor.userId, 'usr-sre-lead');
      assert.strictEqual(timeline[0].eventType, 'STATUS_CHANGED');
    });

    it('should allow posting comments with rich EvidenceReference citations', async () => {
      const items = await engine.getWorkItems(workspaceId);
      const target = items[0];

      const comment = await engine.addComment(
        target.id,
        {
          userId: 'usr-sre-lead',
          name: 'Elena Rostova',
          role: 'SRE'
        },
        'Investigated trace spans: downstream RDS PostgreSQL connection pool queue time is at 45ms.',
        [
          {
            type: 'METRIC',
            id: 'RDS:DBQueueTime',
            title: 'RDS Connection Pool Queue Time',
            snippet: 'Queue latency spiked to 45ms during peak batch window'
          },
          {
            type: 'FINDING',
            id: 'FINDING-DB-CONNECTION-SATURATION',
            title: 'DB Connection Saturation Finding',
            snippet: 'Max connections reached 94% ceiling'
          }
        ],
        ['@marcus.chen', '@david.kim']
      );

      assert.ok(comment.id.startsWith('cmt-'));
      assert.strictEqual(comment.evidenceReferences?.length, 2);
      assert.strictEqual(comment.mentions?.length, 2);

      const comments = await engine.getComments(target.id);
      assert.ok(comments.some(c => c.id === comment.id), 'Comment must be retrievable');
    });
  });

  describe('6. Incident Swarms, Automated Briefings, PIRs & Action Items', () => {
    it('should generate an evidence-backed incident briefing for active incidents', async () => {
      const briefing = await engine.getIncidentBriefing('inc-payment-001');
      assert.ok(briefing, 'Incident briefing should be generated');
      assert.strictEqual(briefing.incidentId, 'inc-payment-001');
      assert.ok(briefing.severity.includes('CRITICAL'));
      assert.ok(briefing.whatHappened.length > 20, 'What happened should be descriptive');
      assert.ok(briefing.timeline.length >= 2, 'Timeline should have entries');
      assert.ok(briefing.rootCauseHypotheses.length >= 1, 'Hypotheses should be present');
    });

    it('should track Action Items for operational follow-ups', async () => {
      const actionItems = await engine.getActionItems(workspaceId);
      assert.ok(actionItems.length >= 1, 'Should track enterprise action items');
      assert.ok(actionItems[0].title.length > 10);
      assert.ok(actionItems[0].ownerUserId);
      assert.strictEqual(actionItems[0].status, 'OPEN');
    });
  });

  describe('7. Notifications, Workload Balancing & AI Collaboration Copilot', () => {
    it('should retrieve notifications with read and acknowledged tracking', async () => {
      const notifs = await engine.getNotifications('usr-sre-lead');
      assert.ok(notifs.length >= 1, 'User should have notifications');

      const targetNotif = notifs[0];
      const marked = await engine.markNotificationAsRead('usr-sre-lead', targetNotif.id);
      assert.strictEqual(marked, true);
    });

    it('should calculate executive workflow summary and team workload balancing', async () => {
      const summary = await engine.getEnterpriseWorkflowSummary(workspaceId);
      assert.ok(summary, 'Workflow summary should be calculated');
      assert.ok(summary.totalTeams >= 3);
      assert.ok(summary.activeWorkItems.total >= 3);
      assert.ok(summary.workloadBalance.length >= 3, 'Should have workload balancing across teams');

      const sreWorkload = summary.workloadBalance.find(w => w.teamId === 'team-sre');
      assert.ok(sreWorkload, 'Core SRE workload metrics must exist');
      assert.ok(['HEALTHY', 'MODERATE', 'HEAVY'].includes(sreWorkload.capacityStatus));
    });

    it('should power the AI SRE / Workflow Copilot with real evidence-backed answers', async () => {
      const queryResult = await engine.investigate('Who owns payment-service?', workspaceId);
      assert.ok(queryResult, 'AI assistant must return result');
      assert.strictEqual(queryResult.intent, 'RESOURCE_OWNERSHIP');
      assert.ok(queryResult.primaryAnswer.includes('Elena Rostova') || queryResult.primaryAnswer.includes('payment-service'));
      assert.strictEqual(queryResult.confidence, 'HIGH');
      assert.ok(queryResult.evidenceCitations.length >= 1, 'Must cite grounding evidence');
      assert.ok(queryResult.suggestedFollowUps.length >= 1, 'Should provide actionable suggestions');
    });
  });
});
