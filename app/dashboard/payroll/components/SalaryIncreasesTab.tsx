'use client';

import { useState } from 'react';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { usePayroll } from '@/src/frontend/hooks/use-payroll';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { Plus, Trash2, CheckCircle2, TrendingUp } from 'lucide-react';

export function SalaryIncreasesTab() {
  const { employees, loading: empLoading } = useEmployees();
  const { salaryConfigs, salaryIncreases, scheduleSalaryIncrease, applySalaryIncrease, deleteSalaryIncrease, updateSalaryIncrease, loading: payrollLoading } = usePayroll();
  const { monthRanges, loading: orgLoading } = useOrganization();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [increaseAmount, setIncreaseAmount] = useState('');
  const [selectedMonthRangeId, setSelectedMonthRangeId] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [editingIncreaseId, setEditingIncreaseId] = useState<string | null>(null);

  const handleSchedule = async () => {
    if (!selectedEmployeeId || !increaseAmount || !selectedMonthRangeId) {
      return;
    }

    setIsScheduling(true);
    try {
      if (editingIncreaseId) {
        await updateSalaryIncrease(editingIncreaseId, {
          employeeId: selectedEmployeeId,
          amount: Number(increaseAmount),
          monthRangeId: selectedMonthRangeId,
        });
        setEditingIncreaseId(null);
      } else {
        await scheduleSalaryIncrease({
          employeeId: selectedEmployeeId,
          amount: Number(increaseAmount),
          monthRangeId: selectedMonthRangeId,
          status: 'Scheduled',
          createdAt: Date.now()
        });
      }
      setSelectedEmployeeId('');
      setIncreaseAmount('');
      setSelectedMonthRangeId('');
    } catch (error) {
      console.error('Error scheduling salary increase:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleEdit = (increase: any) => {
    setEditingIncreaseId(increase.id);
    setSelectedEmployeeId(increase.employeeId);
    setIncreaseAmount(increase.amount.toString());
    setSelectedMonthRangeId(increase.monthRangeId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingIncreaseId(null);
    setSelectedEmployeeId('');
    setIncreaseAmount('');
    setSelectedMonthRangeId('');
  };

  const handleApply = async (increaseId: string, employeeId: string, increaseAmount: number, monthRangeId: string) => {
    try {
      await applySalaryIncrease(increaseId, employeeId, increaseAmount, monthRangeId);
    } catch (error) {
      console.error('Error applying salary increase:', error);
    }
  };

  const handleDelete = async (increaseId: string) => {
    try {
      await deleteSalaryIncrease(increaseId);
    } catch (error) {
      console.error('Error deleting salary increase:', error);
    }
  };

  if (empLoading || payrollLoading || orgLoading) return <div>Loading...</div>;

  // Sort increases by creation date (newest first)
  const sortedIncreases = [...salaryIncreases].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6 text-[11px]">
      {/* Schedule Form */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">Schedule Salary Increase</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="employee" className="text-[10px]">Employee</Label>
            <select
              id="employee"
              className="w-full mt-1.5 h-8 rounded-lg border border-slate-200 bg-white px-3 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Select Employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.employeeCode} - {emp.fullName}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="amount" className="text-[10px]">Increase Amount</Label>
            <Input 
              id="amount"
              type="number"
              value={increaseAmount}
              onChange={(e) => setIncreaseAmount(e.target.value)}
              placeholder="e.g. 500"
              className="mt-1.5 h-8 text-[10px]"
            />
          </div>

          <div>
            <Label htmlFor="monthRange" className="text-[10px]">Apply Month</Label>
            <select
              id="monthRange"
              className="w-full mt-1.5 h-8 rounded-lg border border-slate-200 bg-white px-3 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedMonthRangeId}
              onChange={(e) => setSelectedMonthRangeId(e.target.value)}
            >
              <option value="">Select Month...</option>
              {monthRanges.map(range => (
                <option key={range.id} value={range.id}>{range.month} ({range.startDate} to {range.endDate})</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSchedule} 
              disabled={isScheduling || !selectedEmployeeId || !increaseAmount || !selectedMonthRangeId}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium rounded-lg gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {editingIncreaseId ? 'Update Increase' : 'Schedule Increase'}
            </Button>
            {editingIncreaseId && (
              <Button 
                onClick={handleCancelEdit} 
                variant="outline"
                className="h-8 text-[11px] font-medium rounded-lg"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-xs">Salary Increase Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2 font-medium">Emp Code</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Hiring Date</th>
                <th className="px-4 py-2 font-medium">Branch</th>
                <th className="px-4 py-2 font-medium">Job Title</th>
                <th className="px-4 py-2 font-medium">Basic Salary</th>
                <th className="px-4 py-2 font-medium">Current Increase</th>
                <th className="px-4 py-2 font-medium">Gross Salary</th>
                <th className="px-4 py-2 font-medium">Last Increase</th>
                <th className="px-4 py-2 font-medium">Next Increase Date</th>
                <th className="px-4 py-2 font-medium">New Increase</th>
                <th className="px-4 py-2 font-medium">New Gross Salary</th>
                <th className="px-4 py-2 font-medium">Apply Month</th>
                <th className="px-4 py-2 font-medium">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedIncreases.map(increase => {
                const emp = employees.find(e => e.id === increase.employeeId);
                const config = salaryConfigs.find(c => c.employeeId === increase.employeeId);
                const monthRange = monthRanges.find(m => m.id === increase.monthRangeId);
                
                const currentBasic = config?.basicSalary || 0;
                const currentIncrease = config?.increaseAmount || 0;
                const currentGross = currentBasic + currentIncrease;
                const newGrossSalary = currentGross + increase.amount;
                
                // Find last applied increase for this employee
                const appliedIncreases = salaryIncreases.filter(i => i.employeeId === increase.employeeId && i.status === 'Applied');
                appliedIncreases.sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
                const lastIncreaseDate = appliedIncreases.length > 0 && appliedIncreases[0].appliedAt 
                  ? new Date(appliedIncreases[0].appliedAt).toLocaleDateString() 
                  : 'N/A';

                return (
                  <tr key={increase.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 font-medium text-slate-900">{emp?.employeeCode || '-'}</td>
                    <td className="px-4 py-2">{emp?.fullName || '-'}</td>
                    <td className="px-4 py-2">{emp?.startDate || '-'}</td>
                    <td className="px-4 py-2">{emp?.branch || '-'}</td>
                    <td className="px-4 py-2">{emp?.jobTitle || '-'}</td>
                    <td className="px-4 py-2 font-medium">{currentBasic.toLocaleString()}</td>
                    <td className="px-4 py-2 font-medium">{currentIncrease.toLocaleString()}</td>
                    <td className="px-4 py-2 font-bold text-slate-900">{currentGross.toLocaleString()}</td>
                    <td className="px-4 py-2 text-slate-500">{lastIncreaseDate}</td>
                    <td className="px-4 py-2">{monthRange?.startDate || '-'}</td>
                    <td className="px-4 py-2 font-medium text-green-600">+{increase.amount.toLocaleString()}</td>
                    <td className="px-4 py-2 font-bold text-slate-900">{newGrossSalary.toLocaleString()}</td>
                    <td className="px-4 py-2">{monthRange?.month || '-'}</td>
                    <td className="px-4 py-2">
                      {increase.status === 'Applied' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-[9px] font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Applied
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={() => handleApply(increase.id, increase.employeeId, increase.amount, increase.monthRangeId)}
                            size="sm" 
                            className="h-6 text-[9px] px-2 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Apply
                          </Button>
                          <Button 
                            onClick={() => handleEdit(increase)}
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            onClick={() => handleDelete(increase.id)}
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sortedIncreases.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-500 italic">
                    No salary increases scheduled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
