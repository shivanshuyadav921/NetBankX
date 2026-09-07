import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false
}) => {
  const variantStyles = {
    success: 'bg-luxury-successBg text-luxury-success border-luxury-successBorder',
    warning: 'bg-luxury-amberBg text-luxury-amber border-luxury-amberBorder',
    danger: 'bg-luxury-burgundyBg text-luxury-burgundy border-luxury-burgundyBorder',
    info: 'bg-luxury-slateLight text-luxury-slate border-luxury-border',
    gold: 'bg-luxury-amberBg text-luxury-leather border-luxury-amberBorder',
    neutral: 'bg-luxury-subtle text-luxury-textSecondary border-luxury-border'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold font-mono rounded-md border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}
      {children}
    </span>
  );
};
