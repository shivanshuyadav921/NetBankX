import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { TopologyMap } from '../../components/network/TopologyMap';
import { LivePacketInspector } from '../../components/network/LivePacketInspector';
import { OSITraceAccordion } from '../../components/osi/OSITraceAccordion';
import { EventTimeline } from '../../components/lab/EventTimeline';
import { ApiClient } from '../../services/api';
import { useNetworkSim } from '../../context/NetworkSimContext';
import { Account } from '../../types';
import { Send, CheckCircle2, AlertTriangle, ArrowRight, Zap, RefreshCw, Network, ExternalLink } from 'lucide-react';

export const CustomerTransfer: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [toAccount, setToAccount] = useState<string>('ACC-100003');
  const [amount, setAmount] = useState<number>(5000);
  const [description, setDescription] = useState<string>('Consultancy Fee Payment');
  const [recipientInfo, setRecipientInfo] = useState<any | null>(null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [transferResult, setTransferResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);
  const [calculatedHopCount, setCalculatedHopCount] = useState<number>(6);

  const { speedMultiplier, refreshTopology } = useNetworkSim();

  useEffect(() => {
    async function loadAccountsAndRecipients() {
      try {
        const accs = await ApiClient.getMyAccounts();
        setAccounts(accs || []);
        if (accs && accs.length > 0) {
          setSelectedAccountId(accs[0].id);
        }
      } catch (err) {
        console.error('Failed to load transfer dependencies:', err);
      }
    }
    loadAccountsAndRecipients();
  }, []);

  // Lookup target account upon typing
  useEffect(() => {
    if (!toAccount || toAccount.length < 5) {
      setRecipientInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const info = await ApiClient.lookupAccount(toAccount);
        setRecipientInfo(info);
      } catch (err) {
        setRecipientInfo(null);
      } finally {
        setIsLookingUp(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [toAccount]);

  const currentAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;

    setError(null);
    setTransferResult(null);
    setIsSubmitting(true);

    try {
      const result = await ApiClient.transferFunds({
        sourceAccountId: currentAccount.id,
        destinationAccountNumber: toAccount,
        amount: Number(amount),
        description,
        speedMultiplier
      });

      setTransferResult(result);

      if (result.transaction?.routingPath) {
        setHighlightPath(result.transaction.routingPath);
        setCalculatedHopCount(result.transaction.routingPath.length - 1);
      }

      // Refresh account balances
      const updatedAccounts = await ApiClient.getMyAccounts();
      setAccounts(updatedAccounts);
      await refreshTopology();
    } catch (err: any) {
      setError(err.message || 'Transfer failed. Please check balance or connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Transfer Funds & Network Digital Twin"
        subtitle="Atomic double-entry transaction coupled with server-side WAN packet simulation"
      />

      <div className="p-8 space-y-8 flex-1 bg-luxury-bg">
        {/* Top Grid: Transfer Form (Left) & Network Canvas (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Transfer Form (5 cols) */}
          <div className="lg:col-span-5 luxury-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-luxury-borderSubtle mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-luxury-slateLight border border-luxury-borderSubtle text-luxury-slate">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-luxury-text text-sm">Initiate Fund Transfer</h3>
                    <p className="text-xs text-luxury-textMuted">Real-time ledger write</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-luxury-successBg border border-luxury-successBorder text-luxury-forest font-bold">
                  🔒 TLS 1.3
                </span>
              </div>

              {/* Source Account Balance Card */}
              {currentAccount && (
                <div className="bg-luxury-subtle border border-luxury-borderSubtle rounded-xl p-4 mb-5">
                  <div className="text-[10px] font-mono uppercase text-luxury-textMuted mb-1">Available Balance</div>
                  <div className="text-2xl font-extrabold font-mono text-luxury-leather">
                    ₹ {parseFloat(currentAccount.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] font-mono text-luxury-textSecondary mt-1">
                    Debit Source: <span className="font-bold text-luxury-text">{currentAccount.accountNumber}</span> ({currentAccount.accountType})
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 mb-4 rounded-lg bg-luxury-burgundyBg border border-luxury-burgundyBorder text-luxury-burgundy text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {transferResult && (
                <div className="p-4 mb-4 rounded-xl bg-luxury-successBg border border-luxury-successBorder text-luxury-forest text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-luxury-forest text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Transaction Completed & Delivered!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div>Ref: <strong className="font-mono text-luxury-text">{transferResult.transaction?.referenceNo}</strong></div>
                    <div>State: <strong className="font-mono text-luxury-forest">{transferResult.transaction?.state}</strong></div>
                    <div>Latency: <strong className="font-mono text-luxury-slate">{transferResult.simulation?.totalLatencyMs || 24}ms</strong></div>
                    <div>Hops: <strong className="font-mono text-luxury-leather">{calculatedHopCount} WAN Hops</strong></div>
                  </div>

                  {transferResult.transaction?.id && (
                    <Link
                      to={`/customer/packet-journey/${transferResult.transaction.id}`}
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-luxury-slate hover:bg-luxury-slateHover text-white font-bold flex items-center justify-center gap-2 shadow-luxury-sm transition-all"
                    >
                      <Network className="w-4 h-4 text-luxury-leather" />
                      <span>VIEW NETWORK JOURNEY (HOP-BY-HOP)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={handleTransfer} className="space-y-4 font-mono text-xs">
                {/* Recipient Account Input */}
                <div>
                  <label className="block text-luxury-textSecondary font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Recipient Account Number
                  </label>
                  <input
                    type="text"
                    value={toAccount}
                    onChange={e => setToAccount(e.target.value)}
                    required
                    placeholder="e.g. ACC-100003"
                    className="w-full px-3.5 py-2.5 bg-luxury-surface border border-luxury-border rounded-lg text-luxury-text focus:outline-none focus:border-luxury-slate focus:ring-1 focus:ring-luxury-slate"
                  />

                  {/* Recipient Lookup Result */}
                  <div className="mt-1.5 min-h-[22px]">
                    {isLookingUp ? (
                      <span className="text-luxury-textMuted">Checking account registry...</span>
                    ) : recipientInfo ? (
                      <span className="text-luxury-forest font-sans flex items-center gap-1">
                        ✓ Found: <strong>{recipientInfo.holderName}</strong> · {recipientInfo.branchName} ({recipientInfo.regionName})
                      </span>
                    ) : (
                      toAccount.length >= 5 && <span className="text-luxury-burgundy">Account not found</span>
                    )}
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-luxury-textSecondary font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Amount (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3.5 py-2.5 bg-luxury-surface border border-luxury-border rounded-lg text-luxury-text text-sm font-bold focus:outline-none focus:border-luxury-slate focus:ring-1 focus:ring-luxury-slate"
                  />
                  <div className="flex gap-2 mt-2 font-sans">
                    {[500, 1000, 5000, 15000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className="px-2.5 py-1 rounded bg-luxury-subtle border border-luxury-borderSubtle text-luxury-textSecondary hover:text-luxury-text hover:border-luxury-border text-xs transition-colors"
                      >
                        ₹{val.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-luxury-textSecondary font-semibold mb-1 uppercase tracking-wider text-[11px]">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Payment description"
                    className="w-full px-3.5 py-2 bg-luxury-surface border border-luxury-border rounded-lg text-luxury-text focus:outline-none focus:border-luxury-slate focus:ring-1 focus:ring-luxury-slate"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !recipientInfo}
                  className="w-full py-3 bg-luxury-slate hover:bg-luxury-slateHover text-white font-semibold rounded-lg shadow-luxury-sm hover:shadow-luxury-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Simulating Network Route & Ledger Write...</span>
                    </>
                  ) : (
                    <>
                      <span>Transmit Fund Transfer</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-luxury-borderSubtle text-[10px] text-luxury-textMuted flex items-center gap-1 font-sans">
              <Zap className="w-3.5 h-3.5 text-luxury-leather" />
              <span>Transfers are atomic ACID transactions coupled with Dijkstra packet simulation</span>
            </div>
          </div>

          {/* Right: Digital Twin Topology Visualizer (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <TopologyMap
              highlightPath={highlightPath.length > 0 ? highlightPath : ['NODE-BR-MH01', 'NODE-MH-HUB', 'NODE-HQ-CORE', 'NODE-KA-HUB', 'NODE-BR-KA01']}
              height={440}
            />
            <LivePacketInspector />
          </div>
        </div>

        {/* Bottom Section: 7-Layer OSI Deep-Dive + Event Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <OSITraceAccordion
              amount={amount}
              fromAccount={currentAccount?.accountNumber}
              toAccount={toAccount}
              senderBranch={currentAccount ? 'Mumbai Main (MH-MUM-001)' : 'Mumbai Branch'}
              receiverBranch={recipientInfo ? `${recipientInfo.branchName} (${recipientInfo.branchCode})` : 'Bangalore Tech Branch'}
              hopCount={calculatedHopCount}
              currentHop={calculatedHopCount}
            />
          </div>

          <div className="lg:col-span-5">
            <EventTimeline />
          </div>
        </div>
      </div>
    </div>
  );
};

