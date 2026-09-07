import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { 
  ShieldAlert, 
  Search, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  Filter, 
  RefreshCw 
} from 'lucide-react';

export const HQIncidents: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getSecurityIncidents(statusFilter);
      setIncidents(data || []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [statusFilter]);

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    try {
      setUpdatingId(incidentId);
      const updated = await ApiClient.updateIncidentStatus(incidentId, {
        status: newStatus,
        resolution: `Marked as ${newStatus} by SOC Lead Analyst at ${new Date().toLocaleTimeString()}`
      });
      setIncidents(prev => prev.map(i => i.incidentId === incidentId ? updated : i));
      if (selectedIncident?.incidentId === incidentId) {
        setSelectedIncident(updated);
      }
    } catch (err) {
      console.error('Failed to update incident:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.incidentId.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q) ||
      (inc.affectedUser && inc.affectedUser.toLowerCase().includes(q)) ||
      (inc.correlationId && inc.correlationId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Security Incident Management & Digital Forensics"
        subtitle="Active threat containment lifecycle, correlated packet-to-ledger forensics, and automated SOC investigation"
        actions={
          <button
            onClick={loadIncidents}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-luxury-surface border border-luxury-border hover:bg-luxury-subtle text-luxury-text font-semibold text-xs transition-all shadow-luxury-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Incidents</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 flex-1 bg-luxury-bg">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center luxury-card p-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-luxury-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Incident #, Correlation ID, Actor, TXN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle text-xs text-luxury-text placeholder:text-luxury-textMuted focus:outline-none focus:border-luxury-slate"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-luxury-textMuted" />
            <span className="text-xs text-luxury-textMuted">Status:</span>
            {['ALL', 'DETECTED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-luxury-slate text-white shadow-luxury-sm'
                    : 'bg-luxury-subtle border border-luxury-borderSubtle text-luxury-textMuted hover:text-luxury-text'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Incidents Grid / Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Incidents List */}
          <div className="lg:col-span-7 space-y-3">
            {loading ? (
              <div className="p-12 text-center text-xs text-luxury-textMuted">Loading active incidents...</div>
            ) : filteredIncidents.length === 0 ? (
              <div className="luxury-card p-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-luxury-forest mx-auto mb-2" />
                <h3 className="font-bold text-luxury-text text-sm">No Incidents Found</h3>
                <p className="text-xs text-luxury-textMuted mt-1">All security telemetry streams are currently nominal.</p>
              </div>
            ) : (
              filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.incidentId === inc.incidentId;
                return (
                  <div
                    key={inc.incidentId}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-luxury-surface border-luxury-slate shadow-luxury-md ring-1 ring-luxury-slate/30'
                        : 'bg-luxury-surface border-luxury-border hover:border-luxury-borderStrong'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-luxury-slate">{inc.incidentId}</span>
                          <Badge
                            variant={inc.severity === 'CRITICAL' ? 'danger' : inc.severity === 'HIGH' ? 'warning' : 'info'}
                            size="sm"
                          >
                            {inc.severity}
                          </Badge>
                          <Badge
                            variant={inc.status === 'RESOLVED' ? 'success' : inc.status === 'DETECTED' ? 'danger' : 'warning'}
                            size="sm"
                          >
                            {inc.status}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-luxury-text text-sm">{inc.title}</h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-mono text-luxury-amber font-bold">
                          Risk: {inc.riskScore}/100
                        </div>
                        <div className="text-[10px] text-luxury-textMuted mt-0.5">
                          {new Date(inc.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-luxury-textSecondary line-clamp-2 mb-4 leading-relaxed">
                      {inc.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-luxury-borderSubtle text-[11px]">
                      <span className="text-luxury-textMuted">
                        Actor: <span className="text-luxury-text font-medium">{inc.affectedUser || 'Unknown'}</span>
                      </span>
                      <span className="text-luxury-slate font-mono text-[10px] flex items-center gap-1">
                        <span>CORR: {inc.correlationId}</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Incident Detail / Forensics Inspection Drawer */}
          <div className="lg:col-span-5 luxury-card p-6 flex flex-col">
            {selectedIncident ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-luxury-burgundy" />
                      <h3 className="font-bold text-luxury-text text-base">Incident Evidence Dossier</h3>
                    </div>
                    <Badge variant={selectedIncident.severity === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                      {selectedIncident.severity}
                    </Badge>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-luxury-textMuted">Incident Identifier:</span>
                        <span className="font-mono text-luxury-text font-bold">{selectedIncident.incidentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-luxury-textMuted">Correlation ID:</span>
                        <span className="font-mono text-luxury-slate">{selectedIncident.correlationId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-luxury-textMuted">Affected Account:</span>
                        <span className="text-luxury-text font-medium">{selectedIncident.affectedUser || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-luxury-textMuted">Assigned Investigator:</span>
                        <span className="text-luxury-forest font-medium">{selectedIncident.assignedTo || 'SOC Lead'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-luxury-textMuted">Calculated Risk Score:</span>
                        <span className="text-luxury-burgundy font-bold">{selectedIncident.riskScore} / 100</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-luxury-text text-xs uppercase tracking-wider mb-1.5">Executive Summary</h4>
                      <p className="text-luxury-textSecondary leading-relaxed p-3 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle">
                        {selectedIncident.description}
                      </p>
                    </div>

                    {selectedIncident.resolution && (
                      <div>
                        <h4 className="font-bold text-luxury-forest text-xs uppercase tracking-wider mb-1.5">Resolution Notes</h4>
                        <p className="text-luxury-forest leading-relaxed p-3 rounded-lg bg-luxury-successBg border border-luxury-successBorder">
                          {selectedIncident.resolution}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mitigation & Lifecycle Actions */}
                <div className="pt-5 border-t border-luxury-borderSubtle space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-luxury-textMuted mb-2">
                      Automated Mitigation Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={async () => {
                          if (selectedIncident) {
                            await ApiClient.executeIncidentAction(selectedIncident.incidentId, 'REQUIRE_MFA', selectedIncident.affectedUser, 'Step-up MFA enforced on user account');
                            await loadIncidents();
                          }
                        }}
                        className="py-2 px-3 rounded-lg bg-luxury-slateLight hover:bg-luxury-slate text-luxury-slate hover:text-white border border-luxury-borderSubtle text-[11px] font-semibold transition-all text-left"
                      >
                        ⚡ Step-up MFA Enforce
                      </button>
                      <button
                        onClick={async () => {
                          if (selectedIncident) {
                            await ApiClient.executeIncidentAction(selectedIncident.incidentId, 'REVOKE_SESSION', selectedIncident.affectedSession || 'CURRENT', 'Revoked suspicious session token');
                            await loadIncidents();
                          }
                        }}
                        className="py-2 px-3 rounded-lg bg-luxury-burgundyBg hover:bg-luxury-burgundy text-luxury-burgundy hover:text-white border border-luxury-burgundyBorder text-[11px] font-semibold transition-all text-left"
                      >
                        🚫 Revoke Session
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-luxury-textMuted mb-2">
                      Incident State Transitions
                    </h4>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleStatusChange(selectedIncident.incidentId, 'INVESTIGATING')}
                        disabled={updatingId === selectedIncident.incidentId || selectedIncident.status === 'INVESTIGATING'}
                        className="py-1.5 rounded-lg bg-luxury-amberBg border border-luxury-amberBorder text-luxury-amber hover:bg-luxury-amber hover:text-white text-[11px] font-semibold transition-all disabled:opacity-40"
                      >
                        Investigate
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedIncident.incidentId, 'CONTAINED')}
                        disabled={updatingId === selectedIncident.incidentId || selectedIncident.status === 'CONTAINED'}
                        className="py-1.5 rounded-lg bg-luxury-slateLight border border-luxury-borderSubtle text-luxury-slate hover:bg-luxury-slate hover:text-white text-[11px] font-semibold transition-all disabled:opacity-40"
                      >
                        Contained
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedIncident.incidentId, 'RESOLVED')}
                        disabled={updatingId === selectedIncident.incidentId || selectedIncident.status === 'RESOLVED'}
                        className="py-1.5 rounded-lg bg-luxury-successBg border border-luxury-successBorder text-luxury-forest hover:bg-luxury-forest hover:text-white text-[11px] font-semibold transition-all disabled:opacity-40"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedIncident.incidentId, 'FALSE_POSITIVE')}
                        disabled={updatingId === selectedIncident.incidentId || selectedIncident.status === 'FALSE_POSITIVE'}
                        className="py-1.5 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle text-luxury-textMuted hover:bg-luxury-charcoal hover:text-white text-[11px] font-semibold transition-all disabled:opacity-40"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-luxury-textMuted">
                <FileText className="w-10 h-10 text-luxury-border mb-3" />
                <h4 className="font-bold text-luxury-text text-sm">No Incident Selected</h4>
                <p className="text-xs text-luxury-textMuted mt-1">Select an incident from the timeline to inspect evidence, telemetry chain, and update resolution lifecycle.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

