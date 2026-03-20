'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { Trash2, Edit2, Plus, Upload, Palette, MapPin, Building2, Briefcase, Calendar, Clock } from 'lucide-react';
import { EMPLOYEE_CATEGORIES } from '@/src/frontend/types/employee';

export default function OrganizationPage() {
  const { 
    branches, addBranch, updateBranch, deleteBranch,
    departments, addDepartment, updateDepartment, deleteDepartment,
    jobTitles, addJobTitle, updateJobTitle, deleteJobTitle,
    monthRanges, addMonthRange, updateMonthRange, deleteMonthRange,
    attendanceRules, addAttendanceRule, updateAttendanceRule, deleteAttendanceRule,
    branding, updateBranding,
    loading
  } = useOrganization();

  const [activeTab, setActiveTab] = useState<'branding' | 'branches' | 'departments' | 'jobTitles' | 'monthRanges' | 'attendanceRules'>('branches');

  // Form states
  const [newBranch, setNewBranch] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptType, setNewDeptType] = useState<'Operation' | 'Non-Operation'>('Operation');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobType, setNewJobType] = useState<string>(EMPLOYEE_CATEGORIES[0]);
  const [newJobDeptId, setNewJobDeptId] = useState('');

  const [newMonth, setNewMonth] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  const [newRuleCategory, setNewRuleCategory] = useState('');
  const [newRuleTime, setNewRuleTime] = useState('');
  const [newRuleType, setNewRuleType] = useState<'Fixed' | 'Flexible'>('Fixed');
  const [newGracePeriod, setNewGracePeriod] = useState(60);
  const [newLateStep, setNewLateStep] = useState(60);
  const [newLateDays, setNewLateDays] = useState(1);
  const [newAbsenceDays, setNewAbsenceDays] = useState(1);

  // Edit states
  const [editingBranch, setEditingBranch] = useState<{id: string, name: string} | null>(null);
  const [editingDept, setEditingDept] = useState<{id: string, name: string, type: 'Operation' | 'Non-Operation'} | null>(null);
  const [editingJob, setEditingJob] = useState<{id: string, title: string, type: string, departmentId: string} | null>(null);
  const [editingMonthRange, setEditingMonthRange] = useState<{id: string, month: string, startDate: string, endDate: string} | null>(null);
  const [editingRule, setEditingRule] = useState<{
    id: string, 
    categoryName: string, 
    startTime: string, 
    type: 'Fixed' | 'Flexible',
    gracePeriodMinutes: number,
    lateDeductionStepMinutes: number,
    lateDeductionDaysPerStep: number,
    absenceDeductionDays: number
  } | null>(null);

  const [brandForm, setBrandForm] = useState(branding);

  // Update brandForm when branding loads
  useEffect(() => {
    setBrandForm(branding);
  }, [branding]);

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch) return;
    addBranch(newBranch);
    setNewBranch('');
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    addDepartment(newDeptName, newDeptType);
    setNewDeptName('');
  };

  const handleAddJobTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle || !newJobDeptId) return;
    addJobTitle(newJobTitle, newJobType, newJobDeptId);
    setNewJobTitle('');
  };

  const handleAddMonthRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonth || !newStartDate || !newEndDate) return;
    addMonthRange(newMonth, newStartDate, newEndDate);
    setNewMonth('');
    setNewStartDate('');
    setNewEndDate('');
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleCategory) return;
    if (newRuleType === 'Fixed' && !newRuleTime) return;
    addAttendanceRule(
      newRuleCategory, 
      newRuleType === 'Flexible' ? '' : newRuleTime, 
      newRuleType,
      newGracePeriod,
      newLateStep,
      newLateDays,
      newAbsenceDays
    );
    setNewRuleCategory('');
    setNewRuleTime('');
    setNewGracePeriod(60);
    setNewLateStep(60);
    setNewLateDays(1);
    setNewAbsenceDays(1);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editingBranch.name) return;
    updateBranch(editingBranch.id, editingBranch.name);
    setEditingBranch(null);
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.name) return;
    updateDepartment(editingDept.id, editingDept.name, editingDept.type);
    setEditingDept(null);
  };

  const handleSaveJobTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob || !editingJob.title || !editingJob.departmentId) return;
    updateJobTitle(editingJob.id, editingJob.title, editingJob.type, editingJob.departmentId);
    setEditingJob(null);
  };

  const handleSaveMonthRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonthRange || !editingMonthRange.month || !editingMonthRange.startDate || !editingMonthRange.endDate) return;
    updateMonthRange(editingMonthRange.id, editingMonthRange.month, editingMonthRange.startDate, editingMonthRange.endDate);
    setEditingMonthRange(null);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editingRule.categoryName) return;
    if (editingRule.type === 'Fixed' && !editingRule.startTime) return;
    updateAttendanceRule(
      editingRule.id, 
      editingRule.categoryName, 
      editingRule.type === 'Flexible' ? '' : editingRule.startTime, 
      editingRule.type,
      editingRule.gracePeriodMinutes,
      editingRule.lateDeductionStepMinutes,
      editingRule.lateDeductionDaysPerStep,
      editingRule.absenceDeductionDays
    );
    setEditingRule(null);
  };

  const handleUpdateBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding(brandForm);
    alert('Branding updated successfully!');
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading organization settings...</div>;
  }

  return (
    <div className="space-y-2 text-[10px]">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xs font-semibold text-slate-900">Organization Settings</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex-1 min-w-fit py-1.5 px-2 text-center border-b-2 font-medium text-[9px] flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'branding'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Palette className="h-2.5 w-2.5" />
              Branding
            </button>
            <button
              onClick={() => setActiveTab('branches')}
              className={`flex-1 min-w-fit py-1.5 px-2 text-center border-b-2 font-medium text-[9px] flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'branches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <MapPin className="h-2.5 w-2.5" />
              Branches
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`flex-1 min-w-fit py-1.5 px-2 text-center border-b-2 font-medium text-[9px] flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'departments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Building2 className="h-2.5 w-2.5" />
              Departments
            </button>
            <button
              onClick={() => setActiveTab('jobTitles')}
              className={`flex-1 min-w-fit py-1.5 px-2 text-center border-b-2 font-medium text-[9px] flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'jobTitles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Briefcase className="h-2.5 w-2.5" />
              Job Titles
            </button>
            <button
              onClick={() => setActiveTab('monthRanges')}
              className={`flex-1 min-w-fit py-1.5 px-2 text-center border-b-2 font-medium text-[9px] flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'monthRanges'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Calendar className="h-2.5 w-2.5" />
              Month Ranges
            </button>
            <button
              onClick={() => setActiveTab('attendanceRules')}
              className={`flex-1 min-w-fit py-1.5 px-2 text-center border-b-2 font-medium text-[9px] flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === 'attendanceRules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Clock className="h-2.5 w-2.5" />
              Attendance Rules
            </button>
          </nav>
        </div>

        <div className="p-2">
          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="max-w-xl">
              <form onSubmit={handleUpdateBranding} className="space-y-3">
                <div>
                  <Label htmlFor="appName" className="text-[9px]">Application Name</Label>
                  <Input
                    id="appName"
                    value={brandForm.appName}
                    onChange={(e) => setBrandForm({ ...brandForm, appName: e.target.value })}
                    className="mt-0.5 h-6 text-[9px]"
                  />
                </div>

                <div>
                  <Label className="text-[9px]">Application Logo</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative">
                      {brandForm.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={brandForm.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[8px] text-slate-400">No Logo</span>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="logoUpload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-[9px] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-6 px-2 py-1 gap-1">
                        <Upload className="h-2.5 w-2.5" />
                        Upload New Logo
                      </Label>
                      <input 
                        id="logoUpload"
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setBrandForm(prev => ({ ...prev, logoUrl: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <p className="text-[8px] text-slate-500 mt-0.5">Recommended size: 128x128px (PNG/JPG)</p>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-6 text-[9px] px-2">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && (
            <div className="max-w-2xl space-y-3">
              <form onSubmit={handleAddBranch} className="flex gap-1.5">
                <Input
                  placeholder="New Branch Name..."
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  className="flex-1 h-6 text-[9px]"
                />
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 h-6 text-[9px] px-2">
                  <Plus className="h-2.5 w-2.5" />
                  Add
                </Button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {branches.map(branch => (
                  <div key={branch.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50">
                    {editingBranch?.id === branch.id ? (
                      <form onSubmit={handleSaveBranch} className="flex items-center gap-1.5 w-full">
                        <Input
                          value={editingBranch.name}
                          onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                          className="flex-1 h-6 text-[9px]"
                          autoFocus
                        />
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-[9px] px-2">Save</Button>
                        <Button type="button" size="sm" variant="outline" className="h-6 text-[9px] px-2" onClick={() => setEditingBranch(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span className="font-medium text-slate-900 text-[9px]">{branch.name}</span>
                        </div>
                        <div className="flex gap-0.5">
                          <button 
                            onClick={() => setEditingBranch({ id: branch.id, name: branch.name })}
                            className="text-blue-600 hover:text-blue-700 transition-colors p-0.5"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </button>
                          <button 
                            onClick={() => deleteBranch(branch.id)}
                            className="text-red-600 hover:text-red-700 transition-colors p-0.5"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {branches.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-[9px]">No branches added yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 mb-3">
                <span className="text-[9px] font-medium text-slate-700">Bulk Actions:</span>
                <Button variant="outline" size="sm" className="bg-white h-6 text-[9px] px-1.5">
                  <Upload className="h-2.5 w-2.5 mr-1" /> Template
                </Button>
                <Button variant="outline" size="sm" className="bg-white h-6 text-[9px] px-1.5">
                  <Upload className="h-2.5 w-2.5 mr-1" /> Import CSV
                </Button>
              </div>

              <form onSubmit={handleAddDepartment} className="flex gap-1.5">
                <Input
                  placeholder="New Department Name..."
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="flex-1 h-6 text-[9px]"
                />
                <select
                  value={newDeptType}
                  onChange={(e) => setNewDeptType(e.target.value as 'Operation' | 'Non-Operation')}
                  className="border border-slate-300 rounded-md px-1.5 py-0.5 text-[9px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-6"
                >
                  <option value="Operation">Operation</option>
                  <option value="Non-Operation">Non-Operation</option>
                </select>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 h-6 text-[9px] px-2">
                  <Plus className="h-2.5 w-2.5" />
                  Add
                </Button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {departments.map(dept => (
                  <div key={dept.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50">
                    {editingDept?.id === dept.id ? (
                      <form onSubmit={handleSaveDepartment} className="flex items-center gap-1.5 w-full">
                        <Input
                          value={editingDept.name}
                          onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                          className="flex-1 h-6 text-[9px]"
                          autoFocus
                        />
                        <select
                          value={editingDept.type}
                          onChange={(e) => setEditingDept({ ...editingDept, type: e.target.value as 'Operation' | 'Non-Operation' })}
                          className="border border-slate-300 rounded-md px-1.5 py-0.5 text-[9px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-6"
                        >
                          <option value="Operation">Operation</option>
                          <option value="Non-Operation">Non-Operation</option>
                        </select>
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-[9px] px-2">Save</Button>
                        <Button type="button" size="sm" variant="outline" className="h-6 text-[9px] px-2" onClick={() => setEditingDept(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-purple-500" />
                          <div>
                            <div className="font-medium text-slate-900 text-[9px]">{dept.name}</div>
                            <div className="text-[8px] text-slate-500">{dept.type}</div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <button 
                            onClick={() => setEditingDept({ id: dept.id, name: dept.name, type: dept.type })}
                            className="text-blue-600 hover:text-blue-700 transition-colors p-0.5"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </button>
                          <button 
                            onClick={() => deleteDepartment(dept.id)}
                            className="text-red-600 hover:text-red-700 transition-colors p-0.5"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {departments.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-[9px]">No departments added yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Job Titles Tab */}
          {activeTab === 'jobTitles' && (
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 mb-3">
                <span className="text-[9px] font-medium text-slate-700">Bulk Actions:</span>
                <Button variant="outline" size="sm" className="bg-white h-6 text-[9px] px-1.5">
                  <Upload className="h-2.5 w-2.5 mr-1" /> Template
                </Button>
                <Button variant="outline" size="sm" className="bg-white h-6 text-[9px] px-1.5">
                  <Upload className="h-2.5 w-2.5 mr-1" /> Import CSV
                </Button>
              </div>

              <form onSubmit={handleAddJobTitle} className="flex gap-1.5">
                <Input
                  placeholder="New Job Title..."
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="flex-1 h-6 text-[9px]"
                />
                <select
                  value={newJobType}
                  onChange={(e) => setNewJobType(e.target.value)}
                  className="border border-slate-300 rounded-md px-1.5 py-0.5 text-[9px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-6"
                >
                  {EMPLOYEE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={newJobDeptId}
                  onChange={(e) => setNewJobDeptId(e.target.value)}
                  className="border border-slate-300 rounded-md px-1.5 py-0.5 text-[9px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-6"
                  required
                >
                  <option value="" disabled>Select Dept</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 h-6 text-[9px] px-2">
                  <Plus className="h-2.5 w-2.5" />
                  Add
                </Button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {jobTitles.map(job => {
                  const dept = departments.find(d => d.id === job.departmentId);
                  return (
                    <div key={job.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50">
                      {editingJob?.id === job.id ? (
                        <form onSubmit={handleSaveJobTitle} className="flex items-center gap-1.5 w-full">
                          <Input
                            value={editingJob.title}
                            onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                            className="flex-1 h-6 text-[9px]"
                            autoFocus
                          />
                          <select
                            value={editingJob.type}
                            onChange={(e) => setEditingJob({ ...editingJob, type: e.target.value })}
                            className="border border-slate-300 rounded-md px-1.5 py-0.5 text-[9px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-6"
                          >
                            {EMPLOYEE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <select
                            value={editingJob.departmentId}
                            onChange={(e) => setEditingJob({ ...editingJob, departmentId: e.target.value })}
                            className="border border-slate-300 rounded-md px-1.5 py-0.5 text-[9px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-6"
                            required
                          >
                            <option value="" disabled>Select Dept</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-[9px] px-2">Save</Button>
                          <Button type="button" size="sm" variant="outline" className="h-6 text-[9px] px-2" onClick={() => setEditingJob(null)}>Cancel</Button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3 w-3 text-emerald-500" />
                            <div>
                              <div className="font-medium text-slate-900 text-[9px]">{job.title}</div>
                              <div className="flex gap-1 text-[8px] mt-0.5">
                                <span className="text-slate-500 border border-slate-200 rounded px-1 py-0.5">{job.type}</span>
                                {dept && (
                                  <span className="text-slate-500 border border-slate-200 rounded px-1 py-0.5">{dept.name}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            <button 
                              onClick={() => setEditingJob({ id: job.id, title: job.title, type: job.type, departmentId: job.departmentId })}
                              className="text-blue-600 hover:text-blue-700 transition-colors p-0.5"
                            >
                              <Edit2 className="h-2.5 w-2.5" />
                            </button>
                            <button 
                              onClick={() => deleteJobTitle(job.id)}
                              className="text-red-600 hover:text-red-700 transition-colors p-0.5"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {jobTitles.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-[9px]">No job titles added yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Month Ranges Tab */}
          {activeTab === 'monthRanges' && (
            <div className="max-w-3xl space-y-3">
              <form onSubmit={handleAddMonthRange} className="flex gap-1.5">
                <Input
                  placeholder="Month (e.g., January 2024)"
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  className="flex-1 h-6 text-[9px]"
                  required
                />
                <div className="flex items-center gap-1">
                  <Label className="text-[8px] text-slate-500 whitespace-nowrap">Start:</Label>
                  <Input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="h-6 text-[9px] w-24"
                    required
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-[8px] text-slate-500 whitespace-nowrap">End:</Label>
                  <Input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="h-6 text-[9px] w-24"
                    required
                  />
                </div>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 h-6 text-[9px] px-2">
                  <Plus className="h-2.5 w-2.5" />
                  Add
                </Button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {monthRanges.map(range => (
                  <div key={range.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50">
                    {editingMonthRange?.id === range.id ? (
                      <form onSubmit={handleSaveMonthRange} className="flex items-center gap-1.5 w-full">
                        <Input
                          value={editingMonthRange.month}
                          onChange={(e) => setEditingMonthRange({ ...editingMonthRange, month: e.target.value })}
                          className="flex-1 h-6 text-[9px]"
                          autoFocus
                          required
                        />
                        <Input
                          type="date"
                          value={editingMonthRange.startDate}
                          onChange={(e) => setEditingMonthRange({ ...editingMonthRange, startDate: e.target.value })}
                          className="h-6 text-[9px] w-24"
                          required
                        />
                        <Input
                          type="date"
                          value={editingMonthRange.endDate}
                          onChange={(e) => setEditingMonthRange({ ...editingMonthRange, endDate: e.target.value })}
                          className="h-6 text-[9px] w-24"
                          required
                        />
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-[9px] px-2">Save</Button>
                        <Button type="button" size="sm" variant="outline" className="h-6 text-[9px] px-2" onClick={() => setEditingMonthRange(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-indigo-500" />
                          <div>
                            <div className="font-medium text-slate-900 text-[9px]">{range.month}</div>
                            <div className="text-[8px] text-slate-500 mt-0.5">
                              {range.startDate} to {range.endDate}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <button 
                            onClick={() => setEditingMonthRange({ id: range.id, month: range.month, startDate: range.startDate, endDate: range.endDate })}
                            className="text-blue-600 hover:text-blue-700 transition-colors p-0.5"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </button>
                          <button 
                            onClick={() => deleteMonthRange(range.id)}
                            className="text-red-600 hover:text-red-700 transition-colors p-0.5"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {monthRanges.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-[9px]">No month ranges added yet.</div>
                )}
              </div>
            </div>
          )}
          {/* Attendance Rules Tab */}
          {activeTab === 'attendanceRules' && (
            <div className="max-w-4xl space-y-3">
              <form onSubmit={handleAddRule} className="flex gap-1.5 items-end">
                <div className="flex-1">
                  <Label htmlFor="ruleCategory" className="text-[8px] text-slate-500 mb-0.5 block">Category</Label>
                  <select
                    id="ruleCategory"
                    value={newRuleCategory}
                    onChange={(e) => {
                      setNewRuleCategory(e.target.value);
                      if (e.target.value === 'Part Time') {
                        setNewRuleType('Flexible');
                      }
                    }}
                    className="flex h-6 w-full rounded-md border border-input bg-background px-1.5 py-0.5 text-[9px] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="" disabled>Select Category...</option>
                    {EMPLOYEE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {newRuleType === 'Fixed' && (
                  <div>
                    <Label htmlFor="ruleTime" className="text-[8px] text-slate-500 mb-0.5 block">Start Time</Label>
                    <Input
                      id="ruleTime"
                      type="time"
                      value={newRuleTime}
                      onChange={(e) => setNewRuleTime(e.target.value)}
                      className="h-6 text-[9px] w-20"
                      required={newRuleType === 'Fixed'}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="ruleType" className="text-[8px] text-slate-500 mb-0.5 block">Type</Label>
                  <select
                    id="ruleType"
                    value={newRuleType}
                    onChange={(e) => setNewRuleType(e.target.value as 'Fixed' | 'Flexible')}
                    disabled={newRuleCategory === 'Part Time'}
                    className="flex h-6 w-20 rounded-md border border-input bg-background px-1.5 py-0.5 text-[9px] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Fixed">Fixed</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="gracePeriod" className="text-[8px] text-slate-500 mb-0.5 block">Grace (min)</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    value={newGracePeriod}
                    onChange={(e) => setNewGracePeriod(Number(e.target.value))}
                    className="w-12 h-6 text-[9px]"
                  />
                </div>
                <div>
                  <Label htmlFor="lateStep" className="text-[8px] text-slate-500 mb-0.5 block">Step (min)</Label>
                  <Input
                    id="lateStep"
                    type="number"
                    value={newLateStep}
                    onChange={(e) => setNewLateStep(Number(e.target.value))}
                    className="w-12 h-6 text-[9px]"
                  />
                </div>
                <div>
                  <Label htmlFor="lateDays" className="text-[8px] text-slate-500 mb-0.5 block">Ded (days)</Label>
                  <Input
                    id="lateDays"
                    type="number"
                    value={newLateDays}
                    onChange={(e) => setNewLateDays(Number(e.target.value))}
                    className="w-12 h-6 text-[9px]"
                  />
                </div>
                <div>
                  <Label htmlFor="absenceDays" className="text-[8px] text-slate-500 mb-0.5 block">Absence (days)</Label>
                  <Input
                    id="absenceDays"
                    type="number"
                    value={newAbsenceDays}
                    onChange={(e) => setNewAbsenceDays(Number(e.target.value))}
                    className="w-12 h-6 text-[9px]"
                  />
                </div>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 h-6 text-[9px] px-2">
                  <Plus className="h-2.5 w-2.5" />
                  Add
                </Button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {attendanceRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50">
                    {editingRule?.id === rule.id ? (
                      <form onSubmit={handleSaveRule} className="flex items-center gap-1.5 w-full">
                        <select
                          value={editingRule.categoryName}
                          onChange={(e) => {
                            const newCat = e.target.value;
                            setEditingRule({ 
                              ...editingRule, 
                              categoryName: newCat,
                              type: newCat === 'Part Time' ? 'Flexible' : editingRule.type
                            });
                          }}
                          className="flex-1 h-6 rounded-md border border-input bg-background px-1.5 py-0.5 text-[9px] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          {EMPLOYEE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        {editingRule.type === 'Fixed' && (
                          <Input
                            type="time"
                            value={editingRule.startTime}
                            onChange={(e) => setEditingRule({ ...editingRule, startTime: e.target.value })}
                            className="h-6 text-[9px] w-20"
                            required={editingRule.type === 'Fixed'}
                          />
                        )}
                        <select
                          value={editingRule.type}
                          onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as 'Fixed' | 'Flexible' })}
                          disabled={editingRule.categoryName === 'Part Time'}
                          className="h-6 w-20 rounded-md border border-input bg-background px-1.5 py-0.5 text-[9px] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="Fixed">Fixed</option>
                          <option value="Flexible">Flexible</option>
                        </select>
                        <Input
                          type="number"
                          value={editingRule.gracePeriodMinutes}
                          onChange={(e) => setEditingRule({ ...editingRule, gracePeriodMinutes: Number(e.target.value) })}
                          className="w-12 h-6 text-[9px]"
                          placeholder="Grace"
                        />
                        <Input
                          type="number"
                          value={editingRule.lateDeductionStepMinutes}
                          onChange={(e) => setEditingRule({ ...editingRule, lateDeductionStepMinutes: Number(e.target.value) })}
                          className="w-12 h-6 text-[9px]"
                          placeholder="Step"
                        />
                        <Input
                          type="number"
                          value={editingRule.lateDeductionDaysPerStep}
                          onChange={(e) => setEditingRule({ ...editingRule, lateDeductionDaysPerStep: Number(e.target.value) })}
                          className="w-12 h-6 text-[9px]"
                          placeholder="Ded"
                        />
                        <Input
                          type="number"
                          value={editingRule.absenceDeductionDays}
                          onChange={(e) => setEditingRule({ ...editingRule, absenceDeductionDays: Number(e.target.value) })}
                          className="w-12 h-6 text-[9px]"
                          placeholder="Abs"
                        />
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-[9px] px-2">Save</Button>
                        <Button type="button" size="sm" variant="outline" className="h-6 text-[9px] px-2" onClick={() => setEditingRule(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-purple-500" />
                          <div>
                            <div className="font-medium text-slate-900 text-[9px]">{rule.categoryName}</div>
                            <div className="text-[8px] text-slate-500 mt-0.5">
                              {rule.type} {rule.startTime ? `@ ${rule.startTime}` : '(Flexible)'}
                            </div>
                            <div className="text-[7px] text-slate-400 mt-0.5">
                              Late: {rule.gracePeriodMinutes}m grace, then {rule.lateDeductionDaysPerStep}d per {rule.lateDeductionStepMinutes}m | Absence: {rule.absenceDeductionDays}d
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <button 
                            onClick={() => setEditingRule({ 
                              id: rule.id, 
                              categoryName: rule.categoryName, 
                              startTime: rule.startTime, 
                              type: rule.type,
                              gracePeriodMinutes: rule.gracePeriodMinutes || 60,
                              lateDeductionStepMinutes: rule.lateDeductionStepMinutes || 60,
                              lateDeductionDaysPerStep: rule.lateDeductionDaysPerStep || 1,
                              absenceDeductionDays: rule.absenceDeductionDays || 1
                            })}
                            className="text-blue-600 hover:text-blue-700 transition-colors p-0.5"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </button>
                          <button 
                            onClick={() => deleteAttendanceRule(rule.id)}
                            className="text-red-600 hover:text-red-700 transition-colors p-0.5"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {attendanceRules.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-[9px]">No attendance rules added yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
