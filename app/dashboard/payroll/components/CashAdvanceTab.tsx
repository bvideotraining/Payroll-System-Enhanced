'use client';

import { useState } from 'react';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { usePayroll } from '@/src/frontend/hooks/use-payroll';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { Plus, Trash2, CheckCircle, XCircle, Clock, Wallet } from 'lucide-react';
import { CashAdvance } from '@/src/frontend/types/payroll';

export function CashAdvanceTab() {
  const { employees } = useEmployees();
  const { cashAdvances, addCashAdvance, updateCashAdvanceStatus, deleteCashAdvance } = usePayroll();
  const { monthRanges } = useOrganization();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newAdvance, setNewAdvance] = useState<Omit<CashAdvance, 'id'>>({
    employeeId: '',
    amount: 0,
    requestDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    reason: '',
    repaymentMonth: ''
  });

  const handleAdd = async () => {
    if (!newAdvance.employeeId || !newAdvance.amount || !newAdvance.repaymentMonth) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      await addCashAdvance(newAdvance);
      setIsAdding(false);
      setNewAdvance({
        employeeId: '',
        amount: 0,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        reason: '',
        repaymentMonth: ''
      });
    } catch (error) {
      console.error('Error adding cash advance:', error);
      alert('Failed to add cash advance');
    }
  };

  const getStatusColor = (status: CashAdvance['status']) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'Paid': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="space-y-3 text-[11px]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-900">Cash in Advance Requests</h3>
        <Button onClick={() => setIsAdding(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-7 text-[10px]">
          <Plus className="h-3 w-3" />
          New Request
        </Button>
      </div>

      {isAdding && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="employee" className="text-[10px]">Employee</Label>
              <select
                id="employee"
                className="w-full mt-1 h-7 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newAdvance.employeeId}
                onChange={(e) => setNewAdvance({ ...newAdvance, employeeId: e.target.value })}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="amount" className="text-[10px]">Amount</Label>
              <Input 
                id="amount"
                type="number"
                value={newAdvance.amount}
                onChange={(e) => setNewAdvance({ ...newAdvance, amount: Number(e.target.value) })}
                className="mt-1 bg-white h-7 text-[10px]"
              />
            </div>
            <div>
              <Label htmlFor="repaymentMonth" className="text-[10px]">Repayment Month</Label>
              <select
                id="repaymentMonth"
                className="w-full mt-1 h-7 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newAdvance.repaymentMonth}
                onChange={(e) => setNewAdvance({ ...newAdvance, repaymentMonth: e.target.value })}
              >
                <option value="">Select Month Range</option>
                {monthRanges.map(range => (
                  <option key={range.id} value={range.id}>{range.month}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="reason" className="text-[10px]">Reason (Optional)</Label>
              <Input 
                id="reason"
                value={newAdvance.reason}
                onChange={(e) => setNewAdvance({ ...newAdvance, reason: e.target.value })}
                className="mt-1 bg-white h-7 text-[10px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button size="sm" className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAdd}>Submit Request</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Repayment</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {cashAdvances.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[10px] text-slate-400 italic">
                  No cash advance records found
                </td>
              </tr>
            ) : (
              cashAdvances.map((adv) => {
                const emp = employees.find(e => e.id === adv.employeeId);
                const range = monthRanges.find(r => r.id === adv.repaymentMonth);
                return (
                  <tr key={adv.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                      <div className="text-[9px] text-slate-500">{emp?.employeeCode}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-slate-900">
                      ${adv.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-slate-500">
                      {range?.month || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${getStatusColor(adv.status)}`}>
                        {adv.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] font-medium">
                      <div className="flex items-center justify-end gap-1">
                        {adv.status === 'Pending' && (
                          <>
                            <button onClick={() => updateCashAdvanceStatus(adv.id, 'Approved')} className="text-green-600 hover:text-green-900 p-0.5">
                              <CheckCircle className="h-3 w-3" />
                            </button>
                            <button onClick={() => updateCashAdvanceStatus(adv.id, 'Rejected')} className="text-red-600 hover:text-red-900 p-0.5">
                              <XCircle className="h-3 w-3" />
                            </button>
                          </>
                        )}
                        <button onClick={() => deleteCashAdvance(adv.id)} className="text-slate-400 hover:text-red-600 p-0.5">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
