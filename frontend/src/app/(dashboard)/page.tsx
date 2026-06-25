'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import { 
  Users, 
  Boxes, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const PIE_COLORS = ['#a855f7', '#06b6d4', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [summaryRes, insightsRes] = await Promise.all([
        api.get('/finance/summary'),
        api.get('/ai/insights')
      ]);

      if (summaryRes.data.success) {
        setData(summaryRes.data.data);
      }
      if (insightsRes.data.success) {
        setInsights(insightsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      setError('Failed to sync server records. Verify that your backend connection is online.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-accentPurple"></div>
          <p className="text-sm font-semibold text-gray-400">Loading live analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="glass-panel flex flex-col items-center rounded-3xl p-8 shadow-xl">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Sync Connection Failure</h3>
          <p className="text-sm text-gray-400 mb-6">{error || 'Unable to load dashboard records.'}</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-xl bg-accentPurple px-6 py-3 text-sm font-semibold text-white transition hover:bg-accentPurple/80"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { stats, monthlyChartData, inventoryChartData, recentActivities } = data;

  // Custom tooltips styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-[#0d101a] p-3 shadow-lg">
          <p className="text-xs font-bold text-gray-400 mb-1.5">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-xs font-semibold" style={{ color: p.color }}>
              {p.name}: ${p.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative space-y-8 px-6 py-8 lg:px-8">
      {/* Glow Orbs */}
      <div className="bg-glow-purple top-10 left-10"></div>
      <div className="bg-glow-cyan bottom-10 right-10"></div>

      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10 relative">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white">Performance Overview</h3>
          <p className="text-sm text-gray-400 mt-1">Consolidated reports and real-time AI Business Insights.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex self-start items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition duration-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 z-10 relative">
        {/* Total Employees */}
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Employees</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accentPurple/10 text-accentPurple border border-accentPurple/20">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-white">{stats.totalEmployees}</p>
          <p className="mt-1 text-[10px] text-gray-500 font-semibold">Active staff entries</p>
        </div>

        {/* Total Products */}
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Products</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accentCyan/10 text-accentCyan border border-accentCyan/20">
              <Boxes className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-white">{stats.totalProducts}</p>
          <p className="mt-1 text-[10px] text-gray-500 font-semibold">SKUs in catalog</p>
        </div>

        {/* Total Revenue */}
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-emerald-400">${stats.totalRevenue.toLocaleString()}</p>
          <p className="mt-1 text-[10px] text-gray-500 font-semibold">Gross sales income</p>
        </div>

        {/* Total Expenses */}
        <div className="glass-card glass-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Expenses</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <TrendingDown className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-red-400">${stats.totalExpenses.toLocaleString()}</p>
          <p className="mt-1 text-[10px] text-gray-500 font-semibold">Operational expenditure</p>
        </div>

        {/* Net Profit */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Net Profit</span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              stats.netProfit >= 0 
                ? 'bg-accentPurple/10 text-accentPurple border-accentPurple/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className={`mt-4 text-2xl font-black ${stats.netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
            {stats.netProfit < 0 ? '-' : ''}${Math.abs(stats.netProfit).toLocaleString()}
          </p>
          <p className="mt-1 text-[10px] text-gray-500 font-semibold">Net margin profit</p>
        </div>
      </div>

      {/* AI Insights Panel */}
      {insights.length > 0 && (
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden z-10 border-accentPurple/10 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
          <div className="absolute top-0 right-0 h-40 w-40 bg-accentPurple/5 blur-2xl rounded-full"></div>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-accentPurple animate-pulse" />
            <h4 className="text-base font-bold text-white">AI-Powered Business Insights</h4>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight) => {
              const badgeColors = {
                success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                neutral: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
              }[insight.type as string] || 'bg-white/5 text-gray-300 border-white/5';

              const Icon = {
                success: CheckCircle,
                warning: AlertTriangle,
                danger: AlertTriangle,
                info: Info,
                neutral: Info,
              }[insight.type as string] || Info;

              return (
                <div key={insight.id} className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                        {insight.category}
                      </span>
                      <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeColors}`}>
                        <Icon className="h-3 w-3" />
                        {insight.title}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-300 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-white/5 pt-3">
                    <p className="text-[10px] uppercase font-bold text-accentPurple tracking-wider mb-1">Recommendation</p>
                    <p className="text-xs text-gray-400 leading-normal">{insight.suggestion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visual Analytics Charts Grid */}
      <div className="grid gap-6 md:grid-cols-3 z-10 relative">
        {/* Monthly Revenue Chart */}
        <div className="glass-card rounded-2xl p-6 md:col-span-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Revenue & Expenses Trend</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" name="Expense" dataKey="expense" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Category Chart */}
        <div className="glass-card rounded-2xl p-6">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Stock Allocation by Category</h4>
          <div className="h-80 w-full flex flex-col items-center justify-center">
            {inventoryChartData.length > 0 ? (
              <div className="relative h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {inventoryChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [`${value} units`, name]}
                      contentStyle={{ background: '#0d101a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Total Stock</span>
                  <span className="text-xl font-black text-white">
                    {inventoryChartData.reduce((acc: number, curr: any) => acc + curr.value, 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-500 py-12">No inventory quantities.</div>
            )}
            
            {/* Legend Labels */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
              {inventoryChartData.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span className="font-semibold text-gray-300">{entry.name}</span>
                  <span className="text-gray-500">({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities Lists */}
      <div className="glass-card rounded-2xl p-6 z-10 relative">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Recent Enterprise Activities</h4>
        {recentActivities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentActivities.map((act: any, idx: number) => {
              const borderColors = {
                employee: 'border-l-accentPurple',
                product: 'border-l-accentCyan',
                income: 'border-l-emerald-500',
                expense: 'border-l-red-500',
              }[act.type as string] || 'border-l-white/10';

              const badgeColors = {
                employee: 'bg-accentPurple/10 text-accentPurple border-accentPurple/10',
                product: 'bg-accentCyan/10 text-accentCyan border-accentCyan/10',
                income: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10',
                expense: 'bg-red-500/10 text-red-400 border-red-500/10',
              }[act.type as string] || 'bg-white/5 text-gray-400';

              return (
                <div 
                  key={idx} 
                  className={`rounded-xl border border-white/5 border-l-3 bg-white/[0.01] p-4 flex justify-between items-start ${borderColors}`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${badgeColors}`}>
                        {act.type}
                      </span>
                      <p className="text-xs font-bold text-white">{act.title}</p>
                    </div>
                    <p className="text-xs text-gray-400 leading-normal">{act.desc}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">
                    {new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-xs text-gray-500 py-8">No recent transactions or log activities recorded.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
