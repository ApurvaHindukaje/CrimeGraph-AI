import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, CheckCircle } from 'lucide-react';

interface BlockchainVerifyBadgeProps {
  status: 'pending' | 'registered' | 'verified' | 'tampered';
  txHash?: string;
  onVerifyClick?: () => void;
  isVerifying?: boolean;
}

export const BlockchainVerifyBadge: React.FC<BlockchainVerifyBadgeProps> = ({
  status,
  txHash,
  onVerifyClick,
  isVerifying = false
}) => {
  const renderBadge = () => {
    switch (status) {
      case 'verified':
        return (
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified On-Chain</span>
          </div>
        );
      case 'tampered':
        return (
          <div className="flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Tampering Detected!</span>
          </div>
        );
      case 'registered':
        return (
          <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Registered On-Chain</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md text-xs font-semibold">
            <Clock className="w-4 h-4" />
            <span>Pending Registration</span>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {renderBadge()}
        </div>
        {txHash && (
          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
            Tx: {txHash}
          </div>
        )}
      </div>

      {onVerifyClick && status !== 'pending' && (
        <button
          onClick={onVerifyClick}
          disabled={isVerifying}
          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-200 disabled:opacity-50 shadow-sm"
        >
          {isVerifying ? 'Verifying...' : 'Verify Hash'}
        </button>
      )}
    </div>
  );
};
