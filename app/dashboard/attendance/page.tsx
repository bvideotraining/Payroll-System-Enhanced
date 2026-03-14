'use client';

import { useState, useMemo } from 'react';
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
  Calendar as CalendarIcon
} from 'lucide-react';
import { LogModal } from './LogModal';
import { AttendanceRecord } from '@/src/frontend/types/attendance';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';

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

  const { employees, loading: empLoading } = useEmployees();
  const { branches, attendanceRules, loading: orgLoading } = useOrganization();
  const { records, loading: attLoading } = useAttendanceRange(startDate, endDate);

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
    
    const rule = attendanceRules.find(r => r.categoryName === category);
    if (!rule || rule.type === 'Flexible' || !rule.startTime) return null;

    const [checkInH, checkInM] = checkIn.split(':').map(Number);
    const [ruleH, ruleM] = rule.startTime.split(':').map(Number);

    const checkInTotal = checkInH * 60 + checkInM;
    const ruleTotal = ruleH * 60 + ruleM;

    if (checkInTotal > ruleTotal) {
      return checkInTotal - ruleTotal;
    }
    return null;
  };

  const getDayOfWeek = (dateString: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateString);
    return days[d.getDay()];
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await deleteDoc(doc(db, 'attendance', id));
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
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

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Attendance Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">Manage logs, check-ins, and late penalties.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Template
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Log
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
          <CalendarIcon className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Range:</span>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0 p-0 w-32"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0 p-0 w-32"
          />
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Branch
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Time Log
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Late / Absent
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    Loading records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No attendance records found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const emp = employees.find(e => e.id === record.employeeId);
                  const lateMins = record.lateMinutes !== undefined ? record.lateMinutes : calculateLateMinutes(record.checkIn, emp?.category);
                  
                  return (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{record.date}</div>
                        <div className="text-xs text-slate-500">{getDayOfWeek(record.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{emp?.employeeCode || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {emp?.branch || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          {emp?.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1 rounded-md border border-slate-100 w-max">
                          <span>{record.checkIn || '--:--'}</span>
                          <span className="text-slate-400">→</span>
                          <span>{record.checkOut || '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.status === 'Absent' ? (
                          <span className="text-sm font-medium text-red-600">Absent</span>
                        ) : lateMins && lateMins > 0 ? (
                          <span className="text-sm font-medium text-red-600">{lateMins} min late</span>
                        ) : (
                          <span className="text-sm text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(record)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
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
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong>Rules Applied:</strong> Late calc based on category start times. Saturday attendance automatically flags for bonuses in Bonus Module. Absences deduct 1 day wage.
        </p>
      </div>

      <LogModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        employees={employees} 
        record={editingRecord} 
      />
    </div>
  );
}
