import React, { useState } from 'react';
import { useNetworkSim } from '../../context/NetworkSimContext';
import { Flame, RefreshCw, Zap, ShieldAlert, Sliders, ServerCrash } from 'lucide-react';

export const FaultInjectionConsole: React.FC = () => {
  const {
    nodes,
    speedMultiplier,
    tlsEnabled,
    setSpeedMultiplier,
    setTlsEnabled,
    toggleNodeStatus,
    resetTopology,
    updateFaultParams
  } = useNetworkSim();

  const [simLossRate, setSimLossRate] = useState<number>(0);
  const [latencyMultiplier, setLatencyMultiplier] = useState<number>(1.0);
  const [ddosActive, setDdosActive] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const handleLossChange = async (val: number) => {
    setSimLossRate(val);
    await updateFaultParams({ globalLossRateOverride: val / 100 });
  };

  const handleLatencyChange = async (val: number) => {
    setLatencyMultiplier(val);
    await updateFaultParams({ globalLatencyMultiplier: val });
  };

  const handleDdosToggle = async () => {
    const next = !ddosActive;
    setDdosActive(next);
    await updateFaultParams({ ddosSimulationActive: next });
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetTopology();
      setSimLossRate(0);
      setLatencyMultiplier(1.0);
      setDdosActive(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="luxury-card p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-luxury-borderSubtle pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-luxury-burgundyBg border border-luxury-burgundyBorder text-luxury-burgundy">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-luxury-text text-sm">🧪 Network Fault-Injection Laboratory</h3>
            <p className="text-xs text-luxury-textMuted">Introduce WAN impairments & observe dynamic Dijkstra failover</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-luxury-surface border border-luxury-border text-luxury-textSecondary hover:bg-luxury-subtle hover:text-luxury-text transition-colors shadow-luxury-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset All Defaults</span>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Packet Loss Slider */}
        <div className="bg-luxury-subtle p-4 rounded-lg border border-luxury-borderSubtle">
          <div className="flex justify-between items-center mb-2">
            <span className="text-luxury-textMuted font-sans">Simulated Packet Loss</span>
            <span className="text-luxury-burgundy font-bold">{simLossRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={simLossRate}
            onChange={e => handleLossChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-luxury-border rounded-lg appearance-none cursor-pointer accent-[#7B1E20]"
          />
          <div className="flex justify-between text-[10px] text-luxury-textMuted mt-1 font-sans">
            <span>0% Normal</span>
            <span>40% Degraded</span>
            <span>80% Heavy Loss</span>
          </div>
        </div>

        {/* Latency Multiplier */}
        <div className="bg-luxury-subtle p-4 rounded-lg border border-luxury-borderSubtle">
          <div className="flex justify-between items-center mb-2">
            <span className="text-luxury-textMuted font-sans">Latency Jitter Multiplier</span>
            <span className="text-luxury-slate font-bold">{latencyMultiplier}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={latencyMultiplier}
            onChange={e => handleLatencyChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-luxury-border rounded-lg appearance-none cursor-pointer accent-[#4F6F73]"
          />
          <div className="flex justify-between text-[10px] text-luxury-textMuted mt-1 font-sans">
            <span>1x (Base OFC)</span>
            <span>3x (Congestion)</span>
            <span>5x (Satellite link)</span>
          </div>
        </div>

        {/* Simulation Speed */}
        <div className="bg-luxury-subtle p-4 rounded-lg border border-luxury-borderSubtle">
          <div className="flex justify-between items-center mb-2">
            <span className="text-luxury-textMuted font-sans">Animation Execution Speed</span>
            <span className="text-luxury-leather font-bold">{speedMultiplier}x</span>
          </div>
          <div className="flex gap-2 font-sans">
            {[0.5, 1.0, 2.0, 5.0].map(s => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`flex-1 py-1 rounded text-xs font-semibold transition-colors ${
                  speedMultiplier === s
                    ? 'bg-luxury-slate text-white shadow-luxury-sm'
                    : 'bg-luxury-surface border border-luxury-border text-luxury-textSecondary hover:text-luxury-text'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Attack & Impairment Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-sans">
        <button
          onClick={() => {
            const hqCore = nodes.find(n => n.nodeType === 'HQ_CORE');
            if (hqCore) toggleNodeStatus(hqCore.id, hqCore.status);
          }}
          className="flex items-center gap-2 p-3 rounded-lg bg-luxury-burgundyBg border border-luxury-burgundyBorder text-luxury-burgundy hover:bg-luxury-burgundy hover:text-white text-xs font-semibold transition-colors text-left"
        >
          <ServerCrash className="w-4 h-4 flex-shrink-0" />
          <span>Toggle HQ Core Failure</span>
        </button>

        <button
          onClick={() => {
            const mhHub = nodes.find(n => n.nodeKey === 'MH-HUB');
            if (mhHub) toggleNodeStatus(mhHub.id, mhHub.status);
          }}
          className="flex items-center gap-2 p-3 rounded-lg bg-luxury-amberBg border border-luxury-amberBorder text-luxury-amber hover:bg-luxury-amber hover:text-white text-xs font-semibold transition-colors text-left"
        >
          <Zap className="w-4 h-4 flex-shrink-0" />
          <span>Toggle MH Gateway Hub</span>
        </button>

        <button
          onClick={handleDdosToggle}
          className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-colors text-left ${
            ddosActive
              ? 'bg-luxury-burgundy text-white border-luxury-burgundy shadow-luxury-md'
              : 'bg-luxury-slateLight border border-luxury-borderSubtle text-luxury-slate hover:bg-luxury-slate hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{ddosActive ? '🚨 Stop DDoS Attack' : '💥 Simulate SYN Flood DDoS'}</span>
        </button>

        <button
          onClick={() => setTlsEnabled(!tlsEnabled)}
          className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-colors text-left ${
            tlsEnabled
              ? 'bg-luxury-successBg border-luxury-successBorder text-luxury-forest hover:bg-luxury-forest hover:text-white'
              : 'bg-luxury-burgundyBg border-luxury-burgundyBorder text-luxury-burgundy'
          }`}
        >
          <Sliders className="w-4 h-4 flex-shrink-0" />
          <span>{tlsEnabled ? '🔒 TLS 1.3 Active' : '⚠️ Plaintext Mode'}</span>
        </button>
      </div>
    </div>
  );
};

