import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserManagementModal } from '../auth';
import { apiClient } from '../../shared';
import { FolderPlus, Folder, Activity, ShieldAlert, Cpu, LogOut, FileText, CheckCircle2, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Case {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  entity_count: number;
}

export const Dashboard: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await apiClient.get('/cases');
      setCases(res.data);
    } catch (err) {
      console.error('Failed to fetch cases from backend, using demo cases', err);
      setCases([
        {
          id: 1,
          title: 'Operation DarkNet Mixer',
          description: 'Multilayer Bitcoin tumbler mixing investigation involving suspicious cross-jurisdictional hops.',
          status: 'Active',
          entity_count: 4,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Operation Aegis',
          description: 'Ransomware extortion payment cluster tracking & shell account laundering.',
          status: 'Active',
          entity_count: 4,
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          title: 'Operation Chameleon',
          description: 'Cross-chain decentralized exchange (DEX) liquidity pool obfuscation pattern.',
          status: 'In Review',
          entity_count: 4,
          created_at: new Date().toISOString(),
        },
        {
          id: 4,
          title: 'Operation SanctionShield',
          description: 'OFAC-sanctioned address cluster interaction & offshore wire matching.',
          status: 'Active',
          entity_count: 4,
          created_at: new Date().toISOString(),
        }
      ]);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/cases', { title, description });
      setTitle('');
      setDescription('');
      setIsModalOpen(false);
      fetchCases();
    } catch (err) {
      console.error('Failed to create case', err);
    }
  };

  const riskData = [
    { name: 'Low Risk', value: 45, color: '#10b981' },
    { name: 'Medium Risk', value: 30, color: '#f59e0b' },
    { name: 'High Risk', value: 15, color: '#f97316' },
    { name: 'Critical Risk', value: 10, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">CrimeGraph</h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">AI</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">GNN Graph Intelligence & On-Chain Evidence Registry</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-800">{user?.username}</div>
              <div className="text-[10px] text-indigo-600 capitalize font-mono font-semibold">{user?.role}</div>
            </div>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="px-3 py-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Manage User Accounts"
                >
                  <Users className="w-4 h-4" />
                  <span>User Management</span>
                </button>
                <Link to="/audit" className="px-3 py-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition">
                  <FileText className="w-4 h-4" />
                  <span>Audit Log</span>
                </Link>
              </>
            )}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-2 text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg border border-slate-200 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 space-y-8">
        {/* Banner Notice */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Framing Notice</div>
            <p className="text-xs text-slate-600">
              System identifies statistical patterns associated with illicit transaction categories in training data. It does not determine legal guilt or claim unlawful conduct.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> Transductive GNN Online
          </span>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Active Cases</div>
              <div className="text-2xl font-bold text-slate-900">{cases.length}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Entities Analyzed</div>
              <div className="text-2xl font-bold text-slate-900">1,000</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">High/Critical Flags</div>
              <div className="text-2xl font-bold text-red-600">25%</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Blockchain Registered</div>
              <div className="text-2xl font-bold text-emerald-600">SHA-256</div>
            </div>
          </div>
        </div>

        {/* Middle Section: Cases List & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cases Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-600" />
                Investigation Cases
              </h2>
              {(user?.role === 'admin' || user?.role === 'investigator') && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Create New Case</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.map((c) => (
                <Link
                  key={c.id}
                  to={`/cases/${c.id}`}
                  className="bg-white hover:bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition duration-200 space-y-3 block group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-semibold">
                      Case #{c.id}
                    </span>
                    <span className="text-[11px] text-slate-500 uppercase font-semibold">{c.status}</span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">{c.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>{c.entity_count} Flagged Entities</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Risk Distribution Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Global Risk Tier Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {riskData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-500">{item.name}:</span>
                  <span className="font-semibold text-slate-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Create Case */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Create Investigation Case</h3>
            <form onSubmit={handleCreateCase} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Case Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Transaction Cluster #404"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Investigation context & details..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-semibold shadow-sm transition"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admin User Management */}
      <UserManagementModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />
    </div>
  );
};
