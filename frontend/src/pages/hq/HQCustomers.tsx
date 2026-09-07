import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { Search } from 'lucide-react';

export const HQCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    async function loadCustomers() {
      const data = await ApiClient.getCustomers();
      setCustomers(data || []);
    }
    loadCustomers();
  }, []);

  const filtered = customers.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.customer_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.account_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="National Account Registry"
        subtitle="Complete ledger of all customer accounts across all regions"
      />

      <div className="p-8 space-y-6 flex-1 bg-luxury-bg">
        <div className="luxury-card p-4 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-luxury-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, account, or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-luxury-subtle border border-luxury-borderSubtle rounded-lg text-xs font-mono text-luxury-text placeholder:text-luxury-textMuted focus:outline-none focus:border-luxury-slate"
            />
          </div>
          <div className="text-xs font-mono text-luxury-textMuted">
            Total Accounts: <strong className="text-luxury-slate">{filtered.length}</strong>
          </div>
        </div>

        <div className="luxury-card overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-luxury-subtle border-b border-luxury-borderSubtle text-luxury-textMuted uppercase text-[11px]">
              <tr>
                <th className="p-4 font-semibold">Account No</th>
                <th className="p-4 font-semibold">Customer Name</th>
                <th className="p-4 font-semibold">Branch</th>
                <th className="p-4 font-semibold">Region</th>
                <th className="p-4 font-semibold">KYC</th>
                <th className="p-4 font-semibold text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-borderSubtle">
              {filtered.map(c => (
                <tr key={c.customer_id} className="hover:bg-luxury-subtle/50 transition-colors">
                  <td className="p-4 font-bold text-luxury-slate">{c.account_number || 'ACC-100001'}</td>
                  <td className="p-4 text-luxury-text font-sans font-semibold">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="p-4 text-luxury-textSecondary font-sans">{c.branch_name}</td>
                  <td className="p-4 text-luxury-teal font-bold">{c.region_name?.split(' ')[0] || c.region_id || 'HQ'}</td>
                  <td className="p-4">
                    <Badge variant="success" size="sm">{c.kyc_status}</Badge>
                  </td>
                  <td className="p-4 text-right font-bold text-luxury-text text-sm">
                    ₹{parseFloat(c.balance || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

