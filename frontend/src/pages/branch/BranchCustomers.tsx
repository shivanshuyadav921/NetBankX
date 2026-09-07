import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { Search } from 'lucide-react';

export const BranchCustomers: React.FC = () => {
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
        title="Branch Customer Accounts"
        subtitle="Manage KYC verified accounts registered at Mumbai Main Hub"
      />

      <div className="p-8 space-y-6 flex-1">
        <div className="luxury-card p-4 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-luxury-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer name, account, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-luxury-surface border border-luxury-border rounded-lg text-xs font-mono text-luxury-text focus:outline-none focus:border-luxury-slate focus:ring-1 focus:ring-luxury-slate/20 transition-all placeholder:text-luxury-muted/60"
            />
          </div>
          <div className="text-xs font-mono text-luxury-muted">
            Total Records: <strong className="text-luxury-text">{filtered.length}</strong>
          </div>
        </div>

        <div className="luxury-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-luxury-subtle/60 border-b border-luxury-border text-luxury-muted uppercase text-[11px]">
                <tr>
                  <th className="p-4 font-semibold">Customer Code</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Account No</th>
                  <th className="p-4 font-semibold">Phone</th>
                  <th className="p-4 font-semibold">KYC</th>
                  <th className="p-4 font-semibold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/60">
                {filtered.map(c => (
                  <tr key={c.customer_id} className="hover:bg-luxury-subtle/40 transition-colors">
                    <td className="p-4 font-bold text-luxury-text">{c.customer_code}</td>
                    <td className="p-4 text-luxury-text font-sans font-semibold">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="p-4 text-luxury-slate font-medium">{c.account_number || 'ACC-100001'}</td>
                    <td className="p-4 text-luxury-muted">{c.phone}</td>
                    <td className="p-4">
                      <Badge variant="success" size="sm">
                        {c.kyc_status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-bold text-luxury-text text-sm">
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
