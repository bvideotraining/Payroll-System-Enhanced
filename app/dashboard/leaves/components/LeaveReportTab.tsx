'use client';

import { useState, useMemo } from 'react';
import { useLeaves } from '@/src/frontend/hooks/use-leaves';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { Button } from '@/src/frontend/components/ui/button';
import { Download, BarChart2, FileText, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function LeaveReportTab() {
  const { leaves, balances } = useLeaves();
  const { employees } = useEmployees();
  const { branches } = useOrganization();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [selectedEmployee, setSelectedEmployee] = useState('All Employees');
  const [selectedType, setSelectedType] = useState('All Types');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const approvedLeaves = useMemo(() => {
    return leaves.filter(l => l.status === 'Approved');
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    return approvedLeaves.filter(leave => {
      const emp = employees.find(e => e.id === leave.employeeId);
      if (!emp) return false;

      const leaveYear = new Date(leave.startDate).getFullYear().toString();
      if (selectedYear !== 'All Years' && leaveYear !== selectedYear) return false;
      if (selectedBranch !== 'All Branches' && emp.branch !== selectedBranch) return false;
      if (selectedEmployee !== 'All Employees' && emp.id !== selectedEmployee) return false;
      if (selectedType !== 'All Types' && leave.leaveType !== selectedType) return false;

      return true;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [approvedLeaves, employees, selectedYear, selectedBranch, selectedEmployee, selectedType]);

  const handleExportExcel = () => {
    const data = filteredLeaves.map(leave => {
      const emp = employees.find(e => e.id === leave.employeeId);
      const balance = balances.find(b => b.employeeId === leave.employeeId);
      
      let remBal = 'N/A';
      if (balance) {
        if (leave.leaveType === 'Annual') remBal = balance.annual.toString();
        if (leave.leaveType === 'Sick') remBal = balance.sick.toString();
        if (leave.leaveType === 'Casual') remBal = balance.casual.toString();
      }

      return {
        'Employee Details': emp?.fullName || 'Unknown',
        'Leave Type': leave.leaveType,
        'Dates': `${leave.startDate} to ${leave.endDate}`,
        'Duration': `${leave.duration} Days`,
        'Rem. Bal (Year End)': remBal
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leave Report");
    XLSX.writeFile(wb, `Leave_Activity_Report_${selectedYear}.xlsx`);
    setExportDropdownOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Employee", "Leave Type", "Dates", "Duration", "Rem. Bal"];
    const tableRows: any[] = [];

    filteredLeaves.forEach(leave => {
      const emp = employees.find(e => e.id === leave.employeeId);
      const balance = balances.find(b => b.employeeId === leave.employeeId);
      
      let remBal = 'N/A';
      if (balance) {
        if (leave.leaveType === 'Annual') remBal = balance.annual.toString();
        if (leave.leaveType === 'Sick') remBal = balance.sick.toString();
        if (leave.leaveType === 'Casual') remBal = balance.casual.toString();
      }

      const rowData = [
        emp?.fullName || 'Unknown',
        leave.leaveType,
        `${leave.startDate} to ${leave.endDate}`,
        `${leave.duration} Days`,
        remBal
      ];
      tableRows.push(rowData);
    });

    doc.text(`Leave Activity Report - ${selectedYear}`, 14, 15);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    doc.save(`Leave_Activity_Report_${selectedYear}.pdf`);
    setExportDropdownOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Leave Activity Report</h2>
          <p className="text-xs text-slate-500">Approved leaves log with running balances.</p>
        </div>
        <div className="relative">
          <Button 
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)} 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 h-8 text-xs"
          >
            <Download className="h-3 w-3" />
            Export Report
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
          {exportDropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-md shadow-lg z-10 py-1">
              <button
                onClick={handleExportExcel}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Excel (.xlsx)
              </button>
              <button
                onClick={handleExportPDF}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <FileText className="h-3 w-3" />
                PDF (.pdf)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-500 uppercase">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All Years">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-500 uppercase">Branch</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All Branches">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="text-[10px] font-semibold text-slate-500 uppercase">Employee</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All Employees">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-500 uppercase">Leave Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All Types">All Types</option>
            <option value="Annual">Annual</option>
            <option value="Casual">Casual</option>
            <option value="Sick">Sick</option>
            <option value="Maternity">Maternity</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Death">Death</option>
            <option value="Lieu">Lieu</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Details</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rem. Bal (Year End)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    <BarChart2 className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    No approved leave records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const emp = employees.find(e => e.id === leave.employeeId);
                  const balance = balances.find(b => b.employeeId === leave.employeeId);
                  
                  let remBal: number | string = '-';
                  if (balance) {
                    if (leave.leaveType === 'Annual') remBal = balance.annual;
                    if (leave.leaveType === 'Sick') remBal = balance.sick;
                    if (leave.leaveType === 'Casual') remBal = balance.casual;
                  }

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{emp?.employeeCode || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                        {leave.leaveType}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {leave.startDate} to {leave.endDate}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {leave.duration} Days
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">
                        {remBal}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
