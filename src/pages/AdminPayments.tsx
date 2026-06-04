import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Clock, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { PaymentRecord } from '../types';

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notAdmin, setNotAdmin] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const KOF_USER = (() => {
    try {
      const raw = localStorage.getItem('qr_guard_auth_user');
      // store email mostly; userId is needed but not stored. Use email hash or empty
      return raw || '';
    } catch { return ''; }
  })();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('__clerk_db_jwt');
      const res = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'x-user-id': KOF_USER,
        },
      });
      if (res.status === 403) setNotAdmin(true);
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [KOF_USER]);

  const handleAction = async (paymentId: string, action: 'approve' | 'reject') => {
    setActing(paymentId);
    try {
      const token = localStorage.getItem('__clerk_db_jwt');
      const adminNote = noteInputs[paymentId] || undefined;
      const res = await fetch('/api/admin/payments/act', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-user-id': KOF_USER,
        },
        body: JSON.stringify({ paymentId, action, adminNote }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} payment`);
      }
      // Update local state
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? { ...p, status: action === 'approve' ? 'approved' : 'rejected', updatedAt: new Date().toISOString(), adminNote }
            : p
        )
      );
      setNoteInputs((prev) => {
        const next = { ...prev };
        delete next[paymentId];
        return next;
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.email.toLowerCase().includes(q) || p.userId.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    }
    return true;
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    return styles[status] || '';
  };

  if (notAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <ShieldCheck className="h-12 w-12 text-slate-400 mb-4" />
        <h1 className="text-xl font-black text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-500 mt-2">You must be an admin to access this page.</p>
        <a href="/" className="mt-6 text-indigo-600 text-xs font-black hover:underline">← Back to app</a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <a href="/" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <div>
            <h1 className="text-lg font-black text-slate-900">Payment Management</h1>
            <p className="text-[11px] text-slate-500">Approve or reject payment submissions</p>
          </div>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-hidden font-medium focus:border-indigo-400 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer capitalize ${
                filter === f
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {f === 'all' ? `All (${payments.length})` : `${f} (${payments.filter((p) => p.status === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 w-64">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <code className="font-mono text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {p.id.slice(-8).toUpperCase()}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800">{p.email}</span>
                        <br />
                        <span className="font-mono text-[10px] text-slate-400">{p.userId.slice(0, 16)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-black px-2 py-1 rounded-lg border bg-slate-50 border-slate-200 text-slate-700 text-[10px]">
                        {p.plan === 'pro' ? 'Pro' : 'Enterprise'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border font-black text-[10px] ${statusBadge(p.status)}`}>
                        {p.status === 'pending' && <Clock className="h-3 w-3" />}
                        {p.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                        {p.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'pending' ? (
                        <motion.div className="flex items-center gap-2" layout>
                          <input
                            type="text"
                            placeholder="Optional admin note..."
                            value={noteInputs[p.id] || ''}
                            onChange={(e) => setNoteInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            className="flex-1 px-2 py-1.5 text-[10.5px] bg-slate-50 border border-slate-200 rounded-lg outline-hidden font-medium"
                          />
                          <button
                            disabled={acting === p.id}
                            onClick={() => handleAction(p.id, 'approve')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer disabled:opacity-60"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            disabled={acting === p.id}
                            onClick={() => handleAction(p.id, 'reject')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-red-100 text-red-700 text-[10px] font-black rounded-lg border border-slate-200 transition-all cursor-pointer disabled:opacity-60"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </button>
                        </motion.div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          {p.adminNote || 'No notes'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No payments found for this filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}