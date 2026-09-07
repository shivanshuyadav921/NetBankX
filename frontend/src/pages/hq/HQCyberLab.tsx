import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { 
  ShieldAlert, 
  Terminal, 
  Play, 
  AlertTriangle, 
  ArrowRight, 
  Radio, 
  Fingerprint, 
  Lock, 
  Flame, 
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScenarioOption {
  id: string;
  name: string;
  category: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  vector: string;
  mitigation: string;
  icon: React.ReactNode;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: 'brute_force',
    name: 'Credential Brute-Force Wave',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    description: 'High-frequency credential stuffing targeting privileged HQ Admin account arjun.mehta with dictionary variations.',
    vector: '5 Rapid Failed Logins -> Lockout Rule -> Incident SEC-BF',
    mitigation: 'Adaptive Rate Limiter + Temporary Account Lockout + SOC Alert',
    icon: <Lock className="w-5 h-5 text-luxury-amber" />
  },
  {
    id: 'account_takeover',
    name: 'Account Takeover (ATO) & Fund Drain',
    category: 'FRAUD_AND_IDENTITY',
    severity: 'CRITICAL',
    description: 'Repeated authentication failures followed by sudden success from unrecognized hardware fingerprint attempting ₹2,40,000 transfer.',
    vector: 'Failures -> Success -> New Device -> High-Value Transfer',
    mitigation: 'Step-up MFA Requirement + Transaction Hold + Critical Incident Creation',
    icon: <Fingerprint className="w-5 h-5 text-luxury-burgundy" />
  },
  {
    id: 'privilege_escalation',
    name: 'RBAC Privilege Escalation Attempt',
    category: 'AUTHORIZATION',
    severity: 'HIGH',
    description: 'Standard retail customer account attempts direct administrative API execution on core topology management routes.',
    vector: 'POST /api/v1/network/reset-topology (Role: CUSTOMER)',
    mitigation: 'API RBAC Firewall 403 Forbidden + Telemetry Event + Escalation Alert',
    icon: <Flame className="w-5 h-5 text-luxury-terracotta" />
  },
  {
    id: 'syn_flood',
    name: 'WAN Core Volumetric Anomaly',
    category: 'NETWORK',
    severity: 'MEDIUM',
    description: 'Simulated high-rate packet burst targeting HQ Core Gateway router to stress Dijkstra routing buffers.',
    vector: 'SYN Frame Influx -> Ingress Buffer Spike -> Anomaly Trigger',
    mitigation: 'Dynamic Rate Shaping + Multi-Hop Failover + Metric Logging',
    icon: <Radio className="w-5 h-5 text-luxury-slate" />
  },
  {
    id: 'honeypot_decoy',
    name: 'Educational Honeypot Decoy Trap',
    category: 'DECEPTION_INTELLIGENCE',
    severity: 'HIGH',
    description: 'Simulates unauthorized automated crawler probing isolated deception vault keys endpoint /api/v1/security/decoy/vault-keys.',
    vector: 'GET /api/v1/security/decoy/vault-keys (External Scanner)',
    mitigation: 'Deception Trap 403 + Proactive Incident Creation + Forensic Capture',
    icon: <ShieldAlert className="w-5 h-5 text-luxury-teal" />
  }
];

export const HQCyberLab: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('account_takeover');
  const [running, setRunning] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [executionSteps, setExecutionSteps] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleRunSimulation = async () => {
    setRunning(true);
    setExecutionSteps([]);
    setSimulationResult(null);

    const activeScenario = SCENARIOS.find(s => s.id === selectedScenario);

    // Visual step sequence
    const addStep = (msg: string) => setExecutionSteps(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    addStep(`Initializing sandbox scenario: ${activeScenario?.name}`);
    
    setTimeout(() => {
      addStep(`Injecting attack vectors from simulated IP: 198.51.100.42`);
    }, 400);

    setTimeout(() => {
      addStep(`Security Event Normalizer processing incoming telemetry`);
    }, 800);

    try {
      const result = await ApiClient.runCyberLabScenario(selectedScenario);
      setTimeout(() => {
        addStep(`Correlation Engine evaluated behavioral chains — Risk Score: ${result.incidentCreated?.riskScore || 85}/100`);
        addStep(`Automated Response executed: Incident #${result.incidentCreated?.incidentId} logged`);
        addStep(`Audit Hash Chain updated — Cryptographic status: ${result.auditStatus}`);
        setSimulationResult(result);
        setRunning(false);
      }, 1200);
    } catch (err: any) {
      addStep(`Simulation Error: ${err.message || 'Execution failed'}`);
      setRunning(false);
    }
  };

  const activeOption = SCENARIOS.find(s => s.id === selectedScenario)!;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Cybersecurity Attack Simulation Lab"
        subtitle="Safe educational attack sandbox demonstrating end-to-end Attack → Detection → Risk Scoring → Incident → Cryptographic Audit workflows"
      />

      <div className="p-8 space-y-8 flex-1 bg-luxury-bg">
        {/* Educational Disclaimer */}
        <div className="bg-luxury-amberBg border border-luxury-amberBorder rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-luxury-amber mt-0.5 shrink-0" />
          <div className="text-xs text-luxury-textSecondary leading-relaxed">
            <span className="font-bold text-luxury-text">Educational Simulation Environment:</span> NetBankX cybersecurity controls, fraud risk engines, packet behavior, and attack simulations operate strictly in an isolated educational sandbox. No external network traffic is generated, and financial ledger data remains cryptographically isolated.
          </div>
        </div>

        {/* Scenario Selection Cards */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-luxury-textMuted mb-4">
            Select Educational Attack Scenario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SCENARIOS.map((sc) => {
              const isSelected = selectedScenario === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => !running && setSelectedScenario(sc.id)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-luxury-surface border-luxury-slate shadow-luxury-md ring-1 ring-luxury-slate/40'
                      : 'bg-luxury-surface border-luxury-border hover:border-luxury-borderStrong'
                  } ${running ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle">
                        {sc.icon}
                      </div>
                      <Badge
                        variant={sc.severity === 'CRITICAL' ? 'danger' : sc.severity === 'HIGH' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {sc.severity}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-luxury-text text-sm mb-1">{sc.name}</h3>
                    <p className="text-xs text-luxury-textSecondary leading-relaxed mb-4">{sc.description}</p>
                  </div>

                  <div className="pt-3 border-t border-luxury-borderSubtle text-[11px] text-luxury-slate font-mono font-semibold">
                    {sc.category}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Configuration & Trigger */}
          <div className="lg:col-span-5 luxury-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-luxury-slate" />
                <h3 className="font-bold text-luxury-text text-base">Scenario Execution Parameters</h3>
              </div>

              <div className="space-y-4 mb-6 text-xs">
                <div className="p-3.5 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle space-y-2">
                  <div className="flex justify-between text-luxury-textMuted">
                    <span>Target Vector:</span>
                    <span className="text-luxury-text font-mono font-semibold">{activeOption.vector}</span>
                  </div>
                  <div className="flex justify-between text-luxury-textMuted">
                    <span>Severity Profile:</span>
                    <span className="text-luxury-burgundy font-bold">{activeOption.severity}</span>
                  </div>
                  <div className="flex justify-between text-luxury-textMuted">
                    <span>Simulated Ingress:</span>
                    <span className="text-luxury-textSecondary font-mono">198.51.100.42 (WAN)</span>
                  </div>
                  <div className="flex justify-between text-luxury-textMuted">
                    <span>Expected Defense:</span>
                    <span className="text-luxury-forest font-medium">{activeOption.mitigation}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={running}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-luxury-slate hover:bg-luxury-slateHover text-white font-semibold text-sm shadow-luxury-sm hover:shadow-luxury-md active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Simulating Attack Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Attack Simulation</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Real-Time Progression Stream & Incident Output */}
          <div className="lg:col-span-7 luxury-card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-luxury-forest animate-pulse" />
                <h3 className="font-bold text-luxury-text text-base">Pipeline Progression Telemetry</h3>
              </div>
              <Badge variant="neutral" size="sm">LIVE SANDBOX</Badge>
            </div>

            <div className="flex-1 bg-luxury-charcoal border border-luxury-charcoalBorder rounded-xl p-4 font-mono text-xs text-luxury-charcoalMuted space-y-2 min-h-[220px] max-h-[260px] overflow-y-auto dark-scroll">
              {executionSteps.length === 0 ? (
                <div className="h-full flex items-center justify-center text-luxury-charcoalMuted/60 italic text-center">
                  Select a scenario and click "Execute Attack Simulation" to observe end-to-end detection and response telemetry.
                </div>
              ) : (
                executionSteps.map((step, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className={step.includes('Risk Score') ? 'text-luxury-amber font-bold' : step.includes('Incident') ? 'text-luxury-terracotta font-bold' : step.includes('Audit') ? 'text-luxury-forest font-bold' : 'text-luxury-charcoalText'}>
                      {step}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Generated Incident Preview */}
            {simulationResult && (
              <div className="mt-4 p-4 rounded-xl bg-luxury-burgundyBg border border-luxury-burgundyBorder flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4 text-luxury-burgundy" />
                    <span className="font-bold text-luxury-text text-xs">
                      Incident Generated: {simulationResult.incidentCreated?.incidentId}
                    </span>
                    <Badge variant="danger" size="sm">
                      {simulationResult.incidentCreated?.severity}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-luxury-textSecondary">
                    {simulationResult.incidentCreated?.title}
                  </p>
                </div>

                <button
                  onClick={() => navigate('/hq/incidents')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-luxury-burgundy hover:bg-red-900 text-white font-semibold text-xs shadow-luxury-sm transition-all"
                >
                  <span>Investigate in SOC</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

