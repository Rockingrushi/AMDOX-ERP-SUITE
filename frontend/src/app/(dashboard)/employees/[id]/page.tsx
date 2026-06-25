'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../utils/api';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  DollarSign, 
  Calendar, 
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';

const EmployeeDetails = () => {
  const { id } = useParams();
  const router = useRouter();

  const { data: employeeData, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await api.get(`/employees/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const employee = employeeData;

  const calculateTenure = (joiningDateString: string) => {
    if (!joiningDateString) return '';
    const joinDate = new Date(joiningDateString);
    const now = new Date();
    
    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < joinDate.getDate())) {
      years--;
      months = 12 + months;
    }
    
    if (now.getDate() < joinDate.getDate()) {
      months--;
    }

    if (years > 0) {
      return `${years} yr${years !== 1 ? 's' : ''} ${months} mo${months !== 1 ? 's' : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-accentPurple"></div>
          <p className="text-sm font-semibold text-gray-400">Retrieving secure personnel files...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <div className="glass-panel flex flex-col items-center rounded-3xl p-8 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-2">Record Search Failure</h3>
          <p className="text-sm text-gray-400 mb-6">Requested profile could not be loaded.</p>
          <button
            onClick={() => router.push('/employees')}
            className="flex items-center gap-2 rounded-xl bg-accentPurple px-5 py-3 text-xs font-semibold text-white transition hover:bg-accentPurple/85"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to workforce
          </button>
        </div>
      </div>
    );
  }

  const annualSalary = employee.salary * 12;
  const tenureStr = calculateTenure(employee.joiningDate);

  return (
    <div className="relative space-y-8 px-6 py-8 lg:px-8">
      {/* Decorative Glow Orbs */}
      <div className="bg-glow-purple top-10 left-10"></div>
      <div className="bg-glow-cyan bottom-10 right-10"></div>

      {/* Navigation & Header */}
      <div className="flex items-center gap-4 z-10 relative">
        <button
          onClick={() => router.push('/employees')}
          className="rounded-xl border border-white/5 bg-white/5 p-3 text-gray-400 hover:bg-white/10 hover:text-white transition duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-xs font-bold text-accentPurple uppercase tracking-wider">Employee Registry</span>
          <h3 className="text-xl font-extrabold tracking-tight text-white mt-0.5">Personnel Files</h3>
        </div>
      </div>

      {/* Main Profile Grid Layout */}
      <div className="grid gap-6 md:grid-cols-3 z-10 relative">
        {/* Left Side: General Profile Badge Card */}
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center text-center justify-between min-h-[350px]">
          <div className="flex flex-col items-center w-full">
            {/* Big avatar bubble */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-accentPurple to-accentCyan text-white text-3xl font-extrabold shadow-lg shadow-accentPurple/20 border border-white/10 mb-5">
              {employee.name.charAt(0)}
            </div>
            
            <h4 className="text-lg font-extrabold text-white">{employee.name}</h4>
            <p className="text-sm text-gray-400 mt-1 font-semibold">{employee.designation}</p>
            <p className="text-xs text-accentCyan mt-0.5 font-bold uppercase tracking-wider">{employee.department}</p>
            
            <span className="mt-4 flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400">
              <UserCheck className="h-3 w-3" />
              Active Status
            </span>
          </div>

          <div className="w-full border-t border-white/5 pt-6 mt-6 flex justify-around text-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500">Designation</p>
              <p className="text-xs font-bold text-white mt-1">{employee.designation}</p>
            </div>
            <div className="w-[1px] bg-white/5"></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500">Tenure</p>
              <p className="text-xs font-bold text-accentPurple mt-1">{tenureStr || 'Recent hire'}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Data Ledger */}
        <div className="glass-card rounded-3xl p-6 md:col-span-2 space-y-6">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Personnel Data Sheets</h4>
          
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Contact details */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-white border-b border-white/5 pb-2">Contact Profile</h5>
              
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-gray-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500">Email Address</p>
                  <p className="text-xs font-semibold text-white mt-0.5">{employee.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-gray-400">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500">Phone Number</p>
                  <p className="text-xs font-semibold text-white mt-0.5">{employee.phone}</p>
                </div>
              </div>
            </div>

            {/* Employment details */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-white border-b border-white/5 pb-2">Employment Profile</h5>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-gray-400">
                  <Building className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500">Department</p>
                  <p className="text-xs font-semibold text-white mt-0.5">{employee.department} Division</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-gray-400">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500">Date of Joining</p>
                  <p className="text-xs font-semibold text-white mt-0.5">
                    {new Date(employee.joiningDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Profile Card */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-accentCyan" />
              Compensations Ledger
            </h5>
            
            <div className="grid gap-4 sm:grid-cols-3 text-left">
              <div className="bg-[#0b0c16]/50 border border-white/5 p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-gray-500">Monthly Basic Salary</p>
                <p className="text-xl font-black text-accentCyan mt-1">${employee.salary.toLocaleString()}</p>
              </div>
              <div className="bg-[#0b0c16]/50 border border-white/5 p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-gray-500">Annualized CTC Package</p>
                <p className="text-xl font-black text-accentPurple mt-1">${annualSalary.toLocaleString()}</p>
              </div>
              <div className="bg-[#0b0c16]/50 border border-white/5 p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-gray-500">Security Clearance</p>
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm mt-1.5">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  <span>Authorized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
