'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Search, Plus, MoreVertical, Edit, Trash2, Upload, Download, List, Grid, CreditCard, Calendar, Phone } from 'lucide-react';

export default function EmployeesPage() {
  const { employees, loading, deleteEmployee } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [branchFilter, setBranchFilter] = useState('All Branches');

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (emp.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || emp.category === categoryFilter;
    const matchesBranch = branchFilter === 'All Branches' || emp.branch === branchFilter;
    return matchesSearch && matchesCategory && matchesBranch;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      await deleteEmployee(id);
    }
  };

  const categories = ['All Categories', ...Array.from(new Set(employees.map(e => e.category).filter(Boolean)))];
  const branches = ['All Branches', ...Array.from(new Set(employees.map(e => e.branch).filter(Boolean)))];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Employee Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage profiles, documents, and roles.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2 text-slate-600">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="flex items-center gap-2 text-slate-600">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <div className="flex items-center border border-slate-200 rounded-md p-1 bg-white">
            <button className="p-1.5 bg-slate-100 rounded text-slate-700">
              <List className="h-4 w-4" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-700">
              <Grid className="h-4 w-4" />
            </button>
          </div>
          <Link href="/dashboard/employees/new">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1 w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <Input
            type="text"
            placeholder="Search employees..."
            className="pl-9 bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            className="block w-full sm:w-40 pl-3 pr-10 py-2 text-sm border-slate-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            className="block w-full sm:w-40 pl-3 pr-10 py-2 text-sm border-slate-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/50">
            <tr>
              <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile</th>
              <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
              <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dept / Category</th>
              <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Title</th>
              <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacts</th>
              <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative py-4 pl-3 pr-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-500">Loading employees...</td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-500">No employees found.</td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-6 pr-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden border border-slate-200">
                        {employee.photoUrl ? (
                          <img src={employee.photoUrl} alt={employee.fullName} className="h-full w-full object-cover" />
                        ) : (
                          (employee.fullName || 'U').charAt(0)
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-semibold text-slate-900">{employee.fullName}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{employee.employeeCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                    <div className="flex flex-col gap-1.5">
                      {employee.idNumber && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                          <span>{employee.idNumber}</span>
                        </div>
                      )}
                      {employee.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{employee.startDate}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="flex flex-col gap-1.5">
                      {employee.department && (
                        <span className="inline-flex w-max items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
                          {employee.department}
                        </span>
                      )}
                      {employee.category && (
                        <span className="inline-flex w-max items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/10">
                          {employee.category}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="font-medium text-slate-700">{employee.jobTitle}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{employee.branch}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                    {employee.mobileNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{employee.mobileNumber}</span>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      employee.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                      employee.status === 'On Leave' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' :
                      'bg-rose-50 text-rose-700 ring-rose-600/10'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/employees/${employee.id}`} className="text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit, {employee.fullName}</span>
                      </Link>
                      <button onClick={() => handleDelete(employee.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete, {employee.fullName}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
