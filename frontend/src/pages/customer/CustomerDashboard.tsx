import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { Account, Transaction } from '../../types';
import { Wallet, Send, History, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [showBalance, setShowBalance] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [accs, profile] = await Promise.all([
          ApiClient.getMyAccounts(),
          ApiClient.getCustomerProfile()
        ]);
        setAccounts(accs || []);
        setCustomerProfile(profile);

        if (accs && accs.length > 0) {
          const txns = await ApiClient.getAccountTransactions(accs[0].id);
          setTransactions(txns || []);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }
    loadData();
  }, []);

  const primaryAccount = accounts[0];

  // Dynamic calculation of real debit outflow from ledger
  const debitTransactions = transactions.filter(
    t => t.sourceAccountId === primaryAccount?.id || (t as any).source_account_id === primaryAccount?.id
  );
  const totalOutflow = debitTransactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  const formattedOutflow = `₹ ${totalOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const outflowSubtitle = `${debitTransactions.length} transfer${debitTransactions.length === 1 ? '' : 's'} recorded`;

  return (
    <div className="flex-1 flex flex-col bg-luxury-bg">
      <Header
        title="My Accounts"
        subtitle="Personal banking dashboard & real-time balance overview"
        actions={
          <Link
            to="/customer/transfer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-luxury-slate text-white font-semibold text-xs shadow-luxury-sm hover:bg-luxury-slateHover transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Instant Transfer</span>
          </Link>
        }
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Account Banner Card — Luxury Architecture */}
        {primaryAccount && (
          <div className="bg-luxury-surface border border-luxury-border rounded-xl p-6 shadow-luxury-sm relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-luxury-textMuted mb-1.5">
                  <span className="font-semibold uppercase tracking-wider">Account Number</span>
                  <span>·</span>
                  <span className="text-luxury-text font-bold">{primaryAccount.accountNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold font-mono text-luxury-text">
                    {showBalance ? `₹ ${parseFloat(primaryAccount.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹ ••••••••'}
                  </div>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-1.5 rounded-lg bg-luxury-subtle text-luxury-textSecondary hover:text-luxury-text transition-colors"
                  >
                    {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3.5">
                  <Badge variant="gold">{primaryAccount.accountType} ACCOUNT</Badge>
                  <Badge variant="success" pulse>KYC VERIFIED</Badge>
                  {customerProfile && (
                    <span className="text-xs text-luxury-textMuted font-mono">
                      Branch: <strong className="text-luxury-text">{customerProfile.branch_name || 'Main Branch'}</strong> ({customerProfile.ifsc || 'NBXX0000001'})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  to="/customer/transfer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-luxury-slate text-white font-semibold text-xs shadow-luxury-sm hover:bg-luxury-slateHover active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transfer Funds</span>
                </Link>
                <Link
                  to="/customer/history"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-luxury-subtle text-luxury-textSecondary font-semibold text-xs border border-luxury-border hover:bg-luxury-surfaceElevated transition-all"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Statement</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Liquid Balance"
            value={primaryAccount ? `₹ ${parseFloat(primaryAccount.balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹ 0'}
            subtitle="Available for instant dispatch"
            icon={<Wallet className="w-5 h-5 text-luxury-slate" />}
            accentColor="slate"
          />
          <StatCard
            title="Monthly Outflow"
            value={formattedOutflow}
            subtitle={outflowSubtitle}
            icon={<Send className="w-5 h-5 text-luxury-leather" />}
            trend={`${debitTransactions.length} txns`}
            trendPositive={true}
            accentColor="gold"
          />
          <StatCard
            title="Digital Twin Route"
            value="OPTIMAL"
            subtitle="Primary HQ Fiber Backhaul"
            icon={<ShieldCheck className="w-5 h-5 text-luxury-forest" />}
            accentColor="forest"
          />
          <StatCard
            title="Account Security"
            value="SECURED"
            subtitle="2FA & Packet Integrity ON"
            icon={<ShieldCheck className="w-5 h-5 text-luxury-forest" />}
            accentColor="forest"
          />
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-luxury-surface border border-luxury-border rounded-xl p-6 shadow-luxury-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-luxury-text text-sm">Recent Ledger Activity</h3>
              <p className="text-xs text-luxury-textMuted">Live settled financial transactions</p>
            </div>
            <Link
              to="/customer/history"
              className="text-xs font-semibold text-luxury-slate hover:underline"
            >
              View All History →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-luxury-border text-luxury-textMuted font-mono uppercase tracking-wider bg-luxury-subtle">
                <tr>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-borderSubtle font-mono text-luxury-text">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-luxury-textMuted font-sans">
                      No recent transactions recorded for this account.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 5).map((txn) => (
                    <tr key={txn.id} className="hover:bg-luxury-surfaceElevated transition-colors">
                      <td className="py-3 px-3 font-semibold text-luxury-slate">{txn.id}</td>
                      <td className="py-3 px-3">
                        <span className="capitalize">{txn.type?.toLowerCase() || 'transfer'}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-luxury-text">
                        ₹ {parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={txn.state === 'COMPLETED' ? 'success' : txn.state === 'PENDING' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {txn.state || (txn as any).status || 'COMPLETED'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-luxury-textMuted text-[11px]">
                        {new Date(txn.createdAt || (txn as any).created_at || Date.now()).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
