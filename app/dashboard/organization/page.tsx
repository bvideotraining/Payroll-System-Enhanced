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

  // Edit states
  const [editingBranch, setEditingBranch] = useState<{id: string, name: string} | null>(null);
  const [editingDept, setEditingDept] = useState<{id: string, name: string, type: 'Operation' | 'Non-Operation'} | null>(null);
  const [editingJob, setEditingJob] = useState<{id: string, title: string, type: string, departmentId: string} | null>(null);
  const [editingMonthRange, setEditingMonthRange] = useState<{id: string, month: string, startDate: string, endDate: string} | null>(null);
  const [editingRule, setEditingRule] = useState<{id: string, categoryName: string, startTime: string, type: 'Fixed' | 'Flexible'} | null>(null);

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
    addAttendanceRule(newRuleCategory, newRuleType === 'Flexible' ? '' : newRuleTime, newRuleType);
    setNewRuleCategory('');
    setNewRuleTime('');
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
    updateAttendanceRule(editingRule.id, editingRule.categoryName, editingRule.type === 'Flexible' ? '' : editingRule.startTime, editingRule.type);
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
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Organization Settings</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('branding')}
              className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${
                activeTab === 'branding'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Palette className="h-4 w-4" />
              Branding
            </button>
            <button
              onClick={() => setActiveTab('branches')}
              className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${
                activeTab === 'branches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <MapPin className="h-4 w-4" />
              Branches
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${
                activeTab === 'departments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Departments
            </button>
            <button
              onClick={() => setActiveTab('jobTitles')}
              className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${
                activeTab === 'jobTitles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Job Titles
            </button>
            <button
              onClick={() => setActiveTab('monthRanges')}
              className={`w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${
                activeTab === 'monthRanges'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Month Ranges
            </button>
            <button
              onClick={() => setActiveTab('attendanceRules')}
              className={`w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${
                activeTab === 'attendanceRules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Clock className="h-4 w-4" />
              Attendance Rules
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="max-w-2xl">
              <form onSubmit={handleUpdateBranding} className="space-y-6">
                <div>
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={brandForm.appName}
                    onChange={(e) => setBrandForm({ ...brandForm, appName: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Application Logo</Label>
                  <div className="mt-2 flex items-center gap-6">
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative">
                      {brandForm.logoUrl ? (
                        <img src={brandForm.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-xs text-slate-400">No Logo</span>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="logoUpload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2">
                        <Upload className="h-4 w-4" />
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
                      <p className="text-xs text-slate-500 mt-2">Recommended size: 128x128px (PNG/JPG)</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && (
            <div className="max-w-3xl space-y-6">
              <form onSubmit={handleAddBranch} className="flex gap-4">
                <Input
                  placeholder="New Branch Name..."
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {branches.map(branch => (
                  <div key={branch.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    {editingBranch?.id === branch.id ? (
                      <form onSubmit={handleSaveBranch} className="flex items-center gap-3 w-full">
                        <Input
                          value={editingBranch.name}
                          onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                          className="flex-1"
                          autoFocus
                        />
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingBranch(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-blue-500" />
                          <span className="font-medium text-slate-900">{branch.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingBranch({ id: branch.id, name: branch.name })}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteBranch(branch.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {branches.length === 0 && (
                  <div className="p-8 text-center text-slate-500">No branches added yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                <span className="text-sm font-medium text-slate-700">Bulk Actions:</span>
                <Button variant="outline" size="sm" className="bg-white">
                  <Upload className="h-4 w-4 mr-2" /> Template
                </Button>
                <Button variant="outline" size="sm" className="bg-white">
                  <Upload className="h-4 w-4 mr-2" /> Import CSV
                </Button>
              </div>

              <form onSubmit={handleAddDepartment} className="flex gap-4">
                <Input
                  placeholder="New Department Name..."
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={newDeptType}
                  onChange={(e) => setNewDeptType(e.target.value as 'Operation' | 'Non-Operation')}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Operation">Operation</option>
                  <option value="Non-Operation">Non-Operation</option>
                </select>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {departments.map(dept => (
                  <div key={dept.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    {editingDept?.id === dept.id ? (
                      <form onSubmit={handleSaveDepartment} className="flex items-center gap-3 w-full">
                        <Input
                          value={editingDept.name}
                          onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                          className="flex-1"
                          autoFocus
                        />
                        <select
                          value={editingDept.type}
                          onChange={(e) => setEditingDept({ ...editingDept, type: e.target.value as 'Operation' | 'Non-Operation' })}
                          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Operation">Operation</option>
                          <option value="Non-Operation">Non-Operation</option>
                        </select>
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingDept(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-purple-500" />
                          <div>
                            <div className="font-medium text-slate-900">{dept.name}</div>
                            <div className="text-xs text-slate-500">{dept.type}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingDept({ id: dept.id, name: dept.name, type: dept.type })}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteDepartment(dept.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {departments.length === 0 && (
                  <div className="p-8 text-center text-slate-500">No departments added yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Job Titles Tab */}
          {activeTab === 'jobTitles' && (
            <div className="max-w-4xl space-y-6">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                <span className="text-sm font-medium text-slate-700">Bulk Actions:</span>
                <Button variant="outline" size="sm" className="bg-white">
                  <Upload className="h-4 w-4 mr-2" /> Template
                </Button>
                <Button variant="outline" size="sm" className="bg-white">
                  <Upload className="h-4 w-4 mr-2" /> Import CSV
                </Button>
              </div>

              <form onSubmit={handleAddJobTitle} className="flex gap-4">
                <Input
                  placeholder="New Job Title..."
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={newJobType}
                  onChange={(e) => setNewJobType(e.target.value)}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EMPLOYEE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={newJobDeptId}
                  onChange={(e) => setNewJobDeptId(e.target.value)}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>Select Dept</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {jobTitles.map(job => {
                  const dept = departments.find(d => d.id === job.departmentId);
                  return (
                    <div key={job.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                      {editingJob?.id === job.id ? (
                        <form onSubmit={handleSaveJobTitle} className="flex items-center gap-3 w-full">
                          <Input
                            value={editingJob.title}
                            onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                            className="flex-1"
                            autoFocus
                          />
                          <select
                            value={editingJob.type}
                            onChange={(e) => setEditingJob({ ...editingJob, type: e.target.value })}
                            className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {EMPLOYEE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <select
                            value={editingJob.departmentId}
                            onChange={(e) => setEditingJob({ ...editingJob, departmentId: e.target.value })}
                            className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="" disabled>Select Dept</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setEditingJob(null)}>Cancel</Button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Briefcase className="h-5 w-5 text-emerald-500" />
                            <div>
                              <div className="font-medium text-slate-900">{job.title}</div>
                              <div className="flex gap-2 text-xs mt-1">
                                <span className="text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">{job.type}</span>
                                {dept && (
                                  <span className="text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">{dept.name}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingJob({ id: job.id, title: job.title, type: job.type, departmentId: job.departmentId })}
                              className="text-slate-400 hover:text-blue-600 transition-colors p-2"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteJobTitle(job.id)}
                              className="text-red-400 hover:text-red-600 transition-colors p-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {jobTitles.length === 0 && (
                  <div className="p-8 text-center text-slate-500">No job titles added yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Month Ranges Tab */}
          {activeTab === 'monthRanges' && (
            <div className="max-w-4xl space-y-6">
              <form onSubmit={handleAddMonthRange} className="flex gap-4">
                <Input
                  placeholder="Month (e.g., January 2024)"
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  className="flex-1"
                  required
                />
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-500 whitespace-nowrap">Start:</Label>
                  <Input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-500 whitespace-nowrap">End:</Label>
                  <Input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {monthRanges.map(range => (
                  <div key={range.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    {editingMonthRange?.id === range.id ? (
                      <form onSubmit={handleSaveMonthRange} className="flex items-center gap-3 w-full">
                        <Input
                          value={editingMonthRange.month}
                          onChange={(e) => setEditingMonthRange({ ...editingMonthRange, month: e.target.value })}
                          className="flex-1"
                          autoFocus
                          required
                        />
                        <Input
                          type="date"
                          value={editingMonthRange.startDate}
                          onChange={(e) => setEditingMonthRange({ ...editingMonthRange, startDate: e.target.value })}
                          required
                        />
                        <Input
                          type="date"
                          value={editingMonthRange.endDate}
                          onChange={(e) => setEditingMonthRange({ ...editingMonthRange, endDate: e.target.value })}
                          required
                        />
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingMonthRange(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-indigo-500" />
                          <div>
                            <div className="font-medium text-slate-900">{range.month}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {range.startDate} to {range.endDate}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingMonthRange({ id: range.id, month: range.month, startDate: range.startDate, endDate: range.endDate })}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteMonthRange(range.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {monthRanges.length === 0 && (
                  <div className="p-8 text-center text-slate-500">No month ranges added yet.</div>
                )}
              </div>
            </div>
          )}
          {/* Attendance Rules Tab */}
          {activeTab === 'attendanceRules' && (
            <div className="max-w-4xl space-y-6">
              <form onSubmit={handleAddRule} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="ruleCategory" className="text-xs text-slate-500 mb-1 block">Category</Label>
                  <select
                    id="ruleCategory"
                    value={newRuleCategory}
                    onChange={(e) => {
                      setNewRuleCategory(e.target.value);
                      if (e.target.value === 'Part Time') {
                        setNewRuleType('Flexible');
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <Label htmlFor="ruleTime" className="text-xs text-slate-500 mb-1 block">Start Time</Label>
                    <Input
                      id="ruleTime"
                      type="time"
                      value={newRuleTime}
                      onChange={(e) => setNewRuleTime(e.target.value)}
                      required={newRuleType === 'Fixed'}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="ruleType" className="text-xs text-slate-500 mb-1 block">Type</Label>
                  <select
                    id="ruleType"
                    value={newRuleType}
                    onChange={(e) => setNewRuleType(e.target.value as 'Fixed' | 'Flexible')}
                    disabled={newRuleCategory === 'Part Time'}
                    className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Fixed">Fixed</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 h-10">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {attendanceRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    {editingRule?.id === rule.id ? (
                      <form onSubmit={handleSaveRule} className="flex items-center gap-3 w-full">
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
                          className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            required={editingRule.type === 'Fixed'}
                          />
                        )}
                        <select
                          value={editingRule.type}
                          onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as 'Fixed' | 'Flexible' })}
                          disabled={editingRule.categoryName === 'Part Time'}
                          className="h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="Fixed">Fixed</option>
                          <option value="Flexible">Flexible</option>
                        </select>
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingRule(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-indigo-500" />
                          <div>
                            <div className="font-medium text-slate-900">{rule.categoryName}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {rule.type === 'Fixed' ? `Start Time: ${rule.startTime} | ` : ''}Type: {rule.type}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingRule({ id: rule.id, categoryName: rule.categoryName, startTime: rule.startTime, type: rule.type })}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteAttendanceRule(rule.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {attendanceRules.length === 0 && (
                  <div className="p-8 text-center text-slate-500">No attendance rules added yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
