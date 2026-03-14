'use client';

import { useAuthStore } from '@/src/frontend/store/use-auth-store';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { useAttendance } from '@/src/frontend/hooks/use-attendance';
import { useMonthAttendance } from '@/src/frontend/hooks/use-month-attendance';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/frontend/components/ui/card';
import { 
  UserPlus, 
  FileText, 
  Play, 
  DollarSign, 
  AlertCircle, 
  Clock, 
  Coffee, 
  CheckCircle2,
  BarChart2,
  Gift
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { employees } = useEmployees();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { records: todayAttendance } = useAttendance(today);
  const { records: monthAttendance } = useMonthAttendance(currentMonth);

  // Calculate Payroll Est.
  const activeEmployees = employees.filter(emp => emp.status === 'Active');
  const payrollEst = activeEmployees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);
  const activeCount = activeEmployees.length;

  // Calculate On Leave
  const onLeaveEmployees = employees.filter(emp => emp.status === 'On Leave');
  const onLeaveCount = onLeaveEmployees.length;

  // Calculate Late Incidents (This Month)
  const lateIncidents = monthAttendance.filter(rec => rec.status === 'Late').length;

  // Calculate Branch Data for Chart
  const branchSalaryMap: Record<string, number> = {};
  activeEmployees.forEach(emp => {
    const branchName = emp.branch || 'Unassigned';
    branchSalaryMap[branchName] = (branchSalaryMap[branchName] || 0) + (Number(emp.salary) || 0);
  });
  
  const branchData = Object.entries(branchSalaryMap).map(([name, value]) => ({
    name,
    value
  }));

  if (branchData.length === 0) {
    branchData.push({ name: 'No Data', value: 0 });
  }

  const bonusData = branchData.map(b => ({ name: b.name, value: 0 }));

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen -m-8 p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Admin Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Overview of {today.substring(0, 7)}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link 
            href="/dashboard/employees/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            New Employee
          </Link>
          <Link 
            href="/dashboard/leaves"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Leave Requests
          </Link>
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
          >
            <Play className="h-4 w-4" />
            Run Payroll
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Payroll Est.</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(payrollEst)}</p>
                <p className="mt-1 text-xs text-slate-400">Net Payable ({activeCount} Emps)</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Leaves</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">0</p>
                <p className="mt-1 text-xs text-slate-400">Requires Approval</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">On Leave</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{onLeaveCount}</p>
                <p className="mt-1 text-xs text-slate-400">This Month</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Late Incidents</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{lateIncidents}</p>
                <p className="mt-1 text-xs text-slate-400">Employees Late This Month</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-sm min-h-[300px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base font-semibold text-slate-900">On Leave (This Month)</CardTitle>
            </div>
            <Link href="/dashboard/leaves" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
            {onLeaveEmployees.length > 0 ? (
              <div className="w-full space-y-4 mt-4">
                {onLeaveEmployees.slice(0, 5).map(emp => (
                  <div key={emp.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                        {emp.photoUrl ? (
                          <img src={emp.photoUrl} alt={emp.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-slate-500">{emp.fullName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-900">{emp.fullName}</p>
                        <p className="text-xs text-slate-500">{emp.jobTitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <CheckCircle2 className="h-16 w-16 text-slate-200 mb-4" strokeWidth={1.5} />
                <p className="text-sm text-slate-400">No approved leaves this month.</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm min-h-[300px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base font-semibold text-slate-900">Top Late Employees (This Month)</CardTitle>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {currentMonth}
            </span>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
            {lateIncidents > 0 ? (
              <div className="w-full space-y-4 mt-4">
                {Object.entries(
                  monthAttendance
                    .filter(rec => rec.status === 'Late')
                    .reduce((acc, rec) => {
                      acc[rec.employeeId] = (acc[rec.employeeId] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([employeeId, count]) => {
                    const emp = employees.find(e => e.id === employeeId);
                    if (!emp) return null;
                    return (
                      <div key={employeeId} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                            {emp.photoUrl ? (
                              <img src={emp.photoUrl} alt={emp.fullName} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-medium text-slate-500">{emp.fullName.charAt(0)}</span>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-slate-900">{emp.fullName}</p>
                            <p className="text-xs text-slate-500">{count} late incident{count !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <>
                <CheckCircle2 className="h-16 w-16 text-emerald-200 mb-4" strokeWidth={1.5} />
                <p className="text-sm text-slate-400">No late records this month!</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-semibold text-slate-900">Net Salary per Branch</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={true} 
                    tickLine={true} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={true} 
                    tickLine={true} 
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base font-semibold text-slate-900">Bonus Payout</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bonusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={true} 
                    tickLine={true} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={true} 
                    tickLine={true} 
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    domain={[0, 0.004]}
                    tickFormatter={(value) => `${value}k`}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
