import React, { useState, useEffect } from 'react';
import { cloudConnectionsApi } from '../api/client.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { LoadingState } from '../components/ui/States.tsx';
import type {
  CloudKnowledgeGraphSummary,
  CloudKnowledgeNode,
  CloudKnowledgeEdge,
  ResourceRiskProfile,
  GraphPathResult,
  GraphDiffResult,
  CloudKnowledgeNodeType
} from '@cloudpulse/shared';

export function GovernanceKnowledgeGraphPage() {
  const [summary, setSummary] = useState<CloudKnowledgeGraphSummary | null>(null);
  const [nodes, setNodes] = useState<CloudKnowledgeNode[]>([]);
  const [edges, setEdges] = useState<CloudKnowledgeEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<CloudKnowledgeNode | null>(null);
  const [activeTab, setActiveTab] = useState<'explorer' | 'path_tracer' | 'resource_profile' | 'diff'>('explorer');
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('all');

  // Path Tracer state
  const [sourceNodeId, setSourceNodeId] = useState<string>('usr-deployer-ci');
  const [targetNodeId, setTargetNodeId] = useState<string>('s3-cloudpulse-prod-audit-logs-2026');
  const [pathResult, setPathResult] = useState<GraphPathResult | null>(null);
  const [tracingPath, setTracingPath] = useState(false);

  // Resource Risk Profile state
  const [profileResourceId, setProfileResourceId] = useState<string>('s3-cloudpulse-prod-audit-logs-2026');
  const [riskProfile, setRiskProfile] = useState<ResourceRiskProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Graph Diff state
  const [graphDiff, setGraphDiff] = useState<GraphDiffResult | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, nList, eList] = await Promise.all([
        cloudConnectionsApi.getAwsKnowledgeGraphSummary(),
        cloudConnectionsApi.getAwsKnowledgeGraphNodes(),
        cloudConnectionsApi.getAwsKnowledgeGraphEdges(),
      ]);
      setSummary(sum);
      setNodes(nList || []);
      setEdges(eList || []);
      if (nList?.length > 0 && !selectedNode) {
        setSelectedNode(nList[0]);
      }
    } catch (err: any) {
      console.error('Failed to load knowledge graph data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTracePath = async () => {
    if (!sourceNodeId || !targetNodeId) return;
    try {
      setTracingPath(true);
      const res = await cloudConnectionsApi.getAwsKnowledgeGraphPath(sourceNodeId, targetNodeId);
      setPathResult(res);
    } catch (err: any) {
      console.error('Failed to trace graph path:', err);
    } finally {
      setTracingPath(false);
    }
  };

  const handleLoadResourceProfile = async (id: string) => {
    try {
      setLoadingProfile(true);
      setProfileResourceId(id);
      const res = await cloudConnectionsApi.getAwsResourceRiskProfile(id);
      setRiskProfile(res);
      setActiveTab('resource_profile');
    } catch (err: any) {
      console.error('Failed to load resource risk profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLoadDiff = async () => {
    try {
      setLoadingDiff(true);
      const diff = await cloudConnectionsApi.getAwsKnowledgeGraphDiff();
      setGraphDiff(diff);
    } catch (err: any) {
      console.error('Failed to load graph diff:', err);
    } finally {
      setLoadingDiff(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'path_tracer' && !pathResult) {
      handleTracePath();
    } else if (activeTab === 'resource_profile' && !riskProfile) {
      handleLoadResourceProfile(profileResourceId);
    } else if (activeTab === 'diff' && !graphDiff) {
      handleLoadDiff();
    }
  }, [activeTab]);

  const filteredNodes = nodes.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (criticalityFilter !== 'all' && n.criticality !== criticalityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return n.name.toLowerCase().includes(q) || n.id.toLowerCase().includes(q) || n.service.toLowerCase().includes(q);
    }
    return true;
  });

  const getCriticalityBadge = (crit: string) => {
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
        return <span className="badge badge-neutral">{crit}</span>;
    }
  };

  const getNodeTypeIcon = (type: CloudKnowledgeNodeType) => {
    switch (type) {
      case 'RESOURCE':
        return '📦';
      case 'IDENTITY':
      case 'ROLE':
        return '👤';
      case 'POLICY':
        return '📜';
      case 'CONTROL':
      case 'COMPLIANCE_CONTROL':
        return '🛡️';
      case 'DRIFT':
        return '⚡';
      case 'SECURITY_FINDING':
        return '🚨';
      case 'INCIDENT':
        return '🔥';
      case 'COST_RECORD':
        return '💰';
      case 'METRIC':
        return '📊';
      case 'PREDICTION':
        return '🔮';
      case 'REMEDIATION':
        return '🔧';
      case 'GOVERNANCE_DECISION':
        return '⚖️';
      default:
        return '🌐';
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <PageHeader
          title="AWS Governance Knowledge Graph & Cross-Domain Risk Intelligence"
          subtitle="Unified cross-domain intelligence connecting AWS resources, identities, policies, controls, drift, security findings, costs, and remediations"
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '13px' }}>
            ● LIVE AWS EVIDENCE GRAPH
          </span>
          <button
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Graph'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4" style={{ gap: '16px', marginTop: '20px' }}>
        <Card title="Knowledge Graph Nodes">
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa' }}>
            {summary?.nodeCount ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            Across 14 Connected Cloud Domains
          </div>
        </Card>

        <Card title="Cross-Domain Relationships">
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#a78bfa' }}>
            {summary?.edgeCount ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            100% Attributed with Evidence Strength
          </div>
        </Card>

        <Card title="Critical Risk Entities">
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>
            {summary?.criticalNodesCount ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            Composite Risk Score ≥ 75
          </div>
        </Card>

        <Card title="High-Risk Attack Paths">
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fbbf24' }}>
            {summary?.highRiskPathsCount ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            Identity ↔ Drift ↔ Asset Chains
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #374151', marginTop: '24px', gap: '8px' }}>
        <button
          className={`tab-btn ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'explorer' ? '2px solid #60a5fa' : 'none',
            color: activeTab === 'explorer' ? '#60a5fa' : '#9ca3af',
            fontWeight: activeTab === 'explorer' ? '600' : 'normal',
            cursor: 'pointer'
          }}
        >
          🌐 Graph & Entity Explorer
        </button>
        <button
          className={`tab-btn ${activeTab === 'path_tracer' ? 'active' : ''}`}
          onClick={() => setActiveTab('path_tracer')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'path_tracer' ? '2px solid #60a5fa' : 'none',
            color: activeTab === 'path_tracer' ? '#60a5fa' : '#9ca3af',
            fontWeight: activeTab === 'path_tracer' ? '600' : 'normal',
            cursor: 'pointer'
          }}
        >
          🔗 Cross-Domain Path Tracer
        </button>
        <button
          className={`tab-btn ${activeTab === 'resource_profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('resource_profile')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'resource_profile' ? '2px solid #60a5fa' : 'none',
            color: activeTab === 'resource_profile' ? '#60a5fa' : '#9ca3af',
            fontWeight: activeTab === 'resource_profile' ? '600' : 'normal',
            cursor: 'pointer'
          }}
        >
          🛡️ 360° Resource Risk Profile
        </button>
        <button
          className={`tab-btn ${activeTab === 'diff' ? 'active' : ''}`}
          onClick={() => setActiveTab('diff')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'diff' ? '2px solid #60a5fa' : 'none',
            color: activeTab === 'diff' ? '#60a5fa' : '#9ca3af',
            fontWeight: activeTab === 'diff' ? '600' : 'normal',
            cursor: 'pointer'
          }}
        >
          📈 Graph Diff & Structural Timeline
        </button>
      </div>

      {loading ? (
        <div style={{ marginTop: '40px' }}>
          <LoadingState message="Connecting live AWS governance graph nodes and cross-domain relationships..." />
        </div>
      ) : (
        <>
          {/* TAB 1: GRAPH & ENTITY EXPLORER */}
          {activeTab === 'explorer' && (
            <div style={{ marginTop: '20px' }}>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search nodes by name, ID, or service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field"
                  style={{
                    flex: '1 1 250px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    background: '#1f2937',
                    color: '#f3f4f6'
                  }}
                />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    background: '#1f2937',
                    color: '#f3f4f6'
                  }}
                >
                  <option value="all">All Entity Domains</option>
                  <option value="RESOURCE">Resource</option>
                  <option value="IDENTITY">Identity</option>
                  <option value="ROLE">IAM Role</option>
                  <option value="POLICY">Governance Policy</option>
                  <option value="CONTROL">Governance Control</option>
                  <option value="DRIFT">Configuration Drift</option>
                  <option value="SECURITY_FINDING">Security Finding</option>
                  <option value="INCIDENT">Incident</option>
                  <option value="COST_RECORD">FinOps Cost</option>
                  <option value="PREDICTION">Prediction</option>
                  <option value="REMEDIATION">Remediation Plan</option>
                  <option value="GOVERNANCE_DECISION">Decision</option>
                </select>
                <select
                  value={criticalityFilter}
                  onChange={(e) => setCriticalityFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    background: '#1f2937',
                    color: '#f3f4f6'
                  }}
                >
                  <option value="all">All Criticalities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Explorer Content Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                {/* Node Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                  {filteredNodes.map((n) => {
                    const isSelected = selectedNode?.id === n.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          background: isSelected ? '#1e3a8a' : '#1f2937',
                          border: isSelected ? '1px solid #60a5fa' : '1px solid #374151',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '18px' }}>{getNodeTypeIcon(n.type)}</span>
                          {getCriticalityBadge(n.criticality)}
                        </div>
                        <div style={{ fontWeight: '600', color: '#f3f4f6', marginTop: '8px', fontSize: '14px', wordBreak: 'break-word' }}>
                          {n.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          {n.type} • {n.service}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>Risk: {n.riskScore}/100</span>
                          {n.type === 'RESOURCE' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadResourceProfile(n.id);
                              }}
                              style={{ fontSize: '11px', padding: '2px 6px' }}
                            >
                              View 360° Profile
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Node Detail & Connected Relationships Drawer */}
                {selectedNode && (
                  <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '24px' }}>{getNodeTypeIcon(selectedNode.type)}</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', color: '#f3f4f6' }}>{selectedNode.name}</h3>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>ID: {selectedNode.id}</div>
                        </div>
                      </div>
                      {getCriticalityBadge(selectedNode.criticality)}
                    </div>

                    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ background: '#1f2937', padding: '10px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>DOMAIN / TYPE</div>
                        <div style={{ fontWeight: '600', color: '#e5e7eb', marginTop: '2px' }}>{selectedNode.type}</div>
                      </div>
                      <div style={{ background: '#1f2937', padding: '10px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>SERVICE</div>
                        <div style={{ fontWeight: '600', color: '#e5e7eb', marginTop: '2px' }}>{selectedNode.service}</div>
                      </div>
                      <div style={{ background: '#1f2937', padding: '10px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>ACCOUNT & REGION</div>
                        <div style={{ fontWeight: '600', color: '#e5e7eb', marginTop: '2px' }}>{selectedNode.accountId} ({selectedNode.region})</div>
                      </div>
                      <div style={{ background: '#1f2937', padding: '10px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>PROVENANCE</div>
                        <div style={{ fontWeight: '600', color: '#10b981', marginTop: '2px' }}>{selectedNode.provenance}</div>
                      </div>
                    </div>

                    {/* Connected Relationships list */}
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#d1d5db' }}>Connected Graph Edges ({edges.filter(e => e.sourceNodeId === selectedNode.id || e.targetNodeId === selectedNode.id).length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                        {edges
                          .filter(e => e.sourceNodeId === selectedNode.id || e.targetNodeId === selectedNode.id)
                          .map(e => {
                            const isOutgoing = e.sourceNodeId === selectedNode.id;
                            const peerId = isOutgoing ? e.targetNodeId : e.sourceNodeId;
                            const peerNode = nodes.find(n => n.id === peerId);
                            return (
                              <div
                                key={e.id}
                                style={{
                                  padding: '10px',
                                  background: '#1f2937',
                                  borderRadius: '6px',
                                  borderLeft: '3px solid #60a5fa',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#93c5fd' }}>
                                    {isOutgoing ? '──(' + e.relationshipType + ')──►' : '◄──(' + e.relationshipType + ')──'}
                                  </div>
                                  <div style={{ fontSize: '13px', color: '#f3f4f6', marginTop: '2px' }}>
                                    {peerNode?.name || peerId}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                    Evidence: {e.evidenceStrength} ({e.confidence} Confidence)
                                  </div>
                                </div>
                                <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                                  {e.provenance}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PATH TRACER */}
          {activeTab === 'path_tracer' && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ background: '#1f2937', padding: '18px', borderRadius: '8px', border: '1px solid #374151' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f3f4f6' }}>Trace Cross-Domain Attack & Dependency Risk Paths</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 250px' }}>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>SOURCE NODE (e.g. Identity, Change, Drift)</label>
                    <select
                      value={sourceNodeId}
                      onChange={(e) => setSourceNodeId(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#111827', color: '#f3f4f6', border: '1px solid #374151' }}
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>[{n.type}] {n.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: '1 1 250px' }}>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>TARGET NODE (e.g. Resource, Policy, Incident)</label>
                    <select
                      value={targetNodeId}
                      onChange={(e) => setTargetNodeId(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#111827', color: '#f3f4f6', border: '1px solid #374151' }}
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>[{n.type}] {n.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleTracePath}
                    disabled={tracingPath}
                    style={{ padding: '8px 16px', height: '38px' }}
                  >
                    {tracingPath ? 'Tracing...' : 'Trace Path'}
                  </button>
                </div>
              </div>

              {/* Path Result Display */}
              {pathResult && (
                <div style={{ marginTop: '20px' }}>
                  {pathResult.pathFound && pathResult.path ? (
                    <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span className="badge badge-success" style={{ marginRight: '8px' }}>PATH FOUND</span>
                          <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Total Hops: {pathResult.path.totalHops} | Overall Path Risk: <strong>{pathResult.path.overallRisk}/100</strong></span>
                        </div>
                        <span className="badge badge-neutral">PROVENANCE: {pathResult.provenance}</span>
                      </div>

                      {/* Step by step timeline */}
                      <div style={{ marginTop: '24px', position: 'relative', paddingLeft: '20px' }}>
                        {pathResult.path.nodes.map((node, idx) => {
                          const edge = idx < pathResult.path!.edges.length ? pathResult.path!.edges[idx] : null;
                          return (
                            <div key={node.id} style={{ marginBottom: '24px', position: 'relative' }}>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: '#1e3a8a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px'
                                }}>
                                  {getNodeTypeIcon(node.type)}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600', color: '#f3f4f6', fontSize: '15px' }}>{node.name}</span>
                                    {getCriticalityBadge(node.criticality)}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                                    {node.type} • {node.service} • Risk Score: {node.riskScore}
                                  </div>
                                </div>
                              </div>

                              {edge && (
                                <div style={{
                                  margin: '12px 0 12px 18px',
                                  padding: '8px 12px',
                                  background: '#1f2937',
                                  borderLeft: '2px solid #60a5fa',
                                  borderRadius: '0 6px 6px 0',
                                  fontSize: '12px'
                                }}>
                                  <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>RELATIONSHIP: {edge.relationshipType}</span>
                                  <span style={{ marginLeft: '12px', color: '#9ca3af' }}>Evidence: {edge.evidenceStrength} | Confidence: {edge.confidence}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#1f2937', padding: '30px', textAlign: 'center', borderRadius: '8px' }}>
                      <p style={{ color: '#9ca3af', margin: 0 }}>No direct or transitive relationship path found between the selected entities.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 360° RESOURCE RISK PROFILE */}
          {activeTab === 'resource_profile' && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', color: '#9ca3af' }}>Select AWS Resource:</label>
                <select
                  value={profileResourceId}
                  onChange={(e) => handleLoadResourceProfile(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' }}
                >
                  {nodes.filter(n => n.type === 'RESOURCE').map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.service})</option>
                  ))}
                </select>
              </div>

              {loadingProfile ? (
                <LoadingState message="Aggregating 360° cross-domain evidence for resource..." />
              ) : riskProfile ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                  {/* Left Column: Composite Risk & Controls & Drift */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #374151' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', color: '#f3f4f6' }}>{riskProfile.resourceName}</h3>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                            {riskProfile.service} • {riskProfile.accountId} • {riskProfile.region}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: riskProfile.compositeRiskScore > 70 ? '#f87171' : '#60a5fa' }}>
                            {riskProfile.compositeRiskScore}/100
                          </div>
                          {getCriticalityBadge(riskProfile.criticality)}
                        </div>
                      </div>

                      {/* Risk factors */}
                      <div style={{ marginTop: '16px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#d1d5db' }}>Identified Risk Factors</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {riskProfile.riskFactors.map((rf, idx) => (
                            <div key={idx} style={{ padding: '8px', background: '#1f2937', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '12px', color: '#f3f4f6' }}>{rf.description}</span>
                              <span className="badge badge-warning" style={{ fontSize: '10px' }}>+{rf.score} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Protecting Controls & Policies */}
                    <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #374151' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f3f4f6' }}>Protecting Governance Controls ({riskProfile.protectingControls.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {riskProfile.protectingControls.map((ctrl) => (
                          <div key={ctrl.id} style={{ padding: '10px', background: '#1f2937', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#f3f4f6' }}>{ctrl.name}</div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Enforcement: {ctrl.enforcement}</div>
                            </div>
                            <span className={`badge ${ctrl.status === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
                              {ctrl.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Security Findings, Identities, Decisions & Remediations */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Security Findings & Drift */}
                    <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #374151' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f3f4f6' }}>Security & Drift Findings</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {riskProfile.activeDrifts.map(d => (
                          <div key={d.id} style={{ padding: '8px', background: '#374151', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#f87171' }}>⚡ Drift: {d.driftType}</span>
                            <span className="badge badge-danger">DRIFT</span>
                          </div>
                        ))}
                        {riskProfile.securityFindings.map(s => (
                          <div key={s.id} style={{ padding: '8px', background: '#374151', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#f3f4f6' }}>🚨 {s.title}</span>
                            {getCriticalityBadge(s.severity)}
                          </div>
                        ))}
                        {riskProfile.activeDrifts.length === 0 && riskProfile.securityFindings.length === 0 && (
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>No open security findings or configuration drifts.</div>
                        )}
                      </div>
                    </div>

                    {/* Governance Decisions & Remediation Plans */}
                    <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #374151' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f3f4f6' }}>Governance Decisions & Remediation</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {riskProfile.governanceDecisions.map(dec => (
                          <div key={dec.id} style={{ padding: '8px', background: '#1f2937', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#60a5fa' }}>⚖️ {dec.title}</span>
                            <span className="badge badge-info">{dec.status}</span>
                          </div>
                        ))}
                        {riskProfile.suggestedRemediations.map(rem => (
                          <div key={rem.id} style={{ padding: '8px', background: '#1f2937', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#10b981' }}>🔧 {rem.title}</span>
                            <span className="badge badge-success">{rem.safetyScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 4: GRAPH DIFF */}
          {activeTab === 'diff' && (
            <div style={{ marginTop: '20px' }}>
              {loadingDiff ? (
                <LoadingState message="Calculating structural graph diff against historical baseline..." />
              ) : graphDiff ? (
                <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#f3f4f6' }}>Structural Graph Evolution & Changes</h3>
                    <span className="badge badge-neutral">PROVENANCE: {graphDiff.provenance}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <div>
                      <h4 style={{ color: '#34d399', fontSize: '14px', margin: '0 0 10px 0' }}>Newly Added Graph Entities ({graphDiff.addedNodes.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {graphDiff.addedNodes.map(n => (
                          <div key={n.id} style={{ padding: '8px', background: '#1f2937', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#f3f4f6' }}>+{n.name}</span>
                            <span className="badge badge-success">{n.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: '#fbbf24', fontSize: '14px', margin: '0 0 10px 0' }}>Modified Risk Profiles ({graphDiff.modifiedNodes.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {graphDiff.modifiedNodes.map((m, idx) => (
                          <div key={idx} style={{ padding: '8px', background: '#1f2937', borderRadius: '4px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f3f4f6' }}>{m.node.name}</div>
                            <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '2px' }}>
                              Risk score increased from {m.changes.riskScore?.previous} to {m.changes.riskScore?.current}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
