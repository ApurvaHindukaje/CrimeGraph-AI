import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { apiClient } from '../../shared';
import {
  Shield,
  Activity,
  Lock,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Database,
  Cpu,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  Globe,
  Layers
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { token, login } = useAuth();
  const navigate = useNavigate();

  // Quick Sign-In Drawer/Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { username, password });
      login(response.data.access_token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data?.detail || `Authentication failed (${err.response.status})`);
      } else if (err.request) {
        setError("Unable to connect to backend server. Please ensure Docker containers are running.");
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAccess = (userRole: string, pass: string) => {
    setUsername(userRole);
    setPassword(pass);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sleek Minimal Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900 tracking-tight">CrimeGraph</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                AI
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">Capabilities</a>
            <a href="#technology" className="hover:text-indigo-600 transition">GNN Engine</a>
            <a href="#blockchain" className="hover:text-indigo-600 transition">Blockchain Integrity</a>
            <a href="#architecture" className="hover:text-indigo-600 transition">Architecture</a>
          </nav>

          <div className="flex items-center gap-3">
            {token ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleQuickDemoAccess('admin', 'admin123')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
                >
                  <span>Explore Demo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
          Next-Generation Crime Pattern Intelligence & On-Chain Auditability
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Illuminating Illicit Financial Networks with <span className="text-indigo-600">CrimeGraph AI</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Unified graph intelligence combining Transductive Graph Neural Networks and tamper-proof blockchain evidence verification for financial crime investigators.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {token ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition"
            >
              <span>Open Investigator Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition"
            >
              <span>Launch Platform Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleQuickDemoAccess('investigator1', 'investigator123')}
            className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 text-sm font-semibold rounded-xl border border-slate-300 shadow-sm transition"
          >
            Access Sample Investigation Case
          </button>
        </div>

        {/* Minimal Feature Mockup Banner */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 text-left relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span className="text-xs font-mono text-slate-400 ml-2">CrimeGraph AI — Case #104 Interactive Network Analysis</span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Hash Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-slate-500 font-medium">Flagged Addresses</div>
                <div className="text-xl font-bold text-slate-900">45 Wallet Nodes</div>
                <div className="text-[11px] text-indigo-600 font-semibold">Mixer & Tumbler Topology</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-slate-500 font-medium">Offshore Statements</div>
                <div className="text-xl font-bold text-slate-900">PDF & Wire Records</div>
                <div className="text-[11px] text-emerald-600 font-semibold">SHA-256 Registered</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-slate-500 font-medium">Highest Risk Score</div>
                <div className="text-xl font-bold text-red-600">89.4 / 100</div>
                <div className="text-[11px] text-red-600 font-semibold">Critical Threat Level</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="features" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Built for Financial Investigators</h2>
            <p className="text-sm text-slate-500">
              Designed to replace fragmented spreadsheets and obscure machine learning output with clean, action-oriented intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 hover:border-indigo-300 transition shadow-sm">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit border border-indigo-100">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Graph Neural Network Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Processes complex transaction graphs, identifying non-obvious money routing patterns, intermediary hops, and illicit wallet clusters.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 hover:border-indigo-300 transition shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit border border-emerald-100">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Blockchain Evidence Registry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registers cryptographic SHA-256 hashes of wire receipts and evidence files to an immutable ledger for tamper-proof court readiness.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 hover:border-indigo-300 transition shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit border border-blue-100">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Unified Evidence Workflow</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamlessly bridges on-chain cryptocurrency wallet activity with traditional offshore bank account statements and document uploads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Architecture Section */}
      <section id="technology" className="py-16 max-w-7xl mx-auto px-6 w-full space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold">
              <Globe className="w-3.5 h-3.5" /> High-Performance Stack
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Enterprise-Grade Architecture Built for Speed and Compliance
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              CrimeGraph AI operates on a modern microservices architecture using FastAPI, PyTorch Geometric GNN models, PostgreSQL, and Smart Contract verification logic.
            </p>

            <div className="space-y-3 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Strict Role-Based Access Control (RBAC: Admin, Investigator, Analyst)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dual-mode evidence verification (Structured JSON + File Records)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Full immutable audit logging for security compliance</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>System Security & Data Pipeline</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                Operational
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700">API Gateway & RBAC</span>
                <span className="font-mono text-slate-500">FastAPI / JWT</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700">GNN Graph Inference</span>
                <span className="font-mono text-slate-500">PyTorch Geometric</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700">Audit Ledger</span>
                <span className="font-mono text-slate-500">Ethereum Hardhat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 px-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-900">CrimeGraph AI</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <p className="max-w-xl text-center md:text-right text-[11px] text-slate-400">
            CrimeGraph AI provides decision-support pattern analytics for financial crime investigators. It does not make automated legal determinations.
          </p>
        </div>
      </footer>

      {/* Auth Modal / Quick Access Drawer */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 mb-1 shadow-sm">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">CrimeGraph AI</h2>
              <p className="text-xs text-slate-500">Sign in to access the investigation workspace.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Username</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2.5 pl-9 pr-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2.5 pl-9 pr-10 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In'}
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 uppercase font-semibold mb-2">1-Click Quick Demo Sign In</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded border border-slate-200 text-center font-medium transition"
                >
                  Admin
                </button>
                <button
                  onClick={() => { setUsername('investigator1'); setPassword('investigator123'); }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded border border-slate-200 text-center font-medium transition"
                >
                  Investigator
                </button>
                <button
                  onClick={() => { setUsername('analyst1'); setPassword('analyst123'); }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded border border-slate-200 text-center font-medium transition"
                >
                  Analyst
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
