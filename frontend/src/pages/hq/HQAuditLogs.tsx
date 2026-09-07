import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';
import { Search } from 'lucide-react';

export const HQAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    async function loadLogs() {
      const data = await ApiClient.getAuditLogs(100);
      setLogs(data || []);
    }
    loadLogs();
  }, []);

  const filtered = logs.filter(l =>
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.actorId || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.ipAddress || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Security & Compliance Audit Trail"
        subtitle="Cryptographically logged operational and administrative security events"
      />

      <div className="p-8 space-y-6 flex-1 bg-luxury-bg">
        <div className="luxury-card p-4 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-luxury-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, actor, or IP address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-luxury-subtle border border-luxury-borderSubtle rounded-lg text-xs font-mono text-luxury-text placeholder:text-luxury-textMuted focus:outline-none focus:border-luxury-slate"
            />
          </div>
          <div className="text-xs font-mono text-luxury-textMuted">
            Total Audited Events: <strong className="text-luxury-slate">{filtered.length}</strong>
          </div>
        </div>

        <div className="luxury-card overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-luxury-subtle border-b border-luxury-borderSubtle text-luxury-textMuted uppercase text-[11px]">
              <tr>
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Actor ID</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">IP Address</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-borderSubtle">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-luxury-subtle/50 transition-colors">
                  <td className="p-4 text-luxury-textMuted">{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                  <td className="p-4 font-bold text-luxury-text">{l.actorId || 'SYSTEM'}</td>
                  <td className="p-4 text-luxury-slate font-semibold">{l.actorRole || 'SYSTEM'}</td>
                  <td className="p-4 font-bold text-luxury-leather">{l.action}</td>
                  <td className="p-4 text-luxury-textSecondary">{l.ipAddress}</td>
                  <td className="p-4">
                    <Badge variant={l.status === 'SUCCESS' ? 'success' : l.status === 'DENIED' ? 'danger' : 'warning'} size="sm">
                      {l.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-luxury-textSecondary text-[11px] truncate max-w-xs">
                    {typeof l.details === 'object' ? JSON.stringify(l.details) : l.details || '—'}
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

