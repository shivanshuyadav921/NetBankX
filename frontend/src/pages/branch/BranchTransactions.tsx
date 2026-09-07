import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { Transaction } from '../../types';

export const BranchTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    async function loadTransactions() {
      const data = await ApiClient.getAllTransactions(50);
      setTransactions(data || []);
    }
    loadTransactions();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Branch Transaction Journal"
        subtitle="All transactions traversing the Mumbai Main Branch Gateway"
      />

      <div className="p-8 space-y-6 flex-1">
        <div className="luxury-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-luxury-subtle/60 border-b border-luxury-border text-luxury-muted uppercase text-[11px]">
                <tr>
                  <th className="p-4 font-semibold">Reference</th>
                  <th className="p-4 font-semibold">Source Account</th>
                  <th className="p-4 font-semibold">Dest Account</th>
                  <th className="p-4 font-semibold">Latency</th>
                  <th className="p-4 font-semibold">State</th>
                  <th className="p-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/60">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-luxury-subtle/40 transition-colors">
                    <td className="p-4 font-bold text-luxury-text">{txn.referenceNo || txn.id}</td>
                    <td className="p-4 text-luxury-muted">{txn.source_acc_number || 'SRC'}</td>
                    <td className="p-4 text-luxury-slate font-medium">{txn.dest_acc_number || 'DST'}</td>
                    <td className="p-4 text-luxury-leather">{txn.totalLatencyMs || 24}ms</td>
                    <td className="p-4">
                      <Badge variant={txn.state === 'COMPLETED' ? 'success' : 'warning'}>
                        {txn.state}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-bold text-luxury-text">
                      ₹{parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
