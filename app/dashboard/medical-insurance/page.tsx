'use client';

import { useState } from 'react';
import { useMedicalInsurance } from '@/src/frontend/hooks/use-medical-insurance';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { HeartPulse, Search, Plus, Download, Edit2, Trash2 } from 'lucide-react';
import { MedicalInsuranceModal } from './components/MedicalInsuranceModal';
import { MedicalInsurance } from '@/src/frontend/types/insurance';
import * as XLSX from 'xlsx';

export default function MedicalInsurancePage() {
  const { medicalInsurances, deleteMedicalInsurance } = useMedicalInsurance();
  const { employees } = useEmployees();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<MedicalInsurance | null>(null);

  const filteredInsurances = medicalInsurances.filter(insurance => {
    const emp = employees.find(e => e.id === insurance.employeeId);
    return emp?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           emp?.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleExport = () => {
    const data = filteredInsurances.map(insurance => {
      const emp = employees.find(e => e.id === insurance.employeeId);
      const dependentTotal = insurance.dependents.reduce((sum, d) => sum + d.amount, 0);
      const totalAmount = insurance.monthlyAmount + dependentTotal;
      
      const familyMembersStr = insurance.dependents.map(d => `${d.name} (${d.relation}) - ID: ${d.nationalId} - EGP ${d.amount}`).join(', ');

      return {
        'Code': emp?.employeeCode || 'Unknown',
        'Employee Name': emp?.fullName || 'Unknown',
        'Start Date': insurance.startDate,
        'Billing Month': insurance.billingMonth,
        'Emp. Amount': insurance.monthlyAmount,
        'Family Members': familyMembersStr,
        'Total Amount': totalAmount
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Medical Insurance');
    XLSX.writeFile(wb, 'Medical_Insurance_Export.xlsx');
  };

  const handleEdit = (insurance: MedicalInsurance) => {
    setEditingInsurance(insurance);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingInsurance(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-rose-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Medical Insurance</h1>
            <p className="text-xs text-slate-500">Manage private health insurance and family dependents.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search employee..." 
              className="pl-9 h-9 w-64 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={handleAddNew} className="h-9 gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Add Policy
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Code</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Employee Name</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Start Date</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Emp. Amount</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Family Members (Name | Rel | ID | Amount)</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredInsurances.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No medical insurance records found.
                </td>
              </tr>
            ) : (
              filteredInsurances.map((insurance) => {
                const emp = employees.find(e => e.id === insurance.employeeId);
                const dependentTotal = insurance.dependents.reduce((sum, d) => sum + d.amount, 0);
                const totalAmount = insurance.monthlyAmount + dependentTotal;
                
                return (
                  <tr key={insurance.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                      {emp?.employeeCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900">
                      {emp?.fullName || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                      {insurance.startDate}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                      {insurance.monthlyAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {insurance.dependents.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">None</span>
                        ) : (
                          insurance.dependents.map((dep, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {dep.name} | {dep.relation} | {dep.nationalId} | <span className="font-bold ml-1">{dep.amount}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-rose-600">
                      {totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(insurance)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this record?')) {
                              deleteMedicalInsurance(insurance.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 transition-colors"
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

      {isModalOpen && (
        <MedicalInsuranceModal
          insurance={editingInsurance}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
