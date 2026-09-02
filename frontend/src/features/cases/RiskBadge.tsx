import React from 'react';

interface RiskBadgeProps {
  score: number;
  tier: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, tier }) => {
  const getBadgeStyle = (tierStr: string) => {
    switch (tierStr.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(tier)}`}>
      <span className="w-2 h-2 rounded-full bg-current"></span>
      {tier} Risk ({score}/100)
    </span>
  );
};
