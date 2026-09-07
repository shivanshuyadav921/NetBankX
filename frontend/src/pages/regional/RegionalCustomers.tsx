import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';

export const RegionalCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    async function loadCustomers() {
      const data = await ApiClient.getCustomers();
      setCustomers(data?.filter((c: any) => c.region_id === 'MH') || []);
    }
    loadCustomers();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Regional Customer Accounts"
        subtitle="Accounts aggregated across Maharashtra regional branches"
      />

      <div className="p-8 space-y-6 flex-1">
        <div className="luxury-card overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-luxury-subtle/60 border-b border-luxury-border text-luxury-muted uppercase text-[11px]">
              <tr>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Branch</th>
                <th className="p-4 font-semibold">Account No</th>
                <th className="p-4 font-semibold">KYC</th>
                <th className="p-4 font-semibold text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/60">
              {customers.map(c => (
                <tr key={c.customer_id} className="hover:bg-luxury-subtle/40 transition-colors">
                  <td className="p-4 font-bold text-luxury-text">{c.first_name} {c.last_name}</td>
                  <td className="p-4 text-luxury-muted font-sans">{c.branch_name}</td>
                  <td className="p-4 text-luxury-slate font-medium">{c.account_number}</td>
                  <td className="p-4"><Badge variant="success" size="sm">{c.kyc_status}</Badge></td>
                  <td className="p-4 text-right font-bold text-luxury-text">
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
