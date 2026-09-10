import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ApiClient } from '../../services/api';
import { Transaction } from '../../types';
import { Search, Download, Network, ArrowRight } from 'lucide-react';

export const CustomerHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    async function loadTransactions() {
      try {
        const accs = await ApiClient.getMyAccounts();
        if (accs && accs.length > 0) {
          const txns = await ApiClient.getAccountTransactions(accs[0].id);
          setTransactions(txns || []);
        }
      } catch (err) {
        console.error('Error loading history:', err);
      }
    }
    loadTransactions();
  }, []);

  const handleInspect = async (txnId: string) => {
    try {
      const data = await ApiClient.getTransaction(txnId);
      setSelectedTxn(data);
    } catch (err) {
      console.error('Error loading transaction details:', err);
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Reference', 'Date', 'SourceAccount', 'DestAccount', 'Amount', 'Currency', 'State', 'LatencyMs', 'WANRoute'];
    const rows = filtered.map(t => [
      t.referenceNo || t.id,
      new Date(t.createdAt || (t as any).created_at || Date.now()).toISOString(),
      t.source_acc_number || t.sourceAccountId,
      t.dest_acc_number || t.destinationAccountId,
      t.amount,
      t.currency || 'INR',
      t.state,
      t.totalLatencyMs || 24,
      `"${Array.isArray(t.routingPath) ? t.routingPath.join(' -> ') : ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NetBankX_Statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (filtered.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filtered, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `NetBankX_Statement_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = transactions.filter(t => {
    const matchesSearch =
      (t.referenceNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.dest_acc_number || '').toLowerCase().includes(search.toLowerCase());

    if (filterType === 'ALL') return matchesSearch;
    return matchesSearch && t.state === filterType;
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Transaction History & Ledger"
        subtitle="Immutable record of executed banking transfers and packet metrics"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-luxury-subtle hover:bg-luxury-surfaceElevated border border-luxury-border text-luxury-text text-xs font-semibold shadow-luxury-sm transition-all disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-luxury-slate" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-luxury-slate hover:bg-luxury-slateHover text-white text-xs font-semibold shadow-luxury-sm transition-all disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        }
      />

      <div className="p-8 space-y-6 flex-1 bg-luxury-bg">
        {/* Filters and search bar */}
        <div className="luxury-card p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-luxury-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, account, or remarks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-luxury-subtle border border-luxury-borderSubtle rounded-lg text-xs font-mono text-luxury-text placeholder:text-luxury-textMuted focus:outline-none focus:border-luxury-slate"
            />
          </div>

          <div className="flex gap-2">
            {['ALL', 'COMPLETED', 'TRANSMITTING', 'FAILED'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterType === type
                    ? 'bg-luxury-slate text-white shadow-luxury-sm'
                    : 'bg-luxury-subtle border border-luxury-borderSubtle text-luxury-textMuted hover:text-luxury-text'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="luxury-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-luxury-subtle border-b border-luxury-borderSubtle text-luxury-textMuted uppercase text-[11px]">
                <tr>
                  <th className="p-4 font-semibold">Reference</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Source ➔ Dest</th>
                  <th className="p-4 font-semibold">WAN Route</th>
                  <th className="p-4 font-semibold">Latency</th>
                  <th className="p-4 font-semibold">State</th>
                  <th className="p-4 font-semibold text-right">Amount</th>
                  <th className="p-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-borderSubtle">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-luxury-textMuted font-sans">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(txn => {
                    const dateStr = new Date(txn.createdAt || (txn as any).created_at || Date.now()).toLocaleString('en-IN');
                    const path = Array.isArray(txn.routingPath)
                      ? txn.routingPath.join(' ➔ ')
                      : 'Standard Backbone';

                    return (
                      <tr key={txn.id} className="hover:bg-luxury-subtle/50 transition-colors">
                        <td className="p-4 font-bold text-luxury-text">{txn.referenceNo || txn.id}</td>
                        <td className="p-4 text-luxury-textMuted font-sans">{dateStr}</td>
                        <td className="p-4 text-luxury-textSecondary font-sans">
                          {txn.source_acc_number || 'SRC'} ➔ {txn.dest_acc_number || 'DST'}
                        </td>
                        <td className="p-4 text-luxury-slate text-[11px] truncate max-w-xs">{path}</td>
                        <td className="p-4 text-luxury-leather font-semibold">{txn.totalLatencyMs || 24}ms</td>
                        <td className="p-4">
                          <Badge variant={txn.state === 'COMPLETED' ? 'success' : 'warning'}>
                            {txn.state}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-bold text-sm text-luxury-text">
                          ₹{parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleInspect(txn.id)}
                              className="px-2.5 py-1 rounded bg-luxury-subtle hover:bg-luxury-borderSubtle text-luxury-textSecondary hover:text-luxury-text text-[11px] font-semibold transition-colors"
                            >
                              Details
                            </button>
                            <Link
                              to={`/customer/packet-journey/${txn.id}`}
                              className="px-2.5 py-1 rounded bg-luxury-slate/10 hover:bg-luxury-slate/20 text-luxury-slate text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Inspect Hop-by-Hop Packet Simulation"
                            >
                              <Network className="w-3 h-3" />
                              <span>Trace</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Inspection Modal */}
      {selectedTxn && (
        <Modal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          title={`Transaction ${selectedTxn.referenceNo || selectedTxn.id}`}
          subtitle="Complete audit and state transition timeline"
          maxWidth="lg"
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-3 bg-luxury-subtle p-3 rounded-lg border border-luxury-borderSubtle">
              <div>
                <span className="text-luxury-textMuted block text-[10px]">AMOUNT</span>
                <span className="text-luxury-leather font-bold text-base">₹{parseFloat(selectedTxn.amount).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-luxury-textMuted block text-[10px]">STATE</span>
                <Badge variant={selectedTxn.state === 'COMPLETED' ? 'success' : 'warning'}>{selectedTxn.state}</Badge>
              </div>
              <div>
                <span className="text-luxury-textMuted block text-[10px]">LATENCY</span>
                <span className="text-luxury-slate font-bold">{selectedTxn.totalLatencyMs} ms</span>
              </div>
              <div>
                <span className="text-luxury-textMuted block text-[10px]">PACKETS TRANSMITTED</span>
                <span className="text-luxury-text">{selectedTxn.packetsTransmitted} sent ({selectedTxn.packetsLost} lost)</span>
              </div>
            </div>

            {/* Hop-by-Hop Link */}
            <div className="p-3 bg-luxury-surface border border-luxury-border rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-luxury-text">Network Packet Journey</div>
                <div className="text-[11px] text-luxury-textMuted">Inspect Dijkstra calculated route & 7-layer OSI encapsulation</div>
              </div>
              <Link
                to={`/customer/packet-journey/${selectedTxn.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-luxury-slate text-white text-xs font-semibold hover:bg-luxury-slateHover transition-all"
              >
                <span>Open Packet Trace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* State Transition Events */}
            <div>
              <div className="text-[11px] font-bold text-luxury-textSecondary uppercase tracking-wider mb-2">
                State Transition Timeline
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedTxn.events?.map((e: any) => (
                  <div key={e.id} className="p-2.5 bg-luxury-subtle/70 rounded border border-luxury-borderSubtle">
                    <div className="flex justify-between text-[10px] text-luxury-textMuted mb-1">
                      <span className="text-luxury-slate font-bold">{e.previousState || 'INIT'} ➔ {e.newState}</span>
                      <span>{new Date(e.createdAt || e.created_at).toLocaleTimeString('en-IN')}</span>
                    </div>
                    <div className="text-luxury-text font-sans">{e.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

