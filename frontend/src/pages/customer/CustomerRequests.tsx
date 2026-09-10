import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const CustomerRequests: React.FC = () => {
  const [requestType, setRequestType] = useState<string>('CHEQUE_BOOK');
  const [details, setDetails] = useState<string>('');
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      setIsLoading(true);
      try {
        const data = await ApiClient.getServiceRequests();
        setRequests(data || []);
      } catch (err: any) {
        console.error('Error loading service requests:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessTicketId(null);

    try {
      const categoryNames: Record<string, string> = {
        CHEQUE_BOOK: 'Cheque Book Issuance',
        DEBIT_CARD: 'Debit Card Replacement',
        STATEMENT: 'Physical Statement Request',
        KYC_UPDATE: 'KYC Profile Address Update'
      };

      const newTicket = await ApiClient.createServiceRequest({
        category: requestType,
        title: categoryNames[requestType] || `${requestType} Request`,
        description: details.trim(),
        priority: 'MEDIUM'
      });

      setSuccessTicketId(newTicket.id);
      setDetails('');
      setRequests(prev => [newTicket, ...prev]);
    } catch (err: any) {
      console.error('Failed to submit service ticket:', err);
      setErrorMessage(err.message || 'Failed to submit service ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED':
      case 'COMPLETED':
        return 'success';
      case 'IN_REVIEW':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      default:
        return 'info';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Service Requests"
        subtitle="Submit and track branch service requests & ticket dispatches"
      />

      <div className="p-8 space-y-8 flex-1 bg-luxury-bg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-5 luxury-card p-6">
            <h3 className="font-bold text-luxury-text text-sm mb-1">Submit New Service Ticket</h3>
            <p className="text-xs text-luxury-textMuted mb-5">Requests are persisted in the core ledger and routed to your branch</p>

            {successTicketId && (
              <div className="p-3 mb-4 rounded-lg bg-luxury-successBg border border-luxury-successBorder text-luxury-forest text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Ticket registered in ledger! Assigned ID: <strong>{successTicketId}</strong></span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 mb-4 rounded-lg bg-luxury-dangerBg border border-luxury-dangerBorder text-luxury-burgundy text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-luxury-textSecondary font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Request Category
                </label>
                <select
                  value={requestType}
                  onChange={e => setRequestType(e.target.value)}
                  className="w-full px-3 py-2 bg-luxury-surface border border-luxury-border rounded-lg text-luxury-text focus:outline-none focus:border-luxury-slate"
                >
                  <option value="CHEQUE_BOOK">Cheque Book Issuance</option>
                  <option value="DEBIT_CARD">Debit Card Replacement</option>
                  <option value="STATEMENT">Physical Statement Request</option>
                  <option value="KYC_UPDATE">KYC Profile Address Update</option>
                </select>
              </div>

              <div>
                <label className="block text-luxury-textSecondary font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Description / Specification
                </label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  required
                  placeholder="Provide specific requirements..."
                  className="w-full px-3 py-2 bg-luxury-surface border border-luxury-border rounded-lg text-luxury-text focus:outline-none focus:border-luxury-slate"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-luxury-slate hover:bg-luxury-slateHover text-white font-semibold rounded-lg shadow-luxury-sm hover:shadow-luxury-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isSubmitting ? 'Submitting to Ledger...' : 'Submit Ticket'}</span>
              </button>
            </form>
          </div>

          {/* History */}
          <div className="lg:col-span-7 luxury-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-luxury-text text-sm mb-1">Service Tickets History</h3>
                <p className="text-xs text-luxury-textMuted">Persisted requests and fulfillment status</p>
              </div>
              <span className="text-xs font-mono text-luxury-textMuted">{requests.length} total tickets</span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-luxury-textMuted font-mono flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading tickets from ledger...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-xs text-luxury-textMuted font-sans">
                No previous service tickets registered for your account.
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {requests.map(r => (
                  <div key={r.id} className="p-4 bg-luxury-subtle rounded-lg border border-luxury-borderSubtle flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-bold text-luxury-text">
                        <span>{r.title || r.category}</span>
                        <span className="text-luxury-textMuted font-normal text-[11px]">({r.id})</span>
                      </div>
                      <div className="text-luxury-textSecondary font-sans text-xs mt-1">{r.description}</div>
                      <div className="text-[10px] text-luxury-textMuted mt-2">
                        Submitted: {new Date(r.createdAt || r.created_at || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(r.status)}>
                      {r.status?.replace(/_/g, ' ') || 'IN REVIEW'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


