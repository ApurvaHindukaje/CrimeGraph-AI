import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export interface Entity {
  id: number;
  case_id: number;
  external_id: string;
  risk_score: number;
  risk_tier: string;
  gnn_probability: number;
  anomaly_score: number;
  community_id: number;
  centrality: number;
  reasons: string[];
  created_at: string;
}

interface GraphViewProps {
  entities: Entity[];
  onSelectEntity: (entity: Entity) => void;
  selectedEntityId?: number;
}

export const GraphView: React.FC<GraphViewProps> = ({
  entities,
  onSelectEntity,
  selectedEntityId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || entities.length === 0) return;

    const getNodeColor = (tier: string) => {
      switch (tier.toLowerCase()) {
        case 'critical':
          return '#ef4444';
        case 'high':
          return '#f97316';
        case 'medium':
          return '#f59e0b';
        default:
          return '#10b981';
      }
    };

    // Construct Cytoscape elements (display first 60 for clean interactive performance)
    const displayEntities = entities.slice(0, 60);
    const elements: cytoscape.ElementDefinition[] = [];

    displayEntities.forEach((ent) => {
      elements.push({
        data: {
          id: ent.external_id,
          label: `${ent.external_id.substring(0, 10)}...`,
          score: ent.risk_score,
          tier: ent.risk_tier,
          color: getNodeColor(ent.risk_tier),
          entityData: ent
        }
      });
    });

    // Create realistic transaction graph edges between entities in same community
    for (let i = 0; i < displayEntities.length; i++) {
      for (let j = i + 1; j < displayEntities.length; j++) {
        if (displayEntities[i].community_id === displayEntities[j].community_id && Math.random() < 0.25) {
          elements.push({
            data: {
              source: displayEntities[i].external_id,
              target: displayEntities[j].external_id,
            }
          });
        }
      }
    }

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#0f172a',
            'font-size': '11px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'width': 'mapData(score, 0, 100, 26, 50)',
            'height': 'mapData(score, 0, 100, 26, 50)',
            'border-width': 2,
            'border-color': '#ffffff'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#4f46e5'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 50
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const entData = node.data('entityData');
      if (entData) {
        onSelectEntity(entData);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [entities, onSelectEntity]);

  return (
    <div className="relative w-full h-[520px] bg-slate-100/70 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur border border-slate-200 px-3.5 py-2 rounded-lg text-xs text-slate-700 font-semibold shadow-sm flex items-center gap-3">
        <span>Interactive Network Graph</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Low</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Med</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>High</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>Critical</span>
      </div>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
