'use client';

import { useState, useEffect } from 'react';
import { useLeaves } from '@/src/frontend/hooks/use-leaves';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { X, Upload } from 'lucide-react';
import { LeaveRequest, LeaveType } from '@/src/frontend/types/leave';
import { Employee } from '@/src/frontend/types/employee';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  employees?: Employee[];
  isAdmin?: boolean;
  record?: LeaveRequest;
}

export function LeaveRequestModal({ isOpen, onClose, employee, employees = [], isAdmin = false, record }: LeaveRequestModalProps) {
  const { addLeave, updateLeave } = useLeaves();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeEmployee = isAdmin ? employees.find(e => e.id === selectedEmployeeId) : employee;

  useEffect(() => {
    if (employee && !isAdmin) {
      setSelectedEmployeeId(employee.id);
    } else if (record && isAdmin) {
      setSelectedEmployeeId(record.employeeId);
    } else if (employees.length > 0 && !selectedEmployeeId && isAdmin) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employee, record, employees, isAdmin, selectedEmployeeId]);

  // Check if employee has passed 3 months
  const hasPassed3Months = () => {
    if (!activeEmployee?.joinDate && !activeEmployee?.startDate) return false;
    const joinDate = new Date(activeEmployee.joinDate || activeEmployee.startDate);
    const threeMonthsLater = new Date(joinDate);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    return new Date() >= threeMonthsLater;
  };

  const canRequestPaidLeave = hasPassed3Months();

  useEffect(() => {
    if (record) {
      setLeaveType(record.leaveType);
      setStartDate(record.startDate);
      setEndDate(record.endDate);
      setDuration(record.duration);
      setNotes(record.notes || '');
    } else {
      setLeaveType(canRequestPaidLeave ? 'Annual' : 'Unpaid');
      setStartDate('');
      setEndDate('');
      setDuration(0);
      setNotes('');
      setAttachment(null);
    }
  }, [record, isOpen, canRequestPaidLeave]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end >= start) {
        let count = 0;
        let current = new Date(start);
        
        while (current <= end) {
          const dayOfWeek = current.getDay();
          // Exclude Friday (5) and Saturday (6)
          if (dayOfWeek !== 5 && dayOfWeek !== 6) {
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
        setDuration(count);
      } else {
        setDuration(0);
      }
    } else {
      setDuration(0);
    }
  }, [startDate, endDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (leaveType === 'Sick' && !attachment && !record?.attachmentUrl) {
      alert('Medical report attachment is mandatory for Sick leave.');
      return;
    }

    if (duration <= 0) {
      alert('Duration must be greater than 0.');
      return;
    }

    if (!activeEmployee) {
      alert('Please select an employee.');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, we would upload the attachment to Firebase Storage here and get the URL
      // For this demo, we'll just simulate it or leave it empty if not implemented
      const attachmentUrl = attachment ? 'simulated-url.pdf' : record?.attachmentUrl;

      if (record) {
        await updateLeave(record.id, {
          employeeId: activeEmployee.id,
          leaveType,
          startDate,
          endDate,
          duration,
          notes,
          attachmentUrl
        });
      } else {
        await addLeave({
          employeeId: activeEmployee.id,
          leaveType,
          startDate,
          endDate,
          duration,
          status: 'Pending',
          notes,
          attachmentUrl
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save leave request:', error);
      alert('Failed to save leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            {record ? 'Edit Leave Request' : 'New Leave Request'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Employee</Label>
            {isAdmin ? (
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="" disabled>Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
                ))}
              </select>
            ) : (
              <Input 
                value={activeEmployee?.fullName || ''} 
                disabled 
                className="h-8 text-xs bg-slate-50"
              />
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Leave Type</Label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="Annual" disabled={!canRequestPaidLeave}>Annual Leave {!canRequestPaidLeave && '(Requires 3 months of service)'}</option>
              <option value="Casual" disabled={!canRequestPaidLeave}>Casual Leave {!canRequestPaidLeave && '(Requires 3 months of service)'}</option>
              <option value="Sick" disabled={!canRequestPaidLeave}>Sick Leave {!canRequestPaidLeave && '(Requires 3 months of service)'}</option>
              <option value="Maternity">Maternity Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
              <option value="Death">Death Leave</option>
              <option value="Lieu">Lieu Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="h-8 text-xs"
                min={startDate}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Duration (Days)</Label>
            <Input
              type="number"
              value={duration}
              readOnly
              className="h-8 text-xs bg-slate-50"
            />
            <p className="text-[10px] text-slate-500">Excludes Fridays and Saturdays</p>
          </div>

          {leaveType === 'Sick' && (
            <div className="space-y-1">
              <Label className="text-xs">Medical Report <span className="text-red-500">*</span></Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="medical-report"
                  className="hidden"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="medical-report"
                  className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 text-xs text-slate-600"
                >
                  <Upload className="h-3 w-3" />
                  {attachment ? attachment.name : record?.attachmentUrl ? 'Report Uploaded' : 'Upload File'}
                </label>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Notes (Optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="h-8 text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? 'Saving...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
