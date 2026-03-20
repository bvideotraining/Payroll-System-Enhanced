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
  const { cashAdvances, addCashAdvance, updateCashAdvanceStatus, deleteCashAdvance, payrolls } = usePayroll();
  const { monthRanges } = useOrganization();
  
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAdvance, setNewAdvance] = useState<Omit<CashAdvance, 'id'>>({
    employeeId: '',
    amount: 0,
    requestDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    reason: '',
    repaymentMonth: '',
    installments: 1
  });

  const getRemainingAmount = (adv: CashAdvance) => {
    if (adv.status !== 'Approved') return adv.amount;
    
    const sortedRanges = [...monthRanges].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const startRangeIndex = sortedRanges.findIndex(r => r.id === adv.repaymentMonth);
    
    if (startRangeIndex === -1) return adv.amount;

    const installments = adv.installments || 1;
    const monthlyAmount = Math.floor((adv.amount / installments) * 100) / 100;
    
    let paidAmount = 0;
    let payrollsCount = 0;
    
    for (let i = startRangeIndex; i < sortedRanges.length; i++) {
      const rangeId = sortedRanges[i].id;
      const hasPayroll = payrolls.some(p => p.employeeId === adv.employeeId && p.monthRangeId === rangeId);
      
      if (hasPayroll) {
        payrollsCount++;
        const isLast = payrollsCount === installments;
        const amountForThisMonth = isLast ? (adv.amount - (monthlyAmount * (installments - 1))) : monthlyAmount;
        paidAmount += amountForThisMonth;
        
        if (payrollsCount >= installments) {
          break;
        }
      }
    }
    
    return Math.max(0, adv.amount - paidAmount);
  };

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
        repaymentMonth: '',
        installments: 1
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

  const filteredAdvances = cashAdvances.filter(adv => {
    const emp = employees.find(e => e.id === adv.employeeId);
    const range = monthRanges.find(r => r.id === adv.repaymentMonth);
    const search = searchTerm.toLowerCase();
    
    return (
      emp?.fullName.toLowerCase().includes(search) ||
      emp?.employeeCode.toLowerCase().includes(search) ||
      range?.month.toLowerCase().includes(search) ||
      adv.status.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-3 text-[11px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-slate-900">Cash in Advance Requests</h3>
          <Input
            placeholder="Search by employee or month..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-7 w-64 text-[10px] bg-white"
          />
        </div>
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
              <Label htmlFor="repaymentMonth" className="text-[10px]">Repayment Start Month</Label>
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
              <Label htmlFor="installments" className="text-[10px]">Installments (Months)</Label>
              <Input 
                id="installments"
                type="number"
                min="1"
                value={newAdvance.installments || 1}
                onChange={(e) => setNewAdvance({ ...newAdvance, installments: Math.max(1, Number(e.target.value)) })}
                className="mt-1 bg-white h-7 text-[10px]"
              />
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
            {newAdvance.amount > 0 && newAdvance.installments && newAdvance.installments > 0 && (
              <div className="md:col-span-2 bg-blue-50 p-2 rounded border border-blue-100 flex justify-between items-center text-blue-800">
                <span><strong>Monthly Installment:</strong> EGP {(newAdvance.amount / newAdvance.installments).toFixed(2)}</span>
                <span><strong>Total Amount:</strong> EGP {newAdvance.amount.toFixed(2)}</span>
              </div>
            )}
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
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Remaining</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Installments</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Monthly Inst.</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Repayment Start</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredAdvances.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-[10px] text-slate-400 italic">
                  No cash advance records found
                </td>
              </tr>
            ) : (
              filteredAdvances.map((adv) => {
                const emp = employees.find(e => e.id === adv.employeeId);
                const range = monthRanges.find(r => r.id === adv.repaymentMonth);
                return (
                  <tr key={adv.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                      <div className="text-[9px] text-slate-500">{emp?.employeeCode}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-slate-900">
                      EGP {adv.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-blue-600">
                      EGP {getRemainingAmount(adv).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-slate-500">
                      {adv.installments || 1}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-slate-500">
                      EGP {(adv.amount / (adv.installments || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
