import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../shared';
import { GraphView, Entity } from './GraphView';
import { RiskBadge } from './RiskBadge';
import { BlockchainVerifyBadge } from '../evidence';
import { ArrowLeft, Play, Shield, FilePlus, Search, RefreshCw, Upload, FileText, X } from 'lucide-react';

export type { Entity };

interface CaseDetail {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  entities: Entity[];
}

interface Evidence {
  id: number;
  case_id: number;
  entity_id: number | null;
  description: string;
  file_reference: string | null;
  sha256_hash: string;
  blockchain_tx_id: string | null;
  verification_status: 'pending' | 'registered' | 'verified' | 'tampered';
  created_at: string;
}

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [verifyingMap, setVerifyingMap] = useState<Record<number, boolean>>({});

  // File Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchCase();
    fetchEvidence();
  }, [id]);

  const fetchCase = async () => {
    try {
      const res = await apiClient.get(`/cases/${id}`);
      setCaseData(res.data);
      if (res.data.entities && res.data.entities.length > 0) {
        setSelectedEntity(res.data.entities[0]);
      }
    } catch (err) {
      console.error('Failed to fetch case detail from backend, using demo case', err);
      const mockEntities: Entity[] = [
        { id: 101, case_id: Number(id), external_id: '0x71C...3a9', risk_score: 89, risk_tier: 'Critical', gnn_probability: 0.89, anomaly_score: 0.85, community_id: 0, centrality: 0.35, reasons: ['Mixer pattern'], created_at: new Date().toISOString() },
        { id: 102, case_id: Number(id), external_id: '0x89B...4f1', risk_score: 74, risk_tier: 'High', gnn_probability: 0.74, anomaly_score: 0.70, community_id: 0, centrality: 0.28, reasons: ['High centrality'], created_at: new Date().toISOString() },
        { id: 103, case_id: Number(id), external_id: '0x32A...1e8', risk_score: 52, risk_tier: 'Medium', gnn_probability: 0.52, anomaly_score: 0.48, community_id: 1, centrality: 0.19, reasons: ['DEX pool swap'], created_at: new Date().toISOString() },
        { id: 104, case_id: Number(id), external_id: '0x11D...90b', risk_score: 18, risk_tier: 'Low', gnn_probability: 0.18, anomaly_score: 0.12, community_id: 1, centrality: 0.05, reasons: ['Standard transaction'], created_at: new Date().toISOString() },
      ];
      const mockCase = {
        id: Number(id) || 1,
        title: 'Operation DarkNet Mixer',
        description: 'Multilayer Bitcoin tumbler mixing investigation involving suspicious cross-jurisdictional hops.',
        status: 'Active',
        created_at: new Date().toISOString(),
        entities: mockEntities,
      };
      setCaseData(mockCase);
      setSelectedEntity(mockEntities[0]);
    }
  };

  const fetchEvidence = async () => {
    try {
      const res = await apiClient.get(`/evidence/case/${id}`);
      setEvidenceList(res.data);
    } catch (err) {
      console.error('Failed to fetch evidence, using demo evidence', err);
      setEvidenceList([
        {
          id: 1,
          case_id: Number(id) || 1,
          entity_id: 101,
          description: 'Panama Shell Corp Wire Transfer Receipt PDF',
          file_reference: 'evidence_panama_wire.pdf',
          sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          blockchain_tx_id: '0x4f88a91b...2901',
          verification_status: 'verified',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          case_id: Number(id) || 1,
          entity_id: 102,
          description: 'Risk analysis record for 0x71C...3a9',
          file_reference: null,
          sha256_hash: '7d8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
          blockchain_tx_id: '0x9921bc7a...8831',
          verification_status: 'registered',
          created_at: new Date().toISOString(),
        }
      ]);
    }
  };

  const handleRunMLAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await apiClient.post(`/cases/${id}/analyze`);
      await fetchCase();
    } catch (err) {
      console.error('Failed to run ML analysis', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegisterStructuredEvidence = async () => {
    if (!selectedEntity || !caseData) return;
    try {
      const res = await apiClient.post('/evidence/structured', {
        case_id: caseData.id,
        entity_id: selectedEntity.id,
        description: `Risk analysis record for ${selectedEntity.external_id}`,
        mode: 'structured',
        data: {
          external_id: selectedEntity.external_id,
          risk_score: selectedEntity.risk_score,
          risk_tier: selectedEntity.risk_tier,
        }
      });
      setEvidenceList((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error('Failed to register evidence', err);
    }
  };

  const handleUploadFileEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !caseData || !uploadDescription.trim()) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('case_id', String(caseData.id));
      formData.append('description', uploadDescription);
      formData.append('file', uploadFile);

      const res = await apiClient.post('/evidence/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setEvidenceList((prev) => [res.data, ...prev]);
      setShowUploadModal(false);
      setUploadDescription('');
      setUploadFile(null);
    } catch (err) {
      console.error('Failed to upload file evidence', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyEvidence = async (evId: number) => {
    setVerifyingMap((prev) => ({ ...prev, [evId]: true }));
    try {
      const res = await apiClient.get(`/evidence/${evId}/verify`);
      setEvidenceList((prev) =>
        prev.map((e) => (e.id === evId ? res.data : e))
      );
    } catch (err) {
      console.error('Verification failed', err);
    } finally {
      setVerifyingMap((prev) => ({ ...prev, [evId]: false }));
    }
  };

  const filteredEntities = caseData?.entities.filter((e) =>
    e.external_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!caseData) {
    return <div className="p-8 text-center text-slate-500">Loading Case Detail...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">{caseData.title}</h1>
            <p className="text-xs text-slate-500 font-mono">Case ID #{caseData.id} • {caseData.entities.length} Analyzed Entities</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-2 border border-slate-200 transition shadow-sm"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Upload Document Evidence</span>
          </button>

          <button
            onClick={handleRunMLAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isAnalyzing ? 'Running Analysis...' : 'Run Network Pattern Detection'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full space-y-6">
        {/* Upper Grid: Network Graph View + Node Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <GraphView
              entities={filteredEntities}
              onSelectEntity={(ent) => setSelectedEntity(ent)}
              selectedEntityId={selectedEntity?.id}
            />

            {/* Entity Filter Input */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search wallet or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Right Side Panel: Clean Selected Node Information */}
          <div className="space-y-4">
            {selectedEntity ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 font-semibold">
                    {selectedEntity.external_id}
                  </span>
                  <RiskBadge score={selectedEntity.risk_score} tier={selectedEntity.risk_tier} />
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <div className="text-xs text-slate-500 font-medium">Risk Assessment</div>
                  <div className="text-sm font-semibold text-slate-800">
                    Calculated Risk Score: <span className="text-indigo-600 font-bold">{selectedEntity.risk_score}/100</span>
                  </div>
                </div>

                <button
                  onClick={handleRegisterStructuredEvidence}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Register Node Evidence Hash</span>
                </button>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs shadow-sm">
                Click any node on the graph to inspect details.
              </div>
            )}
          </div>
        </div>

        {/* Evidence & Blockchain Registry Module */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Evidence Registry & Blockchain Audit Log</h3>
                <p className="text-xs text-slate-500">Tamper-proof on-chain verification for case documents & flagged entities</p>
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Document</span>
            </button>
          </div>

          {evidenceList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidenceList.map((ev) => (
                <div key={ev.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 font-medium flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      {ev.description}
                    </span>
                  </div>
                  <BlockchainVerifyBadge
                    status={ev.verification_status}
                    txHash={ev.blockchain_tx_id || undefined}
                    onVerifyClick={() => handleVerifyEvidence(ev.id)}
                    isVerifying={!!verifyingMap[ev.id]}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-slate-200">
              No evidence registered for this case yet. Click "Register Node Evidence Hash" or "Upload Document Evidence" above.
            </div>
          )}
        </div>
      </div>

      {/* Modal for Document Evidence Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                Upload Document / Bank Record Evidence
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadFileEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Description / Record Label</label>
                <input
                  type="text"
                  placeholder="e.g. Panama Offshore Wire Receipt PDF"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Evidence File (PDF, CSV, Statement)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-700 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50 transition"
                >
                  {isUploading ? 'Uploading & Hashing...' : 'Upload & Register Hash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
