'use client';

import { useState } from 'react';
import { useMedicalInsurance } from '@/src/frontend/hooks/use-medical-insurance';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { X, Save, UserPlus, HeartPulse, Trash2 } from 'lucide-react';
import { MedicalInsurance, MedicalDependent } from '@/src/frontend/types/insurance';

interface MedicalInsuranceModalProps {
  insurance: MedicalInsurance | null;
  onClose: () => void;
}

export function MedicalInsuranceModal({ insurance, onClose }: MedicalInsuranceModalProps) {
  const { addMedicalInsurance, updateMedicalInsurance } = useMedicalInsurance();
  const { employees } = useEmployees();
  const { monthRanges } = useOrganization();

  const [employeeId, setEmployeeId] = useState(insurance?.employeeId || '');
  const [billingMonth, setBillingMonth] = useState(insurance?.billingMonth || '');
  const [monthlyAmount, setMonthlyAmount] = useState(insurance?.monthlyAmount?.toString() || '');
  const [startDate, setStartDate] = useState(insurance?.startDate || '');
  
  const [dependents, setDependents] = useState<MedicalDependent[]>(insurance?.dependents || []);

  // Form state for new dependent
  const [depName, setDepName] = useState('');
  const [depRelation, setDepRelation] = useState('');
  const [depAmount, setDepAmount] = useState('');
  const [depStartDate, setDepStartDate] = useState('');
  const [depNationalId, setDepNationalId] = useState('');

  const handleAddDependent = () => {
    if (!depName || !depRelation || !depAmount || !depStartDate || !depNationalId) return;

    const newDependent: MedicalDependent = {
      id: crypto.randomUUID(),
      name: depName,
      relation: depRelation,
      amount: parseFloat(depAmount),
      startDate: depStartDate,
      nationalId: depNationalId
    };

    setDependents([...dependents, newDependent]);
    
    // Reset form
    setDepName('');
    setDepRelation('');
    setDepAmount('');
    setDepStartDate('');
    setDepNationalId('');
  };

  const handleRemoveDependent = (id: string) => {
    setDependents(dependents.filter(d => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !billingMonth || !monthlyAmount || !startDate) return;

    const data = {
      employeeId,
      billingMonth,
      monthlyAmount: parseFloat(monthlyAmount),
      startDate,
      dependents
    };

    if (insurance) {
      updateMedicalInsurance(insurance.id, data);
    } else {
      addMedicalInsurance(data);
    }
    onClose();
  };

  const basePremium = parseFloat(monthlyAmount || '0');
  const dependentsTotal = dependents.reduce((sum, d) => sum + d.amount, 0);
  const globalNetDeduction = basePremium + dependentsTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              Plan Architect
            </h2>
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Configuring Enterprise Medical Policy</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Column: Holder Info */}
            <div className="p-6 border-r border-slate-200 space-y-6">
              <form id="medical-insurance-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Holder Selection</label>
                    <select
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                      className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billing Month</label>
                    <select
                      value={billingMonth}
                      onChange={(e) => setBillingMonth(e.target.value)}
                      required
                      className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Month</option>
                      {monthRanges.map(range => (
                        <option key={range.id} value={range.id}>{range.month}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Holder Base Premium</label>
                    <Input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(e.target.value)}
                      className="h-10 bg-slate-50 font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                    <Input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-10 bg-slate-50 font-semibold"
                    />
                  </div>
                </div>
              </form>

              <div className="mt-8 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-1/2 transform translate-x-4 -translate-y-1/2 opacity-20">
                  <HeartPulse className="w-40 h-40" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-1">Global Net Deduction</h3>
                  <div className="text-4xl font-black tracking-tight mb-2">
                    EGP {globalNetDeduction.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-[10px] opacity-90">This amount will be pushed to payroll as a recurring deduction.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Dependents */}
            <div className="p-6 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-6">
                <UserPlus className="h-4 w-4 text-pink-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Enrollment Ledger</h3>
              </div>

              {dependents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 italic mb-6">
                  No dependents enrolled yet.
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {dependents.map((dep) => (
                    <div key={dep.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-sm">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{dep.name} <span className="text-xs font-medium text-slate-500 ml-1">({dep.relation})</span></div>
                        <div className="text-[10px] text-slate-500 mt-0.5">ID: {dep.nationalId} • Starts: {dep.startDate}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-slate-900">EGP {dep.amount}</div>
                        <button 
                          onClick={() => handleRemoveDependent(dep.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white p-5 rounded-xl border border-pink-100 border-dashed shadow-sm">
                <h4 className="text-[10px] font-bold text-pink-500 uppercase tracking-wider text-center mb-4">Enroll Dependant</h4>
                
                <div className="space-y-3">
                  <Input
                    placeholder="Dependent Name"
                    value={depName}
                    onChange={(e) => setDepName(e.target.value)}
                    className="h-9 bg-slate-50 text-sm"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={depRelation}
                      onChange={(e) => setDepRelation(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="">Relation</option>
                      <option value="Wife">Wife</option>
                      <option value="Husband">Husband</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Parent">Parent</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={depAmount}
                      onChange={(e) => setDepAmount(e.target.value)}
                      className="h-9 bg-slate-50 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      value={depStartDate}
                      onChange={(e) => setDepStartDate(e.target.value)}
                      className="h-9 bg-slate-50 text-sm text-slate-500"
                    />
                    <Input
                      placeholder="National ID"
                      value={depNationalId}
                      onChange={(e) => setDepNationalId(e.target.value)}
                      className="h-9 bg-slate-50 text-sm"
                    />
                  </div>

                  <Button 
                    type="button" 
                    onClick={handleAddDependent}
                    className="w-full mt-2 bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold tracking-wide border border-pink-100"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Dependant
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-4 items-center">
          <button type="button" onClick={onClose} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors">
            Discard Changes
          </button>
          <Button type="submit" form="medical-insurance-form" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-8 h-10 rounded-xl font-bold tracking-wide shadow-sm">
            <Save className="h-4 w-4" />
            Commit Medical Policy
          </Button>
        </div>
      </div>
    </div>
  );
}
