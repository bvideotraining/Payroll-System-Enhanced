'use client';

import { useState, useEffect } from 'react';
import { useLeaves } from '@/src/frontend/hooks/use-leaves';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { X } from 'lucide-react';
import { Employee } from '@/src/frontend/types/employee';
import { LeaveBalance } from '@/src/frontend/types/leave';

interface LeaveBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  record?: LeaveBalance;
}

export function LeaveBalanceModal({ isOpen, onClose, employees, record }: LeaveBalanceModalProps) {
  const { updateBalance } = useLeaves();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [annual, setAnnual] = useState(15);
  const [casual, setCasual] = useState(6);
  const [sick, setSick] = useState(5);
  const [death, setDeath] = useState(3);
  const [unpaid, setUnpaid] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setSelectedEmployeeId(record.employeeId);
      setAnnual(record.annual);
      setCasual(record.casual);
      setSick(record.sick);
      setDeath(record.death || 3);
      setUnpaid(record.unpaid || 0);
    } else {
      setSelectedEmployeeId(employees.length > 0 ? employees[0].id : '');
      setAnnual(15);
      setCasual(6);
      setSick(5);
      setDeath(3);
      setUnpaid(0);
    }
  }, [record, isOpen, employees]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId) {
      alert('Please select an employee.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBalance(selectedEmployeeId, {
        employeeId: selectedEmployeeId,
        annual,
        casual,
        sick,
        death,
        unpaid,
        year: new Date().getFullYear()
      });
      onClose();
    } catch (error) {
      console.error('Failed to save leave balance:', error);
      alert('Failed to save leave balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            {record ? 'Edit Leave Balance' : 'Add Leave Balance'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Employee</Label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              disabled={!!record}
            >
              <option value="" disabled>Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Annual Leave</Label>
              <Input
                type="number"
                value={annual}
                onChange={(e) => setAnnual(Number(e.target.value))}
                required
                min="0"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Casual Leave</Label>
              <Input
                type="number"
                value={casual}
                onChange={(e) => setCasual(Number(e.target.value))}
                required
                min="0"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sick Leave</Label>
              <Input
                type="number"
                value={sick}
                onChange={(e) => setSick(Number(e.target.value))}
                required
                min="0"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Death Leave</Label>
              <Input
                type="number"
                value={death}
                onChange={(e) => setDeath(Number(e.target.value))}
                required
                min="0"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unpaid Leave (Used)</Label>
              <Input
                type="number"
                value={unpaid}
                onChange={(e) => setUnpaid(Number(e.target.value))}
                required
                min="0"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="h-8 text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? 'Saving...' : 'Save Balance'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
