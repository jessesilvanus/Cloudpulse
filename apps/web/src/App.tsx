import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { AppShell } from './components/layout/AppShell.tsx';

// Public & Onboarding Pages
import { LoginPage } from './pages/LoginPage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';
import { AuthCallbackPage } from './pages/AuthCallbackPage.tsx';

// Platform Core Pages
import { OverviewPage } from './pages/OverviewPage.tsx';
import { ServicesPage } from './pages/ServicesPage.tsx';
import { MetricsPage } from './pages/MetricsPage.tsx';
import { LogsPage } from './pages/LogsPage.tsx';
import { TracesPage } from './pages/TracesPage.tsx';
import { AlertsPage } from './pages/AlertsPage.tsx';
import { IncidentsPage } from './pages/IncidentsPage.tsx';
import { SlosPage } from './pages/SlosPage.tsx';
import { InfrastructurePage } from './pages/InfrastructurePage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { SystemStatusPage } from './pages/SystemStatusPage.tsx';
import { SecurityPage } from './pages/SecurityPage.tsx';
import { AccountsPage } from './pages/AccountsPage.tsx';
import { FinopsPage } from './pages/FinopsPage.tsx';
import { ObservabilityHealthPage } from './pages/ObservabilityHealthPage.tsx';
import { TopologyBlastRadiusPage } from './pages/TopologyBlastRadiusPage.tsx';
import { IncidentCorrelationPage } from './pages/IncidentCorrelationPage.tsx';
import { PredictiveEarlyWarningPage } from './pages/PredictiveEarlyWarningPage.tsx';
import { GovernanceCompliancePage } from './pages/GovernanceCompliancePage.tsx';
import { DriftDetectionPage } from './pages/DriftDetectionPage.tsx';
import { RemediationOrchestrationPage } from './pages/RemediationOrchestrationPage.tsx';
import { AutoHealingDashboardPage } from './pages/AutoHealingDashboardPage.tsx';
import { PolicySimulatorPage } from './pages/PolicySimulatorPage.tsx';
import { GovernanceIntelligenceCenterPage } from './pages/GovernanceIntelligenceCenterPage.tsx';
import { GovernanceDecisionEnginePage } from './pages/GovernanceDecisionEnginePage.tsx';
import { GovernanceKnowledgeGraphPage } from './pages/GovernanceKnowledgeGraphPage.tsx';
import { CloudInvestigationPage } from './pages/CloudInvestigationPage.tsx';
import { CloudOperationsPage } from './pages/CloudOperationsPage.tsx';
import { MultiCloudOverviewPage } from './pages/MultiCloudOverviewPage.tsx';
import { AwsConnectionWizardPage } from './pages/AwsConnectionWizardPage.tsx';
import { AzureConnectionWizardPage } from './pages/AzureConnectionWizardPage.tsx';
import { GcpConnectionWizardPage } from './pages/GcpConnectionWizardPage.tsx';
import { KubernetesCommandCenterPage } from './pages/KubernetesCommandCenterPage.tsx';
import { KubernetesClusterDetailPage } from './pages/KubernetesClusterDetailPage.tsx';
import { KubernetesConnectWizardPage } from './pages/KubernetesConnectWizardPage.tsx';
import { SreCommandCenterPage } from './pages/SreCommandCenterPage.tsx';
import { ServiceReliabilityDetailPage } from './pages/ServiceReliabilityDetailPage.tsx';
import { WorkInboxPage } from './pages/WorkInboxPage.tsx';
import { ChangeManagementPage } from './pages/ChangeManagementPage.tsx';
import { NotificationCenterPage } from './pages/NotificationCenterPage.tsx';
import { ResiliencePage } from './pages/ResiliencePage.tsx';
import { SituationDetailPage } from './pages/SituationDetailPage.tsx';
import { DecisionsPage } from './pages/DecisionsPage.tsx';
import { PlatformObservabilityPage } from './pages/PlatformObservabilityPage.tsx';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/profile" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Guided Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Application Routes inside AppShell */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Navigate to="/overview" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
                  <Route path="/overview" element={<OverviewPage />} />
                  <Route path="/platform" element={<PlatformObservabilityPage />} />
                  <Route path="/situations/:id" element={<SituationDetailPage />} />
                  <Route path="/decisions" element={<DecisionsPage />} />
                  <Route path="/work" element={<WorkInboxPage />} />
                  <Route path="/changes/calendar" element={<ChangeManagementPage />} />
                  <Route path="/changes" element={<ChangeManagementPage />} />
                  <Route path="/notifications" element={<NotificationCenterPage />} />
                  <Route path="/resilience" element={<ResiliencePage />} />
                  <Route path="/sre" element={<SreCommandCenterPage />} />
                  <Route path="/sre/services/:serviceId" element={<ServiceReliabilityDetailPage />} />
                  <Route path="/cloud-overview" element={<MultiCloudOverviewPage />} />
                  <Route path="/kubernetes" element={<KubernetesCommandCenterPage />} />
                  <Route path="/kubernetes/clusters/:clusterId" element={<KubernetesClusterDetailPage />} />
                  <Route path="/settings/cloud-connections/aws" element={<AwsConnectionWizardPage />} />
                  <Route path="/settings/cloud-connections/kubernetes" element={<KubernetesConnectWizardPage />} />
                  <Route path="/settings/cloud-connections/azure" element={<AzureConnectionWizardPage />} />
                  <Route path="/settings/cloud-connections/gcp" element={<GcpConnectionWizardPage />} />
                  <Route path="/operations" element={<CloudOperationsPage />} />
                  <Route path="/aws-operations" element={<CloudOperationsPage />} />
                  <Route path="/aws-observability" element={<ObservabilityHealthPage />} />
                  <Route path="/aws-topology" element={<TopologyBlastRadiusPage />} />
                  <Route path="/aws-incidents" element={<IncidentCorrelationPage />} />
                  <Route path="/aws-predictive" element={<PredictiveEarlyWarningPage />} />
                  <Route path="/aws-governance" element={<GovernanceCompliancePage />} />
                  <Route path="/aws-drift" element={<DriftDetectionPage />} />
                  <Route path="/aws-remediation" element={<RemediationOrchestrationPage />} />
                  <Route path="/aws-auto-healing" element={<AutoHealingDashboardPage />} />
                  <Route path="/aws-simulator" element={<PolicySimulatorPage />} />
                  <Route path="/aws-governance-intelligence" element={<GovernanceIntelligenceCenterPage />} />
                  <Route path="/aws-governance-decisions" element={<GovernanceDecisionEnginePage />} />
                  <Route path="/aws-knowledge-graph" element={<GovernanceKnowledgeGraphPage />} />
                  <Route path="/investigate" element={<CloudInvestigationPage />} />
                  <Route path="/aws-investigate" element={<CloudInvestigationPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/services/:id" element={<ServicesPage />} />
                  <Route path="/metrics" element={<MetricsPage />} />
                  <Route path="/logs" element={<LogsPage />} />
                  <Route path="/traces" element={<TracesPage />} />
                  <Route path="/traces/:id" element={<TracesPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/alerts/:id" element={<AlertsPage />} />
                  <Route path="/incidents" element={<IncidentsPage />} />
                  <Route path="/incidents/:id" element={<IncidentsPage />} />
                  <Route path="/slos" element={<SlosPage />} />
                  <Route path="/slos/:id" element={<SlosPage />} />
                  <Route path="/security" element={<SecurityPage />} />
                  <Route path="/infrastructure" element={<InfrastructurePage />} />
                  <Route path="/accounts" element={<AccountsPage />} />
                  <Route path="/finops" element={<FinopsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/system-status" element={<SystemStatusPage />} />
                  <Route path="*" element={<Navigate to="/overview" replace />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
