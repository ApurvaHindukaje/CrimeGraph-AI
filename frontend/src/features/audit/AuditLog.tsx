import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../shared';
import { ArrowLeft, FileText, Clock, User } from 'lucide-react';

interface AuditRecord {
  id: number;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id: string | null;
  timestamp: string;
  ip_address: string | null;
}

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get('/audit-log');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch audit log', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 bg-white text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 transition shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                System Audit Trail Log
              </h1>
              <p className="text-xs text-slate-500">Immutable security audit record of all case and evidence interactions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">User ID</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Resource</th>
                <th className="px-6 py-3">Resource ID</th>
                <th className="px-6 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-mono text-slate-400">#{log.id}</td>
                  <td className="px-6 py-4 flex items-center gap-1.5 font-semibold text-slate-800">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    User #{log.user_id}
                  </td>
                  <td className="px-6 py-4 font-mono text-indigo-600 font-semibold">{log.action}</td>
                  <td className="px-6 py-4 text-slate-700 capitalize font-medium">{log.resource_type}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{log.resource_id || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No audit records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
