// pages/agents/AgentAnalytics.tsx
// Platform-wide agent analytics + leaderboard
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, Users, Star, Trophy, RefreshCw,
  AlertTriangle, Loader2, BarChart3, CheckCircle, Eye,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface PlatformStats {
  total: number; active: number; inactive: number; suspended: number;
  available: number; verified: number; pending_kyc: number;
  avg_rating: number; total_leads_completed: number;
}
interface Analytics {
  period_days: number;
  metrics: { total_assignments: number; completed: number; cancelled: number; customer_rejected: number; completion_rate: number; total_revenue: number; avg_deal_value: number };
  daily_breakdown: Array<{ date: string; total: number; completed: number; revenue: number }>;
  by_partner: Array<{ agent__partner__business_name: string; total: number; completed: number; revenue: number }>;
}
interface LeaderAgent {
  rank: number; agent_id: string; name: string; phone: string;
  employee_code: string; partner_name: string;
  total_completed: number; average_rating: number; is_available: boolean;
}

const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((c) => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const fmt = (n = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtD = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const rankColor = (r: number) => r === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : r === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : r === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gray-200 text-gray-600';

const AgentAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats]           = useState<PlatformStats | null>(null);
  const [analytics, setAnalytics]   = useState<Analytics | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderAgent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [days, setDays]             = useState(30);
  const [lbMetric, setLbMetric]     = useState<'completed' | 'revenue' | 'rating'>('completed');
  const [error, setError]           = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sRes, aRes, lRes] = await Promise.all([
        api.get<PlatformStats>('/admin/agents/platform_stats/'),
        api.get<Analytics>(`/admin/agents/analytics/?days=${days}`),
        api.get<{ results: LeaderAgent[] }>(`/admin/agents/leaderboard/?metric=${lbMetric}&limit=15`),
      ]);
      setStats(sRes.data); setAnalytics(aRes.data); setLeaderboard(lRes.data.results || []);
    } catch { setError('Failed to load analytics.'); }
    finally { setLoading(false); }
  }, [days, lbMetric]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 size={32} className="text-emerald-600 animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen"><div className="text-center space-y-3"><AlertTriangle size={36} className="mx-auto text-red-400" /><p className="text-gray-700">{error}</p><button onClick={loadAll} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg">Retry</button></div></div>;

  const m = analytics?.metrics;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/agents')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={22} /></button>
            <div><h1 className="text-2xl font-bold text-gray-900">Agent Analytics</h1><p className="text-sm text-gray-500">Platform-wide performance insights</p></div>
          </div>
          <div className="flex items-center gap-2">
            {[7, 30, 90].map(d => <button key={d} onClick={() => setDays(d)} className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${days === d ? 'bg-emerald-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{d}d</button>)}
            <button onClick={loadAll} className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50"><RefreshCw size={15} /></button>
          </div>
        </div>

        {/* Platform stats strip */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { l: 'Total Agents', v: stats.total, c: 'text-gray-900' },
              { l: 'Active',       v: stats.active, c: 'text-emerald-600' },
              { l: 'Available',    v: stats.available, c: 'text-blue-600' },
              { l: 'KYC Verified', v: stats.verified, c: 'text-emerald-600' },
              { l: 'Avg Rating',   v: stats.avg_rating.toFixed(1), c: 'text-yellow-600' },
            ].map(({ l, v, c }) => (
              <div key={l} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{l}</p>
                <p className={`text-2xl font-bold mt-1 ${c}`}>{v}</p>
              </div>
            ))}
          </div>
        )}

        {/* Period metrics */}
        {m && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"><p className="text-xs text-gray-500">Total Assignments</p><p className="text-2xl font-bold text-gray-900 mt-1">{m.total_assignments}</p></div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"><p className="text-xs text-gray-500">Completion Rate</p><p className="text-2xl font-bold text-emerald-600 mt-1">{m.completion_rate.toFixed(1)}%</p><p className="text-xs text-gray-500 mt-0.5">{m.completed} completed</p></div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"><p className="text-xs text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-purple-600 mt-1">{fmt(m.total_revenue)}</p></div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"><p className="text-xs text-gray-500">Avg Deal Value</p><p className="text-2xl font-bold text-gray-900 mt-1">{fmt(m.avg_deal_value)}</p></div>
          </div>
        )}

        {/* Daily chart + by-partner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily bar chart */}
          {analytics && (
            <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-5">Daily Assignments</h3>
              <div className="space-y-2">
                {analytics.daily_breakdown.slice(-14).map(day => {
                  const max = Math.max(...analytics.daily_breakdown.map(d => d.total), 1);
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{fmtD(day.date)}</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(day.total / max) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-700 w-20 text-right">{day.completed}/{day.total}</span>
                      <span className="text-xs text-purple-600 w-20 text-right font-medium">{fmt(day.revenue)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By-partner */}
          {analytics?.by_partner && analytics.by_partner.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">By Partner (Top 10)</h3>
              <div className="space-y-3">
                {analytics.by_partner.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0"><p className="font-medium text-gray-900 truncate">{p.agent__partner__business_name}</p></div>
                    <div className="text-right flex-shrink-0 ml-3"><p className="font-bold text-gray-900">{p.completed}</p><p className="text-xs text-gray-500">{p.total} total</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Trophy size={18} className="text-yellow-500" />Agent Leaderboard</h3>
            <div className="flex gap-2">
              {(['completed', 'revenue', 'rating'] as const).map(m => (
                <button key={m} onClick={() => setLbMetric(m)} className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-colors ${lbMetric === m ? 'bg-emerald-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {leaderboard.map(agent => (
              <div key={agent.agent_id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                {/* Rank */}
                <div className={`w-10 h-10 rounded-full ${rankColor(agent.rank)} flex items-center justify-center flex-shrink-0`}>
                  {agent.rank <= 3
                    ? <Trophy size={16} className="text-white" />
                    : <span className="text-sm font-bold text-gray-700">{agent.rank}</span>}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.partner_name} {agent.employee_code && `· #${agent.employee_code}`}</p>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className="font-bold text-emerald-600">{agent.total_completed}</p>
                    <p className="text-xs text-gray-500">Done</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-gray-900 text-sm">{agent.average_rating.toFixed(1)}</span>
                  </div>
                  {agent.is_available && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Available</span>}
                  <button onClick={() => navigate(`/agents/${agent.agent_id}`)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 border border-emerald-200">
                    <Eye size={12} />View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentAnalytics;
