/**
 * CLOUDPULSE Enterprise Workflow & Governed Change Management REST API Router (Phase 64)
 */

import { Router, Request, Response } from 'express';
import { enterpriseWorkflowEngine } from '../services/enterprise-workflow-engine.js';
import { EnterpriseUserRole, TeamType, WorkItemPriority, WorkItemStatus, WorkItemType } from '@cloudpulse/shared';

const router: Router = Router();

// ─── 1. OVERVIEW & SUMMARY ────────────────────────────────────────────────────
router.get(['/overview', '/summary'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const summary = await enterpriseWorkflowEngine.getEnterpriseWorkflowSummary(workspaceId);
    return res.json({ ok: true, data: summary });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 2. TEAMS & MEMBERSHIP ───────────────────────────────────────────────────
router.get('/teams', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const teams = await enterpriseWorkflowEngine.getTeams(workspaceId);
    return res.json({ ok: true, data: teams });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/teams', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-enterprise-01';
    const creatorUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
    const { name, description, teamType, members } = req.body;

    if (!name || !teamType) {
      return res.status(400).json({ ok: false, error: 'Team name and teamType are required' });
    }

    const team = await enterpriseWorkflowEngine.createTeam(workspaceId, tenantId, creatorUserId, {
      name,
      description: description || '',
      teamType: teamType as TeamType,
      members
    });

    return res.status(201).json({ ok: true, data: team });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/teams/:teamId', async (req: Request, res: Response) => {
  try {
    const team = await enterpriseWorkflowEngine.getTeamById(req.params.teamId!);
    if (!team) {
      return res.status(404).json({ ok: false, error: 'Team not found' });
    }
    return res.json({ ok: true, data: team });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 3. WORK ITEMS INBOX & WORKFLOW ──────────────────────────────────────────
router.get(['/work-items', '/items'], async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const { section, userId, teamId, priority, status, type } = req.query;

    const filters: any = {};
    if (section) filters.section = section as string;
    if (userId) filters.userId = userId as string;
    if (teamId) filters.teamId = teamId as string;
    if (priority) filters.priority = priority as WorkItemPriority;
    if (status) filters.status = status as WorkItemStatus;
    if (type) filters.type = type as WorkItemType;

    const items = await enterpriseWorkflowEngine.getWorkItems(workspaceId, filters);
    return res.json({ ok: true, data: items });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/work-items/:id', async (req: Request, res: Response) => {
  try {
    const item = await enterpriseWorkflowEngine.getWorkItemById(req.params.id!);
    if (!item) {
      return res.status(404).json({ ok: false, error: 'Work item not found' });
    }
    return res.json({ ok: true, data: item });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/work-items/:id/assign', async (req: Request, res: Response) => {
  try {
    const actor = {
      userId: (req.headers['x-user-id'] as string) || 'usr-sre-lead',
      name: (req.headers['x-user-name'] as string) || 'Elena Rostova',
      role: (req.headers['x-user-role'] as string) || 'SRE'
    };
    const updated = await enterpriseWorkflowEngine.assignWorkItem(req.params.id!, actor, req.body);
    return res.json({ ok: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/work-items/:id/status', async (req: Request, res: Response) => {
  try {
    const actor = {
      userId: (req.headers['x-user-id'] as string) || 'usr-sre-lead',
      name: (req.headers['x-user-name'] as string) || 'Elena Rostova',
      role: (req.headers['x-user-role'] as string) || 'SRE'
    };
    const { status, blockedReason } = req.body;
    if (!status) {
      return res.status(400).json({ ok: false, error: 'status is required' });
    }
    const updated = await enterpriseWorkflowEngine.updateWorkItemStatus(req.params.id!, actor, status as WorkItemStatus, blockedReason);
    return res.json({ ok: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/work-items/:id/escalate', async (req: Request, res: Response) => {
  try {
    const actor = {
      userId: (req.headers['x-user-id'] as string) || 'usr-sre-lead',
      name: (req.headers['x-user-name'] as string) || 'Elena Rostova',
      role: (req.headers['x-user-role'] as string) || 'SRE'
    };
    const { reason } = req.body;
    const updated = await enterpriseWorkflowEngine.escalateWorkItem(req.params.id!, actor, reason || 'Operator triggered escalation');
    return res.json({ ok: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/work-items/:id/handoff', async (req: Request, res: Response) => {
  try {
    const actor = {
      userId: (req.headers['x-user-id'] as string) || 'usr-sre-lead',
      name: (req.headers['x-user-name'] as string) || 'Elena Rostova',
      role: (req.headers['x-user-role'] as string) || 'SRE'
    };
    const updated = await enterpriseWorkflowEngine.handoffWorkItem(req.params.id!, actor, req.body);
    return res.json({ ok: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 4. COMMENTS & TIMELINES ─────────────────────────────────────────────────
router.get('/work-items/:id/comments', async (req: Request, res: Response) => {
  try {
    const comments = await enterpriseWorkflowEngine.getComments(req.params.id!);
    return res.json({ ok: true, data: comments });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/work-items/:id/comments', async (req: Request, res: Response) => {
  try {
    const author = {
      userId: (req.headers['x-user-id'] as string) || 'usr-sre-lead',
      name: (req.headers['x-user-name'] as string) || 'Elena Rostova',
      role: ((req.headers['x-user-role'] as string) || 'SRE') as EnterpriseUserRole
    };
    const { content, evidenceReferences, mentions } = req.body;
    if (!content) {
      return res.status(400).json({ ok: false, error: 'Comment content is required' });
    }
    const comment = await enterpriseWorkflowEngine.addComment(req.params.id!, author, content, evidenceReferences, mentions);
    return res.status(201).json({ ok: true, data: comment });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/work-items/:id/timeline', async (req: Request, res: Response) => {
  try {
    const timeline = await enterpriseWorkflowEngine.getTimeline(req.params.id!);
    return res.json({ ok: true, data: timeline });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 5. RESOURCE OWNERSHIP ───────────────────────────────────────────────────
router.get('/ownership/resources', async (req: Request, res: Response) => {
  try {
    const ownerships = await enterpriseWorkflowEngine.listResourceOwnerships();
    return res.json({ ok: true, data: ownerships });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/ownership/resources/:resourceId', async (req: Request, res: Response) => {
  try {
    const ownership = await enterpriseWorkflowEngine.getResourceOwnership(req.params.resourceId!);
    return res.json({ ok: true, data: ownership });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/ownership/resources/:resourceId', async (req: Request, res: Response) => {
  try {
    const assignedBy = (req.headers['x-user-id'] as string) || 'usr-admin';
    const ownership = await enterpriseWorkflowEngine.setResourceOwnership(req.params.resourceId!, {
      ...req.body,
      assignedBy
    });
    return res.json({ ok: true, data: ownership });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 6. APPROVAL WORKFLOW & TWO-PERSON CONTROL ───────────────────────────────
router.get('/approvals', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const approvals = await enterpriseWorkflowEngine.getApprovalRequests(workspaceId);
    return res.json({ ok: true, data: approvals });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/approvals/:id', async (req: Request, res: Response) => {
  try {
    const approval = await enterpriseWorkflowEngine.getApprovalRequestById(req.params.id!);
    if (!approval) {
      return res.status(404).json({ ok: false, error: 'Approval request not found' });
    }
    return res.json({ ok: true, data: approval });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/approvals/:id/decide', async (req: Request, res: Response) => {
  try {
    const approver = {
      userId: req.body.approverUserId || (req.headers['x-user-id'] as string) || 'usr-sre-lead',
      name: req.body.approverName || (req.headers['x-user-name'] as string) || 'Elena Rostova',
      role: (req.body.approverRole || (req.headers['x-user-role'] as string) || 'SRE') as EnterpriseUserRole
    };
    const { decision, comment } = req.body;
    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ ok: false, error: 'decision must be APPROVED or REJECTED' });
    }

    const result = await enterpriseWorkflowEngine.decideApproval(req.params.id!, approver, decision, comment || '');
    return res.json({ ok: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

// ─── 7. GOVERNED CHANGE MANAGEMENT ────────────────────────────────────────────
router.get('/changes', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const changes = await enterpriseWorkflowEngine.getChangeRequests(workspaceId);
    return res.json({ ok: true, data: changes });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/changes/:id', async (req: Request, res: Response) => {
  try {
    const change = await enterpriseWorkflowEngine.getChangeRequestById(req.params.id!);
    if (!change) {
      return res.status(404).json({ ok: false, error: 'Change request not found' });
    }
    return res.json({ ok: true, data: change });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/changes', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-enterprise-01';
    const requester = {
      userId: (req.headers['x-user-id'] as string) || 'usr-sre-02',
      name: (req.headers['x-user-name'] as string) || 'Marcus Chen',
      email: (req.headers['x-user-email'] as string) || 'marcus.chen@cloudpulse.internal',
      teamId: 'team-sre'
    };

    const change = await enterpriseWorkflowEngine.createChangeRequest(workspaceId, tenantId, requester, req.body);
    return res.status(201).json({ ok: true, data: change });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/maintenance-windows', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const windows = await enterpriseWorkflowEngine.getMaintenanceWindows(workspaceId);
    return res.json({ ok: true, data: windows });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/change-freezes', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const freezes = await enterpriseWorkflowEngine.getChangeFreezes(workspaceId);
    return res.json({ ok: true, data: freezes });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 8. NOTIFICATIONS ────────────────────────────────────────────────────────
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'usr-sre-lead';
    const notifs = await enterpriseWorkflowEngine.getNotifications(userId);
    return res.json({ ok: true, data: notifs });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'usr-sre-lead';
    const success = await enterpriseWorkflowEngine.markNotificationAsRead(userId, req.params.id!);
    return res.json({ ok: true, success });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 9. INCIDENT BRIEFINGS & ACTION ITEMS ─────────────────────────────────────
router.get('/incident-briefings/:incidentId', async (req: Request, res: Response) => {
  try {
    const briefing = await enterpriseWorkflowEngine.getIncidentBriefing(req.params.incidentId!);
    return res.json({ ok: true, data: briefing });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/action-items', async (req: Request, res: Response) => {
  try {
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const items = await enterpriseWorkflowEngine.getActionItems(workspaceId);
    return res.json({ ok: true, data: items });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── 10. AI COLLABORATION COPILOT ───────────────────────────────────────────
router.post('/ai-copilot', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'prompt is required' });
    }
    const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-production';
    const result = await enterpriseWorkflowEngine.investigate(prompt, workspaceId);
    return res.json({ ok: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
