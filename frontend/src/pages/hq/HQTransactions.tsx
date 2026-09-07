import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { Transaction } from '../../types';
import { Network } from 'lucide-react';

export const HQTransactions: React.FC = () => {
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
        title="Global Ledger Transactions"
        subtitle="Authoritative log of all double-entry ledger operations across the national banking network"
      />

      <div className="p-8 space-y-6 flex-1 bg-luxury-bg">
        <div className="luxury-card overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-luxury-subtle border-b border-luxury-borderSubtle text-luxury-textMuted uppercase text-[11px]">
              <tr>
                <th className="p-4 font-semibold">Reference</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Source Account</th>
                <th className="p-4 font-semibold">Dest Account</th>
                <th className="p-4 font-semibold">Latency</th>
                <th className="p-4 font-semibold">Packets</th>
                <th className="p-4 font-semibold">State</th>
                <th className="p-4 font-semibold text-right">Amount</th>
                <th className="p-4 font-semibold text-center">Network Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-borderSubtle">
              {transactions.map(txn => (
                <tr key={txn.id} className="hover:bg-luxury-subtle/50 transition-colors">
                  <td className="p-4 font-bold text-luxury-text">{txn.referenceNo || txn.id}</td>
                  <td className="p-4 text-luxury-textMuted font-sans">{new Date(txn.createdAt).toLocaleString('en-IN')}</td>
                  <td className="p-4 text-luxury-textSecondary">{txn.source_acc_number || 'SRC'}</td>
                  <td className="p-4 text-luxury-slate font-semibold">{txn.dest_acc_number || 'DST'}</td>
                  <td className="p-4 text-luxury-leather font-semibold">{txn.totalLatencyMs || 24}ms</td>
                  <td className="p-4 text-luxury-textMuted">{txn.packetsTransmitted || 7} sent</td>
                  <td className="p-4"><Badge variant={txn.state === 'COMPLETED' ? 'success' : 'warning'}>{txn.state}</Badge></td>
                  <td className="p-4 text-right font-bold text-luxury-text text-sm">
                    ₹{parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      to={`/hq/packet-journey/${txn.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-luxury-slateLight border border-luxury-borderSubtle text-luxury-slate hover:bg-luxury-slate hover:text-white transition-all text-[11px] font-bold font-sans"
                    >
                      <Network className="w-3.5 h-3.5 text-luxury-leather" />
                      <span>View Journey</span>
                    </Link>
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


