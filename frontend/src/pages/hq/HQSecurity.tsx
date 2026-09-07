import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Lock, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Terminal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HQSecurity: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [integrityResult, setIntegrityResult] = useState<any>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [overviewData, eventsData, sessionsData] = await Promise.all([
        ApiClient.getSecurityOverview(),
        ApiClient.getSecurityEvents({ severity: severityFilter !== 'ALL' ? severityFilter : undefined, limit: 20 }),
        ApiClient.getSecuritySessions()
      ]);
      setOverview(overviewData);
      setEvents(eventsData || []);
      setSessions(sessionsData || []);
    } catch (err) {
      console.error('Failed to load security telemetry:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [severityFilter]);

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const result = await ApiClient.verifyAuditIntegrity();
      setIntegrityResult(result);
      await loadData();
    } catch (err: any) {
      setIntegrityResult({
        valid: false,
        status: 'AUDIT INTEGRITY FAILURE',
        details: err.message || 'Audit chain integrity check failed'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingId(sessionId);
      await ApiClient.revokeSecuritySession(sessionId);
      await loadData();
    } catch (err) {
      console.error('Failed to revoke session:', err);
    } finally {
      setRevokingId(null);
    }
  };

  const threat = overview?.threatAssessment;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Security Operations Center (SOC) Command"
        subtitle="Real-time security telemetry, explainable risk scoring, active session defense, and cryptographic hash chain verification"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/hq/cyber-lab')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-luxury-charcoalSurface border border-luxury-border text-luxury-slate hover:bg-luxury-subtle font-semibold text-xs transition-all"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Cyber Attack Lab</span>
            </button>
            <button
              onClick={handleVerifyIntegrity}
              disabled={verifying}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-luxury-slate hover:bg-luxury-slateHover text-white font-semibold text-xs shadow-luxury-sm hover:shadow-luxury-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Verifying Hash Chain...' : 'Verify Audit Integrity'}</span>
            </button>
          </div>
        }
      />

      <div className="p-8 space-y-8 flex-1 bg-luxury-bg">
        {/* Threat Level & Security KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Enterprise Threat Level"
            value={threat?.threatLevel || 'LOW'}
            subtitle={`Score: ${threat?.score || 15}/100`}
            icon={<ShieldAlert className={`w-5 h-5 ${threat?.threatLevel === 'CRITICAL' ? 'text-luxury-burgundy' : threat?.threatLevel === 'HIGH' ? 'text-luxury-terracotta' : 'text-luxury-forest'}`} />}
            accentColor={threat?.threatLevel === 'CRITICAL' ? 'burgundy' : threat?.threatLevel === 'HIGH' ? 'terracotta' : 'forest'}
          />
          <StatCard
            title="Active Incidents"
            value={threat?.activeIncidentsCount ?? overview?.activeIncidents?.length ?? 0}
            subtitle={`${threat?.criticalAlertsCount ?? 0} Critical / ${threat?.highAlertsCount ?? 0} High`}
            icon={<Activity className="w-5 h-5 text-luxury-burgundy" />}
            accentColor="burgundy"
          />
          <StatCard
            title="Failed Logins (1h)"
            value={threat?.failedLoginsLastHour ?? 0}
            subtitle="Rate limiting enforced"
            icon={<Lock className="w-5 h-5 text-luxury-amber" />}
            accentColor="amber"
          />
          <StatCard
            title="Active User Sessions"
            value={sessions.length}
            subtitle="Fingerprints monitored"
            icon={<KeyRound className="w-5 h-5 text-luxury-slate" />}
            accentColor="slate"
          />
        </div>

        {/* Dynamic Threat Drivers Banner */}
        {threat?.drivers && threat.drivers.length > 0 && (
          <div className="luxury-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-luxury-slate" />
              <h3 className="font-bold text-luxury-text text-xs uppercase tracking-wider">Live Threat Assessment Signals</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {threat.drivers.map((driver: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-luxury-textSecondary bg-luxury-subtle px-3 py-2 rounded-lg border border-luxury-borderSubtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-luxury-slate"></span>
                  <span>{driver}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cryptographic Hash-Chain Verification Banner */}
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-luxury-slateLight border border-luxury-borderSubtle text-luxury-slate">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-luxury-text text-base">Cryptographic Audit Hash Chain</h3>
                <p className="text-xs text-luxury-textMuted">
                  Deterministic SHA-256 forward hash chaining guarantees non-repudiation and tamper detection across all financial and security events.
                </p>
              </div>
            </div>
            <Badge variant="success" size="sm">TAMPER-EVIDENT</Badge>
          </div>

          {integrityResult && (
            <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 ${
              integrityResult.valid
                ? 'bg-luxury-successBg border-luxury-successBorder text-luxury-forest'
                : 'bg-luxury-burgundyBg border-luxury-burgundyBorder text-luxury-burgundy'
            }`}>
              {integrityResult.valid ? (
                <CheckCircle2 className="w-5 h-5 text-luxury-forest shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-luxury-burgundy shrink-0" />
              )}
              <div className="text-xs font-mono">
                <span className="font-bold">STATUS: {integrityResult.status}</span>
                {integrityResult.totalLogs !== undefined && (
                  <span className="ml-2">— {integrityResult.totalLogs} blocks verified sequentially.</span>
                )}
                {integrityResult.latestHash && (
                  <div className="text-[11px] text-luxury-textMuted mt-1 truncate">
                    Latest Block Hash: {integrityResult.latestHash}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Two-Column Grid: Active Sessions & Live Telemetry Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Sessions Manager */}
          <div className="lg:col-span-5 luxury-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-luxury-slate" />
                  <h3 className="font-bold text-luxury-text text-sm">Active Enterprise Sessions</h3>
                </div>
                <Badge variant="neutral" size="sm">{sessions.length} ACTIVE</Badge>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {sessions.length === 0 ? (
                  <div className="text-xs text-luxury-textMuted text-center py-8">No active user sessions.</div>
                ) : (
                  sessions.map((sess) => (
                    <div key={sess.sessionId} className="p-3.5 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-luxury-text text-xs">{sess.username}</span>
                          <Badge variant="info" size="sm">{sess.roleId}</Badge>
                        </div>
                        <div className="text-[11px] text-luxury-textMuted mt-1 font-mono">
                          {sess.deviceLabel} • {sess.ipAddress}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeSession(sess.sessionId)}
                        disabled={revokingId === sess.sessionId}
                        className="px-2.5 py-1 rounded bg-luxury-burgundyBg hover:bg-luxury-burgundy text-luxury-burgundy hover:text-white border border-luxury-burgundyBorder text-[11px] font-semibold transition-all disabled:opacity-50"
                      >
                        {revokingId === sess.sessionId ? 'Revoking...' : 'Revoke'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Live Telemetry Event Stream */}
          <div className="lg:col-span-7 luxury-card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-luxury-forest animate-pulse" />
                <h3 className="font-bold text-luxury-text text-sm">Live Security Telemetry Stream</h3>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'].map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      severityFilter === sev
                        ? 'bg-luxury-slate text-white shadow-luxury-sm'
                        : 'bg-luxury-subtle text-luxury-textMuted hover:text-luxury-text hover:bg-luxury-borderSubtle'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 font-mono text-xs">
              {events.length === 0 ? (
                <div className="text-xs text-luxury-textMuted text-center py-8 font-sans">No security events match criteria.</div>
              ) : (
                events.map((evt) => (
                  <div key={evt.eventId} className="p-3 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={evt.severity === 'CRITICAL' ? 'danger' : evt.severity === 'HIGH' ? 'warning' : evt.severity === 'MEDIUM' ? 'info' : 'neutral'}
                        size="sm"
                      >
                        {evt.severity}
                      </Badge>
                      <div>
                        <div className="font-mono text-luxury-text font-semibold">{evt.eventType}</div>
                        <div className="text-[11px] text-luxury-textMuted">
                          Actor: <span className="text-luxury-textSecondary">{evt.actor}</span> • Resource: <span className="text-luxury-textSecondary">{evt.resource}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono text-[10px] font-bold ${evt.status === 'DENIED' || evt.status === 'BLOCKED' ? 'text-luxury-burgundy' : 'text-luxury-forest'}`}>
                        {evt.status}
                      </span>
                      <div className="text-[10px] text-luxury-textMuted mt-0.5">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

