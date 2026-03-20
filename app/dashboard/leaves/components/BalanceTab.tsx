'use client';

import { useState, useMemo } from 'react';
import { useLeaves } from '@/src/frontend/hooks/use-leaves';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';
import { AlertCircle, Download, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/src/frontend/components/ui/button';
import { LeaveBalanceModal } from './LeaveBalanceModal';
import { LeaveBalance } from '@/src/frontend/types/leave';
import * as XLSX from 'xlsx';

export function BalanceTab() {
  const { balances } = useLeaves();
  const { employees } = useEmployees();
  const { user, role } = useAuthStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState<LeaveBalance | undefined>(undefined);

  const isAdminOrApprover = role === 'admin' || role === 'approver' || role === 'System Administrator';

  const displayBalances = useMemo(() => {
    if (isAdminOrApprover) {
      return balances;
    } else {
      const currentEmployee = employees.find(e => e.email === user?.email);
      if (currentEmployee) {
        return balances.filter(b => b.employeeId === currentEmployee.id);
      }
      return [];
    }
  }, [balances, employees, user, isAdminOrApprover]);

  const handleAdd = () => {
    setEditingBalance(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (balance: LeaveBalance) => {
    setEditingBalance(balance);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const data = displayBalances.map(balance => {
      const emp = employees.find(e => e.id === balance.employeeId);
      return {
        'Employee Name': emp?.fullName || 'Unknown',
        'Employee Code': emp?.employeeCode || 'N/A',
        'Annual (Rem/Limit)': `${balance.annual} / 15`,
        'Sick (Rem/Limit)': `${balance.sick} / 5`,
        'Casual (Rem/Limit)': `${balance.casual} / 6`,
        'Unpaid (Used)': `${balance.unpaid} Days`
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leave Balances");
    XLSX.writeFile(wb, `Leave_Balances.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Employee Leave Balances</h2>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm" className="flex items-center gap-1 h-8 text-xs">
            <Download className="h-3 w-3" />
            Export
          </Button>
          {isAdminOrApprover && (
            <Button onClick={handleAdd} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 h-8 text-xs">
              <Plus className="h-3 w-3" />
              Add Balance
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Annual (Rem/Limit)</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Sick (Rem/Limit)</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Casual (Rem/Limit)</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Unpaid (Used)</th>
                {isAdminOrApprover && (
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {displayBalances.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrApprover ? 6 : 5} className="px-4 py-8 text-center text-sm text-slate-500">
                    No leave balances found.
                  </td>
                </tr>
              ) : (
                displayBalances.map((balance) => {
                  const emp = employees.find(e => e.id === balance.employeeId);
                  return (
                    <tr key={balance.employeeId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{emp?.employeeCode || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        <span className="text-blue-600 font-medium">{balance.annual}</span> <span className="text-slate-400">/ 15</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        <span className="text-red-500 font-medium">{balance.sick}</span> <span className="text-slate-400">/ 5</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        <span className="text-amber-500 font-medium">{balance.casual}</span> <span className="text-slate-400">/ 6</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-slate-700">
                        {balance.unpaid} Days
                      </td>
                      {isAdminOrApprover && (
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEdit(balance)} className="text-blue-600 hover:text-blue-800 transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
        <p className="text-xs text-blue-800">
          <strong>Policy Note:</strong> Unused leaves do not carry over to the next year. Sick leaves require a medical attachment for approval. Casual leaves are limited to 6 days per year.
        </p>
      </div>

      {isAdminOrApprover && (
        <LeaveBalanceModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          employees={employees}
          record={editingBalance}
        />
      )}
    </div>
  );
}
