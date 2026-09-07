import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { UserRole } from '../types';

// Customer Pages
import { CustomerDashboard } from '../pages/customer/CustomerDashboard';
import { CustomerTransfer } from '../pages/customer/CustomerTransfer';
import { CustomerHistory } from '../pages/customer/CustomerHistory';
import { CustomerRequests } from '../pages/customer/CustomerRequests';

// Branch Pages
import { BranchDashboard } from '../pages/branch/BranchDashboard';
import { BranchCustomers } from '../pages/branch/BranchCustomers';
import { BranchTransactions } from '../pages/branch/BranchTransactions';
import { BranchNetwork } from '../pages/branch/BranchNetwork';

// Regional Pages
import { RegionalDashboard } from '../pages/regional/RegionalDashboard';
import { RegionalBranches } from '../pages/regional/RegionalBranches';
import { RegionalCustomers } from '../pages/regional/RegionalCustomers';
import { RegionalNetwork } from '../pages/regional/RegionalNetwork';
import { RegionalTransactions } from '../pages/regional/RegionalTransactions';

// HQ Pages
import { HQDashboard } from '../pages/hq/HQDashboard';
import { HQNetworkLab } from '../pages/hq/HQNetworkLab';
import { HQTrafficSimulator } from '../pages/hq/HQTrafficSimulator';
import { HQRegions } from '../pages/hq/HQRegions';
import { HQBranches } from '../pages/hq/HQBranches';
import { HQCustomers } from '../pages/hq/HQCustomers';
import { HQTransactions } from '../pages/hq/HQTransactions';
import { HQAuditLogs } from '../pages/hq/HQAuditLogs';
import { HQSecurity } from '../pages/hq/HQSecurity';
import { HQCyberLab } from '../pages/hq/HQCyberLab';
import { HQIncidents } from '../pages/hq/HQIncidents';
import { TransactionPacketJourneyPage } from '../pages/customer/TransactionPacketJourneyPage';
import { DesignSystemPage } from '../pages/DesignSystemPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ allowedRoles: UserRole[]; children: React.ReactNode }> = ({
  allowedRoles,
  children
}) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-luxury-bg flex items-center justify-center text-luxury-slate font-mono text-xs">
        Verifying cryptographic session...
      </div>
    );
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (role === 'HQ_ADMIN') return <Navigate to="/hq/dashboard" replace />;
    if (role === 'REGIONAL_MANAGER') return <Navigate to="/regional/dashboard" replace />;
    if (role === 'BRANCH_STAFF') return <Navigate to="/branch/dashboard" replace />;
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Design System Documentation Page (Accessible for review) */}
      <Route path="/design-system" element={<DesignSystemPage />} />

      {/* Default redirect to login or dashboard */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Customer Portal */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="transfer" element={<CustomerTransfer />} />
        <Route path="packet-journey/:transactionId" element={<TransactionPacketJourneyPage />} />
        <Route path="history" element={<CustomerHistory />} />
        <Route path="requests" element={<CustomerRequests />} />
      </Route>

      {/* Branch Staff Portal */}
      <Route
        path="/branch"
        element={
          <ProtectedRoute allowedRoles={['BRANCH_STAFF']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<BranchDashboard />} />
        <Route path="customers" element={<BranchCustomers />} />
        <Route path="transactions" element={<BranchTransactions />} />
        <Route path="network" element={<BranchNetwork />} />
        <Route path="packet-journey/:transactionId" element={<TransactionPacketJourneyPage />} />
      </Route>

      {/* Regional Manager Portal */}
      <Route
        path="/regional"
        element={
          <ProtectedRoute allowedRoles={['REGIONAL_MANAGER']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RegionalDashboard />} />
        <Route path="branches" element={<RegionalBranches />} />
        <Route path="customers" element={<RegionalCustomers />} />
        <Route path="network" element={<RegionalNetwork />} />
        <Route path="transactions" element={<RegionalTransactions />} />
        <Route path="packet-journey/:transactionId" element={<TransactionPacketJourneyPage />} />
      </Route>

      {/* HQ Executive Portal */}
      <Route
        path="/hq"
        element={
          <ProtectedRoute allowedRoles={['HQ_ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<HQDashboard />} />
        <Route path="network-lab" element={<HQNetworkLab />} />
        <Route path="traffic-simulator" element={<HQTrafficSimulator />} />
        <Route path="packet-journey/:transactionId" element={<TransactionPacketJourneyPage />} />
        <Route path="regions" element={<HQRegions />} />
        <Route path="branches" element={<HQBranches />} />
        <Route path="customers" element={<HQCustomers />} />
        <Route path="transactions" element={<HQTransactions />} />
        <Route path="audit-logs" element={<HQAuditLogs />} />
        <Route path="security" element={<HQSecurity />} />
        <Route path="cyber-lab" element={<HQCyberLab />} />
        <Route path="incidents" element={<HQIncidents />} />
        <Route path="design-system" element={<DesignSystemPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
