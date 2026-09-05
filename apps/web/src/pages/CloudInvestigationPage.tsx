import React, { useState, useEffect } from 'react';
import { cloudConnectionsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import type {
  CloudQueryAst,
  CloudQueryResult,
  NaturalLanguageInvestigationResponse,
  CloudInvestigation,
  CloudKnowledgeNode,
  CloudKnowledgeEdge,
  CloudKnowledgeNodeType,
  CloudKnowledgeRelationshipType,
  CloudQueryOperator
} from '@cloudpulse/shared';

export function CloudInvestigationPage() {
  // Navigation & View Mode
  const [leftTab, setLeftTab] = useState<'nl' | 'builder' | 'investigations' | 'history'>('nl');
  const [centerView, setCenterView] = useState<'graph' | 'table' | 'explain'>('graph');
  const [loading, setLoading] = useState(false);
  const [executingNl, setExecutingNl] = useState(false);

  // Natural Language State
  const [nlPrompt, setNlPrompt] = useState('Show all production resources exposed to the internet');
  const [nlResponse, setNlResponse] = useState<NaturalLanguageInvestigationResponse | null>(null);

  // Visual Query Builder State
  const [builderEntityType, setBuilderEntityType] = useState<CloudKnowledgeNodeType | 'ANY'>('RESOURCE');
  const [filterField, setFilterField] = useState('criticality');
  const [filterOp, setFilterOp] = useState<CloudQueryOperator>('EQUALS');
  const [filterVal, setFilterVal] = useState('CRITICAL');
  const [relConstraint, setRelConstraint] = useState<CloudKnowledgeRelationshipType | 'NONE'>('DRIFTS_FROM');

  // Query Result & Selection
  const [queryResult, setQueryResult] = useState<CloudQueryResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<CloudKnowledgeNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<CloudKnowledgeEdge | null>(null);

  // Investigation Management State
  const [investigations, setInvestigations] = useState<CloudInvestigation[]>([]);
  const [activeInvestigation, setActiveInvestigation] = useState<CloudInvestigation | null>(null);
  const [suggestions, setSuggestions] = useState<{ category: string; prompt: string; description: string; risk: string }[]>([]);
  const [queryHistory, setQueryHistory] = useState<any[]>([]);

  // Modals & Action States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [convertingDecision, setConvertingDecision] = useState(false);
  const [decisionSuccessMsg, setDecisionSuccessMsg] = useState<string | null>(null);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [invs, suggs, hist] = await Promise.all([
        cloudConnectionsApi.getAwsInvestigations(),
        cloudConnectionsApi.getAwsQuerySuggestions(),
        cloudConnectionsApi.getAwsQueryHistory(),
      ]);
      setInvestigations(invs || []);
      setSuggestions(suggs || []);
      setQueryHistory(hist || []);
      if (invs?.length > 0) {
        setActiveInvestigation(invs[0]);
      }
      // Run default prompt
      await executeNaturalLanguageQuery('Show all production resources exposed to the internet');
    } catch (err: any) {
      console.error('Failed to load investigation workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeNaturalLanguageQuery = async (promptToRun: string) => {
    try {
      setExecutingNl(true);
      setDecisionSuccessMsg(null);
      const res = await cloudConnectionsApi.queryAwsNaturalLanguage(promptToRun);
      setNlResponse(res);
      setQueryResult(res.queryResult);
      if (res.queryResult.nodes?.length > 0) {
        setSelectedNode(res.queryResult.nodes[0]);
      }
    } catch (err: any) {
      console.error('Natural language query failed:', err);
    } finally {
      setExecutingNl(false);
    }
  };

  const executeBuilderQuery = async () => {
    try {
      setExecutingNl(true);
      setDecisionSuccessMsg(null);
      const ast: CloudQueryAst = {
        primaryEntityType: builderEntityType,
        filters: filterVal ? [{ field: filterField, operator: filterOp, value: filterVal }] : [],
        relationships: relConstraint !== 'NONE' ? [{ relationshipType: relConstraint, depthLimit: 2 }] : []
      };

      const res = await cloudConnectionsApi.executeAwsQuery({
        queryAst: ast,
        queryType: 'VISUAL_BUILDER',
        scope: 'AWS Production Estate'
      });
      setQueryResult(res);
      setNlResponse(null);
      if (res.nodes?.length > 0) {
        setSelectedNode(res.nodes[0]);
      }
    } catch (err: any) {
      console.error('Builder query execution failed:', err);
    } finally {
      setExecutingNl(false);
    }
  };

  const handleConvertToDecision = async () => {
    if (!activeInvestigation) return;
    try {
      setConvertingDecision(true);
      const res = await cloudConnectionsApi.convertAwsInvestigationToDecision(activeInvestigation.id);
      if (res.success) {
        setDecisionSuccessMsg(res.message);
        const updated = await cloudConnectionsApi.getAwsInvestigationById(activeInvestigation.id);
        setActiveInvestigation(updated);
      }
    } catch (err: any) {
      console.error('Failed to convert investigation to decision:', err);
    } finally {
      setConvertingDecision(false);
    }
  };

  const handleExportReport = async () => {
    if (!activeInvestigation) return;
    try {
      const rep = await cloudConnectionsApi.getAwsInvestigationReport(activeInvestigation.id);
      setReportData(rep);
      setShowReportModal(true);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const getCriticalityBadge = (crit?: string) => {
    switch (crit) {
      case 'CRITICAL':
        return <span className="badge badge-danger">CRITICAL</span>;
      case 'HIGH':
        return <span className="badge badge-warning">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-info">MEDIUM</span>;
      case 'LOW':
        return <span className="badge badge-success">LOW</span>;
      default:
        return <span className="badge badge-neutral">{crit || 'INFO'}</span>;
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <PageHeader
          title="Cloud Investigation & Graph Query Engine"
          subtitle="Investigate AWS estate with structured safe queries, multi-hop relationship joins, and anti-hallucination natural language analysis"
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '13px' }}>
            ● LIVE AWS QUERY ENGINE
          </span>
          <button className="btn btn-secondary" onClick={handleExportReport} disabled={!activeInvestigation}>
            📄 Export Report
          </button>
        </div>
      </div>

      {decisionSuccessMsg && (
        <div style={{ marginTop: '16px', padding: '12px 16px', background: '#064e3b', border: '1px solid #059669', borderRadius: '8px', color: '#a7f3d0' }}>
          ✓ {decisionSuccessMsg}
        </div>
      )}

      {/* Main Investigation Workspace Three-Pane Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr 380px', gap: '20px', marginTop: '20px', minHeight: '750px' }}>

        {/* LEFT PANE: QUERY BUILDER & NATURAL LANGUAGE */}
        <div style={{ background: '#111827', borderRadius: '8px', border: '1px solid #374151', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #374151', paddingBottom: '8px', marginBottom: '14px' }}>
            <button
              onClick={() => setLeftTab('nl')}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '4px',
                border: 'none',
                background: leftTab === 'nl' ? '#1e3a8a' : 'transparent',
                color: leftTab === 'nl' ? '#60a5fa' : '#9ca3af',
                cursor: 'pointer'
              }}
            >
              💬 AI Analyst
            </button>
            <button
              onClick={() => setLeftTab('builder')}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '4px',
                border: 'none',
                background: leftTab === 'builder' ? '#1e3a8a' : 'transparent',
                color: leftTab === 'builder' ? '#60a5fa' : '#9ca3af',
                cursor: 'pointer'
              }}
            >
              ⚡ Query DSL
            </button>
            <button
              onClick={() => setLeftTab('investigations')}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '4px',
                border: 'none',
                background: leftTab === 'investigations' ? '#1e3a8a' : 'transparent',
                color: leftTab === 'investigations' ? '#60a5fa' : '#9ca3af',
                cursor: 'pointer'
              }}
            >
              📁 Cases ({investigations.length})
            </button>
            <button
              onClick={() => setLeftTab('history')}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '4px',
                border: 'none',
                background: leftTab === 'history' ? '#1e3a8a' : 'transparent',
                color: leftTab === 'history' ? '#60a5fa' : '#9ca3af',
                cursor: 'pointer'
              }}
            >
              📜 Log
            </button>
          </div>

          {/* TAB 1: NATURAL LANGUAGE INPUT */}
          {leftTab === 'nl' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Natural Language Query Prompt:</label>
                <textarea
                  rows={3}
                  value={nlPrompt}
                  onChange={(e) => setNlPrompt(e.target.value)}
                  placeholder="Ask a question across resources, IAM, security, incidents, drift, or costs..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#f3f4f6',
                    fontSize: '13px',
                    resize: 'none'
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => executeNaturalLanguageQuery(nlPrompt)}
                  disabled={executingNl || !nlPrompt.trim()}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {executingNl ? 'Analyzing Real AWS Estate...' : '🔍 Investigate'}
                </button>
              </div>

              {/* Suggestions */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Intelligent Investigation Suggestions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '380px', overflowY: 'auto' }}>
                  {suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setNlPrompt(s.prompt);
                        executeNaturalLanguageQuery(s.prompt);
                      }}
                      style={{
                        padding: '10px',
                        background: '#1f2937',
                        borderRadius: '6px',
                        border: '1px solid #374151',
                        cursor: 'pointer',
                        transition: 'background 0.1s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 'bold' }}>{s.category}</span>
                        {getCriticalityBadge(s.risk)}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#f3f4f6', marginTop: '4px' }}>
                        "{s.prompt}"
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                        {s.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL QUERY BUILDER */}
          {leftTab === 'builder' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>1. Primary Entity Domain</label>
                <select
                  value={builderEntityType}
                  onChange={(e) => setBuilderEntityType(e.target.value as any)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' }}
                >
                  <option value="RESOURCE">RESOURCE (EC2, S3, RDS, EKS, ALB)</option>
                  <option value="IDENTITY">IDENTITY (IAM User, Service Account)</option>
                  <option value="ROLE">ROLE (IAM Role, Execution Role)</option>
                  <option value="POLICY">POLICY (Governance Rules)</option>
                  <option value="CONTROL">CONTROL (Compliance Controls)</option>
                  <option value="DRIFT">DRIFT (AWS Config Deviations)</option>
                  <option value="SECURITY_FINDING">SECURITY_FINDING (GuardDuty, Inspector)</option>
                  <option value="INCIDENT">INCIDENT (Active Incidents)</option>
                  <option value="CHANGE">CHANGE (CloudTrail Mutations)</option>
                  <option value="COST_RECORD">COST_RECORD (FinOps Records)</option>
                  <option value="GOVERNANCE_DECISION">GOVERNANCE_DECISION</option>
                  <option value="ANY">ANY Entity Domain</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>2. Predicate Filter (WHERE)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <select
                    value={filterField}
                    onChange={(e) => setFilterField(e.target.value)}
                    style={{ padding: '6px', borderRadius: '6px', background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', fontSize: '12px' }}
                  >
                    <option value="criticality">criticality</option>
                    <option value="service">service</option>
                    <option value="riskScore">riskScore</option>
                    <option value="accountId">accountId</option>
                    <option value="region">region</option>
                  </select>
                  <select
                    value={filterOp}
                    onChange={(e) => setFilterOp(e.target.value as any)}
                    style={{ padding: '6px', borderRadius: '6px', background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', fontSize: '12px' }}
                  >
                    <option value="EQUALS">EQUALS</option>
                    <option value="NOT_EQUALS">NOT_EQUALS</option>
                    <option value="CONTAINS">CONTAINS</option>
                    <option value="GREATER_THAN">GREATER_THAN</option>
                    <option value="LESS_THAN">LESS_THAN</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={filterVal}
                  onChange={(e) => setFilterVal(e.target.value)}
                  placeholder="Filter value..."
                  style={{ width: '100%', padding: '6px 10px', marginTop: '6px', borderRadius: '6px', background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>3. Cross-Domain Relationship Join</label>
                <select
                  value={relConstraint}
                  onChange={(e) => setRelConstraint(e.target.value as any)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' }}
                >
                  <option value="NONE">No Relationship Join</option>
                  <option value="DRIFTS_FROM">DRIFTS_FROM (Config Drift)</option>
                  <option value="VIOLATES">VIOLATES (Policy Failures)</option>
                  <option value="AFFECTS">AFFECTS (Security Findings / CVEs)</option>
                  <option value="DEPENDS_ON">DEPENDS_ON (Topology Links)</option>
                  <option value="ASSUMES">ASSUMES (IAM Role Delegation)</option>
                  <option value="AUTHORIZES">AUTHORIZES (Instance Profiles)</option>
                  <option value="IMPACTS">IMPACTS (Incidents)</option>
                  <option value="COSTS">COSTS (Monthly Spend)</option>
                  <option value="REMEDIATED_BY">REMEDIATED_BY (Remediation Plans)</option>
                </select>
              </div>

              <button className="btn btn-primary" onClick={executeBuilderQuery} disabled={executingNl}>
                {executingNl ? 'Executing...' : 'Run Query AST'}
              </button>
            </div>
          )}

          {/* TAB 3: INVESTIGATION CASES */}
          {leftTab === 'investigations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
              {investigations.map((inv) => {
                const isSelected = activeInvestigation?.id === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setActiveInvestigation(inv)}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      background: isSelected ? '#1e3a8a' : '#1f2937',
                      border: isSelected ? '1px solid #60a5fa' : '1px solid #374151',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>{inv.status}</span>
                      {getCriticalityBadge(inv.severity)}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#f3f4f6', marginTop: '6px' }}>{inv.title}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{inv.scope}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: QUERY HISTORY */}
          {leftTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto' }}>
              {queryHistory.map((q, idx) => (
                <div key={idx} style={{ padding: '8px', background: '#1f2937', borderRadius: '4px', fontSize: '12px' }}>
                  <div style={{ color: '#60a5fa', fontWeight: 'bold' }}>{q.queryType}</div>
                  <div style={{ color: '#f3f4f6', marginTop: '2px' }}>{q.rawPrompt || JSON.stringify(q.queryAst)}</div>
                  <div style={{ color: '#9ca3af', fontSize: '10px', marginTop: '2px' }}>{new Date(q.createdAt).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CENTER PANE: QUERY RESULTS & GRAPH / TABLE / EXPLAIN VIEW */}
        <div style={{ background: '#111827', borderRadius: '8px', border: '1px solid #374151', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {/* Top Bar for Center */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`tab-btn ${centerView === 'graph' ? 'active' : ''}`}
                onClick={() => setCenterView('graph')}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', background: centerView === 'graph' ? '#1e3a8a' : '#1f2937', color: '#f3f4f6', cursor: 'pointer' }}
              >
                🌐 Graph Tiles ({queryResult?.nodes?.length || 0})
              </button>
              <button
                className={`tab-btn ${centerView === 'table' ? 'active' : ''}`}
                onClick={() => setCenterView('table')}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', background: centerView === 'table' ? '#1e3a8a' : '#1f2937', color: '#f3f4f6', cursor: 'pointer' }}
              >
                📋 Data Table
              </button>
              <button
                className={`tab-btn ${centerView === 'explain' ? 'active' : ''}`}
                onClick={() => setCenterView('explain')}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', background: centerView === 'explain' ? '#1e3a8a' : '#1f2937', color: '#f3f4f6', cursor: 'pointer' }}
              >
                ⚡ Explain Plan
              </button>
            </div>

            {queryResult && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '11px', color: '#9ca3af' }}>
                <span>Execution: <strong style={{ color: '#10b981' }}>{queryResult.executionTimeMs}ms</strong></span>
                <span>Coverage: <strong style={{ color: '#60a5fa' }}>{queryResult.coverageStatus}</strong></span>
              </div>
            )}
          </div>

          {/* Results Content */}
          {executingNl ? (
            <div style={{ marginTop: '60px' }}>
              <LoadingState message="Executing bounded query against real AWS Knowledge Graph..." />
            </div>
          ) : queryResult && queryResult.nodes.length > 0 ? (
            <div style={{ marginTop: '16px', flex: 1 }}>
              {/* VIEW 1: GRAPH TILES */}
              {centerView === 'graph' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', maxHeight: '620px', overflowY: 'auto' }}>
                  {queryResult.nodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        style={{
                          padding: '12px',
                          borderRadius: '6px',
                          background: isSelected ? '#1e3a8a' : '#1f2937',
                          border: isSelected ? '1px solid #60a5fa' : '1px solid #374151',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{node.type}</span>
                          {getCriticalityBadge(node.criticality)}
                        </div>
                        <div style={{ fontWeight: '600', color: '#f3f4f6', fontSize: '13px', marginTop: '6px', wordBreak: 'break-word' }}>
                          {node.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                          {node.service} • Risk: {node.riskScore}/100
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VIEW 2: ACCESSIBLE DATA TABLE */}
              {centerView === 'table' && (
                <div style={{ maxHeight: '620px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#e5e7eb' }}>
                    <thead>
                      <tr style={{ background: '#1f2937', textAlign: 'left', borderBottom: '1px solid #374151' }}>
                        <th style={{ padding: '8px' }}>Type</th>
                        <th style={{ padding: '8px' }}>Entity Name / ID</th>
                        <th style={{ padding: '8px' }}>Service</th>
                        <th style={{ padding: '8px' }}>Criticality</th>
                        <th style={{ padding: '8px' }}>Risk Score</th>
                        <th style={{ padding: '8px' }}>Provenance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.nodes.map((n) => (
                        <tr
                          key={n.id}
                          onClick={() => setSelectedNode(n)}
                          style={{
                            borderBottom: '1px solid #374151',
                            background: selectedNode?.id === n.id ? '#1e3a8a' : 'transparent',
                            cursor: 'pointer'
                          }}
                        >
                          <td style={{ padding: '8px' }}><span className="badge badge-neutral">{n.type}</span></td>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{n.name}</td>
                          <td style={{ padding: '8px' }}>{n.service}</td>
                          <td style={{ padding: '8px' }}>{getCriticalityBadge(n.criticality)}</td>
                          <td style={{ padding: '8px' }}>{n.riskScore}/100</td>
                          <td style={{ padding: '8px', color: '#10b981', fontSize: '10px' }}>{n.provenance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VIEW 3: EXPLAIN PLAN */}
              {centerView === 'explain' && queryResult.explainPlan && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: '#1f2937', borderRadius: '6px', border: '1px solid #374151' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#93c5fd' }}>Query Execution Summary</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      Records Examined: {queryResult.explainPlan.recordsExamined} | Returned: {queryResult.explainPlan.recordsReturned} | Cost: {queryResult.explainPlan.estimatedExecutionCost}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {queryResult.explainPlan.steps.map((step) => (
                      <div key={step.order} style={{ padding: '10px', background: '#1f2937', borderRadius: '6px', borderLeft: '3px solid #60a5fa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f3f4f6' }}>Step {step.order}: {step.operation}</span>
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{step.estimatedComplexity}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{step.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '60px', textAlign: 'center', color: '#9ca3af' }}>
              <p>No matching entities found. Adjust your natural language prompt or query filters.</p>
            </div>
          )}
        </div>

        {/* RIGHT PANE: EVIDENCE & INVESTIGATION TIMELINE DRAWER */}
        <div style={{ background: '#111827', borderRadius: '8px', border: '1px solid #374151', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

          {/* AI Evidence Explanation Card */}
          {nlResponse && (
            <div style={{ background: '#1f2937', border: '1px solid #3b82f6', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#60a5fa' }}>AI EVIDENCE SYNTHESIS</span>
                {getCriticalityBadge(nlResponse.riskLevel)}
              </div>
              <p style={{ fontSize: '13px', color: '#f3f4f6', margin: '8px 0', fontWeight: '500' }}>
                {nlResponse.explanation}
              </p>

              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                <strong>Key Evidence:</strong>
                <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>
                  {nlResponse.evidenceSummary.map((ev, i) => (
                    <li key={i} style={{ color: '#d1d5db', marginBottom: '2px' }}>{ev}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '10px', padding: '8px', background: '#111827', borderRadius: '4px', fontSize: '11px', color: '#a7f3d0', border: '1px solid #059669' }}>
                <strong>Recommended Next Step:</strong> {nlResponse.suggestedNextStep}
              </div>
            </div>
          )}

          {/* Selected Entity 360 Inspector */}
          {selectedNode && (
            <div style={{ background: '#1f2937', borderRadius: '8px', padding: '14px', border: '1px solid #374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#f3f4f6' }}>{selectedNode.name}</h4>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{selectedNode.type} • {selectedNode.service}</span>
                </div>
                {getCriticalityBadge(selectedNode.criticality)}
              </div>

              <div style={{ marginTop: '10px', fontSize: '11px', color: '#d1d5db' }}>
                <div>Account: <strong>{selectedNode.accountId}</strong></div>
                <div>Region: <strong>{selectedNode.region}</strong></div>
                <div>Provenance: <strong style={{ color: '#10b981' }}>{selectedNode.provenance}</strong></div>
              </div>

              {/* Connected edges */}
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af' }}>Connected Relationships:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                  {queryResult?.edges
                    .filter((e) => e.sourceNodeId === selectedNode.id || e.targetNodeId === selectedNode.id)
                    .map((e) => (
                      <div key={e.id} style={{ padding: '6px', background: '#111827', borderRadius: '4px', fontSize: '10px', color: '#93c5fd' }}>
                        {e.relationshipType} ({e.evidenceStrength})
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Investigation Narrative Timeline */}
          {activeInvestigation && (
            <div style={{ background: '#1f2937', borderRadius: '8px', padding: '14px', border: '1px solid #374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f3f4f6' }}>Investigation Timeline</span>
                <span className="badge badge-info" style={{ fontSize: '10px' }}>{activeInvestigation.status}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                {activeInvestigation.timeline.map((t) => (
                  <div key={t.id} style={{ padding: '8px', background: '#111827', borderRadius: '4px', borderLeft: '2px solid #3b82f6' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f3f4f6' }}>{t.title}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{t.description}</div>
                  </div>
                ))}
              </div>

              {/* Conversion Action */}
              <button
                className="btn btn-primary"
                onClick={handleConvertToDecision}
                disabled={convertingDecision || !!activeInvestigation.decisionId}
                style={{ width: '100%', marginTop: '12px', fontSize: '12px' }}
              >
                {activeInvestigation.decisionId ? '✓ Linked to Decision Engine' : convertingDecision ? 'Converting...' : '⚖️ Convert to Governance Decision'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export Report Modal */}
      {showReportModal && reportData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '24px', maxWidth: '650px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#f3f4f6' }}>Cloud Investigation Report</h3>
              <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>✕ Close</button>
            </div>

            <div style={{ marginTop: '16px', fontSize: '13px', color: '#d1d5db' }}>
              <p><strong>Executive Summary:</strong> {reportData.executiveSummary}</p>
              <p><strong>Status:</strong> {reportData.investigation?.status} | <strong>Severity:</strong> {reportData.investigation?.severity}</p>

              <h4 style={{ color: '#f3f4f6', marginTop: '16px' }}>Key Findings:</h4>
              {reportData.findings?.map((f: any, i: number) => (
                <div key={i} style={{ padding: '10px', background: '#1f2937', borderRadius: '6px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#f87171' }}>{f.title} ({f.severity})</div>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '12px' }}>
                    {f.evidence?.map((e: string, j: number) => (
                      <li key={j}>{e}</li>
                    ))}
                  </ul>
                </div>
              ))}

              <h4 style={{ color: '#f3f4f6', marginTop: '16px' }}>Recommended Actions:</h4>
              <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '12px' }}>
                {reportData.recommendedActions?.map((act: string, k: number) => (
                  <li key={k} style={{ marginBottom: '4px' }}>{act}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
