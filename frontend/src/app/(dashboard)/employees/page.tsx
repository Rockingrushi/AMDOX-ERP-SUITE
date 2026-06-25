'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../utils/api';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  AlertCircle,
  X
} from 'lucide-react';

const Employees = () => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch employees list
  const { data: employeesData, isLoading, error } = useQuery({
    queryKey: ['employees', search],
    queryFn: async () => {
      const res = await api.get(`/employees?search=${search}`);
      return res.data.data;
    },
  });

  const employees = employeesData || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newEmp: any) => api.post('/employees', newEmp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Error occurred while saving Employee record.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Error occurred while saving Employee record.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete employee.');
    }
  });

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setName('');
    setEmail('');
    setPhone('');
    setDepartment('');
    setDesignation('');
    setSalary('');
    setJoiningDate('');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (emp: any) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setDepartment(emp.department);
    setDesignation(emp.designation);
    setSalary(emp.salary);
    const formattedDate = emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '';
    setJoiningDate(formattedDate);
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = (id: string, empName: string) => {
    if (window.confirm(`Are you sure you want to remove employee "${empName}" from the database?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name || !email || !phone || !department || !designation || !salary || !joiningDate) {
      setFormError('All fields are required.');
      return;
    }

    const payload = {
      name,
      email,
      phone,
      department,
      designation,
      salary: Number(salary),
      joiningDate: new Date(joiningDate)
    };

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="relative space-y-8 px-6 py-8 lg:px-8">
      {/* Decorative Glow Orbs */}
      <div className="bg-glow-purple top-20 left-10"></div>
      <div className="bg-glow-cyan bottom-20 right-10"></div>

      {/* Header toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10 relative">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white font-sans">Workforce Registry</h3>
          <p className="text-sm text-gray-400 mt-1">Manage staff logs, salary sheets, and contact details.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex self-start items-center gap-2 rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan px-4 py-3 text-sm font-semibold text-white shadow-md shadow-accentPurple/20 hover:brightness-110 active:scale-98 transition duration-200"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Add Employee
        </button>
      </div>

      {/* Filtering Search Box */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center z-10 relative">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, department or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-xs"
          />
        </div>
        <div className="text-xs font-semibold text-gray-500">
          Showing {employees.length} active employee{employees.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400 flex items-center gap-2 z-10 relative">
          <AlertCircle className="h-4.5 w-4.5" />
          Could not connect to the employee database server.
        </div>
      )}

      {/* Data Table */}
      <div className="glass-card rounded-2xl shadow-xl overflow-hidden z-10 relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Employee Details</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Department / Role</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Salary (Monthly)</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Joining Date</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-accentPurple mx-auto mb-2"></div>
                    <span className="text-xs text-gray-400 font-semibold">Updating workforce lists...</span>
                  </td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map((emp: any) => (
                  <tr key={emp.id} className="glass-table-row">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-accentPurple/10 to-accentCyan/10 border border-white/10 text-white font-bold text-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{emp.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-white">{emp.designation}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{emp.department}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-accentCyan">${emp.salary.toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-gray-400 font-medium">
                        {new Date(emp.joiningDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/employees/${emp.id}`)}
                          title="View Ledger Page"
                          className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          title="Edit Profile"
                          className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-accentCyan transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
                          title="Delete Employee"
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-xs text-gray-500 font-medium">
                    No matching employee logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.01] px-6 py-4">
              <h4 className="text-base font-bold text-white">
                {editingEmployee ? 'Edit Employee Log' : 'Create Employee Profile'}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
              {formError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-semibold text-red-400">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 px-4.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="priya@amdox.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 px-4.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 px-4.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Department
                  </label>
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 px-4 text-xs appearance-none"
                  >
                    <option value="" disabled className="bg-slate-900 text-gray-400">Select Department</option>
                    <option value="Engineering" className="bg-slate-900 text-white">Engineering</option>
                    <option value="Sales" className="bg-slate-900 text-white">Sales</option>
                    <option value="Marketing" className="bg-slate-900 text-white">Marketing</option>
                    <option value="Human Resources" className="bg-slate-900 text-white">Human Resources</option>
                    <option value="Design" className="bg-slate-900 text-white">Design</option>
                    <option value="Finance" className="bg-slate-900 text-white">Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Designation
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Lead Analyst"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 px-4.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Salary (Monthly)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="85000"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="glass-input w-full rounded-xl py-2.5 pl-7 pr-4.5 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 px-4 text-xs"
                  />
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan px-6 py-2.5 text-xs font-semibold text-white hover:brightness-110 active:scale-98 shadow-md shadow-accentPurple/25 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingEmployee ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
