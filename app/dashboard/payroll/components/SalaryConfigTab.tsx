'use client';

import { useState } from 'react';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { usePayroll } from '@/src/frontend/hooks/use-payroll';
import { useSocialInsurance } from '@/src/frontend/hooks/use-social-insurance';
import { useMedicalInsurance } from '@/src/frontend/hooks/use-medical-insurance';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { Plus, Trash2, Save, Search, Banknote, Download } from 'lucide-react';
import { SalaryConfig } from '@/src/frontend/types/payroll';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';
import { BonusEntry } from '@/src/frontend/types/bonus';

export function SalaryConfigTab() {
  const { employees, loading: empLoading } = useEmployees();
  const { salaryConfigs, saveSalaryConfig, loading: payrollLoading } = usePayroll();
  const { socialInsurances, loading: socialLoading } = useSocialInsurance();
  const { medicalInsurances, loading: medicalLoading } = useMedicalInsurance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  const [editingConfig, setEditingConfig] = useState<Omit<SalaryConfig, 'id'>>({
    employeeId: '',
    basicSalary: 0,
    allowances: [],
    deductions: []
  });

  const filteredEmployees = employees.filter(e => 
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    const existing = salaryConfigs.find(c => c.employeeId === empId);
    if (existing) {
      setEditingConfig({
        employeeId: existing.employeeId,
        basicSalary: existing.basicSalary,
        allowances: [...existing.allowances],
        deductions: [...existing.deductions]
      });
    } else {
      setEditingConfig({
        employeeId: empId,
        basicSalary: 0,
        allowances: [],
        deductions: []
      });
    }
  };

  const handleAddAllowance = () => {
    setEditingConfig({
      ...editingConfig,
      allowances: [...editingConfig.allowances, { name: '', amount: 0 }]
    });
  };

  const handleRemoveAllowance = (index: number) => {
    const newAllowances = [...editingConfig.allowances];
    newAllowances.splice(index, 1);
    setEditingConfig({ ...editingConfig, allowances: newAllowances });
  };

  const handleAddDeduction = () => {
    setEditingConfig({
      ...editingConfig,
      deductions: [...editingConfig.deductions, { name: '', amount: 0 }]
    });
  };

  const handleImportInsurance = () => {
    if (!selectedEmployeeId) return;

    const socialInsurance = socialInsurances.find(si => si.employeeId === selectedEmployeeId);
    const medicalInsurance = medicalInsurances.find(mi => mi.employeeId === selectedEmployeeId);

    const newDeductions = [...editingConfig.deductions];

    const addOrUpdate = (name: string, amount: number) => {
      if (amount && amount > 0) {
        const existing = newDeductions.find(d => d.name === name);
        if (existing) {
          existing.amount = amount;
        } else {
          newDeductions.push({ name, amount });
        }
      }
    };

    if (socialInsurance?.insurableWage) {
      // Employee share is 11.25% of insurable wage
      const employeeShare = Math.round(socialInsurance.insurableWage * 0.1125);
      addOrUpdate('Social Insurance', employeeShare);
    }

    if (medicalInsurance?.monthlyAmount) {
      addOrUpdate('Medical Insurance', medicalInsurance.monthlyAmount);
    }

    setEditingConfig({ ...editingConfig, deductions: newDeductions });
    alert('Deductions imported from insurance records.');
  };

  const handleRemoveDeduction = (index: number) => {
    const newDeductions = [...editingConfig.deductions];
    newDeductions.splice(index, 1);
    setEditingConfig({ ...editingConfig, deductions: newDeductions });
  };

  const handleImportBonuses = async () => {
    if (!selectedEmployeeId) return;
    try {
      const q = query(collection(db, 'bonuses'), where('employeeId', '==', selectedEmployeeId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        alert('No bonus records found for this employee.');
        return;
      }
      
      const employeeBonuses = snapshot.docs.map(doc => doc.data() as BonusEntry);
      employeeBonuses.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      const latestBonus = employeeBonuses[0];

      const newAllowances = [...editingConfig.allowances];
      
      const addOrUpdate = (name: string, amount: number) => {
        if (amount && amount > 0) {
          const existing = newAllowances.find(a => a.name === name);
          if (existing) {
            existing.amount = amount;
          } else {
            newAllowances.push({ name, amount });
          }
        }
      };

      addOrUpdate('Saturday Shift', latestBonus.saturdayShift);
      addOrUpdate('Duty Allowance', latestBonus.dutyAllowance);
      addOrUpdate('Potty Training', latestBonus.pottyTraining);
      addOrUpdate('After School', latestBonus.afterSchool);
      addOrUpdate('Transportation', latestBonus.transportation);
      addOrUpdate('Extra Bonus', latestBonus.extraBonus);

      setEditingConfig({ ...editingConfig, allowances: newAllowances });
      alert('Allowances imported from the latest bonus record.');
    } catch (error) {
      console.error('Error importing bonuses:', error);
      alert('Failed to import bonuses.');
    }
  };

  const handleSave = async () => {
    if (!selectedEmployeeId) return;
    try {
      await saveSalaryConfig(editingConfig);
      alert('Salary configuration saved successfully');
    } catch (error) {
      console.error('Error saving salary config:', error);
      alert('Failed to save salary configuration');
    }
  };

  if (empLoading || payrollLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
      {/* Employee List */}
      <div className="md:col-span-1 border-r border-slate-100 pr-4">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          <Input 
            placeholder="Search employees..." 
            className="pl-8 h-7 text-[10px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
          {filteredEmployees.map(emp => (
            <button
              key={emp.id}
              onClick={() => handleSelectEmployee(emp.id)}
              className={`w-full text-left p-2 rounded-lg border transition-all ${
                selectedEmployeeId === emp.id 
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-medium text-slate-900 text-[10px]">{emp.fullName}</div>
              <div className="text-[9px] text-slate-500">{emp.employeeCode} • {emp.jobTitle}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Config Form */}
      <div className="md:col-span-2">
        {selectedEmployeeId ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900">
                Salary Config for {employees.find(e => e.id === selectedEmployeeId)?.fullName}
              </h3>
              <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-7 text-[10px]">
                <Save className="h-3 w-3" />
                Save Config
              </Button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <Label htmlFor="basicSalary" className="text-[10px]">Basic Salary</Label>
              <Input 
                id="basicSalary"
                type="number"
                value={editingConfig.basicSalary}
                onChange={(e) => setEditingConfig({ ...editingConfig, basicSalary: Number(e.target.value) })}
                className="mt-1 bg-white h-7 text-[10px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Allowances */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-700 text-[10px]">Allowances</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleImportBonuses} className="h-6 gap-1 text-[9px] px-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Download className="h-2.5 w-2.5" />
                      Import from Bonus
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleAddAllowance} className="h-6 gap-1 text-[9px] px-2">
                      <Plus className="h-2.5 w-2.5" />
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {editingConfig.allowances.map((al, idx) => (
                    <div key={idx} className="flex gap-1.5 items-end">
                      <div className="flex-1">
                        <Label className="text-[8px] uppercase text-slate-400">Name</Label>
                        <Input 
                          value={al.name}
                          onChange={(e) => {
                            const newAl = [...editingConfig.allowances];
                            newAl[idx].name = e.target.value;
                            setEditingConfig({ ...editingConfig, allowances: newAl });
                          }}
                          placeholder="e.g. Housing"
                          className="h-6 text-[9px] px-2"
                        />
                      </div>
                      <div className="w-16">
                        <Label className="text-[8px] uppercase text-slate-400">Amount</Label>
                        <Input 
                          type="number"
                          value={al.amount}
                          onChange={(e) => {
                            const newAl = [...editingConfig.allowances];
                            newAl[idx].amount = Number(e.target.value);
                            setEditingConfig({ ...editingConfig, allowances: newAl });
                          }}
                          className="h-6 text-[9px] px-2"
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveAllowance(idx)} className="text-slate-400 hover:text-red-500 h-6 w-6">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {editingConfig.allowances.length === 0 && (
                    <div className="text-[10px] text-slate-400 italic text-center py-3 border border-dashed border-slate-200 rounded-lg">
                      No allowances added
                    </div>
                  )}
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-700 text-[10px]">Deductions</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleImportInsurance} className="h-6 gap-1 text-[9px] px-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Download className="h-2.5 w-2.5" />
                      Import from Insurance
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleAddDeduction} className="h-6 gap-1 text-[9px] px-2">
                      <Plus className="h-2.5 w-2.5" />
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {editingConfig.deductions.map((de, idx) => (
                    <div key={idx} className="flex gap-1.5 items-end">
                      <div className="flex-1">
                        <Label className="text-[8px] uppercase text-slate-400">Name</Label>
                        <Input 
                          value={de.name}
                          onChange={(e) => {
                            const newDe = [...editingConfig.deductions];
                            newDe[idx].name = e.target.value;
                            setEditingConfig({ ...editingConfig, deductions: newDe });
                          }}
                          placeholder="e.g. Insurance"
                          className="h-6 text-[9px] px-2"
                        />
                      </div>
                      <div className="w-16">
                        <Label className="text-[8px] uppercase text-slate-400">Amount</Label>
                        <Input 
                          type="number"
                          value={de.amount}
                          onChange={(e) => {
                            const newDe = [...editingConfig.deductions];
                            newDe[idx].amount = Number(e.target.value);
                            setEditingConfig({ ...editingConfig, deductions: newDe });
                          }}
                          className="h-6 text-[9px] px-2"
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDeduction(idx)} className="text-slate-400 hover:text-red-500 h-6 w-6">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {editingConfig.deductions.length === 0 && (
                    <div className="text-[10px] text-slate-400 italic text-center py-3 border border-dashed border-slate-200 rounded-lg">
                      No deductions added
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
            <Banknote className="h-8 w-8 opacity-20" />
            <p className="text-[10px]">Select an employee to configure their salary</p>
          </div>
        )}
      </div>
    </div>
  );
}
