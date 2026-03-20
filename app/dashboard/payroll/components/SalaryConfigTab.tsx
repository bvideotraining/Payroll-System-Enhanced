'use client';

import { useState } from 'react';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { usePayroll } from '@/src/frontend/hooks/use-payroll';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
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
  const { salaryConfigs, saveSalaryConfig, deleteSalaryConfig, cashAdvances, loading: payrollLoading } = usePayroll();
  const { monthRanges, loading: orgLoading } = useOrganization();
  const { socialInsurances, loading: socialLoading } = useSocialInsurance();
  const { medicalInsurances, loading: medicalLoading } = useMedicalInsurance();
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedMonthRangeId, setSelectedMonthRangeId] = useState('');
  
  const [editingConfig, setEditingConfig] = useState<Omit<SalaryConfig, 'id'>>({
    employeeId: '',
    monthRangeId: '',
    basicSalary: 0,
    increaseAmount: 0,
    grossSalary: 0,
    totalSalary: 0,
    dailyRate: 0,
    allowances: [],
    deductions: []
  });

  const filteredEmployees = employees.filter(e => 
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectEmployee = (empId: string, monthId?: string) => {
    const monthToUse = monthId || selectedMonthRangeId;
    setSelectedEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    
    const existing = salaryConfigs.find(c => c.employeeId === empId && c.monthRangeId === monthToUse);
    if (existing) {
      const totalAllowances = existing.allowances.reduce((sum, a) => sum + a.amount, 0);
      setEditingConfig({
        employeeId: existing.employeeId,
        monthRangeId: existing.monthRangeId,
        basicSalary: existing.basicSalary,
        increaseAmount: existing.increaseAmount || 0,
        grossSalary: (existing.basicSalary || 0) + (existing.increaseAmount || 0),
        totalSalary: (existing.basicSalary || 0) + (existing.increaseAmount || 0) + totalAllowances,
        dailyRate: existing.dailyRate || 0,
        allowances: [...existing.allowances],
        deductions: [...existing.deductions]
      });
    } else {
      const basicSalary = emp?.salary || 0;
      setEditingConfig({
        employeeId: empId,
        monthRangeId: monthToUse,
        basicSalary: basicSalary,
        increaseAmount: 0,
        grossSalary: basicSalary,
        totalSalary: basicSalary,
        dailyRate: 0,
        allowances: [],
        deductions: []
      });
    }
  };

  const handleMonthChange = (monthId: string) => {
    setSelectedMonthRangeId(monthId);
    if (selectedEmployeeId) {
      handleSelectEmployee(selectedEmployeeId, monthId);
    }
  };

  const handleAddAllowance = () => {
    const newAllowances = [...editingConfig.allowances, { name: '', amount: 0 }];
    const totalAllowances = newAllowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    setEditingConfig({
      ...editingConfig,
      allowances: newAllowances,
      totalSalary: (editingConfig.grossSalary || 0) + totalAllowances
    });
  };

  const handleRemoveAllowance = (index: number) => {
    const newAllowances = [...editingConfig.allowances];
    newAllowances.splice(index, 1);
    const totalAllowances = newAllowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    setEditingConfig({ 
      ...editingConfig, 
      allowances: newAllowances,
      totalSalary: (editingConfig.grossSalary || 0) + totalAllowances
    });
  };

  const handleAddDeduction = () => {
    setEditingConfig({
      ...editingConfig,
      deductions: [...editingConfig.deductions, { name: '', amount: 0 }]
    });
  };

    const handleImportDeductions = () => {
      if (!selectedEmployeeId) return;
  
      const socialInsurance = socialInsurances.find(si => si.employeeId === selectedEmployeeId);
      const medicalInsurance = medicalInsurances.find(mi => mi.employeeId === selectedEmployeeId);
      
      // Calculate cash advance installment
      const activeAdvances = cashAdvances.filter(a => 
        a.employeeId === selectedEmployeeId && 
        a.status === 'Approved'
      );
      
      let totalCashAdvanceInstallment = 0;
      activeAdvances.forEach(adv => {
        const installments = adv.installments || 1;
        const monthlyAmount = Math.floor((adv.amount / installments) * 100) / 100;
        totalCashAdvanceInstallment += monthlyAmount;
      });
  
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
        // Employee share is 11% of insurable wage
        const employeeShare = Math.round(socialInsurance.insurableWage * 0.11);
        addOrUpdate('Social Insurance', employeeShare);
      }
  
      if (medicalInsurance) {
        const employeeAmount = medicalInsurance.monthlyAmount || 0;
        const dependentsAmount = medicalInsurance.dependents?.reduce((sum, dep) => sum + (dep.amount || 0), 0) || 0;
        const totalMedical = employeeAmount + dependentsAmount;
        if (totalMedical > 0) {
          addOrUpdate('Medical Insurance', totalMedical);
        }
      }
      
      if (totalCashAdvanceInstallment > 0) {
        addOrUpdate('Cash Advance', totalCashAdvanceInstallment);
      }
  
      setEditingConfig({ ...editingConfig, deductions: newDeductions });
      alert('Deductions imported successfully.');
    };

  const handleRemoveDeduction = (index: number) => {
    const newDeductions = [...editingConfig.deductions];
    newDeductions.splice(index, 1);
    setEditingConfig({ ...editingConfig, deductions: newDeductions });
  };

  const handleImportBonuses = async () => {
    if (!selectedEmployeeId || !selectedMonthRangeId) {
      alert('Please select both an employee and a month');
      return;
    }
    try {
      const q = query(
        collection(db, 'bonuses'), 
        where('employeeId', '==', selectedEmployeeId),
        where('monthRangeId', '==', selectedMonthRangeId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        alert('No bonus record found for this employee in the selected month.');
        return;
      }
      
      const latestBonus = snapshot.docs[0].data() as BonusEntry;

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

      const totalAllowances = newAllowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      setEditingConfig({ 
        ...editingConfig, 
        allowances: newAllowances,
        totalSalary: (editingConfig.grossSalary || 0) + totalAllowances
      });
      alert('Allowances imported from the latest bonus record.');
    } catch (error) {
      console.error('Error importing bonuses:', error);
      alert('Failed to import bonuses.');
    }
  };

  const handleSave = async () => {
    if (!selectedEmployeeId || !selectedMonthRangeId) {
      alert('Please select both an employee and a month');
      return;
    }
    try {
      await saveSalaryConfig({
        ...editingConfig,
        monthRangeId: selectedMonthRangeId
      });
      alert('Salary configuration saved successfully');
    } catch (error) {
      console.error('Error saving salary config:', error);
      alert('Failed to save salary configuration');
    }
  };

  const handleEditConfig = (config: SalaryConfig) => {
    setSelectedEmployeeId(config.employeeId);
    setSelectedMonthRangeId(config.monthRangeId);
    const totalAllowances = config.allowances.reduce((sum, a) => sum + a.amount, 0);
    setEditingConfig({
      employeeId: config.employeeId,
      monthRangeId: config.monthRangeId,
      basicSalary: config.basicSalary,
      increaseAmount: config.increaseAmount || 0,
      grossSalary: (config.basicSalary || 0) + (config.increaseAmount || 0),
      totalSalary: (config.basicSalary || 0) + (config.increaseAmount || 0) + totalAllowances,
      dailyRate: config.dailyRate || 0,
      allowances: [...config.allowances],
      deductions: [...config.deductions]
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    try {
      await deleteSalaryConfig(id);
      if (selectedEmployeeId && salaryConfigs.find(c => c.id === id)?.employeeId === selectedEmployeeId) {
        // Reset form if deleted config was the one being edited
        handleSelectEmployee(selectedEmployeeId);
      }
    } catch (error) {
      console.error('Error deleting salary config:', error);
      alert('Failed to delete salary configuration');
    }
  };

  const filteredHistory = salaryConfigs.filter(config => {
    const emp = employees.find(e => e.id === config.employeeId);
    const month = monthRanges.find(m => m.id === config.monthRangeId);
    const searchStr = historySearchTerm.toLowerCase();
    return (
      emp?.fullName.toLowerCase().includes(searchStr) ||
      emp?.employeeCode.toLowerCase().includes(searchStr) ||
      month?.month.toLowerCase().includes(searchStr)
    );
  });

  if (empLoading || payrollLoading || orgLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
        {/* Employee List */}
        <div className="md:col-span-1 border-r border-slate-100 pr-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="monthRange" className="text-[10px]">Select Month</Label>
              <select
                id="monthRange"
                className="w-full mt-1.5 h-8 rounded-lg border border-slate-200 bg-white px-3 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedMonthRangeId}
                onChange={(e) => handleMonthChange(e.target.value)}
              >
                <option value="">Choose a month...</option>
                {monthRanges.map(range => (
                  <option key={range.id} value={range.id}>{range.month}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <Input 
                placeholder="Search employees..." 
                className="pl-8 h-7 text-[10px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
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
        </div>

        {/* Config Form */}
        <div className="md:col-span-2">
          {selectedEmployeeId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900">
                  Salary Config for {employees.find(e => e.id === selectedEmployeeId)?.fullName}
                  {selectedMonthRangeId && ` - ${monthRanges.find(m => m.id === selectedMonthRangeId)?.month}`}
                </h3>
                <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-7 text-[10px]">
                  <Save className="h-3 w-3" />
                  Save Config
                </Button>
              </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              {employees.find(e => e.id === selectedEmployeeId)?.category === 'Part Time' ? (
                <>
                  <Label htmlFor="dailyRate" className="text-[10px]">Daily Rate</Label>
                  <Input 
                    id="dailyRate"
                    type="number"
                    value={editingConfig.dailyRate || 0}
                    onChange={(e) => setEditingConfig({ ...editingConfig, dailyRate: Number(e.target.value) })}
                    className="mt-1 bg-white h-7 text-[10px]"
                  />
                </>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="basicSalary" className="text-[10px]">Basic Salary</Label>
                    <Input 
                      id="basicSalary"
                      type="number"
                      value={editingConfig.basicSalary}
                      onChange={(e) => {
                        const newBasic = Number(e.target.value);
                        const newGross = newBasic + (editingConfig.increaseAmount || 0);
                        const totalAllowances = editingConfig.allowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
                        setEditingConfig({ 
                          ...editingConfig, 
                          basicSalary: newBasic,
                          grossSalary: newGross,
                          totalSalary: newGross + totalAllowances
                        });
                      }}
                      className="mt-1 bg-white h-7 text-[10px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="increaseAmount" className="text-[10px]">Increase Amount</Label>
                    <Input 
                      id="increaseAmount"
                      type="number"
                      value={editingConfig.increaseAmount || 0}
                      disabled
                      className="mt-1 bg-slate-100 h-7 text-[10px] text-slate-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grossSalary" className="text-[10px]">Gross Salary</Label>
                    <Input 
                      id="grossSalary"
                      type="number"
                      value={editingConfig.grossSalary || 0}
                      disabled
                      className="mt-1 bg-slate-100 h-7 text-[10px] font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalSalary" className="text-[10px]">Total Salary</Label>
                    <Input 
                      id="totalSalary"
                      type="number"
                      value={editingConfig.totalSalary || 0}
                      disabled
                      className="mt-1 bg-slate-100 h-7 text-[10px] font-bold text-blue-600"
                    />
                  </div>
                </div>
              )}
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
                            const totalAllowances = newAl.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
                            setEditingConfig({ 
                              ...editingConfig, 
                              allowances: newAl,
                              totalSalary: (editingConfig.grossSalary || 0) + totalAllowances
                            });
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
                    <Button variant="outline" size="sm" onClick={handleImportDeductions} className="h-6 gap-1 text-[9px] px-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Download className="h-2.5 w-2.5" />
                      Import Deductions
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

      {/* Salary Configs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-xs">Salary Configurations History</h3>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <Input 
              placeholder="Filter history..." 
              className="pl-8 h-7 text-[10px]"
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="px-3 py-2 font-medium">Emp Code</th>
                <th className="px-3 py-2 font-medium">Emp Name</th>
                <th className="px-3 py-2 font-medium">Month</th>
                <th className="px-3 py-2 font-medium">Basic Salary</th>
                <th className="px-3 py-2 font-medium">Increase Amount</th>
                <th className="px-3 py-2 font-medium">Gross Salary</th>
                <th className="px-3 py-2 font-medium">Bonus Items</th>
                <th className="px-3 py-2 font-medium">Deduction Items</th>
                <th className="px-3 py-2 font-medium">Total Salary</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map(config => {
                const emp = employees.find(e => e.id === config.employeeId);
                const month = monthRanges.find(m => m.id === config.monthRangeId);
                
                return (
                  <tr key={config.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-medium text-slate-900">{emp?.employeeCode || '-'}</td>
                    <td className="px-3 py-2">{emp?.fullName || '-'}</td>
                    <td className="px-3 py-2 font-medium text-blue-600">{month?.month || '-'}</td>
                    <td className="px-3 py-2">{(config.basicSalary || 0).toLocaleString()}</td>
                    <td className="px-3 py-2">{(config.increaseAmount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 font-semibold">{(config.grossSalary || 0).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      {config.allowances.map(a => `${a.name}: ${a.amount}`).join(', ') || '-'}
                    </td>
                    <td className="px-3 py-2 text-red-600">
                      {config.deductions.map(d => `${d.name}: ${d.amount}`).join(', ') || '-'}
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-900">{(config.totalSalary || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditConfig(config)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteConfig(config.id)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500 italic">
                    No salary configurations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
