'use client';

import { useState } from 'react';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { usePayroll } from '@/src/frontend/hooks/use-payroll';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { Payroll } from '@/src/frontend/types/payroll';
import { PayrollDetailsModal } from './PayrollDetailsModal';
import * as XLSX from 'xlsx';

export function PayrollSummaryTab() {
  const { employees } = useEmployees();
  const { payrolls, updatePayrollStatus, deletePayroll } = usePayroll();
  const { monthRanges } = useOrganization();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonthId, setSelectedMonthId] = useState('All');
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  const filteredPayrolls = payrolls.filter(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    const matchesSearch = emp?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         emp?.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = selectedMonthId === 'All' || p.monthRangeId === selectedMonthId;
    return matchesSearch && matchesMonth;
  });

  const getStatusColor = (status: Payroll['status']) => {
    switch (status) {
      case 'Published': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleExportAll = () => {
    const data = filteredPayrolls.map(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      const range = monthRanges.find(r => r.id === p.monthRangeId);
      return {
        'Employee Name': emp?.fullName || 'Unknown',
        'Employee Code': emp?.employeeCode || 'Unknown',
        'Month': range?.month || 'Unknown',
        'Basic Salary': p.basicSalary,
        'Increase Amount': p.increaseAmount || 0,
        'Gross Salary': p.grossSalary || (p.basicSalary + (p.increaseAmount || 0)),
        'Total Salary': p.totalSalary || ((p.grossSalary || (p.basicSalary + (p.increaseAmount || 0))) + p.totalAllowances),
        'Total Deductions': p.totalDeductions + p.attendancePenalties + p.cashAdvanceDeduction + (p.unpaidLeaveDeduction || 0),
        'Net Salary': p.netSalary,
        'Status': p.status
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Summary');
    XLSX.writeFile(wb, `Payroll_Summary.xlsx`);
  };

  return (
    <div className="space-y-3 text-[11px]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          <Input 
            placeholder="Search by employee name or code..." 
            className="pl-8 h-7 text-[10px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={selectedMonthId}
          onChange={(e) => setSelectedMonthId(e.target.value)}
          className="h-7 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="All">All Months</option>
          {monthRanges.map(range => (
            <option key={range.id} value={range.id}>{range.month}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={handleExportAll} className="gap-1.5 h-7 text-[10px] px-2">
          <Download className="h-3 w-3" />
          Export All
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Month</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Increase</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Gross Salary</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Total Salary</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Net Salary</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredPayrolls.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-[10px] text-slate-400 italic">
                  No payroll records found
                </td>
              </tr>
            ) : (
              filteredPayrolls.map((p) => {
                const emp = employees.find(e => e.id === p.employeeId);
                const range = monthRanges.find(r => r.id === p.monthRangeId);
                const increaseAmount = p.increaseAmount || 0;
                const grossSalary = p.grossSalary || (p.basicSalary + increaseAmount);
                const totalSalary = p.totalSalary || (grossSalary + p.totalAllowances);
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                      <div className="text-[9px] text-slate-500">{emp?.employeeCode}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-slate-500">
                      {range?.month || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-slate-900">
                      EGP {increaseAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-slate-900">
                      EGP {grossSalary.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-slate-900">
                      EGP {totalSalary.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] font-bold text-slate-900">
                      EGP {p.netSalary.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setSelectedPayroll(p)}
                          className="text-slate-400 hover:text-blue-600 p-0.5" 
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        {p.status === 'Draft' && (
                          <button 
                            onClick={() => updatePayrollStatus(p.id, 'Published')}
                            className="text-slate-400 hover:text-green-600 p-0.5" 
                            title="Publish"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </button>
                        )}
                        <button 
                          onClick={() => deletePayroll(p.id)}
                          className="text-slate-400 hover:text-red-600 p-0.5" 
                          title="Delete"
                        >
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

      {selectedPayroll && (
        <PayrollDetailsModal
          payroll={selectedPayroll}
          employee={employees.find(e => e.id === selectedPayroll.employeeId)}
          monthRange={monthRanges.find(r => r.id === selectedPayroll.monthRangeId)}
          onClose={() => setSelectedPayroll(null)}
        />
      )}
    </div>
  );
}
