import { useState, useEffect } from 'react';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { Employee } from '@/src/frontend/types/employee';
import { AttendanceRecord, AttendanceStatus } from '@/src/frontend/types/attendance';
import { doc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';

import { AttendanceRule } from '@/src/frontend/types/organization';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  attendanceRules: AttendanceRule[];
  record?: AttendanceRecord; // If editing
}

export function LogModal({ isOpen, onClose, employees, attendanceRules, record }: LogModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<AttendanceStatus>('Present');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [lateMinutes, setLateMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-calculate late minutes
  useEffect(() => {
    // Only auto-calculate if we're not editing an existing record or if checkIn was just changed
    if (employeeId && checkIn && status === 'Present') {
      const emp = employees.find(e => e.id === employeeId);
      if (!emp) return;

      // Try to find rule first
      const rule = attendanceRules.find(r => r.categoryName === emp.category);
      let startTime = rule?.startTime || '';
      
      // Fallback to defaults if no rule or rule has no start time
      if (!startTime) {
        if (emp.category === 'White Collar') startTime = '08:00';
        else if (emp.category === 'Blue Collar') startTime = '07:30';
        else if (emp.category === 'Management') startTime = '09:00';
        else if (emp.category === 'Part Time' || rule?.type === 'Flexible') {
          // For Part Time or Flexible, we don't auto-calculate, but we don't force 0 if they manually entered something
          return;
        }
      }

      if (startTime) {
        const [checkH, checkM] = checkIn.split(':').map(Number);
        const [startH, startM] = startTime.split(':').map(Number);
        
        const checkTotal = checkH * 60 + checkM;
        const startTotal = startH * 60 + startM;
        
        if (checkTotal > startTotal) {
          setLateMinutes((checkTotal - startTotal).toString());
        } else {
          setLateMinutes('0');
        }
      }
    }
  }, [employeeId, checkIn, status, employees, attendanceRules]);

  useEffect(() => {
    if (record) {
      setEmployeeId(record.employeeId);
      setDate(record.date);
      setStatus(record.status);
      setCheckIn(record.checkIn || '');
      setCheckOut(record.checkOut || '');
      setLateMinutes(record.lateMinutes?.toString() || '');
      setNotes(record.notes || '');
    } else {
      setEmployeeId('');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('Present');
      setCheckIn('');
      setCheckOut('');
      setLateMinutes('');
      setNotes('');
    }
  }, [record, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !date) return;

    setLoading(true);
    try {
      const recordId = record?.id || `${employeeId}_${date}`;
      const docRef = doc(db, 'attendance', recordId);
      
      const data: any = {
        employeeId,
        date,
        status,
        updatedAt: Date.now()
      };
      
      if (record) {
        data.checkIn = checkIn || deleteField();
        data.checkOut = checkOut || deleteField();
        data.lateMinutes = lateMinutes ? parseInt(lateMinutes, 10) : deleteField();
        data.notes = notes || deleteField();
        await updateDoc(docRef, data);
      } else {
        if (checkIn) data.checkIn = checkIn;
        if (checkOut) data.checkOut = checkOut;
        if (lateMinutes) data.lateMinutes = parseInt(lateMinutes, 10);
        if (notes) data.notes = notes;
        
        await setDoc(docRef, {
          ...data,
          id: recordId,
          createdAt: Date.now()
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving attendance log:', error);
      alert('Failed to save log');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-[280px] p-3 text-[10px]">
        <div className="mb-2">
          <h2 className="text-xs font-semibold">{record ? 'Edit Log' : 'Add Log'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="employee" className="text-[9px]">Employee</Label>
            <select
              id="employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="flex h-6 w-full rounded-md border border-input bg-background px-2 py-1 text-[9px] ring-offset-background file:border-0 file:bg-transparent file:text-[9px] file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={!!record}
            >
              <option value="" disabled>Select Employee...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="date" className="text-[9px]">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-6 text-[9px] px-2"
              required
              disabled={!!record}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="status" className="text-[9px]">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
              className="flex h-6 w-full rounded-md border border-input bg-background px-2 py-1 text-[9px] ring-offset-background file:border-0 file:bg-transparent file:text-[9px] file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="checkIn" className="text-[9px]">Check In</Label>
              <Input
                id="checkIn"
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="h-6 text-[9px] px-2"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="checkOut" className="text-[9px]">Check Out</Label>
              <Input
                id="checkOut"
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="h-6 text-[9px] px-2"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="lateMinutes" className="text-[9px]">Late Minutes (Manual Override)</Label>
            <Input
              id="lateMinutes"
              type="number"
              min="0"
              value={lateMinutes}
              onChange={(e) => setLateMinutes(e.target.value)}
              placeholder="e.g. 15"
              className="h-6 text-[9px] px-2"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes" className="text-[9px]">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="h-6 text-[9px] px-2"
            />
          </div>

          <div className="flex justify-end gap-1.5 mt-3">
            <Button type="button" variant="outline" onClick={onClose} className="h-6 text-[9px] px-2">Cancel</Button>
            <Button type="submit" disabled={loading} className="h-6 text-[9px] px-2">
              {loading ? 'Saving...' : 'Save Log'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
