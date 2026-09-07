import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { StatCard } from '../../components/common/StatCard';
import { TopologyMap } from '../../components/network/TopologyMap';
import { ApiClient } from '../../services/api';
import { Building2, Network, Users, Activity } from 'lucide-react';

export const RegionalDashboard: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const [brs, custs] = await Promise.all([
        ApiClient.getBranches(),
        ApiClient.getCustomers()
      ]);
      setBranches(brs?.filter((b: any) => b.region_id === 'MH') || []);
      setCustomers(custs?.filter((c: any) => c.region_id === 'MH') || []);
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Maharashtra Regional Hub Operations"
        subtitle="Gateway: 203.0.113.1 · NAT Translation, Regional Traffic Aggregation & WAN Telemetry"
      />

      <div className="p-8 space-y-8 flex-1 bg-luxury-bg">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Regional Hub Status"
            value="ONLINE"
            subtitle="MH-HUB (203.0.113.1)"
            icon={<Network className="w-5 h-5 text-luxury-teal" />}
            accentColor="teal"
          />
          <StatCard
            title="Supervised Branches"
            value={branches.length || 4}
            subtitle="Mumbai Main, West, Pune, Nagpur"
            icon={<Building2 className="w-5 h-5 text-luxury-slate" />}
            accentColor="slate"
          />
          <StatCard
            title="Regional Accounts"
            value={customers.length || 8}
            subtitle="KYC Verified Accounts"
            icon={<Users className="w-5 h-5 text-luxury-forest" />}
            accentColor="forest"
          />
          <StatCard
            title="Gateway Backbone Link"
            value="5 Gbps DWDM"
            subtitle="6ms Latency to HQ"
            icon={<Activity className="w-5 h-5 text-luxury-leather" />}
            accentColor="leather"
          />
        </div>

        {/* Regional Topology & Branch List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <h3 className="font-bold text-luxury-text text-sm">Regional Hub WAN Topology</h3>
            <TopologyMap filterRegion="MH" height={440} />
          </div>

          <div className="lg:col-span-4 luxury-card p-6 space-y-4">
            <h3 className="font-bold text-luxury-text text-sm">Connected Regional Branches</h3>
            <p className="text-xs text-luxury-textMuted">Direct 1 Gbps LAN to Regional Gateway</p>

            <div className="space-y-3 font-mono text-xs">
              {branches.map(b => (
                <div key={b.id} className="p-3 bg-luxury-subtle rounded-lg border border-luxury-borderSubtle">
                  <div className="font-bold text-luxury-text">{b.name}</div>
                  <div className="text-[11px] text-luxury-teal mt-0.5">{b.code} · IFSC: {b.ifsc}</div>
                  <div className="text-luxury-textSecondary font-sans text-xs mt-1">Manager: {b.manager_first_name} {b.manager_last_name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

