import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { Send, CheckCircle2 } from 'lucide-react';

export const CustomerRequests: React.FC = () => {
  const [requestType, setRequestType] = useState<string>('CHEQUE_BOOK');
  const [details, setDetails] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const existingRequests = [
    { id: 'REQ-10021', type: 'Cheque Book Request', status: 'COMPLETED', date: '2026-08-20', details: '25-leaf personalized cheque book' },
    { id: 'REQ-10045', type: 'Statement Dispatch', status: 'COMPLETED', date: '2026-08-28', details: 'Previous FY financial statement' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setDetails('');
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
            <p className="text-xs text-luxury-textMuted mb-5">Requests are routed directly to your branch manager</p>

            {submitted && (
              <div className="p-3 mb-4 rounded-lg bg-luxury-successBg border border-luxury-successBorder text-luxury-forest text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ticket submitted successfully! Assigned ID: REQ-{Math.floor(10000 + Math.random() * 90000)}</span>
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
                className="w-full py-2.5 bg-luxury-slate hover:bg-luxury-slateHover text-white font-semibold rounded-lg shadow-luxury-sm hover:shadow-luxury-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Ticket</span>
              </button>
            </form>
          </div>

          {/* History */}
          <div className="lg:col-span-7 luxury-card p-6">
            <h3 className="font-bold text-luxury-text text-sm mb-1">Previous Service Tickets</h3>
            <p className="text-xs text-luxury-textMuted mb-4">Historical requests and fulfillment logs</p>

            <div className="space-y-3 font-mono text-xs">
              {existingRequests.map(r => (
                <div key={r.id} className="p-4 bg-luxury-subtle rounded-lg border border-luxury-borderSubtle flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-luxury-text">
                      <span>{r.type}</span>
                      <span className="text-luxury-textMuted font-normal">({r.id})</span>
                    </div>
                    <div className="text-luxury-textSecondary font-sans text-xs mt-1">{r.details}</div>
                    <div className="text-[10px] text-luxury-textMuted mt-2">Submitted: {r.date}</div>
                  </div>
                  <Badge variant="success">{r.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

