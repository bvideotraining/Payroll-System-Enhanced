'use client';

import { useState } from 'react';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { usePayroll } from '@/src/frontend/hooks/use-payroll';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { 
  Search, 
  Download, 
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PayrollReportTab() {
  const { employees } = useEmployees();
  const { payrolls } = usePayroll();
  const { monthRanges } = useOrganization();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonthId, setSelectedMonthId] = useState('All');

  const filteredPayrolls = payrolls.filter(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    const matchesSearch = emp?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         emp?.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = selectedMonthId === 'All' || p.monthRangeId === selectedMonthId;
    return matchesSearch && matchesMonth;
  });

  const getReportData = () => {
    return filteredPayrolls.map(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      const increaseAmount = p.increaseAmount || 0;
      const grossSalary = p.grossSalary || (p.basicSalary + increaseAmount);
      const totalSalary = p.totalSalary || (grossSalary + p.totalAllowances);
      return {
        'Employee Code': emp?.employeeCode || 'Unknown',
        'Employee Name': emp?.fullName || 'Unknown',
        'Job Title': emp?.jobTitle || 'Unknown',
        'Basic Salary': p.basicSalary,
        'Increase Amount': increaseAmount,
        'Gross Salary': grossSalary,
        'Total Salary': totalSalary,
        'Total Allowances': p.totalAllowances,
        'Daily Wage': p.dailyWage || 0,
        'Late minutes value': p.latePenaltyAmount || 0,
        'Social Insurance employee share': p.socialInsuranceAmount || 0,
        'Medical Insurance Amount': p.medicalInsuranceAmount || 0,
        'Absence Value': p.absencePenaltyAmount || 0,
        'Cash In Advance Installment Value': p.cashAdvanceDeduction || 0,
        'Net Salary': p.netSalary
      };
    });
  };

  const handleExportExcel = () => {
    const data = getReportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Report');
    XLSX.writeFile(wb, `Payroll_Report.xlsx`);
  };

  const handleExportPDF = () => {
    const data = getReportData();
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text('Payroll Report', 14, 20);
    
    const monthName = selectedMonthId === 'All' ? 'All Months' : monthRanges.find(m => m.id === selectedMonthId)?.month || 'Unknown';
    doc.setFontSize(10);
    doc.text(`Month: ${monthName}`, 14, 30);

    const tableData = data.map(row => [
      row['Employee Code'],
      row['Employee Name'],
      row['Job Title'],
      `EGP ${row['Basic Salary'].toLocaleString()}`,
      `EGP ${row['Increase Amount'].toLocaleString()}`,
      `EGP ${row['Gross Salary'].toLocaleString()}`,
      `EGP ${row['Total Salary'].toLocaleString()}`,
      `EGP ${row['Total Allowances'].toLocaleString()}`,
      `EGP ${row['Daily Wage'].toLocaleString()}`,
      `EGP ${row['Late minutes value'].toLocaleString()}`,
      `EGP ${row['Social Insurance employee share'].toLocaleString()}`,
      `EGP ${row['Medical Insurance Amount'].toLocaleString()}`,
      `EGP ${row['Absence Value'].toLocaleString()}`,
      `EGP ${row['Cash In Advance Installment Value'].toLocaleString()}`,
      `EGP ${row['Net Salary'].toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [[
        'Code', 'Name', 'Job Title', 'Basic', 'Increase', 'Gross', 'Total', 'Allowances', 'Daily Wage', 
        'Late Val', 'Social Ins', 'Medical Ins', 'Absence Val', 'Cash Adv', 'Net Salary'
      ]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      styles: { cellPadding: 1, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 20 },
        2: { cellWidth: 15 },
      }
    });

    doc.save(`Payroll_Report.pdf`);
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
        <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 h-7 text-[10px] px-2">
          <FileText className="h-3 w-3" />
          Export Excel
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5 h-7 text-[10px] px-2">
          <Download className="h-3 w-3" />
          Export PDF
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Emp Code</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Emp Name</th>
              <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Job Title</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Basic Salary</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Increase Amount</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Gross Salary</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Total Salary</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Total Allowances</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Daily Wage</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Late Val</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Social Ins</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Medical Ins</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Absence Val</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Cash Adv</th>
              <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Net Salary</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredPayrolls.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-[10px] text-slate-400 italic">
                  No payroll records found
                </td>
              </tr>
            ) : (
              filteredPayrolls.map((p) => {
                const emp = employees.find(e => e.id === p.employeeId);
                const increaseAmount = p.increaseAmount || 0;
                const grossSalary = p.grossSalary || (p.basicSalary + increaseAmount);
                const totalSalary = p.totalSalary || (grossSalary + p.totalAllowances);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-slate-500">{emp?.employeeCode}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium text-slate-900">{emp?.fullName || 'Unknown'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-[10px] text-slate-500">{emp?.jobTitle}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {p.basicSalary.toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {increaseAmount.toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {grossSalary.toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {totalSalary.toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {p.totalAllowances.toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {(p.dailyWage || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {(p.latePenaltyAmount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {(p.socialInsuranceAmount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {(p.medicalInsuranceAmount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {(p.absencePenaltyAmount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] text-slate-900">EGP {(p.cashAdvanceDeduction || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] font-bold text-slate-900">EGP {p.netSalary.toLocaleString()}</td>
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
