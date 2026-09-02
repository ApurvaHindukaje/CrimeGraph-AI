import React from 'react';

interface ExplainabilityPanelProps {
  reasons?: string[];
  gnnProb?: number;
  anomalyScore?: number;
  communityRisk?: string;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = () => {
  return null;
};
