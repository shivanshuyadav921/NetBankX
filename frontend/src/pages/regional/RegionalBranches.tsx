import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';

export const RegionalBranches: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    async function loadBranches() {
      const data = await ApiClient.getBranches();
      setBranches(data?.filter((b: any) => b.region_id === 'MH') || []);
    }
    loadBranches();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Regional Branch Directory"
        subtitle="Branches supervised by the Maharashtra Regional Gateway"
      />

      <div className="p-8 space-y-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {branches.map(b => (
            <div key={b.id} className="luxury-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-luxury-border pb-2">
                <div className="font-semibold text-luxury-text text-sm">{b.name}</div>
                <Badge variant="success">ACTIVE</Badge>
              </div>
              <div className="space-y-1.5 text-luxury-text">
                <div className="flex justify-between">
                  <span className="text-luxury-muted">Branch Code:</span>
                  <span className="text-luxury-slate font-bold">{b.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-luxury-muted">IFSC Code:</span>
                  <span className="text-luxury-text">{b.ifsc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-luxury-muted">City / State:</span>
                  <span className="text-luxury-text">{b.city}, {b.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-luxury-muted">Manager:</span>
                  <span className="text-luxury-leather font-sans font-semibold">{b.manager_first_name} {b.manager_last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-luxury-muted">Contact:</span>
                  <span className="text-luxury-text">{b.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
