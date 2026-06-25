'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../utils/api';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Plus,
  Search,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart2,
  PieChart as ChartIcon,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const PIE_COLORS = ['#a855f7', '#06b6d4', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // Filters & State for Attendance Tab
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attDept, setAttDept] = useState('');
  const [attSearch, setAttSearch] = useState('');
  const [attPage, setAttPage] = useState(1);

  // Filters for Leave Tab
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('');
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leavePage, setLeavePage] = useState(1);

  // Leave Form & Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveEmployeeId, setLeaveEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveError, setLeaveError] = useState('');

  // Edit attendance mode states (inline values)
  const [editingAttId, setEditingAttId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('Present');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Show status alerts helper
  const showAlert = (msg: string, type: 'success' | 'danger' = 'success') => {
    setAlertMessage({ text: msg, type });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // Queries
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await api.get('/employees?limit=100');
      return res.data.data;
    }
  });

  const { data: attStats } = useQuery({
    queryKey: ['attendance-stats'],
    queryFn: async () => {
      const res = await api.get('/attendance/stats');
      return res.data.data;
    }
  });

  const { data: lvStats } = useQuery({
    queryKey: ['leaves-stats'],
    queryFn: async () => {
      const res = await api.get('/leaves/stats');
      return res.data.data;
    }
  });

  const { data: attendanceData, isLoading: isAttLoading } = useQuery({
    queryKey: ['attendance-logs', attDate, attDept, attSearch, attPage],
    queryFn: async () => {
      const res = await api.get(
        `/attendance?date=${attDate}&department=${attDept}&search=${attSearch}&page=${attPage}&limit=10`
      );
      return res.data;
    }
  });

  const { data: leavesData, isLoading: isLeavesLoading } = useQuery({
    queryKey: ['leaves-requests', leaveStatusFilter, leaveSearch, leavePage],
    queryFn: async () => {
      const res = await api.get(
        `/leaves?status=${leaveStatusFilter}&search=${leaveSearch}&page=${leavePage}&limit=10`
      );
      return res.data;
    }
  });

  const attendanceRecords = attendanceData?.data || [];
  const attTotalPages = attendanceData?.pages || 1;

  const leaves = leavesData?.data || [];
  const leaveTotalPages = leavesData?.pages || 1;

  // Mutations
  const markAttendanceMutation = useMutation({
    mutationFn: (payload: any) => api.post('/attendance', payload),
    onSuccess: (res) => {
      showAlert(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (err: any) => {
      showAlert(err.response?.data?.message || 'Error marking attendance', 'danger');
    }
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.put(`/attendance/${id}`, payload),
    onSuccess: (res) => {
      showAlert(res.data.message);
      setEditingAttId(null);
      queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (err: any) => {
      showAlert(err.response?.data?.message || 'Error updating attendance', 'danger');
    }
  });

  const applyLeaveMutation = useMutation({
    mutationFn: (payload: any) => api.post('/leaves', payload),
    onSuccess: (res) => {
      showAlert(res.data.message);
      setIsLeaveModalOpen(false);
      setLeaveEmployeeId('');
      setLeaveReason('');
      setLeaveStartDate('');
      setLeaveEndDate('');
      queryClient.invalidateQueries({ queryKey: ['leaves-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leaves-stats'] });
    },
    onError: (err: any) => {
      setLeaveError(err.response?.data?.message || 'Error submitting leave request.');
    }
  });

  const approveLeaveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/leaves/${id}/approve`),
    onSuccess: () => {
      showAlert('Leave request approved successfully');
      queryClient.invalidateQueries({ queryKey: ['leaves-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leaves-stats'] });
    },
    onError: (err: any) => {
      showAlert(err.response?.data?.message || 'Error approving leave', 'danger');
    }
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.put(`/leaves/${id}/reject`, { rejectionReason: reason }),
    onSuccess: () => {
      showAlert('Leave request rejected');
      queryClient.invalidateQueries({ queryKey: ['leaves-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leaves-stats'] });
    },
    onError: (err: any) => {
      showAlert(err.response?.data?.message || 'Error rejecting leave', 'danger');
    }
  });

  // Action Triggers
  const handleMarkAttendance = (employeeId: string, defaultStatus = 'Present') => {
    markAttendanceMutation.mutate({
      employeeId,
      date: attDate,
      status: defaultStatus,
      checkIn: defaultStatus === 'Present' || defaultStatus === 'Late' ? '09:00 AM' : '',
      checkOut: defaultStatus === 'Present' || defaultStatus === 'Late' ? '05:00 PM' : ''
    });
  };

  const startEditAttendance = (record: any) => {
    setEditingAttId(record.id);
    setEditStatus(record.status);
    setEditCheckIn(record.checkIn || '');
    setEditCheckOut(record.checkOut || '');
    setEditRemarks(record.remarks || '');
  };

  const cancelEditAttendance = () => {
    setEditingAttId(null);
  };

  const saveEditAttendance = (recordId: string) => {
    updateAttendanceMutation.mutate({
      id: recordId,
      payload: {
        status: editStatus,
        checkIn: editCheckIn,
        checkOut: editCheckOut,
        remarks: editRemarks
      }
    });
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveError('');

    if (!leaveEmployeeId || !leaveStartDate || !leaveEndDate || !leaveReason) {
      setLeaveError('Please fill in all required fields.');
      return;
    }

    applyLeaveMutation.mutate({
      employeeId: leaveEmployeeId,
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason
    });
  };

  const handleApproveLeave = (id: string) => {
    approveLeaveMutation.mutate(id);
  };

  const handleRejectLeave = (id: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      showAlert('Rejection reason is required', 'danger');
      return;
    }
    rejectLeaveMutation.mutate({ id, reason });
  };

  const exportCSV = async () => {
    try {
      const res = await api.get(`/attendance/report?startDate=${attDate}&endDate=${attDate}`);
      if (res.data.success) {
        const records = res.data.data.records;
        if (records.length === 0) {
          showAlert('No records to export', 'danger');
          return;
        }

        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Employee,Department,Designation,Date,Status,Check In,Check Out,Hours Worked,Remarks\n';

        records.forEach((r: any) => {
          const formattedDate = new Date(r.date).toISOString().split('T')[0];
          csvContent += `"${r.employeeName}","${r.department}","${r.designation}","${formattedDate}","${r.status}","${r.checkIn || ''}","${r.checkOut || ''}",${r.workingHours || 0},"${r.remarks || ''}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Attendance_Report_${attDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAlert('Report exported as CSV');
      }
    } catch (err) {
      showAlert('Error exporting report', 'danger');
    }
  };

  const getPieChartData = () => {
    if (!lvStats?.utilization) return [];
    return Object.keys(lvStats.utilization).map((key) => ({
      name: key,
      value: lvStats.utilization[key]
    })).filter(item => item.value > 0);
  };

  const getAttendanceTrendData = () => {
    return [
      { name: 'Mon', Present: 92, Late: 5 },
      { name: 'Tue', Present: 95, Late: 2 },
      { name: 'Wed', Present: 90, Late: 8 },
      { name: 'Thu', Present: 96, Late: 1 },
      { name: 'Fri', Present: 94, Late: 3 }
    ];
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    queryClient.invalidateQueries({ queryKey: ['leaves-stats'] });
    queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
    queryClient.invalidateQueries({ queryKey: ['leaves-requests'] });
  };

  return (
    <div className="space-y-8 px-6 py-8 lg:px-8">
      {/* Alert Notifications */}
      {alertMessage && (
        <div
          className={`fixed right-6 top-24 z-50 rounded-xl border px-5 py-4 text-xs font-semibold shadow-2xl backdrop-blur-md transition-all duration-300 ${
            alertMessage.type === 'danger'
              ? 'border-red-500/20 bg-red-500/10 text-red-400'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {alertMessage.text}
        </div>
      )}

      {/* Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">Attendance & Leaves</h1>
          <p className="text-xs text-gray-500 mt-1">Manage workforce daily presence logs and leave request cycles</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition duration-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Logs
          </button>
          {activeTab === 'attendance' && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white px-4 py-2.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export Report
            </button>
          )}
          {activeTab === 'leaves' && (
            <button
              onClick={() => {
                setLeaveError('');
                setIsLeaveModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-accentPurple/25 hover:brightness-110 active:scale-98"
            >
              <Plus className="h-3.5 w-3.5" />
              Request Leave
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'attendance'
              ? 'border-accentPurple text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Workforce Attendance
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'leaves'
              ? 'border-accentPurple text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Leave Applications
        </button>
      </div>

      {activeTab === 'attendance' ? (
        <div className="space-y-6">
          {/* Stats Cards */}
          {attStats && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <div className="glass-card rounded-2xl p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Workforce</span>
                <p className="mt-2 text-2xl font-black text-white">{attStats.totalEmployees}</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-emerald-500/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Present Today</span>
                <p className="mt-2 text-2xl font-black text-emerald-400">{attStats.todayPresent}</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-red-500/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Absent Today</span>
                <p className="mt-2 text-2xl font-black text-red-400">{attStats.todayAbsent}</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-amber-500/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Late Arrivals</span>
                <p className="mt-2 text-2xl font-black text-amber-400">{attStats.todayLate}</p>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accentCyan">Presence Yield</span>
                <p className="mt-2 text-2xl font-black text-accentCyan">{attStats.attendancePercentage}%</p>
              </div>
            </div>
          )}

          {/* Filtering */}
          <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="glass-input rounded-xl py-2 px-3 text-xs w-full sm:w-auto"
              />
              <select
                value={attDept}
                onChange={(e) => setAttDept(e.target.value)}
                className="glass-input rounded-xl py-2 px-3 text-xs w-full sm:w-auto bg-slate-900"
              >
                <option value="">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Design">Design</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            <div className="relative w-full md:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search staff name..."
                value={attSearch}
                onChange={(e) => setAttSearch(e.target.value)}
                className="glass-input w-full rounded-xl py-2 pl-9 pr-4 text-xs"
              />
            </div>
          </div>

          {/* Records Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Employee</th>
                    <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Date</th>
                    <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Check In / Out</th>
                    <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Hours</th>
                    <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Remarks</th>
                    {isAdmin && <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {isAttLoading ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-accentPurple mx-auto"></div>
                      </td>
                    </tr>
                  ) : attendanceRecords.length > 0 ? (
                    attendanceRecords.map((rec: any) => {
                      const isEditing = editingAttId === rec.id;
                      return (
                        <tr key={rec.id} className="glass-table-row text-xs">
                          <td className="p-4">
                            <p className="font-bold text-white text-sm">{rec.employeeName}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{rec.designation} ({rec.department})</p>
                          </td>
                          <td className="p-4 font-medium text-gray-400">
                            {new Date(rec.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="p-4">
                            {isEditing ? (
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="glass-input rounded-lg p-1.5 bg-slate-900"
                              >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Late">Late</option>
                                <option value="Half Day">Half Day</option>
                                <option value="Work From Home">Work From Home</option>
                                <option value="Holiday">Holiday</option>
                              </select>
                            ) : (
                              <span className={`rounded-full px-2.5 py-0.5 font-bold border ${
                                {
                                  Present: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                  Absent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                                  Late: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                  'Half Day': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                                  'Work From Home': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                  Holiday: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                }[rec.status as string] || 'bg-white/5'
                              }`}>
                                {rec.status}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="09:00 AM"
                                  value={editCheckIn}
                                  onChange={(e) => setEditCheckIn(e.target.value)}
                                  className="glass-input rounded-lg p-1.5 w-20 text-center"
                                />
                                <span className="text-gray-600">-</span>
                                <input
                                  type="text"
                                  placeholder="05:00 PM"
                                  value={editCheckOut}
                                  onChange={(e) => setEditCheckOut(e.target.value)}
                                  className="glass-input rounded-lg p-1.5 w-20 text-center"
                                />
                              </div>
                            ) : (
                              <span className="font-semibold text-gray-300">
                                {rec.checkIn && rec.checkOut ? `${rec.checkIn} - ${rec.checkOut}` : '—'}
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-semibold text-gray-300">
                            {rec.workingHours ? `${rec.workingHours} hrs` : '0 hrs'}
                          </td>
                          <td className="p-4 text-gray-400">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editRemarks}
                                onChange={(e) => setEditRemarks(e.target.value)}
                                className="glass-input rounded-lg p-1.5 w-full min-w-[120px]"
                                placeholder="Add remarks..."
                              />
                            ) : (
                              rec.remarks || '—'
                            )}
                          </td>
                          {isAdmin && (
                            <td className="p-4 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => saveEditAttendance(rec.id)}
                                    className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 p-2 text-emerald-400"
                                    title="Save changes"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditAttendance}
                                    className="rounded-lg bg-white/5 hover:bg-white/10 p-2 text-gray-400"
                                    title="Cancel"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditAttendance(rec)}
                                  className="rounded-lg bg-white/5 hover:bg-white/10 p-2 text-gray-400 hover:text-white"
                                >
                                  Edit inline
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="p-12 text-center text-xs text-gray-500">
                        No presence logs recorded for this date query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {attTotalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <button
                  disabled={attPage === 1}
                  onClick={() => setAttPage(p => Math.max(p - 1, 1))}
                  className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-xs text-gray-500 font-semibold">
                  Page {attPage} of {attTotalPages}
                </span>
                <button
                  disabled={attPage === attTotalPages}
                  onClick={() => setAttPage(p => Math.min(p + 1, attTotalPages))}
                  className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white transition"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Leaves tab stats & charts */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Stats */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-around min-h-[220px]">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5 text-accentPurple" />
                <h4 className="text-sm font-bold text-white">Leave Requests</h4>
              </div>
              {lvStats && (
                <div className="grid grid-cols-3 gap-4 text-center mt-4">
                  <div className="bg-[#0b0c16]/50 border border-white/5 p-3 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-gray-500">Pending</p>
                    <p className="text-lg font-black text-accentPurple mt-1">{lvStats.pendingLeaves}</p>
                  </div>
                  <div className="bg-[#0b0c16]/50 border border-white/5 p-3 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-gray-500">Approved</p>
                    <p className="text-lg font-black text-emerald-400 mt-1">{lvStats.approvedLeaves}</p>
                  </div>
                  <div className="bg-[#0b0c16]/50 border border-white/5 p-3 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-gray-500">Rejected</p>
                    <p className="text-lg font-black text-red-400 mt-1">{lvStats.rejectedLeaves}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Leaves Utilization Chart */}
            <div className="glass-card rounded-3xl p-6 md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Leave Categories Allocation (Approved Days)</h4>
              <div className="h-40 w-full flex items-center justify-between">
                {getPieChartData().length > 0 ? (
                  <div className="h-full w-1/2 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={45}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {getPieChartData().map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="w-1/2 flex items-center justify-center text-xs text-gray-500">No approved leaves.</div>
                )}
                
                <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 w-1/2 text-xs">
                  {getPieChartData().map((entry: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-gray-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                      <span>{entry.name}</span>
                      <span className="font-semibold text-white">({entry.value}d)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filtering */}
          <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              <select
                value={leaveStatusFilter}
                onChange={(e) => setLeaveStatusFilter(e.target.value)}
                className="glass-input rounded-xl py-2 px-3 text-xs w-full sm:w-auto bg-slate-900"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="relative w-full md:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search leaves by staff or reason..."
                value={leaveSearch}
                onChange={(e) => setLeaveSearch(e.target.value)}
                className="glass-input w-full rounded-xl py-2 pl-9 pr-4 text-xs"
              />
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Employee</th>
                    <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Type / Period</th>
                    <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Reason</th>
                    <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Status</th>
                    {isAdmin && <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {isLeavesLoading ? (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="p-12 text-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-accentPurple mx-auto"></div>
                      </td>
                    </tr>
                  ) : leaves.length > 0 ? (
                    leaves.map((lv: any) => (
                      <tr key={lv.id} className="glass-table-row text-xs">
                        <td className="p-4">
                          <p className="font-bold text-white text-sm">{lv.employeeName}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{lv.department}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-white">{lv.leaveType} ({lv.totalDays} days)</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {new Date(lv.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - 
                            {new Date(lv.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="p-4 max-w-xs truncate text-gray-400" title={lv.reason}>
                          {lv.reason}
                          {lv.rejectionReason && (
                            <p className="text-[10px] text-red-400 mt-1">Rejection reason: {lv.rejectionReason}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`rounded-full px-2.5 py-0.5 font-bold border ${
                            {
                              Pending: 'bg-accentPurple/10 text-accentPurple border-accentPurple/20',
                              Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                              Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }[lv.status as string] || 'bg-white/5'
                          }`}>
                            {lv.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="p-4 text-right">
                            {lv.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveLeave(lv.id)}
                                  className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-emerald-400 font-bold"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectLeave(lv.id)}
                                  className="rounded-lg bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-rose-400 font-bold"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-600 font-semibold uppercase">Closed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="p-12 text-center text-xs text-gray-500">
                        No leave request records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {leaveTotalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <button
                  disabled={leavePage === 1}
                  onClick={() => setLeavePage(p => Math.max(p - 1, 1))}
                  className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-xs text-gray-500 font-semibold">
                  Page {leavePage} of {leaveTotalPages}
                </span>
                <button
                  disabled={leavePage === leaveTotalPages}
                  onClick={() => setLeavePage(p => Math.min(p + 1, leaveTotalPages))}
                  className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white transition"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.01] px-6 py-4">
              <h4 className="text-base font-bold text-white">Request Leave Application</h4>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              {leaveError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
                  {leaveError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Select Employee
                </label>
                <select
                  required
                  value={leaveEmployeeId}
                  onChange={(e) => setLeaveEmployeeId(e.target.value)}
                  className="glass-input w-full rounded-xl py-2.5 px-4 text-xs bg-slate-900"
                >
                  <option value="" disabled>Select Employee profile</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Leave Type
                </label>
                <select
                  required
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="glass-input w-full rounded-xl py-2.5 px-4 text-xs bg-slate-900"
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Paid">Paid Vacation</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 px-4 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 px-4 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Reason for leave
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain reason..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="glass-input w-full rounded-xl py-2.5 px-4 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="rounded-xl border border-white/15 px-5 py-2 text-xs font-semibold text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyLeaveMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan px-6 py-2 text-xs font-semibold text-white hover:brightness-110 active:scale-98 disabled:opacity-50"
                >
                  {applyLeaveMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
