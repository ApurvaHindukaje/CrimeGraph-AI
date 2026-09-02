import React, { useState, useEffect } from 'react';
import { UserPlus, Users, X, ShieldAlert, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../../shared';

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('investigator');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/auth/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await apiClient.post('/auth/register', {
        username,
        email,
        password,
        role
      });
      setSuccess(`User "${username}" registered successfully with role ${role}.`);
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('investigator');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <Users className="w-5 h-5" />
            <span>Admin User Management</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2 text-xs text-red-600">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2 text-xs text-emerald-600">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Register New User Form */}
        <form onSubmit={handleRegister} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            <span>Create New User Account</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                placeholder="e.g. jdoe"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                placeholder="e.g. jdoe@analysis.local"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                <option value="admin">Admin</option>
                <option value="investigator">Investigator</option>
                <option value="analyst">Analyst</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition duration-200 shadow-md shadow-indigo-600/10 disabled:opacity-50"
          >
            {isLoading ? 'Creating User...' : 'Register User'}
          </button>
        </form>

        {/* Existing Users Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Registered System Accounts</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 font-mono text-slate-400">{u.id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{u.username}</td>
                    <td className="py-2 px-3 text-slate-500">{u.email}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        u.role === 'investigator' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        u.role === 'analyst' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
