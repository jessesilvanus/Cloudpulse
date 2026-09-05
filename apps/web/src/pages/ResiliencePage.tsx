import React, { useState, useEffect } from 'react';
import { realResilienceApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import type {
  ZeroDowntimeScorecard,
  CloudResilienceProfile,
  FailureDomain,
  RealSinglePointOfFailure,
  RealBackupEntity,
  RealRecoveryPlan,
  RecoveryDrillRecord,
  BusinessContinuityEntity,
  ResilienceWhatIfSimulation,
  AiResilienceAnalystResult,
} from '@cloudpulse/shared';

export function ResiliencePage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'failureDomains' | 'spofs' | 'backups' | 'recoveryPlans' | 'businessContinuity' | 'simulator'
  >('overview');

  // Core Data States
  const [scorecard, setScorecard] = useState<ZeroDowntimeScorecard | null>(null);
  const [profiles, setProfiles] = useState<CloudResilienceProfile[]>([]);
  const [failureDomains, setFailureDomains] = useState<FailureDomain[]>([]);
  const [spofs, setSpofs] = useState<RealSinglePointOfFailure[]>([]);
  const [backups, setBackups] = useState<RealBackupEntity[]>([]);
  const [recoveryPlans, setRecoveryPlans] = useState<RealRecoveryPlan[]>([]);
  const [drills, setDrills] = useState<RecoveryDrillRecord[]>([]);
  const [businessContinuity, setBusinessContinuity] = useState<BusinessContinuityEntity[]>([]);

  // Filter States
  const [spofSeverityFilter, setSpofSeverityFilter] = useState<string>('all');
  const [backupHealthFilter, setBackupHealthFilter] = useState<string>('all');

  // Selected Detail States
  const [selectedPlan, setSelectedPlan] = useState<RealRecoveryPlan | null>(null);

  // New Recovery Plan Modal Form States
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanScenario, setNewPlanScenario] = useState<
    'AZ_FAILURE' | 'REGION_FAILURE' | 'CLUSTER_FAILURE' | 'NODE_FAILURE' | 'DATABASE_FAILURE'
  >('AZ_FAILURE');
  const [newPlanRto, setNewPlanRto] = useState(15);
  const [newPlanRpo, setNewPlanRpo] = useState(5);
  const [newPlanOwner, setNewPlanOwner] = useState('SRE Operations Team');
  const [newPlanStepDesc, setNewPlanStepDesc] = useState('');

  // Record Drill Modal Form States
  const [showDrillModal, setShowDrillModal] = useState(false);
  const [drillName, setDrillName] = useState('Quarterly AWS AZ Failover Drill');
  const [drillScenarioType, setDrillScenarioType] = useState('AVAILABILITY_ZONE_OUTAGE');
  const [drillScope, setDrillScope] = useState('us-east-1');
  const [drillObservedRto, setDrillObservedRto] = useState(12);
  const [drillObservedRpo, setDrillObservedRpo] = useState(3);
  const [drillStatus, setDrillStatus] = useState<'PASSED' | 'PARTIALLY_PASSED' | 'FAILED'>('PASSED');
  const [drillLessons, setDrillLessons] = useState('Automated failover completed within acceptable limits.');

  // What-If Simulation State
  const [simScenario, setSimScenario] = useState('AWS Primary AZ Outage (us-east-1a)');
  const [simTrigger, setSimTrigger] = useState('Sudden power failure in AWS us-east-1a data center');
  const [simFdIds, setSimFdIds] = useState<string[]>(['fd-aws-us-east-1a']);
  const [simServiceIds, setSimServiceIds] = useState<string[]>(['payment-service', 'orders-db']);
  const [simResult, setSimResult] = useState<ResilienceWhatIfSimulation | null>(null);
  const [simulating, setSimulating] = useState(false);

  // AI Resilience Analyst State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<AiResilienceAnalystResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // General States
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        sc,
        profList,
        fdList,
        spofList,
        bkList,
        planList,
        drillList,
        bcList,
      ] = await Promise.all([
        realResilienceApi.getScorecard(),
        realResilienceApi.getProfiles(),
        realResilienceApi.getFailureDomains(),
        realResilienceApi.getSpofs(),
        realResilienceApi.getBackups(),
        realResilienceApi.getRecoveryPlans(),
        realResilienceApi.getDrills(),
        realResilienceApi.getBusinessContinuity(),
      ]);

      setScorecard(sc);
      setProfiles(profList);
      setFailureDomains(fdList);
      setSpofs(spofList);
      setBackups(bkList);
      setRecoveryPlans(planList);
      setDrills(drillList);
      setBusinessContinuity(bcList);
      if (planList.length > 0 && !selectedPlan) {
        setSelectedPlan(planList[0] || null);
      }
    } catch (err: any) {
      console.error('Failed to load Resilience & DR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRunSimulation = async () => {
    try {
      setSimulating(true);
      setFeedback(null);
      const res = await realResilienceApi.simulateResilienceWhatIf({
        scenario: simScenario,
        failureTrigger: simTrigger,
        affectedFailureDomainIds: simFdIds,
        affectedServiceIds: simServiceIds,
      });
      setSimResult(res);
      setFeedback(`Simulation "${simScenario}" completed successfully.`);
    } catch (err: any) {
      setFeedback(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleAskAiAnalyst = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setAiLoading(true);
      setFeedback(null);
      const res = await realResilienceApi.investigateResilience(aiPrompt);
      setAiResult(res);
    } catch (err: any) {
      setFeedback(`AI Analyst error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    try {
      const created = await realResilienceApi.createRecoveryPlan({
        name: newPlanName,
        scenarioType: newPlanScenario,
        targetRtoMinutes: Number(newPlanRto),
        targetRpoMinutes: Number(newPlanRpo),
        owner: newPlanOwner,
        recoverySteps: [
          {
            stepOrder: 1,
            name: newPlanStepDesc || 'Initial triage & isolation',
            actionType: 'ISOLATE_FAILING_DOMAIN',
            targetResourceId: 'auto-targeted',
            provider: 'AWS',
            automationType: 'AUTOMATED',
            riskLevel: 'LOW',
            preconditions: ['Failure confirmed by 2 health checks'],
            requiresTwoPersonApproval: false,
            estimatedDurationSeconds: 120,
            verificationCheck: 'Health checks confirm traffic rerouted',
          },
        ],
      });
      setRecoveryPlans((prev) => [created, ...prev]);
      setShowPlanModal(false);
      setNewPlanName('');
      setFeedback(`Recovery plan "${created.name}" created.`);
    } catch (err: any) {
      setFeedback(`Failed to create plan: ${err.message}`);
    }
  };

  const handleRecordDrill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rec = await realResilienceApi.recordDrill({
        name: drillName,
        scenarioType: drillScenarioType,
        scope: drillScope,
        hypothesis: 'Cross-AZ traffic re-route within SLA',
        safetyControls: ['Automated health-gate tripwires'],
        executionMode: 'CONTROLLED_PROD',
        observedRtoMinutes: Number(drillObservedRto),
        observedRpoMinutes: Number(drillObservedRpo),
        targetRtoMinutes: 15,
        targetRpoMinutes: 5,
        status: drillStatus,
        lessonsLearned: [drillLessons],
        blockersIdentified: [],
        verifiedBy: 'SRE Lead',
      });
      setDrills((prev) => [rec, ...prev]);
      setShowDrillModal(false);
      setFeedback(`Drill execution recorded successfully.`);
    } catch (err: any) {
      setFeedback(`Failed to record drill: ${err.message}`);
    }
  };

  if (loading && !scorecard) {
    return <LoadingState message="Loading Real Cloud Resilience & DR Control Plane..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Real Cloud Resilience & Disaster Recovery"
        subtitle="Multi-cloud failure domain intelligence, single-point-of-failure elimination, backup health verification, and zero-downtime recovery automation."
        breadcrumbs={[
          { label: 'Reliability', href: '/sre' },
          { label: 'Resilience & DR Control Plane' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlanModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              + Create Recovery Plan
            </button>
            <button
              onClick={() => setShowDrillModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-purple-600 hover:bg-purple-500 text-white transition"
            >
              + Record Recovery Drill
            </button>
            <button
              onClick={loadAllData}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
            >
              Refresh Telemetry
            </button>
          </div>
        }
      />

      {feedback && (
        <div className="p-3 bg-blue-950/60 border border-blue-700/60 rounded text-blue-200 text-xs flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-blue-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-800 space-x-1 overflow-x-auto text-xs font-medium">
        {[
          { id: 'overview', label: 'Zero-Downtime Scorecard' },
          { id: 'failureDomains', label: `Failure Domains (${failureDomains.length})` },
          { id: 'spofs', label: `SPOFs & Mitigations (${spofs.length})` },
          { id: 'backups', label: `Multi-Cloud Backups (${backups.length})` },
          { id: 'recoveryPlans', label: `Recovery Plans (${recoveryPlans.length})` },
          { id: 'businessContinuity', label: `Business Continuity & Drills (${drills.length})` },
          { id: 'simulator', label: 'What-If Simulator & AI Analyst' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400 font-semibold bg-blue-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: OVERVIEW & ZERO-DOWNTIME SCORECARD ────────────────────────────── */}
      {activeTab === 'overview' && scorecard && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Resilience Score</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-blue-400">{scorecard.overallResilienceScore}</span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
              <div className="mt-2 text-xs flex items-center justify-between">
                <span className="text-gray-400">Multi-AZ Adoption:</span>
                <span className="font-semibold text-emerald-400">{scorecard.multiAzAdoptionRate}%</span>
              </div>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active SPOFs</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-amber-400">{scorecard.activeSpofCount}</span>
                <span className="text-xs text-amber-500">Detected</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Critical Gaps: <span className="text-red-400 font-bold">{scorecard.criticalGapsCount}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Backup Protection</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-emerald-400">{scorecard.backupProtectionRate}%</span>
                <span className="text-xs text-emerald-500">Protected</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Backups Freshness: <span className="text-emerald-400 font-semibold">{scorecard.freshness.backups}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">RTO / RPO Compliance</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-purple-400">{scorecard.rtoComplianceRate}%</span>
                <span className="text-xs text-purple-400">RTO Met</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                RPO Compliance Rate: <span className="text-cyan-400 font-bold">{scorecard.rpoComplianceRate}%</span>
              </div>
            </div>
          </div>

          {/* Service Resilience Profiles Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center justify-between">
              <span>Mission-Critical Services Resilience Matrix</span>
              <span className="text-xs text-gray-500 font-normal">Derived strictly from live multi-cloud evidence</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-950 text-gray-400 border-b border-gray-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Multi-AZ</th>
                    <th className="py-2.5 px-3">Multi-Region</th>
                    <th className="py-2.5 px-3">Target RTO/RPO</th>
                    <th className="py-2.5 px-3">Observed RTO/RPO</th>
                    <th className="py-2.5 px-3">Backup Health</th>
                    <th className="py-2.5 px-3">SPOFs</th>
                    <th className="py-2.5 px-3">Resilience State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-800/40 transition">
                      <td className="py-3 px-3 font-semibold text-gray-100">{p.serviceName}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                          {p.provider}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.redundancy.multiAz ? (
                          <span className="text-emerald-400 font-medium">✓ Multi-AZ</span>
                        ) : (
                          <span className="text-amber-400 font-medium">✗ Single-AZ</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {p.redundancy.multiRegion ? (
                          <span className="text-emerald-400 font-medium">✓ Multi-Region</span>
                        ) : (
                          <span className="text-gray-500 font-medium">Single-Region</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {p.recoveryObjectives.targetRtoMinutes}m / {p.recoveryObjectives.targetRpoMinutes}m
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={
                            (p.recoveryObjectives.observedRtoMinutes || 0) <= p.recoveryObjectives.targetRtoMinutes
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }
                        >
                          {p.recoveryObjectives.observedRtoMinutes !== undefined
                            ? `${p.recoveryObjectives.observedRtoMinutes}m`
                            : 'N/A'}{' '}
                          /{' '}
                          {p.recoveryObjectives.observedRpoMinutes !== undefined
                            ? `${p.recoveryObjectives.observedRpoMinutes}m`
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.backupPosture.healthState === 'HEALTHY'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {p.backupPosture.healthState}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.spofsCount > 0 ? (
                          <span className="text-red-400 font-bold">{p.spofsCount} SPOF</span>
                        ) : (
                          <span className="text-gray-500">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.resilienceState === 'RESILIENT'
                              ? 'bg-emerald-900/60 text-emerald-300'
                              : p.resilienceState === 'DEGRADED'
                              ? 'bg-amber-900/60 text-amber-300'
                              : 'bg-red-900/60 text-red-300'
                          }`}
                        >
                          {p.resilienceState}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: FAILURE DOMAINS & REDUNDANCY ────────────────────────────────────── */}
      {activeTab === 'failureDomains' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {failureDomains.map((fd) => (
              <div
                key={fd.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-100">{fd.name}</h4>
                    <span className="text-[10px] font-mono text-gray-500">{fd.scope}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      fd.concentration === 'CONCENTRATED'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {fd.concentration}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Domain Type:</span>
                    <span className="font-semibold text-gray-300">{fd.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provider:</span>
                    <span className="text-blue-400 font-semibold">{fd.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Risk Level:</span>
                    <span
                      className={`font-semibold ${
                        fd.riskLevel === 'HIGH' || fd.riskLevel === 'CRITICAL' ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {fd.riskLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Single Point of Failure:</span>
                    <span className={fd.isSinglePointOfFailure ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {fd.isSinglePointOfFailure ? 'YES (High Blast Risk)' : 'NO (Redundant)'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800">
                  <div className="text-[11px] font-semibold text-gray-400 mb-1">Primary Workloads:</div>
                  <div className="flex flex-wrap gap-1">
                    {fd.primaryResources.map((res, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-950 text-gray-300 rounded font-mono text-[10px]">
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-gray-400 italic bg-gray-950/50 p-2 rounded border border-gray-800/80">
                  <span className="font-semibold text-gray-300 not-italic">Evidence: </span>
                  {fd.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: SINGLE POINTS OF FAILURE (SPOFS) ───────────────────────────────── */}
      {activeTab === 'spofs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-semibold uppercase">Filter Priority:</span>
              <select
                value={spofSeverityFilter}
                onChange={(e) => setSpofSeverityFilter(e.target.value)}
                className="bg-gray-950 border border-gray-800 text-gray-200 text-xs rounded px-2.5 py-1"
              >
                <option value="all">All Priorities</option>
                <option value="P0">P0 (Immediate Outage Risk)</option>
                <option value="P1">P1 (High Blast Radius)</option>
                <option value="P2">P2 (Medium Impact)</option>
              </select>
            </div>
            <span className="text-xs text-gray-500">{spofs.length} Total SPOFs Identified</span>
          </div>

          <div className="space-y-4">
            {spofs
              .filter((s) => (spofSeverityFilter === 'all' ? true : s.priority === spofSeverityFilter))
              .map((s) => (
                <div
                  key={s.id}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg p-5 space-y-4 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.priority === 'P0'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {s.priority}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-100">{s.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 font-semibold">
                          {s.provider}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Service: <span className="text-gray-200 font-medium">{s.serviceName}</span> ({s.serviceId}) | Resource:{' '}
                        <code className="text-blue-400">{s.resourceId}</code>
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 bg-gray-950 rounded text-amber-400 border border-gray-800">
                      Est. Downtime: {s.blastRadius.estimatedDowntimeMinutes}m
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-950 p-3 rounded border border-gray-800/80 text-xs">
                    <div>
                      <span className="text-gray-500 block">User Impact:</span>
                      <span className="text-gray-200 font-medium">{s.blastRadius.userImpact}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Financial Exposure:</span>
                      <span className="text-red-400 font-semibold">${s.blastRadius.financialLossRiskPerHour}/hr</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Confidence Metric:</span>
                      <span className="text-emerald-400 font-semibold">{s.confidence}% Grounded</span>
                    </div>
                  </div>

                  <div className="bg-blue-950/20 border border-blue-900/50 p-3 rounded text-xs space-y-1">
                    <span className="text-blue-300 font-semibold">Recommended Mitigation:</span>
                    <p className="text-gray-300">{s.recommendedMitigation}</p>
                  </div>

                  <div className="text-[11px] text-gray-400 italic">
                    <span className="font-semibold text-gray-300 not-italic">Live Evidence: </span>
                    {s.evidence}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: MULTI-CLOUD BACKUP INVENTORY ────────────────────────────────────── */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-semibold uppercase">Filter Backup Health:</span>
              <select
                value={backupHealthFilter}
                onChange={(e) => setBackupHealthFilter(e.target.value)}
                className="bg-gray-950 border border-gray-800 text-gray-200 text-xs rounded px-2.5 py-1"
              >
                <option value="all">All Health States</option>
                <option value="HEALTHY">HEALTHY</option>
                <option value="STALE">STALE</option>
                <option value="FAILED">FAILED</option>
                <option value="MISSING">MISSING</option>
              </select>
            </div>
            <span className="text-xs text-gray-500">{backups.length} Protected & Unprotected Datastores</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-950 text-gray-400 border-b border-gray-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Resource</th>
                    <th className="py-2.5 px-3">Provider & Type</th>
                    <th className="py-2.5 px-3">Health</th>
                    <th className="py-2.5 px-3">Observed RPO</th>
                    <th className="py-2.5 px-3">Target RPO</th>
                    <th className="py-2.5 px-3">Retention</th>
                    <th className="py-2.5 px-3">Lock & Encryption</th>
                    <th className="py-2.5 px-3">Last Successful Backup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {backups
                    .filter((b) => (backupHealthFilter === 'all' ? true : b.healthState === backupHealthFilter))
                    .map((b) => (
                      <tr key={b.id} className="hover:bg-gray-800/40 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-100">{b.resourceName}</div>
                          <div className="text-[10px] font-mono text-gray-500">{b.resourceId}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-300 mr-1.5">
                            {b.provider}
                          </span>
                          <span className="text-gray-400">{b.backupType}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              b.healthState === 'HEALTHY'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : b.healthState === 'STALE'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-red-950 text-red-300 border border-red-800'
                            }`}
                          >
                            {b.healthState}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-cyan-400">
                          {b.observedRpoMinutes !== undefined ? `${b.observedRpoMinutes} min` : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-gray-400">{b.targetRpoMinutes} min</td>
                        <td className="py-3 px-3 text-gray-400">{b.retentionDays} days</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                b.encryptionStatus === 'ENCRYPTED' ? 'bg-blue-950 text-blue-300' : 'bg-red-950 text-red-300'
                              }`}
                            >
                              {b.encryptionStatus}
                            </span>
                            {b.immutableLock && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">WORM Lock</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-[11px] font-mono">
                          {new Date(b.lastSuccessfulBackupTimestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: RECOVERY PLANS & PRIORITIZATION ───────────────────────────────── */}
      {activeTab === 'recoveryPlans' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Selector List */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Governed Recovery Plans</h3>
            {recoveryPlans.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p)}
                className={`p-4 rounded-lg border cursor-pointer transition ${
                  selectedPlan?.id === p.id
                    ? 'bg-blue-950/40 border-blue-600'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-200">{p.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      p.readinessState === 'READY'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {p.readinessState}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 flex justify-between mt-2">
                  <span>Scenario: {p.scenarioType}</span>
                  <span className="font-mono text-cyan-400">RTO: {p.targetRtoMinutes}m</span>
                </div>
              </div>
            ))}
          </div>

          {/* Plan Detail Viewer */}
          {selectedPlan && (
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-5">
              <div className="flex items-start justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-100">{selectedPlan.name}</h3>
                  <div className="text-xs text-gray-400 mt-1">
                    Owner: <span className="text-gray-200">{selectedPlan.owner}</span> | Version:{' '}
                    <span className="font-mono text-blue-400">{selectedPlan.version}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-400 block">Target RTO / RPO</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {selectedPlan.targetRtoMinutes}m / {selectedPlan.targetRpoMinutes}m
                  </span>
                </div>
              </div>

              {/* Step-by-Step Sequence */}
              <div>
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Step-by-Step Recovery Sequence ({selectedPlan.recoverySteps.length} Steps)
                </h4>
                <div className="space-y-2">
                  {selectedPlan.recoverySteps.map((step) => (
                    <div key={step.stepOrder} className="bg-gray-950 border border-gray-800 p-3.5 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {step.stepOrder}
                          </span>
                          <span className="text-xs font-semibold text-gray-200">{step.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 font-mono">
                            {step.actionType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              step.automationType === 'AUTOMATED'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-amber-950 text-amber-300'
                            }`}
                          >
                            {step.automationType}
                          </span>
                          {step.requiresTwoPersonApproval && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800">
                              2-Person Approval
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-400">
                        <div>
                          <span className="text-gray-500">Target Resource: </span>
                          <code className="text-gray-300">{step.targetResourceId}</code>
                        </div>
                        <div>
                          <span className="text-gray-500">Est. Duration: </span>
                          <span className="text-gray-200">{step.estimatedDurationSeconds}s</span>
                        </div>
                      </div>

                      <div className="text-[11px] bg-gray-900/60 p-2 rounded border border-gray-800 text-gray-300">
                        <span className="text-gray-500 font-semibold">Verification Check: </span>
                        {step.verificationCheck}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rollback Plan */}
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded text-xs space-y-1">
                <span className="text-red-300 font-semibold">Automated Rollback Safeguard:</span>
                <p className="text-gray-300">{selectedPlan.rollbackPlan}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 6: BUSINESS CONTINUITY & RECOVERY DRILLS ──────────────────────────── */}
      {activeTab === 'businessContinuity' && (
        <div className="space-y-6">
          {/* Business Continuity Services */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Critical Business Continuity Mappings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessContinuity.map((bc) => (
                <div key={bc.businessServiceId} className="bg-gray-950 border border-gray-800 p-4 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-100">{bc.businessServiceName}</h4>
                      <span className="text-[10px] font-mono text-gray-500">Owner: {bc.businessOwner}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        bc.tier === 'TIER_0_MISSION_CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {bc.tier}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-gray-300">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Target RTO / RPO:</span>
                      <span className="font-semibold text-purple-400">
                        {bc.targetRtoHours}h / {bc.targetRpoHours}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Financial Impact:</span>
                      <span className="font-semibold text-red-400">${bc.financialImpactPerHour}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Readiness:</span>
                      <span
                        className={`font-semibold ${
                          bc.currentReadiness === 'READY' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {bc.currentReadiness}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] bg-gray-900 p-2 rounded text-gray-400">
                    <span className="text-gray-300 font-semibold">Status: </span>
                    <span
                      className={`font-semibold ${
                        bc.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {bc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Drill Execution Records */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Historical Recovery Drill Audits</h3>
            <div className="space-y-3">
              {drills.map((d) => (
                <div key={d.id} className="bg-gray-950 border border-gray-800 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'PASSED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {d.status}
                      </span>
                      <span className="text-xs font-semibold text-gray-200">{d.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-500">
                      {new Date(d.executedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-gray-400 bg-gray-900/60 p-2.5 rounded">
                    <div>
                      <span className="text-gray-500 block">Observed RTO:</span>
                      <span className="text-emerald-400 font-bold">{d.observedRtoMinutes} min</span> (Target:{' '}
                      {d.targetRtoMinutes}m)
                    </div>
                    <div>
                      <span className="text-gray-500 block">Observed RPO:</span>
                      <span className="text-cyan-400 font-bold">{d.observedRpoMinutes} min</span> (Target:{' '}
                      {d.targetRpoMinutes}m)
                    </div>
                    <div>
                      <span className="text-gray-500 block">Execution Mode:</span>
                      <span className="text-gray-200 font-medium">{d.executionMode}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Lead Auditor:</span>
                      <span className="text-gray-200">{d.verifiedBy}</span>
                    </div>
                  </div>

                  {d.lessonsLearned.length > 0 && (
                    <div className="text-[11px] text-gray-300 pt-1">
                      <span className="text-gray-500 font-semibold">Lessons Learned: </span>
                      {d.lessonsLearned.join('; ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7: WHAT-IF SIMULATOR & GROUNDED AI RESILIENCE ANALYST ──────────────── */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* What-If Simulator */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200">Cascading Blast-Radius & What-If Resilience Simulator</h3>
            <p className="text-xs text-gray-400">
              Simulate availability zone outages, regional blackouts, or database failures without risking live infrastructure.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Outage Scenario Name</label>
                <input
                  type="text"
                  value={simScenario}
                  onChange={(e) => setSimScenario(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Failure Trigger Description</label>
                <input
                  type="text"
                  value={simTrigger}
                  onChange={(e) => setSimTrigger(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                disabled={simulating}
                onClick={handleRunSimulation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition"
              >
                {simulating ? 'Simulating Blast Radius...' : 'Execute What-If Simulation'}
              </button>
            </div>

            {simResult && (
              <div className="mt-4 p-4 bg-gray-950 border border-gray-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200">Simulation Outcome: {simResult.scenario}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                    Blast Radius: {simResult.blastRadiusScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-gray-900 p-3 rounded">
                    <span className="text-gray-500 block">Cascading Impacted Services:</span>
                    <span className="text-red-400 font-bold">{simResult.cascadingImpactServices.join(', ') || 'None'}</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded">
                    <span className="text-gray-500 block">Data Loss Risk:</span>
                    <span className="text-amber-400 font-bold">{simResult.dataLossRisk}</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded">
                    <span className="text-gray-500 block">RTO / RPO Impact:</span>
                    <span className="text-cyan-400 font-bold">
                      {simResult.rtoEstimateMinutes}m RTO / {simResult.rpoEstimateMinutes}m RPO
                    </span>
                  </div>
                </div>

                <div className="text-xs bg-blue-950/30 border border-blue-900/50 p-3 rounded text-blue-200">
                  <span className="font-semibold block mb-1">Estimated Recovery Path:</span>
                  {simResult.estimatedRecoveryPath.join(' → ')}
                </div>
              </div>
            )}
          </div>

          {/* AI Resilience Analyst */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200">Grounded AI Resilience & DR Analyst</h3>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono">
                Zero-Fabrication Guard Active
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Query multi-cloud disaster recovery postures, analyze single points of failure, or evaluate backup compliance against real infrastructure evidence.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Which payment services are exposed to single-AZ failure in AWS us-east-1?"
                className="flex-1 bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAskAiAnalyst()}
              />
              <button
                disabled={aiLoading || !aiPrompt.trim()}
                onClick={handleAskAiAnalyst}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition"
              >
                {aiLoading ? 'Analyzing...' : 'Ask AI Analyst'}
              </button>
            </div>

            {aiResult && (
              <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300">Analyst Response ({aiResult.intent})</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Confidence: {aiResult.confidence}
                  </span>
                </div>
                <div className="text-gray-200 whitespace-pre-line leading-relaxed">{aiResult.primaryAnswer}</div>

                {aiResult.evidenceCitations.length > 0 && (
                  <div className="pt-2 border-t border-gray-800 text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-300">Evidence Citations: </span>
                    {aiResult.evidenceCitations.map((c) => `${c.title} (${c.type})`).join(' • ')}
                  </div>
                )}

                {aiResult.suggestedFollowUps.length > 0 && (
                  <div className="p-3 bg-gray-900 rounded border border-gray-800 space-y-1">
                    <span className="font-semibold text-emerald-400 block">Suggested Investigations:</span>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {aiResult.suggestedFollowUps.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE RECOVERY PLAN ───────────────────────────────────────────── */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-lg w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-100">Create Governed Recovery Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. AWS Aurora Multi-AZ Failover Runbook"
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Scenario Type</label>
                  <select
                    value={newPlanScenario}
                    onChange={(e) => setNewPlanScenario(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                  >
                    <option value="AZ_FAILURE">AZ Failure</option>
                    <option value="REGION_FAILURE">Region Failure</option>
                    <option value="DATABASE_FAILURE">Database Failure</option>
                    <option value="CLUSTER_FAILURE">Cluster Failure</option>
                    <option value="NODE_FAILURE">Node Failure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Plan Owner</label>
                  <input
                    type="text"
                    value={newPlanOwner}
                    onChange={(e) => setNewPlanOwner(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Target RTO (Minutes)</label>
                  <input
                    type="number"
                    value={newPlanRto}
                    onChange={(e) => setNewPlanRto(Number(e.target.value))}
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Target RPO (Minutes)</label>
                  <input
                    type="number"
                    value={newPlanRpo}
                    onChange={(e) => setNewPlanRpo(Number(e.target.value))}
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Initial Action Step</label>
                <input
                  type="text"
                  value={newPlanStepDesc}
                  onChange={(e) => setNewPlanStepDesc(e.target.value)}
                  placeholder="e.g. Promote cross-AZ read replica to master"
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold"
                >
                  Save Recovery Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: RECORD RECOVERY DRILL ──────────────────────────────────────────── */}
      {showDrillModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-lg w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-100">Record Recovery Drill Execution</h3>
            <form onSubmit={handleRecordDrill} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Drill Name</label>
                <input
                  type="text"
                  required
                  value={drillName}
                  onChange={(e) => setDrillName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Scenario Type</label>
                  <input
                    type="text"
                    value={drillScenarioType}
                    onChange={(e) => setDrillScenarioType(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Scope</label>
                  <input
                    type="text"
                    value={drillScope}
                    onChange={(e) => setDrillScope(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Observed RTO (Minutes)</label>
                  <input
                    type="number"
                    value={drillObservedRto}
                    onChange={(e) => setDrillObservedRto(Number(e.target.value))}
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Observed RPO (Minutes)</label>
                  <input
                    type="number"
                    value={drillObservedRpo}
                    onChange={(e) => setDrillObservedRpo(Number(e.target.value))}
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Drill Status</label>
                <select
                  value={drillStatus}
                  onChange={(e) => setDrillStatus(e.target.value as any)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                >
                  <option value="PASSED">PASSED</option>
                  <option value="PARTIALLY_PASSED">PARTIALLY PASSED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Lessons Learned</label>
                <textarea
                  rows={2}
                  value={drillLessons}
                  onChange={(e) => setDrillLessons(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowDrillModal(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold"
                >
                  Save Drill Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
