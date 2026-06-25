'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { 
  Plus, 
  Trash2, 
  AlertTriangle,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  Tag
} from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

const Finance = () => {
  const queryClient = useQueryClient();
  
  // Navigation tabs: 'income' or 'expense'
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch Incomes
  const { data: incomesData, isLoading: isIncomesLoading, error: incomesError } = useQuery({
    queryKey: ['finance', 'income'],
    queryFn: async () => {
      const res = await api.get('/finance/income');
      return res.data.data as Transaction[];
    }
  });

  // Fetch Expenses
  const { data: expensesData, isLoading: isExpensesLoading, error: expensesError } = useQuery({
    queryKey: ['finance', 'expense'],
    queryFn: async () => {
      const res = await api.get('/finance/expense');
      return res.data.data as Transaction[];
    }
  });

  const incomes = incomesData || [];
  const expenses = expensesData || [];
  const loading = isIncomesLoading || isExpensesLoading;
  const error = incomesError || expensesError ? 'Could not connect to the finance ledger server.' : null;

  // Add transaction mutation
  const addMutation = useMutation({
    mutationFn: ({ type, data }: { type: 'income' | 'expense'; data: Omit<Transaction, 'id'> }) =>
      api.post(`/finance/${type}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finance', variables.type] });
      setShowModal(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to save financial record.');
    }
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'income' | 'expense' }) =>
      api.delete(`/finance/${type}/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finance', variables.type] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to remove ledger entry.');
    }
  });

  const handleOpenModal = () => {
    setTitle('');
    setAmount('');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = (id: string, type: 'income' | 'expense', recordTitle: string) => {
    if (window.confirm(`Are you sure you want to remove "${recordTitle}" from ${type} logs?`)) {
      deleteMutation.mutate({ id, type });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title || !amount || !category || !date) {
      setFormError('All fields are required.');
      return;
    }

    const payload = {
      title,
      amount: Number(amount),
      category,
      date: new Date(date).toISOString()
    };

    addMutation.mutate({ type: activeTab, data: payload });
  };

  // Computations
  const totalRevenue = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="relative space-y-8 px-6 py-8 lg:px-8">
      {/* Decorative Glow Orbs */}
      <div className="bg-glow-purple top-20 left-10"></div>
      <div className="bg-glow-cyan bottom-20 right-10"></div>

      {/* Header toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10 relative">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white font-sans">Financial Operations</h3>
          <p className="text-sm text-gray-400 mt-1">Audit transactions, compute net profits, and log incomes/expenses.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex self-start items-center gap-2 rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan px-4 py-3 text-sm font-semibold text-white shadow-md shadow-accentPurple/20 hover:brightness-110 active:scale-98 transition duration-200"
        >
          <Plus className="h-4.5 w-4.5" />
          Log {activeTab === 'income' ? 'Revenue' : 'Expense'}
        </button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-3 z-10 relative">
        {/* Total revenue */}
        <div className="glass-card rounded-2xl p-5 border-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-emerald-400">${totalRevenue.toLocaleString()}</p>
          <p className="mt-1 text-[10px] text-gray-500 font-semibold">Consolidated earnings</p>
        </div>

        {/* Total expenses */}
        <div className="glass-card rounded-2xl p-5 border-red-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Expenses</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black text-red-400">${totalExpenses.toLocaleString()}</p>
          <p className="mt-1 text-[10px] text-gray-500 font-semibold">Total cost overhead</p>
        </div>

        {/* Margin profit */}
        <div className="glass-card rounded-2xl p-5 border-accentPurple/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Net Profit margin</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentPurple/10 text-accentPurple">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className={`mt-4 text-2xl font-black ${netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
            {netProfit < 0 ? '-' : ''}${Math.abs(netProfit).toLocaleString()}
          </p>
          <p className="mt-1 text-[10px] text-gray-500 font-semibold">Profitability margin: {profitMargin}%</p>
        </div>
      </div>

      {/* Ledger navigation and listing */}
      <div className="glass-card rounded-2xl shadow-xl overflow-hidden z-10 relative">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('income')}
            className={`flex items-center gap-2 px-6 py-4.5 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
              activeTab === 'income'
                ? 'border-accentPurple text-white bg-white/[0.02]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Incomes Log ({incomes.length})
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex items-center gap-2 px-6 py-4.5 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
              activeTab === 'expense'
                ? 'border-accentPurple text-white bg-white/[0.02]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <TrendingDown className="h-4 w-4 text-red-400" />
            Expenses Log ({expenses.length})
          </button>
        </div>

        {/* Database Connection Errors */}
        {error && (
          <div className="m-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5" />
            {error}
          </div>
        )}

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Transaction Title</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Category</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Date Logged</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Amount</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-accentPurple mx-auto mb-2"></div>
                    <span className="text-xs text-gray-400 font-semibold">Updating ledger entries...</span>
                  </td>
                </tr>
              ) : activeTab === 'income' ? (
                incomes.length > 0 ? (
                  incomes.map((inc) => (
                    <tr key={inc.id} className="glass-table-row">
                      <td className="p-4 font-bold text-white">{inc.title}</td>
                      <td className="p-4 text-xs text-gray-300 font-semibold">{inc.category}</td>
                      <td className="p-4 text-xs text-gray-400 font-semibold">
                        {new Date(inc.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 font-bold text-emerald-400 text-sm">+${inc.amount.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(inc.id, 'income', inc.title)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-xs text-gray-500 font-medium">No income logs registered.</td>
                  </tr>
                )
              ) : (
                expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="glass-table-row">
                      <td className="p-4 font-bold text-white">{exp.title}</td>
                      <td className="p-4 text-xs text-gray-300 font-semibold">{exp.category}</td>
                      <td className="p-4 text-xs text-gray-400 font-semibold">
                        {new Date(exp.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 font-bold text-red-400 text-sm">-${exp.amount.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(exp.id, 'expense', exp.title)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-xs text-gray-500 font-medium">No expense logs registered.</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.01] px-6 py-4">
              <h4 className="text-base font-bold text-white capitalize">
                Log New {activeTab}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-semibold text-red-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Transaction Title
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <FileSpreadsheet className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={activeTab === 'income' ? 'Enterprise Contract Payout' : 'Office Lease Bill'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="glass-input w-full rounded-xl py-2.5 pl-7 pr-4 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Transaction Date
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Category
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Tag className="h-4.5 w-4.5" />
                  </span>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-xs appearance-none"
                  >
                    <option value="" disabled className="bg-slate-900 text-gray-400">Select Category</option>
                    {activeTab === 'income' ? (
                      <>
                        <option value="SaaS Subscriptions" className="bg-slate-900 text-white">SaaS Subscriptions</option>
                        <option value="Consulting Fees" className="bg-slate-900 text-white">Consulting Fees</option>
                        <option value="Service Contracts" className="bg-slate-900 text-white">Service Contracts</option>
                        <option value="Product Licensing" className="bg-slate-900 text-white">Product Licensing</option>
                        <option value="Other Revenue" className="bg-slate-900 text-white">Other Revenue</option>
                      </>
                    ) : (
                      <>
                        <option value="Infrastructure" className="bg-slate-900 text-white">Infrastructure</option>
                        <option value="Office Space" className="bg-slate-900 text-white">Office Space</option>
                        <option value="Marketing" className="bg-slate-900 text-white">Marketing</option>
                        <option value="Payroll" className="bg-slate-900 text-white">Payroll</option>
                        <option value="Software Subscriptions" className="bg-slate-900 text-white">Software Subscriptions</option>
                        <option value="Other Expense" className="bg-slate-900 text-white">Other Expense</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-white/15 bg-transparent px-5 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan px-6 py-2.5 text-xs font-semibold text-white hover:brightness-110 active:scale-98 shadow-md shadow-accentPurple/25 disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Logging...' : 'Confirm Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
