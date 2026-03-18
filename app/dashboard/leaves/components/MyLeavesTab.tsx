'use client';

import { useState, useMemo, useRef } from 'react';
import { useLeaves } from '@/src/frontend/hooks/use-leaves';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { Button } from '@/src/frontend/components/ui/button';
import { Plus, Download, Upload, Edit2, Trash2, Calendar as CalendarIcon, FileText, ChevronDown } from 'lucide-react';
import { LeaveRequestModal } from './LeaveRequestModal';
import { LeaveRequest } from '@/src/frontend/types/leave';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function MyLeavesTab() {
  const { user, role } = useAuthStore();
  const { leaves, deleteLeave, addLeave } = useLeaves();
  const { employees } = useEmployees();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | undefined>(undefined);
  const [filterType, setFilterType] = useState('All Types');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find the employee record for the current user
  const currentEmployee = employees.find(e => e.email === user?.email);

  const isAdminOrApprover = role === 'admin' || role === 'approver' || role === 'System Administrator';

  const myLeaves = useMemo(() => {
    if (isAdminOrApprover) {
      return leaves.sort((a, b) => b.createdAt - a.createdAt);
    }
    if (!currentEmployee) return [];
    return leaves.filter(l => l.employeeId === currentEmployee.id).sort((a, b) => b.createdAt - a.createdAt);
  }, [leaves, currentEmployee, isAdminOrApprover]);

  const filteredLeaves = useMemo(() => {
    return myLeaves.filter(leave => {
      if (filterType !== 'All Types' && leave.leaveType !== filterType) return false;
      if (filterStatus !== 'All Statuses' && leave.status !== filterStatus) return false;
      return true;
    });
  }, [myLeaves, filterType, filterStatus]);

  const handleAdd = () => {
    setEditingLeave(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (leave: LeaveRequest) => {
    setEditingLeave(leave);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      await deleteLeave(id);
    }
  };

  const handleExportExcel = () => {
    const data = filteredLeaves.map(leave => ({
      'Leave Type': leave.leaveType,
      'Start Date': leave.startDate,
      'End Date': leave.endDate,
      'Duration (Days)': leave.duration,
      'Status': leave.status,
      'Notes': leave.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "My Leaves");
    XLSX.writeFile(wb, `My_Leaves_Report.xlsx`);
    setExportDropdownOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Leave Type", "Start Date", "End Date", "Duration", "Status", "Notes"];
    const tableRows: any[] = [];

    filteredLeaves.forEach(leave => {
      const rowData = [
        leave.leaveType,
        leave.startDate,
        leave.endDate,
        leave.duration,
        leave.status,
        leave.notes || ''
      ];
      tableRows.push(rowData);
    });

    doc.text(`My Leaves Report`, 14, 15);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    doc.save(`My_Leaves_Report.pdf`);
    setExportDropdownOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentEmployee) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let importedCount = 0;
        for (const row of data) {
          const leaveType = row['Leave Type'];
          const startDate = row['Start Date'];
          const endDate = row['End Date'];
          const duration = row['Duration'];
          const status = row['Status'] || 'Pending';
          
          if (!leaveType || !startDate || !endDate || !duration) continue;

          await addLeave({
            employeeId: currentEmployee.id,
            leaveType: leaveType as any,
            startDate,
            endDate,
            duration: Number(duration),
            status: status as any,
            notes: row['Notes'] || ''
          });
          importedCount++;
        }
        alert(`Successfully imported ${importedCount} leave requests.`);
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import leave data. Please check the file format.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">{isAdminOrApprover ? 'All Leave Requests' : 'My Leave Requests'}</h2>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".xlsx, .xls"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Button variant="outline" size="sm" className="flex items-center gap-1 h-8 text-xs">
              <Upload className="h-3 w-3" />
              Import
            </Button>
          </div>
          <div className="relative">
            <Button 
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)} 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 h-8 text-xs"
            >
              <Download className="h-3 w-3" />
              Export
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
          <Button onClick={handleAdd} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 h-8 text-xs">
            <Plus className="h-3 w-3" />
            New Request
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Filters:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
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
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {isAdminOrApprover && (
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                )}
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrApprover ? 7 : 6} className="px-4 py-8 text-center text-sm text-slate-500">
                    <CalendarIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    No leave requests found
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const emp = employees.find(e => e.id === leave.employeeId);
                  return (
                    <tr key={leave.id} className="hover:bg-slate-50">
                      {isAdminOrApprover && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                          <div className="text-xs text-slate-500">{emp?.employeeCode || 'N/A'}</div>
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{leave.leaveType}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{leave.startDate}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{leave.endDate}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{leave.duration} Days</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                          leave.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' :
                          leave.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {leave.status === 'Pending' && (
                            <>
                              <button onClick={() => handleEdit(leave)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(leave.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
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

      {(currentEmployee || isAdminOrApprover) && (
        <LeaveRequestModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          employee={currentEmployee}
          employees={employees}
          isAdmin={isAdminOrApprover}
          record={editingLeave}
        />
      )}
    </div>
  );
}
