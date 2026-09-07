import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { Users, Activity, Network, Building2 } from 'lucide-react';

export const BranchDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [custs, txns] = await Promise.all([
          ApiClient.getCustomers(),
          ApiClient.getAllTransactions(10)
        ]);
        setCustomers(custs || []);
        setTransactions(txns || []);
      } catch (err) {
        console.error('Error loading branch data:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Branch Operations Dashboard"
        subtitle="Mumbai Main Hub Branch (MH-MUM-001) · Local Account & WAN Management"
        actions={
          <Link
            to="/branch/network"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-luxury-slate text-luxury-bg font-semibold text-xs shadow hover:bg-luxury-slate/90 transition-all"
          >
            <Network className="w-3.5 h-3.5 text-luxury-leather" />
            <span>Branch WAN Status</span>
          </Link>
        }
      />

      <div className="p-8 space-y-8 flex-1">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Branch Customers"
            value={customers.length}
            subtitle="KYC Verified"
            icon={<Users className="w-5 h-5 text-luxury-forest" />}
            accentColor="emerald"
          />
          <StatCard
            title="Branch Router Status"
            value="HEALTHY"
            subtitle="IP: 10.1.1.1 (1 Gbps)"
            icon={<Network className="w-5 h-5 text-luxury-teal" />}
            accentColor="cyan"
          />
          <StatCard
            title="Transactions Processed"
            value={transactions.length}
            subtitle="Today's throughput"
            icon={<Activity className="w-5 h-5 text-luxury-leather" />}
            accentColor="gold"
          />
          <StatCard
            title="Regional Gateway"
            value="MH-HUB"
            subtitle="203.0.113.1 (2ms RTT)"
            icon={<Building2 className="w-5 h-5 text-luxury-slate" />}
            accentColor="indigo"
          />
        </div>

        {/* Branch Customers Table */}
        <div className="luxury-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-luxury-text text-sm">Branch Customer Accounts</h3>
              <p className="text-xs text-luxury-muted">Registered retail accounts under this branch</p>
            </div>
            <Link to="/branch/customers" className="text-xs text-luxury-slate hover:text-luxury-text font-semibold transition-colors">
              View All Customers →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-luxury-border text-luxury-muted text-[11px] uppercase bg-luxury-subtle/50">
                <tr>
                  <th className="p-3 font-semibold">Code</th>
                  <th className="p-3 font-semibold">Customer Name</th>
                  <th className="p-3 font-semibold">Account No</th>
                  <th className="p-3 font-semibold">KYC Status</th>
                  <th className="p-3 font-semibold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/60">
                {customers.slice(0, 5).map(c => (
                  <tr key={c.customer_id} className="hover:bg-luxury-subtle/40 transition-colors">
                    <td className="p-3 font-bold text-luxury-text">{c.customer_code}</td>
                    <td className="p-3 text-luxury-text font-sans font-semibold">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="p-3 text-luxury-slate font-medium">{c.account_number || 'ACC-100001'}</td>
                    <td className="p-3">
                      <Badge variant="success" size="sm">
                        {c.kyc_status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-bold text-luxury-text">
                      ₹{parseFloat(c.balance || '100000').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
