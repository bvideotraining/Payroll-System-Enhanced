'use client';

import { useState } from 'react';
import { useSocialInsurance } from '@/src/frontend/hooks/use-social-insurance';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { ShieldCheck, Search, Plus, Download, Edit2, Trash2 } from 'lucide-react';
import { SocialInsuranceModal } from './components/SocialInsuranceModal';
import { SocialInsurance } from '@/src/frontend/types/insurance';
import * as XLSX from 'xlsx';

export default function SocialInsurancePage() {
  const { socialInsurances, deleteSocialInsurance } = useSocialInsurance();
  const { employees } = useEmployees();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<SocialInsurance | null>(null);

  const filteredInsurances = socialInsurances.filter(insurance => {
    const emp = employees.find(e => e.id === insurance.employeeId);
    return emp?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           emp?.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleExport = () => {
    const data = filteredInsurances.map(insurance => {
      const emp = employees.find(e => e.id === insurance.employeeId);
      const employeeShare = insurance.insurableWage * 0.1125;
      const employerShare = insurance.insurableWage * 0.19;
      
      return {
        'Employee Name': emp?.fullName || 'Unknown',
        'Employee Code': emp?.employeeCode || 'Unknown',
        'Insurance Number': insurance.insuranceNumber,
        'Insurable Wage': insurance.insurableWage,
        'Enrollment Date': insurance.enrollmentDate,
        'Employee Share (11.25%)': employeeShare,
        'Employer Share (19%)': employerShare,
        'Total Contribution': employeeShare + employerShare
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Social Insurance');
    XLSX.writeFile(wb, 'Social_Insurance_Export.xlsx');
  };

  const handleEdit = (insurance: SocialInsurance) => {
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
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Social Insurance</h1>
            <p className="text-xs text-slate-500">Manage employee insurance enrollment and wages.</p>
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Insurance Number</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Insurable Wage (EGP)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrollment Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Calculated Shares</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredInsurances.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  No social insurance records found.
                </td>
              </tr>
            ) : (
              filteredInsurances.map((insurance) => {
                const emp = employees.find(e => e.id === insurance.employeeId);
                const employeeShare = insurance.insurableWage * 0.1125;
                const employerShare = insurance.insurableWage * 0.19;
                
                return (
                  <tr key={insurance.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{emp?.employeeCode}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {insurance.insuranceNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                      {insurance.insurableWage.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {insurance.enrollmentDate}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Employee (11.25%):</span>
                          <span className="font-medium text-slate-900">{employeeShare.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Employer (19%):</span>
                          <span className="font-medium text-slate-900">{employerShare.toLocaleString()}</span>
                        </div>
                      </div>
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
                              deleteSocialInsurance(insurance.id);
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
        <SocialInsuranceModal
          insurance={editingInsurance}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
