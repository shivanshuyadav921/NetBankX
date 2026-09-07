import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: 'cyan' | 'gold' | 'emerald' | 'crimson' | 'indigo' | 'slate' | 'amber' | 'forest' | 'burgundy' | 'teal' | 'leather' | 'terracotta' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
  accentColor = 'slate'
}) => {
  const accentBorders: Record<string, string> = {
    slate: 'border-l-luxury-slate',
    cyan: 'border-l-luxury-slate',
    indigo: 'border-l-luxury-slate',
    teal: 'border-l-luxury-teal',
    gold: 'border-l-luxury-leather',
    leather: 'border-l-luxury-leather',
    amber: 'border-l-luxury-amber',
    emerald: 'border-l-luxury-forest',
    forest: 'border-l-luxury-forest',
    crimson: 'border-l-luxury-burgundy',
    burgundy: 'border-l-luxury-burgundy',
    rose: 'border-l-luxury-burgundy',
    terracotta: 'border-l-luxury-terracotta'
  };

  const borderClass = accentBorders[accentColor] || 'border-l-luxury-slate';

  return (
    <div
      className={`bg-luxury-surface border border-luxury-border rounded-xl p-5 shadow-luxury-sm relative overflow-hidden border-l-4 ${borderClass} hover:border-luxury-borderStrong hover:shadow-luxury-md transition-all`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-luxury-textMuted block mb-1">
            {title}
          </span>
          <div className="text-2xl font-bold font-mono text-luxury-text">{value}</div>
          {subtitle && <div className="text-xs text-luxury-textSecondary mt-1">{subtitle}</div>}
        </div>
        <div className="p-2.5 rounded-lg bg-luxury-subtle border border-luxury-borderSubtle text-luxury-textSecondary">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-2.5 border-t border-luxury-borderSubtle flex items-center gap-1.5 text-xs">
          <span className={trendPositive ? 'text-luxury-forest font-semibold' : 'text-luxury-burgundy font-semibold'}>
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
          <span className="text-luxury-textMuted">vs benchmark</span>
        </div>
      )}
    </div>
  );
};
