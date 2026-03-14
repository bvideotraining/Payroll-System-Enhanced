import { useState, useEffect } from 'react';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { Employee } from '@/src/frontend/types/employee';
import { AttendanceRecord, AttendanceStatus } from '@/src/frontend/types/attendance';
import { doc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  record?: AttendanceRecord; // If editing
}

export function LogModal({ isOpen, onClose, employees, record }: LogModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<AttendanceStatus>('Present');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [lateMinutes, setLateMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{record ? 'Edit Log' : 'Add Log'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <select
              id="employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={!!record}
            >
              <option value="" disabled>Select Employee...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={!!record}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check In</Label>
              <Input
                id="checkIn"
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check Out</Label>
              <Input
                id="checkOut"
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lateMinutes">Late Minutes (Manual Override)</Label>
            <Input
              id="lateMinutes"
              type="number"
              min="0"
              value={lateMinutes}
              onChange={(e) => setLateMinutes(e.target.value)}
              placeholder="e.g. 15"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Log'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
