import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { TopologyMap } from '../../components/network/TopologyMap';
import { LivePacketInspector } from '../../components/network/LivePacketInspector';
import { EventTimeline } from '../../components/lab/EventTimeline';
import { ApiClient } from '../../services/api';
import { useNetworkSim } from '../../context/NetworkSimContext';
import { Send, RefreshCw } from 'lucide-react';

export const BranchNetwork: React.FC = () => {
  const [destBranch, setDestBranch] = useState<string>('NODE-BR-KA01');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const { refreshTopology } = useNetworkSim();

  const handleInterBranchSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const route = await ApiClient.calculateRoute('NODE-BR-MH01', destBranch);
      setSyncResult(`Inter-branch sync path computed: ${route.nodeKeys.join(' ➔ ')} (${route.totalLatencyMs}ms). Data sync dispatched.`);
      await refreshTopology();
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Branch WAN & Inter-Branch Sync"
        subtitle="Mumbai Main Router (10.1.1.1) ➔ Regional Gateway & National Backbone"
      />

      <div className="p-8 space-y-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sync Trigger Panel (4 cols) */}
          <div className="lg:col-span-4 luxury-card p-6 space-y-4">
            <h3 className="font-semibold text-luxury-text text-sm">Inter-Branch Data Synchronization</h3>
            <p className="text-xs text-luxury-muted">
              Synchronize daily settlement & clearing journals across state lines via the national backbone
            </p>

            {syncResult && (
              <div className="p-3 bg-luxury-subtle border border-luxury-border rounded-lg text-xs font-mono text-luxury-slate">
                {syncResult}
              </div>
            )}

            <form onSubmit={handleInterBranchSync} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-luxury-text font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Target Destination Branch
                </label>
                <select
                  value={destBranch}
                  onChange={e => setDestBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-luxury-surface border border-luxury-border rounded-lg text-luxury-text focus:outline-none focus:border-luxury-slate"
                >
                  <option value="NODE-BR-KA01">Bangalore Koramangala (KA)</option>
                  <option value="NODE-BR-KA02">Bangalore Whitefield (KA)</option>
                  <option value="NODE-BR-DL01">Delhi Connaught Place (DL)</option>
                  <option value="NODE-BR-DL03">Gurgaon Cyber City (DL)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSyncing}
                className="w-full py-2.5 bg-luxury-slate text-luxury-bg font-semibold rounded-lg shadow hover:bg-luxury-slate/90 transition-all flex items-center justify-center gap-2"
              >
                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin text-luxury-leather" /> : <Send className="w-4 h-4 text-luxury-leather" />}
                <span>Dispatch Inter-Branch Sync</span>
              </button>
            </form>

            <LivePacketInspector />
          </div>

          {/* Topology Map (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <TopologyMap height={440} highlightPath={['NODE-BR-MH01', 'NODE-MH-HUB', 'NODE-HQ-CORE', destBranch]} />
            <EventTimeline />
          </div>
        </div>
      </div>
    </div>
  );
};
