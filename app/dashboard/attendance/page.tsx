'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { useAttendanceRange } from '@/src/frontend/hooks/use-attendance-range';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { 
  Download, 
  Upload, 
  Plus, 
  Filter, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Calendar as CalendarIcon,
  FileText,
  ChevronDown
} from 'lucide-react';
import { LogModal } from './LogModal';
import { AttendanceRecord } from '@/src/frontend/types/attendance';
import { doc, deleteDoc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AttendanceTrackerPage() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(formatDate(firstDay));
  const [endDate, setEndDate] = useState(formatDate(lastDay));
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | undefined>(undefined);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { employees, loading: empLoading } = useEmployees();
  const { branches, attendanceRules, monthRanges, loading: orgLoading } = useOrganization();
  const { records, loading: attLoading } = useAttendanceRange(startDate, endDate);

  const [selectedMonthRange, setSelectedMonthRange] = useState('');

  const handleMonthRangeChange = (rangeId: string) => {
    setSelectedMonthRange(rangeId);
    const range = monthRanges.find(r => r.id === rangeId);
    if (range) {
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  // Set default month range if available
  useEffect(() => {
    if (monthRanges.length > 0 && !selectedMonthRange) {
      const now = new Date();
      const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      const currentRange = monthRanges.find(r => r.month.toLowerCase().includes(currentMonthName.toLowerCase()));
      
      if (currentRange) {
        handleMonthRangeChange(currentRange.id);
      } else {
        // Default to the first one if current month not found
        handleMonthRangeChange(monthRanges[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthRanges, selectedMonthRange]);

  const isLoading = empLoading || orgLoading || attLoading;

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const emp = employees.find(e => e.id === record.employeeId);
      if (!emp) return false;
      
      if (selectedBranch !== 'All' && emp.branch !== selectedBranch) return false;
      if (selectedEmployee !== 'All' && emp.id !== selectedEmployee) return false;
      
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, employees, selectedBranch, selectedEmployee]);

  const calculateLateMinutes = (checkIn: string | undefined, category: string | undefined) => {
    if (!checkIn || !category) return null;
    
    // Try to find rule first
    const rule = attendanceRules.find(r => r.categoryName === category);
    let startTime = rule?.startTime || '';
    
    // Fallback to defaults if no rule or rule has no start time
    if (!startTime) {
      if (category === 'White Collar') startTime = '08:00';
      else if (category === 'Blue Collar') startTime = '07:30';
      else if (category === 'Management') startTime = '09:00';
      else if (category === 'Part Time' || rule?.type === 'Flexible') return 0;
    }

    if (!startTime) return null;

    const [checkInH, checkInM] = checkIn.split(':').map(Number);
    const [ruleH, ruleM] = startTime.split(':').map(Number);

    const checkInTotal = checkInH * 60 + checkInM;
    const ruleTotal = ruleH * 60 + ruleM;

    if (checkInTotal > ruleTotal) {
      return checkInTotal - ruleTotal;
    }
    return 0;
  };

  const getDayOfWeek = (dateString: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateString);
    return days[d.getDay()];
  };

  const handleDelete = (id: string) => {
    setRecordToDelete(id);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      try {
        await deleteDoc(doc(db, 'attendance', recordToDelete));
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
      setRecordToDelete(null);
    }
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(undefined);
    setIsModalOpen(true);
  };

  const handleTemplate = () => {
    const data = [{
      'Employee Code': 'EMP001',
      'Date (YYYY-MM-DD)': '2023-10-25',
      'Status (Present/Absent/Late/Half Day/On Leave)': 'Present',
      'Check In (HH:mm)': '08:00',
      'Check Out (HH:mm)': '17:00',
      'Late Minutes': '0',
      'Notes': 'Arrived on time'
    }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AttendanceTemplate");
    XLSX.writeFile(wb, "Attendance_Template.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          const empCode = row['Employee Code'];
          const date = row['Date (YYYY-MM-DD)'];
          const status = row['Status (Present/Absent/Late/Half Day/On Leave)'];
          
          if (!empCode || !date || !status) continue;

          const emp = employees.find(e => e.employeeCode === empCode);
          if (!emp) continue;

          const recordId = `${emp.id}_${date}`;
          const recordData: any = {
            employeeId: emp.id,
            date: date,
            status: status,
            checkIn: row['Check In (HH:mm)'] || '',
            checkOut: row['Check Out (HH:mm)'] || '',
            lateMinutes: Number(row['Late Minutes']) || 0,
            notes: row['Notes'] || '',
            updatedAt: Date.now()
          };

          await setDoc(doc(db, 'attendance', recordId), recordData, { merge: true });
          importedCount++;
        }
        alert(`Successfully imported ${importedCount} records.`);
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import attendance data. Please check the file format.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = () => {
    const data = filteredRecords.map(record => {
      const emp = employees.find(e => e.id === record.employeeId);
      const lateMins = record.lateMinutes !== undefined ? record.lateMinutes : calculateLateMinutes(record.checkIn, emp?.category);
      return {
        'Date': record.date,
        'Employee Code': emp?.employeeCode || 'N/A',
        'Employee Name': emp?.fullName || 'Unknown',
        'Branch': emp?.branch || 'N/A',
        'Category': emp?.category || 'N/A',
        'Status': record.status,
        'Check In': record.checkIn || '--:--',
        'Check Out': record.checkOut || '--:--',
        'Late Minutes': lateMins || 0,
        'Notes': record.notes || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_Report_${startDate}_to_${endDate}.xlsx`);
    setExportDropdownOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    const tableColumn = ["Date", "Code", "Name", "Branch", "Category", "Status", "Check In", "Check Out", "Late Mins"];
    const tableRows: any[] = [];

    filteredRecords.forEach(record => {
      const emp = employees.find(e => e.id === record.employeeId);
      const lateMins = record.lateMinutes !== undefined ? record.lateMinutes : calculateLateMinutes(record.checkIn, emp?.category);
      const rowData = [
        record.date,
        emp?.employeeCode || 'N/A',
        emp?.fullName || 'Unknown',
        emp?.branch || 'N/A',
        emp?.category || 'N/A',
        record.status,
        record.checkIn || '--:--',
        record.checkOut || '--:--',
        lateMins || 0
      ];
      tableRows.push(rowData);
    });

    doc.text(`Attendance Report (${startDate} to ${endDate})`, 14, 15);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    doc.save(`Attendance_Report_${startDate}_to_${endDate}.pdf`);
    setExportDropdownOpen(false);
  };

  return (
    <div className="space-y-3 text-[10px]">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Attendance Tracker</h1>
          <p className="mt-0.5 text-[9px] text-slate-500">Manage logs, check-ins, and late penalties.</p>
        </div>
        <div className="mt-2 sm:mt-0 flex gap-1">
          <Button onClick={handleTemplate} variant="outline" size="sm" className="flex items-center gap-1 h-6 text-[9px] px-1.5">
            <Download className="h-2.5 w-2.5" />
            Template
          </Button>
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".xlsx, .xls"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Button variant="outline" size="sm" className="flex items-center gap-1 h-6 text-[9px] px-1.5">
              <Upload className="h-2.5 w-2.5" />
              Import
            </Button>
          </div>
          <div className="relative">
            <Button 
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)} 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 h-6 text-[9px] px-1.5"
            >
              <Download className="h-2.5 w-2.5" />
              Export
              <ChevronDown className="h-2 w-2 ml-0.5" />
            </Button>
            {exportDropdownOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-md shadow-lg z-10 py-1">
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-3 py-1.5 text-[10px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="h-3 w-3" />
                  Excel (.xlsx)
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-3 py-1.5 text-[10px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  PDF (.pdf)
                </button>
              </div>
            )}
          </div>
          <Button size="sm" onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 h-6 text-[9px] px-1.5">
            <Plus className="h-2.5 w-2.5" />
            Add Log
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-2.5 w-2.5 text-slate-400" />
          <select
            value={selectedMonthRange}
            onChange={(e) => handleMonthRangeChange(e.target.value)}
            className="h-6 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-[9px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Custom Range</option>
            {monthRanges.map(range => (
              <option key={range.id} value={range.id}>{range.month}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-1 py-0.5">
          <span className="text-[9px] font-medium text-slate-700">Range:</span>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setSelectedMonthRange('');
            }}
            className="bg-transparent border-none text-[9px] focus:ring-0 p-0 w-20"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setSelectedMonthRange('');
            }}
            className="bg-transparent border-none text-[9px] focus:ring-0 p-0 w-20"
          />
        </div>

        <div className="h-3 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

        <div className="flex items-center gap-1">
          <Filter className="h-2.5 w-2.5 text-slate-400" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-6 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-[9px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="h-6 w-full rounded-md border border-slate-200 bg-white px-1 py-0.5 text-[9px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-2 py-1 text-left text-[8px] font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-2 py-1 text-left text-[8px] font-semibold text-slate-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-2 py-1 text-left text-[8px] font-semibold text-slate-500 uppercase tracking-wider">
                  Branch
                </th>
                <th scope="col" className="px-2 py-1 text-left text-[8px] font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-2 py-1 text-left text-[8px] font-semibold text-slate-500 uppercase tracking-wider">
                  Time Log
                </th>
                <th scope="col" className="px-2 py-1 text-left text-[8px] font-semibold text-slate-500 uppercase tracking-wider">
                  Late / Absent
                </th>
                <th scope="col" className="px-2 py-1 text-right text-[8px] font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-2 py-3 text-center text-[9px] text-slate-500">
                    Loading records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-3 text-center text-[9px] text-slate-500">
                    No attendance records found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const emp = employees.find(e => e.id === record.employeeId);
                  const lateMins = record.lateMinutes !== undefined ? record.lateMinutes : calculateLateMinutes(record.checkIn, emp?.category);
                  
                  return (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-2 py-1 whitespace-nowrap">
                        <div className="text-[9px] font-medium text-slate-900">{record.date}</div>
                        <div className="text-[8px] text-slate-500">{getDayOfWeek(record.date)}</div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        <div className="text-[9px] font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                        <div className="text-[8px] text-slate-500">{emp?.employeeCode || 'N/A'}</div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-[9px] text-slate-500">
                        {emp?.branch || 'N/A'}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        <span className="inline-flex items-center px-1 py-0.5 rounded-md text-[8px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          {emp?.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[8px] font-medium text-slate-700 bg-slate-50 px-1 py-0.5 rounded-md border border-slate-100 w-max">
                          <span>{record.checkIn || '--:--'}</span>
                          <span className="text-slate-400">→</span>
                          <span>{record.checkOut || '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {record.status === 'Absent' ? (
                          <span className="text-[9px] font-medium text-red-600">Absent</span>
                        ) : lateMins && lateMins > 0 ? (
                          <span className="text-[9px] font-medium text-red-600">{lateMins} min late</span>
                        ) : (
                          <span className="text-[9px] text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-right text-[9px] font-medium">
                        <div className="flex items-center justify-end gap-0.5">
                          <button 
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-700 transition-colors p-0.5"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-700 transition-colors p-0.5"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
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

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
        <p className="text-[10px] text-blue-800">
          <strong>Rules Applied:</strong> Late calc based on category start times. Saturday attendance automatically flags for bonuses in Bonus Module. Absences deduct 1 day wage.
        </p>
      </div>

      <LogModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        employees={employees} 
        attendanceRules={attendanceRules}
        record={editingRecord} 
      />

      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-500 mb-4">
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRecordToDelete(null)}>
                Cancel
              </Button>
              <Button variant="default" className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
