import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidents } from '../api/hooks.ts';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Card } from '../components/ui/StatCard.tsx';
import { FilterBar, SelectFilter } from '../components/ui/FilterBar.tsx';
import { DataTable, type Column } from '../components/ui/DataTable.tsx';
import { Drawer } from '../components/ui/Drawer.tsx';
import { SeverityBadge } from '../components/ui/SeverityBadge.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { LoadingState, ErrorState } from '../components/ui/States.tsx';
import { TracesIcon, LogsIcon, AlertsIcon } from '../components/ui/Icons.tsx';
import type { Incident } from '@cloudpulse/shared';

export function IncidentsPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const { data: incidents, loading, error, refetch } = useIncidents(
    {
      severity: severityFilter !== 'all' ? severityFilter : undefined,
      state: stateFilter !== 'all' ? stateFilter : undefined,
    },
    10000
  );

  // Sync route param :id
  useEffect(() => {
    if (id && incidents) {
      const match = incidents.find((i) => i.id === id);
      if (match) {
        setSelectedIncident(match);
      }
    } else if (!id) {
      setSelectedIncident(null);
    }
  }, [id, incidents]);

  if (loading && !incidents) {
    return (
      <div className="page-container">
        <LoadingState message="Loading Incident Response Workspace..." />
      </div>
    );
  }

  if (error && !incidents) {
    return (
      <div className="page-container">
        <ErrorState title="Incident System Error" message={error} onRetry={refetch} />
      </div>
    );
  }

  const allIncidents = incidents || [];
  const filtered = allIncidents.filter(
    (i) =>
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.affectedServices.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCloseDrawer = () => {
    setSelectedIncident(null);
    if (id) {
      navigate('/incidents');
    }
  };

  const handleSelectIncident = (i: Incident) => {
    setSelectedIncident(i);
    navigate(`/incidents/${i.id}`);
  };

  const columns: Column<Incident>[] = [
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      sortValue: (i) => i.severity,
      render: (i) => <SeverityBadge severity={i.severity} />,
    },
    {
      key: 'title',
      header: 'Incident ID & Title',
      sortable: true,
      sortValue: (i) => i.title,
      render: (i) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand)', fontSize: '11.5px' }}>
              {i.id}
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {i.title}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {i.summary}
          </span>
        </div>
      ),
    },
    {
      key: 'state',
      header: 'Status',
      sortable: true,
      sortValue: (i) => i.state,
      render: (i) => <StatusBadge status="at_risk" label={i.state} />,
    },
    {
      key: 'services',
      header: 'Affected Services',
      render: (i) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          {i.affectedServices.join(', ')}
        </span>
      ),
    },
    {
      key: 'commander',
      header: 'Incident Lead',
      sortable: true,
      sortValue: (i) => i.commander || '',
      render: (i) => <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{i.commander || 'Unassigned'}</span>,
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      sortValue: (i) => i.durationMinutes,
      align: 'right',
      render: (i) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-critical)' }}>
          {i.durationMinutes}m active
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Incident Response Console"
        subtitle="Automated alert-to-incident correlation, postmortem tracking, and SRE incident command center"
        badge={
          <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            DEMO INCIDENT DATA
          </span>
        }
      />

      {/* Filter Controls */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search incidents by ID, title, or affected service..."
        totalCount={allIncidents.length}
        filteredCount={filtered.length}
        filters={
          <>
            <SelectFilter
              label="Severity"
              value={severityFilter}
              onChange={setSeverityFilter}
              options={[
                { label: 'All Severities', value: 'all' },
                { label: 'SEV1 Critical', value: 'sev1' },
                { label: 'SEV2 High', value: 'sev2' },
                { label: 'SEV3 Medium', value: 'sev3' },
              ]}
            />
            <SelectFilter
              label="State"
              value={stateFilter}
              onChange={setStateFilter}
              options={[
                { label: 'All States', value: 'all' },
                { label: 'Investigating', value: 'investigating' },
                { label: 'Identified', value: 'identified' },
                { label: 'Mitigating', value: 'mitigating' },
                { label: 'Resolved', value: 'resolved' },
              ]}
            />
          </>
        }
      />

      {/* Incidents Table */}
      <Card padding="0">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(i) => i.id}
          onRowClick={handleSelectIncident}
          pageSize={10}
        />
      </Card>

      {/* ── Incident Response Workspace Drawer ────────────────────────────── */}
      <Drawer
        isOpen={selectedIncident !== null}
        onClose={handleCloseDrawer}
        title={selectedIncident?.title || 'Incident Workspace'}
        subtitle={`Incident ID: ${selectedIncident?.id} · Commander: ${selectedIncident?.commander}`}
        badge={selectedIncident ? <SeverityBadge severity={selectedIncident.severity} /> : null}
        width="760px"
      >
        {selectedIncident && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Impact Assessment Card */}
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--status-critical-bg)',
                border: '1px solid var(--status-critical-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--status-critical)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Operational & Financial Impact
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                {selectedIncident.impact}
              </div>
            </div>

            {/* Affected Services */}
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                Affected Services
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedIncident.affectedServices.map((svc) => (
                  <span
                    key={svc}
                    onClick={() => {
                      navigate(`/services/${svc}`);
                      setSelectedIncident(null);
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--brand)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {svc} →
                  </span>
                ))}
              </div>
            </div>

            {/* Incident Chronological Timeline */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Incident Response Timeline ({selectedIncident.timeline.length} Events)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid var(--border-strong)', paddingLeft: '14px', marginLeft: '6px' }}>
                {selectedIncident.timeline.map((event) => (
                  <div key={event.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '-19px',
                        top: '4px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand)',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {event.title}
                      </span>
                      <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                      {event.description}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Logged by {event.author}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Correlated Traces & Logs */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Correlated Telemetry Artifacts
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => {
                    navigate(selectedIncident.relatedTraceIds[0] ? `/traces/${selectedIncident.relatedTraceIds[0]}` : '/traces');
                    setSelectedIncident(null);
                  }}
                  style={{
                    padding: '10px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--status-purple)',
                    fontSize: '11.5px',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'left',
                  }}
                >
                  <TracesIcon /> Attached Traces ({selectedIncident.relatedTraceIds.length}) →
                </button>

                <button
                  onClick={() => {
                    navigate('/logs');
                    setSelectedIncident(null);
                  }}
                  style={{
                    padding: '10px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--brand)',
                    fontSize: '11.5px',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'left',
                  }}
                >
                  <LogsIcon /> Correlated Error Logs ({selectedIncident.relatedLogIds.length}) →
                </button>
              </div>
            </div>

            {/* Postmortem & Root Cause Notes */}
            {selectedIncident.postIncidentNotes && (
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Post-Incident & Mitigation Notes
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedIncident.postIncidentNotes}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
