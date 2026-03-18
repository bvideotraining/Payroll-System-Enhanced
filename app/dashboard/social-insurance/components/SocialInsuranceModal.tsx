'use client';

import { useState, useEffect } from 'react';
import { useSocialInsurance } from '@/src/frontend/hooks/use-social-insurance';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { X, Save, ShieldCheck } from 'lucide-react';
import { SocialInsurance } from '@/src/frontend/types/insurance';

interface SocialInsuranceModalProps {
  insurance: SocialInsurance | null;
  onClose: () => void;
}

export function SocialInsuranceModal({ insurance, onClose }: SocialInsuranceModalProps) {
  const { addSocialInsurance, updateSocialInsurance } = useSocialInsurance();
  const { employees } = useEmployees();

  const [employeeId, setEmployeeId] = useState(insurance?.employeeId || '');
  const [insuranceNumber, setInsuranceNumber] = useState(insurance?.insuranceNumber || '');
  const [insurableWage, setInsurableWage] = useState(insurance?.insurableWage?.toString() || '');
  const [enrollmentDate, setEnrollmentDate] = useState(insurance?.enrollmentDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !insuranceNumber || !insurableWage || !enrollmentDate) return;

    const data = {
      employeeId,
      insuranceNumber,
      insurableWage: parseFloat(insurableWage),
      enrollmentDate
    };

    if (insurance) {
      updateSocialInsurance(insurance.id, data);
    } else {
      addSocialInsurance(data);
    }
    onClose();
  };

  const employeeShare = parseFloat(insurableWage || '0') * 0.1125;
  const employerShare = parseFloat(insurableWage || '0') * 0.19;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              {insurance ? 'Edit Social Insurance' : 'Enroll Social Insurance'}
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Configuring Employee Policy</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="social-insurance-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Selection</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Insurance Number</label>
                <Input
                  required
                  placeholder="e.g. 123456789"
                  value={insuranceNumber}
                  onChange={(e) => setInsuranceNumber(e.target.value)}
                  className="h-10 bg-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrollment Date</label>
                <Input
                  type="date"
                  required
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  className="h-10 bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Insurable Wage (EGP)</label>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={insurableWage}
                onChange={(e) => setInsurableWage(e.target.value)}
                className="h-10 bg-slate-50 font-mono text-lg"
              />
            </div>

            {insurableWage && parseFloat(insurableWage) > 0 && (
              <div className="mt-6 bg-blue-600 text-white rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                  <ShieldCheck className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">Calculated Contributions</h3>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="text-[10px] uppercase opacity-80">Employee Share (11.25%)</div>
                      <div className="text-2xl font-bold tracking-tight">EGP {employeeShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase opacity-80">Employer Share (19%)</div>
                      <div className="text-2xl font-bold tracking-tight">EGP {employerShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                  <p className="text-[10px] opacity-80 mt-3">These amounts will be pushed to payroll as recurring deductions/contributions.</p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 items-center">
          <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
            Discard Changes
          </button>
          <Button type="submit" form="social-insurance-form" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6 h-10 rounded-lg font-semibold tracking-wide">
            <Save className="h-4 w-4" />
            Commit Policy
          </Button>
        </div>
      </div>
    </div>
  );
}
