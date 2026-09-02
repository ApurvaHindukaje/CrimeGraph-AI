import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { apiClient } from '../../shared';
import { Shield, Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
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
        setError("Unable to connect to backend server at http://localhost:8000. Please ensure Docker containers are running.");
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 mb-2 shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Network Analysis System</h1>
          <p className="text-xs text-slate-500">
            Identifies statistical patterns associated with illicit transaction categories.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Accounts Selector */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[11px] text-slate-400 uppercase font-semibold mb-2">Quick Access Demo Roles</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setQuickAccount('admin', 'admin123')}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded border border-slate-200 text-center font-medium transition"
            >
              Admin
            </button>
            <button
              onClick={() => setQuickAccount('investigator1', 'investigator123')}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded border border-slate-200 text-center font-medium transition"
            >
              Investigator
            </button>
            <button
              onClick={() => setQuickAccount('analyst1', 'analyst123')}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded border border-slate-200 text-center font-medium transition"
            >
              Analyst
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
