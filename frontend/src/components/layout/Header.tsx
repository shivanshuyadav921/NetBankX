import React from 'react';
import { useNetworkSim } from '../../context/NetworkSimContext';
import { ShieldCheck, Activity, Wifi } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const { metrics, tlsEnabled } = useNetworkSim();

  return (
    <header className="px-8 py-4 border-b border-luxury-border bg-luxury-base flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-luxury-sm">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-luxury-text">{title}</h1>
        {subtitle && <p className="text-xs text-luxury-textMuted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time Status Badges */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4F6F73]/20 border border-luxury-slate text-luxury-slateSubtle text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-luxury-slate"></span>
            <Wifi className="w-3.5 h-3.5" />
            <span>Digital Twin Active</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
              tlsEnabled
                ? 'bg-[#607758]/20 border-luxury-forest text-luxury-textSecondary'
                : 'bg-luxury-burgundyBg border-luxury-burgundy text-luxury-text'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-luxury-forest" />
            <span>{tlsEnabled ? 'TLS 1.3 ON' : 'PLAINTEXT'}</span>
          </div>

          {metrics && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-luxury-surfaceElevated border border-luxury-borderStrong text-luxury-textSecondary text-xs font-mono font-medium">
              <Activity className="w-3.5 h-3.5 text-luxury-leather" />
              <span>Avg RTT: {metrics.averageRttMs}ms</span>
            </div>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};
