import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';

export const HQBranches: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    async function loadBranches() {
      const data = await ApiClient.getBranches();
      setBranches(data || []);
    }
    loadBranches();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="National Branch Topology & Subnets"
        subtitle="Complete directory of connected banking edge branches"
      />

      <div className="p-8 space-y-6 flex-1 bg-luxury-bg">
        <div className="luxury-card overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-luxury-subtle border-b border-luxury-borderSubtle text-luxury-textMuted uppercase text-[11px]">
              <tr>
                <th className="p-4 font-semibold">Branch Name</th>
                <th className="p-4 font-semibold">Region</th>
                <th className="p-4 font-semibold">IFSC</th>
                <th className="p-4 font-semibold">Manager</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-borderSubtle">
              {branches.map(b => (
                <tr key={b.id} className="hover:bg-luxury-subtle/50 transition-colors">
                  <td className="p-4 font-bold text-luxury-text">{b.name} ({b.code})</td>
                  <td className="p-4 text-luxury-teal font-bold">{b.region_name}</td>
                  <td className="p-4 text-luxury-textSecondary">{b.ifsc}</td>
                  <td className="p-4 text-luxury-textSecondary font-sans">{b.manager_first_name} {b.manager_last_name}</td>
                  <td className="p-4"><Badge variant="success" size="sm">{b.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

