import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { StatCard } from '../../components/common/StatCard';
import { TopologyMap } from '../../components/network/TopologyMap';
import { ApiClient } from '../../services/api';
import { useNetworkSim } from '../../context/NetworkSimContext';
import { Network, Users, Building2, Activity, Flame } from 'lucide-react';

export const HQDashboard: React.FC = () => {
  const [regions, setRegions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const { metrics } = useNetworkSim();

  useEffect(() => {
    async function loadData() {
      try {
        const [regs, brs, custs] = await Promise.all([
          ApiClient.getRegions(),
          ApiClient.getBranches(),
          ApiClient.getCustomers()
        ]);
        setRegions(regs || []);
        setBranches(brs || []);
        setCustomers(custs || []);
      } catch (err) {
        console.error('Error loading HQ data:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="HQ Executive Command Center"
        subtitle="National Enterprise Banking & Network Operations Center (NOC)"
        actions={
          <Link
            to="/hq/network-lab"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-luxury-slate hover:bg-luxury-slateHover text-white font-semibold text-xs shadow-luxury-sm hover:shadow-luxury-md transition-all"
          >
            <Flame className="w-3.5 h-3.5 text-luxury-leather" />
            <span>Open Network Lab</span>
          </Link>
        }
      />

      <div className="p-8 space-y-8 flex-1 bg-luxury-bg">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="National Regions"
            value={regions.length || 3}
            subtitle="MH, DL, KA Hub Gateways"
            icon={<Building2 className="w-5 h-5 text-luxury-slate" />}
            accentColor="slate"
          />
          <StatCard
            title="Total Network Branches"
            value={branches.length || 10}
            subtitle="Edge Routers Connected"
            icon={<Network className="w-5 h-5 text-luxury-teal" />}
            accentColor="teal"
          />
          <StatCard
            title="Total Active Accounts"
            value={customers.length || 15}
            subtitle="Verified Ledger Accounts"
            icon={<Users className="w-5 h-5 text-luxury-forest" />}
            accentColor="forest"
          />
          <StatCard
            title="Simulation Packet Loss"
            value={`${metrics?.packetLossPercentage || 0}%`}
            subtitle={`Packets: ${metrics?.packetsSent || 0} sent`}
            icon={<Activity className="w-5 h-5 text-luxury-leather" />}
            accentColor="leather"
          />
        </div>

        {/* National WAN Map */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-luxury-text text-sm">National Enterprise Banking WAN Digital Twin</h3>
              <p className="text-xs text-luxury-textMuted">Interactive live topology map connecting HQ Datacenter, Regional Gateways, and Branch Subnets</p>
            </div>
            <Link to="/hq/network-lab" className="text-xs text-luxury-slate font-semibold hover:underline">
              Launch Full Operations Lab →
            </Link>
          </div>
          <TopologyMap height={460} />
        </div>
      </div>
    </div>
  );
};

