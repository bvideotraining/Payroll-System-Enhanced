import { Payroll } from '@/src/frontend/types/payroll';
import { Employee } from '@/src/frontend/types/employee';
import { MonthRange } from '@/src/frontend/types/organization';
import { Button } from '@/src/frontend/components/ui/button';
import { X, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayrollDetailsModalProps {
  payroll: Payroll | null;
  employee: Employee | undefined;
  monthRange: MonthRange | undefined;
  onClose: () => void;
}

export function PayrollDetailsModal({ payroll, employee, monthRange, onClose }: PayrollDetailsModalProps) {
  if (!payroll || !employee || !monthRange) return null;

  const handleExportExcel = () => {
    const increaseAmount = payroll.increaseAmount || 0;
    const grossSalary = payroll.grossSalary || (payroll.basicSalary + increaseAmount);
    const totalSalary = payroll.totalSalary || (grossSalary + payroll.totalAllowances);

    const data = [
      { Category: 'Employee Name', Value: employee.fullName },
      { Category: 'Employee Code', Value: employee.employeeCode },
      { Category: 'Month', Value: monthRange.month },
      { Category: 'Basic Salary', Value: payroll.basicSalary },
      { Category: 'Increase Amount', Value: increaseAmount },
      { Category: 'Gross Salary', Value: grossSalary },
      { Category: 'Total Allowances', Value: payroll.totalAllowances },
      { Category: 'Bonus', Value: payroll.bonus },
      { Category: 'Total Salary', Value: totalSalary },
      { Category: 'Fixed Deductions', Value: payroll.totalDeductions },
      { Category: 'Social Insurance', Value: payroll.socialInsuranceAmount || 0 },
      { Category: 'Attendance Penalties', Value: payroll.attendancePenalties },
      { Category: 'Cash Advance Deduction', Value: payroll.cashAdvanceDeduction },
      { Category: 'Unpaid Leave Deduction', Value: payroll.unpaidLeaveDeduction || 0 },
      { Category: 'Net Salary', Value: payroll.netSalary },
      { Category: 'Status', Value: payroll.status },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Details');
    XLSX.writeFile(wb, `Payroll_${employee.employeeCode}_${monthRange.month}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Payroll Details', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Employee: ${employee.fullName} (${employee.employeeCode})`, 14, 30);
    doc.text(`Month: ${monthRange.month}`, 14, 35);
    doc.text(`Status: ${payroll.status}`, 14, 40);

    const increaseAmount = payroll.increaseAmount || 0;
    const grossSalary = payroll.grossSalary || (payroll.basicSalary + increaseAmount);
    const totalSalary = payroll.totalSalary || (grossSalary + payroll.totalAllowances);

    const tableData = [
      ['Basic Salary', `EGP ${payroll.basicSalary.toLocaleString()}`],
      ['Increase Amount', `EGP ${increaseAmount.toLocaleString()}`],
      ['Gross Salary', `EGP ${grossSalary.toLocaleString()}`],
      ['Total Allowances', `EGP ${payroll.totalAllowances.toLocaleString()}`],
      ['Bonus', `EGP ${payroll.bonus.toLocaleString()}`],
      ['Total Salary', `EGP ${totalSalary.toLocaleString()}`],
      ['Fixed Deductions', `EGP ${payroll.totalDeductions.toLocaleString()}`],
      ['Social Insurance', `EGP ${(payroll.socialInsuranceAmount || 0).toLocaleString()}`],
      ['Attendance Penalties', `EGP ${payroll.attendancePenalties.toLocaleString()}`],
      ['Cash Advance Deduction', `EGP ${payroll.cashAdvanceDeduction.toLocaleString()}`],
      ['Unpaid Leave Deduction', `EGP ${(payroll.unpaidLeaveDeduction || 0).toLocaleString()}`],
      ['Net Salary', `EGP ${payroll.netSalary.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Category', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
    });

    doc.save(`Payroll_${employee.employeeCode}_${monthRange.month}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payroll Details</h2>
            <p className="text-sm text-slate-500">{employee.fullName} - {monthRange.month}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Earnings</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-medium text-slate-900">EGP {payroll.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Increase Amount</span>
                  <span className="font-medium text-slate-900">EGP {(payroll.increaseAmount || 0).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-semibold">
                  <span className="text-slate-900">Gross Salary</span>
                  <span className="text-blue-600">EGP {(payroll.grossSalary || (payroll.basicSalary + (payroll.increaseAmount || 0))).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-slate-600">Total Allowances</span>
                  <span className="font-medium text-slate-900">EGP {payroll.totalAllowances.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Bonus</span>
                  <span className="font-medium text-slate-900">EGP {payroll.bonus.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-semibold">
                  <span className="text-slate-900">Total Salary</span>
                  <span className="text-blue-600">EGP {(payroll.totalSalary || ((payroll.grossSalary || (payroll.basicSalary + (payroll.increaseAmount || 0))) + payroll.totalAllowances)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Deductions</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Fixed Deductions</span>
                  <span className="font-medium text-slate-900">EGP {payroll.totalDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Social Insurance</span>
                  <span className="font-medium text-slate-900">EGP {(payroll.socialInsuranceAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Attendance Penalties</span>
                  <span className="font-medium text-slate-900">EGP {payroll.attendancePenalties.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Cash Advance</span>
                  <span className="font-medium text-slate-900">EGP {payroll.cashAdvanceDeduction.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Unpaid Leave</span>
                  <span className="font-medium text-slate-900">EGP {(payroll.unpaidLeaveDeduction || 0).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-semibold">
                  <span className="text-slate-900">Total Deductions</span>
                  <span className="text-red-600">EGP {(payroll.totalDeductions + payroll.attendancePenalties + payroll.cashAdvanceDeduction + (payroll.unpaidLeaveDeduction || 0) + (payroll.socialInsuranceAmount || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Net Salary</h3>
              <p className="text-xs text-blue-700">Total amount to be paid</p>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              EGP {payroll.netSalary.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <FileText className="h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="default" onClick={handleExportPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
