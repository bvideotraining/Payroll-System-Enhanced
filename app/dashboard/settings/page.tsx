'use client';

import { useState } from 'react';
import { useUsers, AppUser } from '@/src/frontend/hooks/use-users';
import { useSystemConfig, SystemConfig } from '@/src/frontend/hooks/use-system-config';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { useRoles, AppRole, RolePermission } from '@/src/frontend/hooks/use-roles';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { Users, Settings as SettingsIcon, Shield, Edit2, Trash2, Plus, Save, Key, Database, AlertTriangle } from 'lucide-react';
import { AuthSettingsTab } from './components/AuthSettingsTab';
import { BackupRestoreTab } from './components/BackupRestoreTab';
import { SystemResetTab } from './components/SystemResetTab';
import { NotificationSettingsTab } from './components/NotificationSettingsTab';
import { Bell } from 'lucide-react';

const MODULES = [
  'Employees',
  'Leaves',
  'Attendance',
  'Payroll',
  'Organization',
  'Bonuses',
  'Medical Insurance',
  'Social Insurance',
  'Settings'
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'system' | 'auth' | 'backup' | 'reset' | 'notifications'>('users');
  const { users, saveUser, deleteUser, loading: usersLoading } = useUsers();
  const { config, updateConfig, loading: configLoading } = useSystemConfig();
  const { employees, loading: empLoading } = useEmployees();
  const { roles, saveRole, deleteRole, loading: rolesLoading } = useRoles();
  const { branches, departments } = useOrganization();

  // User Form State
  const [editingUser, setEditingUser] = useState<Partial<AppUser> | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Role Form State
  const [editingRole, setEditingRole] = useState<Partial<AppRole> | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // System Config State
  const [configForm, setConfigForm] = useState<SystemConfig>(config);

  const handleEditUser = (user: AppUser) => {
    setEditingUser(user);
    setNewUserPassword('');
    setIsUserModalOpen(true);
  };

  const handleAddUser = () => {
    setEditingUser({
      email: '',
      role: 'employee',
      employeeId: '',
      status: 'Active'
    });
    setNewUserPassword('');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.email || !editingUser.role || !editingUser.status) return;
    
    setIsSavingUser(true);
    try {
      await saveUser(editingUser as any, newUserPassword || undefined);
      setIsUserModalOpen(false);
      setEditingUser(null);
      setNewUserPassword('');
    } catch (error: any) {
      alert(`Error saving user: ${error.message}`);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete);
      setUserToDelete(null);
    }
  };

  const handleEditRole = (role: AppRole) => {
    setEditingRole({
      ...role,
      accessType: role.accessType || 'full',
      customPermissions: role.customPermissions || []
    });
    setIsRoleModalOpen(true);
  };

  const handleAddRole = () => {
    setEditingRole({
      name: '',
      description: '',
      accessType: 'full',
      customPermissions: []
    });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editingRole.name) return;
    
    try {
      await saveRole(editingRole as any);
      setIsRoleModalOpen(false);
      setEditingRole(null);
    } catch (error: any) {
      alert(`Error saving role: ${error.message}`);
    }
  };

  const handleCustomPermissionChange = (module: string, field: keyof RolePermission, value: any) => {
    if (!editingRole) return;
    
    const currentPerms = editingRole.customPermissions || [];
    const permIndex = currentPerms.findIndex(p => p.module === module);
    
    let newPerms = [...currentPerms];
    if (permIndex >= 0) {
      newPerms[permIndex] = { ...newPerms[permIndex], [field]: value };
    } else {
      newPerms.push({
        module,
        view: field === 'view' ? value : false,
        create: field === 'create' ? value : false,
        edit: field === 'edit' ? value : false,
        delete: field === 'delete' ? value : false,
        scope: field === 'scope' ? value : 'all',
        specificBranch: field === 'specificBranch' ? value : undefined,
        specificDepartment: field === 'specificDepartment' ? value : undefined,
        specificBranches: field === 'specificBranches' ? value : [],
        specificDepartments: field === 'specificDepartments' ? value : [],
      });
    }
    
    setEditingRole({ ...editingRole, customPermissions: newPerms });
  };

  const handleDeleteRole = async () => {
    if (roleToDelete) {
      await deleteRole(roleToDelete);
      setRoleToDelete(null);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig(configForm);
    alert('System configuration saved successfully!');
  };

  const toggleWeekendDay = (dayIndex: number) => {
    setConfigForm(prev => {
      const isSelected = prev.weekendDays.includes(dayIndex);
      if (isSelected) {
        return { ...prev, weekendDays: prev.weekendDays.filter(d => d !== dayIndex) };
      } else {
        return { ...prev, weekendDays: [...prev.weekendDays, dayIndex] };
      }
    });
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-4 text-[11px]">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Settings & Role Management</h1>
          <p className="mt-0.5 text-[10px] text-slate-500">Manage system users, roles, and global configurations.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex min-h-[600px]">
        {/* Left Sidebar */}
        <div className="w-56 bg-blue-800 flex-shrink-0">
          <div className="p-4 border-b border-blue-700/50">
            <h2 className="text-white font-semibold text-sm">Settings Menu</h2>
          </div>
          <nav className="flex flex-col p-2 gap-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[11px] font-medium transition-colors text-left ${
                activeTab === 'users'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              System Users
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[11px] font-medium transition-colors text-left ${
                activeTab === 'roles'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              Roles
            </button>
            <button
              onClick={() => {
                setActiveTab('system');
                setConfigForm(config);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[11px] font-medium transition-colors text-left ${
                activeTab === 'system'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <SettingsIcon className="h-4 w-4 shrink-0" />
              System Configurations
            </button>
            <button
              onClick={() => setActiveTab('auth')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[11px] font-medium transition-colors text-left ${
                activeTab === 'auth'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <Key className="h-4 w-4 shrink-0" />
              Auth Settings
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[11px] font-medium transition-colors text-left ${
                activeTab === 'backup'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <Database className="h-4 w-4 shrink-0" />
              Backup & Restore
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[11px] font-medium transition-colors text-left ${
                activeTab === 'notifications'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4 shrink-0" />
              Notification Settings
            </button>
            <button
              onClick={() => setActiveTab('reset')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[11px] font-medium transition-colors text-left mt-4 ${
                activeTab === 'reset'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-red-200 hover:bg-red-500/20 hover:text-red-100'
              }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              System Reset
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  System Users
                </h3>
                <Button onClick={handleAddUser} size="sm" className="h-7 text-[10px] px-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add User
                </Button>
              </div>

              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Linked Employee</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.map((user) => {
                      const emp = employees.find(e => e.id === user.employeeId);
                      return (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 whitespace-nowrap text-[11px] font-medium text-slate-900">{user.email}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-500 capitalize">{user.role}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-500">
                            {emp ? `${emp.fullName} (${emp.employeeCode})` : 'None'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                              user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-[11px] font-medium">
                            <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-900 mr-3">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setUserToDelete(user.id)} className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-slate-500 text-[11px]">
                          No users found. Add a user to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Custom Roles
                </h3>
                <Button onClick={handleAddRole} size="sm" className="h-7 text-[10px] px-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Role
                </Button>
              </div>

              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Role Name</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Description</th>
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] font-medium text-slate-900">{role.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-500">{role.description}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-[11px] font-medium">
                          <button onClick={() => handleEditRole(role)} className="text-blue-600 hover:text-blue-900 mr-3">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setRoleToDelete(role.id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {roles.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-slate-500 text-[11px]">
                          No custom roles found. Add a role to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="max-w-xl">
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Default Currency</Label>
                    <Input 
                      value={configForm.currency} 
                      onChange={e => setConfigForm({...configForm, currency: e.target.value})}
                      className="h-7 text-[11px]"
                      placeholder="e.g., EGP, USD"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Standard Working Hours</Label>
                    <Input 
                      type="number"
                      value={configForm.standardWorkingHours} 
                      onChange={e => setConfigForm({...configForm, standardWorkingHours: Number(e.target.value)})}
                      className="h-7 text-[11px]"
                      min={1}
                      max={24}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px]">Weekend Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeekendDay(index)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                          configForm.weekendDays.includes(index)
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="autoLeave"
                    checked={configForm.autoLeaveApproval}
                    onChange={e => setConfigForm({...configForm, autoLeaveApproval: e.target.checked})}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  <Label htmlFor="autoLeave" className="text-[11px] font-normal cursor-pointer">
                    Auto-approve leave requests for System Administrators
                  </Label>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Button type="submit" size="sm" className="h-7 text-[10px] px-3">
                    <Save className="h-3 w-3 mr-1.5" />
                    Save Configurations
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'auth' && <AuthSettingsTab />}
          {activeTab === 'backup' && <BackupRestoreTab />}
          {activeTab === 'reset' && <SystemResetTab />}
          {activeTab === 'notifications' && <NotificationSettingsTab />}
        </div>
      </div>

      {/* User Modal */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingUser.id ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[10px]">Email Address</Label>
                <Input 
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                  className="h-7 text-[11px]"
                  placeholder="user@example.com"
                  disabled={!!editingUser.id}
                />
              </div>

              {!editingUser.id && (
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Temporary Password</Label>
                  <Input 
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    className="h-7 text-[11px]"
                    placeholder="Enter a temporary password"
                    minLength={6}
                  />
                  <p className="text-[9px] text-slate-500">User will be prompted to change this upon first login.</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-[10px]">Role</Label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                  className="flex h-7 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  required
                >
                  <option value="admin">System Administrator</option>
                  <option value="hr">HR Manager</option>
                  <option value="approver">Approver</option>
                  <option value="employee">Standard Employee</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px]">Linked Employee Profile (Optional)</Label>
                <select
                  value={editingUser.employeeId || ''}
                  onChange={e => setEditingUser({...editingUser, employeeId: e.target.value})}
                  className="flex h-7 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                >
                  <option value="">-- No Linked Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-500">Link this user to an employee profile to allow them to view their own payslips and request leaves.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px]">Status</Label>
                <select
                  value={editingUser.status}
                  onChange={e => setEditingUser({...editingUser, status: e.target.value as any})}
                  className="flex h-7 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsUserModalOpen(false)} className="h-7 text-[10px]">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-7 text-[10px]">
                  Save User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Role Modal */}
      {isRoleModalOpen && editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingRole.id ? 'Edit Role' : 'Add New Role'}
              </h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveRole} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Role Name</Label>
                    <Input 
                      required
                      value={editingRole.name}
                      onChange={e => setEditingRole({...editingRole, name: e.target.value})}
                      className="h-7 text-[11px]"
                      placeholder="e.g., Manager"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Description</Label>
                    <Input 
                      value={editingRole.description}
                      onChange={e => setEditingRole({...editingRole, description: e.target.value})}
                      className="h-7 text-[11px]"
                      placeholder="Role description"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label className="text-[10px]">Access Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-[11px]">
                      <input 
                        type="radio" 
                        name="accessType" 
                        value="full" 
                        checked={editingRole.accessType === 'full'} 
                        onChange={() => setEditingRole({...editingRole, accessType: 'full'})}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Full Access
                    </label>
                    <label className="flex items-center gap-2 text-[11px]">
                      <input 
                        type="radio" 
                        name="accessType" 
                        value="custom" 
                        checked={editingRole.accessType === 'custom'} 
                        onChange={() => setEditingRole({...editingRole, accessType: 'custom'})}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Custom Access
                    </label>
                  </div>
                </div>

                {editingRole.accessType === 'custom' && (
                  <div className="mt-4 border border-slate-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Module</th>
                          <th className="px-3 py-2 text-center text-[10px] font-medium text-slate-500 uppercase tracking-wider">View</th>
                          <th className="px-3 py-2 text-center text-[10px] font-medium text-slate-500 uppercase tracking-wider">Create</th>
                          <th className="px-3 py-2 text-center text-[10px] font-medium text-slate-500 uppercase tracking-wider">Edit</th>
                          <th className="px-3 py-2 text-center text-[10px] font-medium text-slate-500 uppercase tracking-wider">Delete</th>
                          <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Scope</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {MODULES.map(module => {
                          const perm = editingRole.customPermissions?.find(p => p.module === module) || {
                            module, view: false, create: false, edit: false, delete: false, scope: 'all'
                          };
                          return (
                            <tr key={module} className="hover:bg-slate-50">
                              <td className="px-3 py-2 whitespace-nowrap text-[11px] font-medium text-slate-900">{module}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <input type="checkbox" checked={perm.view} onChange={e => handleCustomPermissionChange(module, 'view', e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <input type="checkbox" checked={perm.create} onChange={e => handleCustomPermissionChange(module, 'create', e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <input type="checkbox" checked={perm.edit} onChange={e => handleCustomPermissionChange(module, 'edit', e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <input type="checkbox" checked={perm.delete} onChange={e => handleCustomPermissionChange(module, 'delete', e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <select 
                                    value={perm.scope} 
                                    onChange={e => handleCustomPermissionChange(module, 'scope', e.target.value)}
                                    className="h-6 rounded border border-slate-200 text-[10px] px-1"
                                  >
                                    <option value="all">All Branches & Depts</option>
                                    <option value="branch">Specific Branch</option>
                                    <option value="department">Specific Department</option>
                                  </select>
                                  {perm.scope === 'branch' && (
                                    <div className="mt-1 max-h-24 overflow-y-auto border border-slate-200 rounded p-1 bg-white space-y-0.5 min-w-[150px]">
                                      <label className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-slate-50 rounded cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={(perm.specificBranches || []).includes('OWN_BRANCH')}
                                          onChange={(e) => {
                                            const current = perm.specificBranches || [];
                                            const next = e.target.checked ? [...current, 'OWN_BRANCH'] : current.filter(id => id !== 'OWN_BRANCH');
                                            handleCustomPermissionChange(module, 'specificBranches', next);
                                          }}
                                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                                        />
                                        <span className="text-[10px]">His Own Branch</span>
                                      </label>
                                      {branches.map(b => (
                                        <label key={b.id} className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-slate-50 rounded cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={(perm.specificBranches || []).includes(b.id)}
                                            onChange={(e) => {
                                              const current = perm.specificBranches || [];
                                              const next = e.target.checked ? [...current, b.id] : current.filter(id => id !== b.id);
                                              handleCustomPermissionChange(module, 'specificBranches', next);
                                            }}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                                          />
                                          <span className="text-[10px]">{b.name}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                  {perm.scope === 'department' && (
                                    <div className="mt-1 max-h-24 overflow-y-auto border border-slate-200 rounded p-1 bg-white space-y-0.5 min-w-[150px]">
                                      <label className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-slate-50 rounded cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={(perm.specificDepartments || []).includes('OWN_DEPARTMENT')}
                                          onChange={(e) => {
                                            const current = perm.specificDepartments || [];
                                            const next = e.target.checked ? [...current, 'OWN_DEPARTMENT'] : current.filter(id => id !== 'OWN_DEPARTMENT');
                                            handleCustomPermissionChange(module, 'specificDepartments', next);
                                          }}
                                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                                        />
                                        <span className="text-[10px]">His Own Department</span>
                                      </label>
                                      {departments.map(d => (
                                        <label key={d.id} className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-slate-50 rounded cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={(perm.specificDepartments || []).includes(d.id)}
                                            onChange={(e) => {
                                              const current = perm.specificDepartments || [];
                                              const next = e.target.checked ? [...current, d.id] : current.filter(id => id !== d.id);
                                              handleCustomPermissionChange(module, 'specificDepartments', next);
                                            }}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                                          />
                                          <span className="text-[10px]">{d.name}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsRoleModalOpen(false)} className="h-7 text-[10px]">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-7 text-[10px]">
                  Save Role
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Delete User</h3>
            <p className="text-[11px] text-slate-500">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setUserToDelete(null)} className="h-7 text-[10px]">
                Cancel
              </Button>
              <Button type="button" variant="default" size="sm" onClick={handleDeleteUser} className="h-7 text-[10px] bg-red-600 hover:bg-red-700 text-white">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Modal */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Delete Role</h3>
            <p className="text-[11px] text-slate-500">Are you sure you want to delete this role? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setRoleToDelete(null)} className="h-7 text-[10px]">
                Cancel
              </Button>
              <Button type="button" variant="default" size="sm" onClick={handleDeleteRole} className="h-7 text-[10px] bg-red-600 hover:bg-red-700 text-white">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
