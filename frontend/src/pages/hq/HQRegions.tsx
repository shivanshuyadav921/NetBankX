import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Badge } from '../../components/common/Badge';
import { ApiClient } from '../../services/api';

export const HQRegions: React.FC = () => {
  const [regions, setRegions] = useState<any[]>([]);

  useEffect(() => {
    async function loadRegions() {
      const data = await ApiClient.getRegions();
      setRegions(data || []);
    }
    loadRegions();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="National Regional Networks"
        subtitle="National regional hubs and gateway interconnects"
      />

      <div className="p-8 space-y-6 flex-1 bg-luxury-bg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {regions.map(r => (
            <div key={r.id} className="luxury-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-luxury-borderSubtle pb-2">
                <div className="font-bold text-luxury-text text-sm">{r.name}</div>
                <Badge variant="success">ACTIVE</Badge>
              </div>
              <div className="space-y-1.5 text-luxury-textSecondary">
                <div className="flex justify-between">
                  <span className="text-luxury-textMuted">Region Code:</span>
                  <span className="text-luxury-slate font-bold">{r.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-luxury-textMuted">Gateway IP:</span>
                  <span className="text-luxury-leather font-semibold">203.0.113.{r.code === 'MH' ? 1 : r.code === 'DL' ? 2 : 3}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-luxury-textMuted">City / State:</span>
                  <span className="text-luxury-text font-sans">{r.city}, {r.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-luxury-textMuted">Regional Head:</span>
                  <span className="text-luxury-text font-sans font-medium">{r.head_first_name} {r.head_last_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

