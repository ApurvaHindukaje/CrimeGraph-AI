import React from 'react';
import { Cpu, Network, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ExplainabilityPanelProps {
  reasons?: string[];
  gnnProb?: number;
  anomalyScore?: number;
  communityId?: number;
  centrality?: number;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  reasons = [],
  gnnProb = 0,
  anomalyScore = 0,
  communityId = 0,
  centrality = 0,
}) => {
  return (
    <div className="space-y-4">
      {/* ML Metrics & Signal Breakdown */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>Multi-Model Signal Breakdown</span>
          <Cpu className="w-4 h-4 text-indigo-600" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 font-medium flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              GNN Illicit Prob
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {(gnnProb * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Isolation Forest
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {(anomalyScore * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 font-medium flex items-center gap-1">
              <Network className="w-3.5 h-3.5 text-purple-500" />
              Louvain Cluster
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1">
              Community #{communityId}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 font-medium flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Degree Centrality
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {centrality.toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      {/* GNNExplainer Rule-Based Reasons */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>GNNExplainer Reason Checklist</span>
        </div>

        {reasons.length > 0 ? (
          <ul className="space-y-2 text-xs text-slate-700">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-indigo-600 font-bold mt-0.5">•</span>
                <span className="leading-tight">{reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-slate-400 italic">No specific anomaly rules triggered.</div>
        )}
      </div>
    </div>
  );
};

