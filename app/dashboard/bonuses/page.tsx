'use client';

import { useState, useMemo, useEffect } from 'react';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { useBonuses } from '@/src/frontend/hooks/use-bonuses';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { 
  Gift, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  LayoutGrid, 
  List, 
  Edit2, 
  Trash2, 
  RefreshCw,
  Save,
  AlertCircle,
  X
} from 'lucide-react';
import { BonusEntry } from '@/src/frontend/types/bonus';
import { EMPLOYEE_CATEGORIES } from '@/src/frontend/types/employee';
import * as XLSX from 'xlsx';

export default function BonusesPage() {
  const { employees, loading: empLoading } = useEmployees();
  const { branches, monthRanges, loading: orgLoading } = useOrganization();
  
  const [selectedMonthRangeId, setSelectedMonthRangeId] = useState('');
  const { bonuses, loading: bonusLoading, saveBonus, deleteBonus, calculateSaturdayBonus } = useBonuses(selectedMonthRangeId);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState<Partial<BonusEntry> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Set default month range
  useEffect(() => {
    if (monthRanges.length > 0 && !selectedMonthRangeId) {
      const now = new Date();
      const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      const currentRange = monthRanges.find(r => r.month.toLowerCase().includes(currentMonthName.toLowerCase()));
      if (currentRange) setSelectedMonthRangeId(currentRange.id);
      else setSelectedMonthRangeId(monthRanges[0].id);
    }
  }, [monthRanges, selectedMonthRangeId]);

  const filteredData = useMemo(() => {
    return bonuses.filter(bonus => {
      const emp = employees.find(e => e.id === bonus.employeeId);
      if (!emp) return false;

      const matchesSearch = emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch = filterBranch === 'All' || emp.branch === filterBranch;
      const matchesCategory = filterCategory === 'All' || emp.category === filterCategory;

      return matchesSearch && matchesBranch && matchesCategory;
    });
  }, [bonuses, employees, searchQuery, filterBranch, filterCategory]);

  const handleAddBonus = () => {
    setEditingBonus({
      employeeId: '',
      monthRangeId: selectedMonthRangeId,
      saturdayShift: 0,
      dutyAllowance: 0,
      pottyTraining: 0,
      afterSchool: 0,
      transportation: 0,
      extraBonus: 0,
      totalBonus: 0,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEditBonus = (bonus: BonusEntry) => {
    setEditingBonus(bonus);
    setIsModalOpen(true);
  };

  const handleDeleteBonus = async (id: string) => {
    if (confirm('Are you sure you want to delete this bonus entry?')) {
      await deleteBonus(id);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBonus || !editingBonus.employeeId || !editingBonus.monthRangeId) return;

    const total = (editingBonus.saturdayShift || 0) + 
                  (editingBonus.dutyAllowance || 0) + 
                  (editingBonus.pottyTraining || 0) + 
                  (editingBonus.afterSchool || 0) + 
                  (editingBonus.transportation || 0) + 
                  (editingBonus.extraBonus || 0);

    await saveBonus({
      ...editingBonus as BonusEntry,
      totalBonus: total
    });
    setIsModalOpen(false);
  };

  const handleSyncSaturdays = async () => {
    if (!selectedMonthRangeId) return;
    const range = monthRanges.find(r => r.id === selectedMonthRangeId);
    if (!range) return;

    setIsSyncing(true);
    try {
      for (const emp of employees) {
        const jobTitle = emp.jobTitle.toLowerCase();
        if (jobTitle.includes('helper') || jobTitle.includes('cleaner')) {
          const saturdayBonus = await calculateSaturdayBonus(emp, range.startDate, range.endDate);
          
          const existingBonus = bonuses.find(b => b.employeeId === emp.id);
          if (existingBonus) {
            await saveBonus({
              ...existingBonus,
              saturdayShift: saturdayBonus,
              totalBonus: saturdayBonus + 
                          existingBonus.dutyAllowance + 
                          existingBonus.pottyTraining + 
                          existingBonus.afterSchool + 
                          existingBonus.transportation + 
                          existingBonus.extraBonus
            });
          } else {
            await saveBonus({
              employeeId: emp.id,
              monthRangeId: selectedMonthRangeId,
              saturdayShift: saturdayBonus,
              dutyAllowance: 0,
              pottyTraining: 0,
              afterSchool: 0,
              transportation: 0,
              extraBonus: 0,
              totalBonus: saturdayBonus,
              notes: 'Auto-calculated Saturday shift'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error syncing Saturdays:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    const data = filteredData.map(bonus => {
      const emp = employees.find(e => e.id === bonus.employeeId);
      return {
        'Employee Name': emp?.fullName || 'Unknown',
        'Employee Code': emp?.employeeCode || '',
        'Saturday Shift': bonus.saturdayShift,
        'Duty Allowance': bonus.dutyAllowance,
        'Potty Training': bonus.pottyTraining,
        'After School': bonus.afterSchool,
        'Transportation': bonus.transportation,
        'Extra Bonus': bonus.extraBonus,
        'Total Bonus': bonus.totalBonus,
        'Notes': bonus.notes
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bonuses");
    XLSX.writeFile(wb, `Bonuses_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      for (const row of data) {
        const emp = employees.find(e => e.fullName === row['Employee Name'] || e.employeeCode === row['Employee Code']);
        if (emp) {
          const saturday = Number(row['Saturday Shift']) || 0;
          const duty = Number(row['Duty Allowance']) || 0;
          const potty = Number(row['Potty Training']) || 0;
          const afterSchool = Number(row['After School']) || 0;
          const transportation = Number(row['Transportation']) || 0;
          const extra = Number(row['Extra Bonus']) || 0;
          
          const total = saturday + duty + potty + afterSchool + transportation + extra;

          await saveBonus({
            employeeId: emp.id,
            monthRangeId: selectedMonthRangeId,
            saturdayShift: saturday,
            dutyAllowance: duty,
            pottyTraining: potty,
            afterSchool: afterSchool,
            transportation: transportation,
            extraBonus: extra,
            totalBonus: total,
            notes: row['Notes'] || 'Imported from Excel'
          });
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const isLoading = empLoading || orgLoading || bonusLoading;

  return (
    <div className="p-2 space-y-3 max-w-[900px] mx-auto text-[11px]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-md text-white shadow-sm">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Bonus Management</h1>
            <p className="text-slate-500 text-[10px]">Manage extra incentives and shift bonuses.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          <select
            value={selectedMonthRangeId}
            onChange={(e) => setSelectedMonthRangeId(e.target.value)}
            className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {monthRanges.map(range => (
              <option key={range.id} value={range.id}>{range.month}</option>
            ))}
          </select>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSyncSaturdays}
            disabled={isSyncing || !selectedMonthRangeId}
            className="gap-1.5 border-slate-200 hover:bg-slate-50 h-8 text-[11px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Saturdays
          </Button>

          <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5 border-slate-200 h-8 text-[11px]">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>

          <div className="relative">
            <input
              type="file"
              onChange={handleImport}
              accept=".xlsx, .xls"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 h-8 text-[11px]">
              <Upload className="h-3.5 w-3.5" />
              Import
            </Button>
          </div>

          <Button onClick={handleAddBonus} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm h-8 text-[11px]">
            <Plus className="h-3.5 w-3.5" />
            Add Bonus
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-md p-1.5 flex items-start gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
        <div className="text-[10px] text-blue-800">
          <span className="font-semibold">Auto-Calculation Active:</span> Saturday bonuses for <span className="italic">Helpers (200/day)</span> and <span className="italic">Cleaners (100/day)</span> are automatically calculated.
        </div>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-white p-2 rounded-md border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          <Input
            placeholder="Search employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-[10px] border-slate-200 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="w-full h-8 px-2 rounded-md border border-slate-200 bg-white text-[10px] focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="All">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full h-8 px-2 rounded-md border border-slate-200 bg-white text-[10px] focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="All">All Categories</option>
            {EMPLOYEE_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end text-[10px] text-slate-500 font-medium">
          {filteredData.length} entries
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium text-xs">Loading bonus data...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-sm">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-50 text-slate-300">
            <Gift className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">No bonus entries found</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-[10px]">Try adjusting your filters or add a new bonus entry for this month.</p>
          </div>
          <Button onClick={handleAddBonus} variant="outline" size="sm" className="gap-1.5 h-8 text-[11px]">
            <Plus className="h-3.5 w-3.5" />
            Add First Bonus
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-bottom border-slate-200">
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Saturday</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duty</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Potty</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">After School</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Extra</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(bonus => {
                  const emp = employees.find(e => e.id === bonus.employeeId);
                  return (
                    <tr key={bonus.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs">{emp?.fullName}</span>
                          <span className="text-[10px] text-slate-500">{emp?.employeeCode} • {emp?.jobTitle}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">EGP {bonus.saturdayShift.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-600">EGP {bonus.dutyAllowance.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-600">EGP {bonus.pottyTraining.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-600">EGP {bonus.afterSchool.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-600">EGP {bonus.extraBonus.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                          EGP {bonus.totalBonus.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditBonus(bonus)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBonus(bonus.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map(bonus => {
            const emp = employees.find(e => e.id === bonus.employeeId);
            return (
              <div key={bonus.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                      {emp?.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">{emp?.fullName}</h3>
                      <p className="text-[10px] text-slate-500">{emp?.employeeCode} • {emp?.jobTitle}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => handleEditBonus(bonus)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDeleteBonus(bonus.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Saturday</p>
                    <p className="font-bold text-slate-900 text-xs">EGP {bonus.saturdayShift}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Duty</p>
                    <p className="font-bold text-slate-900 text-xs">EGP {bonus.dutyAllowance}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Potty</p>
                    <p className="font-bold text-slate-900 text-xs">EGP {bonus.pottyTraining}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total</p>
                    <p className="font-bold text-blue-600 text-xs">EGP {bonus.totalBonus}</p>
                  </div>
                </div>

                {bonus.notes && (
                  <div className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded-md border-l-2 border-slate-200">
                    &quot;{bonus.notes}&quot;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bonus Modal */}
      {isModalOpen && editingBonus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingBonus.id ? 'Edit Bonus Entry' : 'New Bonus Entry'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-3 space-y-3 text-[10px]">
              <div className="space-y-2">
                <div>
                  <Label className="text-slate-700 font-semibold mb-0.5 block">Employee</Label>
                  <select
                    value={editingBonus.employeeId}
                    onChange={(e) => {
                      const empId = e.target.value;
                      setEditingBonus({ ...editingBonus, employeeId: empId });
                    }}
                    required
                    disabled={!!editingBonus.id}
                    className="w-full h-8 px-2 rounded-md border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">Select an employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-slate-700 font-semibold mb-0.5 block">Month</Label>
                  <select
                    value={editingBonus.monthRangeId}
                    onChange={(e) => setEditingBonus({ ...editingBonus, monthRangeId: e.target.value })}
                    required
                    className="w-full h-8 px-2 rounded-md border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">Select a month...</option>
                    {monthRanges.map(range => (
                      <option key={range.id} value={range.id}>{range.month}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-slate-800 text-[9px] uppercase tracking-wider">Components</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 text-[9px] px-1.5"
                      onClick={async () => {
                        const emp = employees.find(e => e.id === editingBonus.employeeId);
                        const range = monthRanges.find(r => r.id === editingBonus.monthRangeId);
                        if (emp && range) {
                          const sat = await calculateSaturdayBonus(emp, range.startDate, range.endDate);
                          setEditingBonus({ ...editingBonus, saturdayShift: sat });
                        }
                      }}
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Recalculate
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <Label className="text-[9px] text-slate-500">Saturday Shift</Label>
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-bold">EGP</span>
                        <Input
                          type="number"
                          value={editingBonus.saturdayShift}
                          onChange={(e) => setEditingBonus({ ...editingBonus, saturdayShift: Number(e.target.value) })}
                          className="pl-8 h-7 text-[10px] border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[9px] text-slate-500">Duty Allowance</Label>
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-bold">EGP</span>
                        <Input
                          type="number"
                          value={editingBonus.dutyAllowance}
                          onChange={(e) => setEditingBonus({ ...editingBonus, dutyAllowance: Number(e.target.value) })}
                          className="pl-8 h-7 text-[10px] border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[9px] text-slate-500">Potty Training</Label>
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-bold">EGP</span>
                        <Input
                          type="number"
                          value={editingBonus.pottyTraining}
                          onChange={(e) => setEditingBonus({ ...editingBonus, pottyTraining: Number(e.target.value) })}
                          className="pl-8 h-7 text-[10px] border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[9px] text-slate-500">After School</Label>
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-bold">EGP</span>
                        <Input
                          type="number"
                          value={editingBonus.afterSchool}
                          onChange={(e) => setEditingBonus({ ...editingBonus, afterSchool: Number(e.target.value) })}
                          className="pl-8 h-7 text-[10px] border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[9px] text-slate-500">Transportation</Label>
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-bold">EGP</span>
                        <Input
                          type="number"
                          value={editingBonus.transportation}
                          onChange={(e) => setEditingBonus({ ...editingBonus, transportation: Number(e.target.value) })}
                          className="pl-8 h-7 text-[10px] border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[9px] text-slate-500">Extra Bonus</Label>
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-bold">EGP</span>
                        <Input
                          type="number"
                          value={editingBonus.extraBonus}
                          onChange={(e) => setEditingBonus({ ...editingBonus, extraBonus: Number(e.target.value) })}
                          className="pl-8 h-7 text-[10px] border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Label className="text-slate-700 font-semibold">Notes</Label>
                  <Input
                    value={editingBonus.notes}
                    onChange={(e) => setEditingBonus({ ...editingBonus, notes: e.target.value })}
                    placeholder="e.g. Excellent performance"
                    className="h-8 text-[10px] border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between border border-blue-100">
                <span className="font-bold text-blue-900">Total Bonus</span>
                <span className="text-base font-black text-blue-600">
                  EGP {((editingBonus.saturdayShift || 0) + 
                       (editingBonus.dutyAllowance || 0) + 
                       (editingBonus.pottyTraining || 0) + 
                       (editingBonus.afterSchool || 0) + 
                       (editingBonus.transportation || 0) + 
                       (editingBonus.extraBonus || 0)).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-1.5 pt-1.5">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="h-8 px-4 rounded-md text-[10px]">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-md gap-1.5 shadow-sm text-[10px]">
                  <Save className="h-3.5 w-3.5" />
                  Save Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
