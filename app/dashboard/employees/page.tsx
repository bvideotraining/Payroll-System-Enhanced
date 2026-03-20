'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Search, Plus, MoreVertical, Edit, Trash2, Upload, Download, List, Grid, CreditCard, Calendar, Phone, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const extractDobFromId = (idNumber: string): string => {
  if (!idNumber || idNumber.length < 7) return '';
  const centuryDigit = idNumber.substring(0, 1);
  const yearDigits = idNumber.substring(1, 3);
  const monthDigits = idNumber.substring(3, 5);
  const dayDigits = idNumber.substring(5, 7);
  
  const year = (centuryDigit === '2' ? 1900 : 2000) + parseInt(yearDigits, 10);
  const month = parseInt(monthDigits, 10);
  const day = parseInt(dayDigits, 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
  
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
};

const calculateAge = (dobString: string): number | string => {
  if (!dobString) return '';
  const [month, day, year] = dobString.split('/');
  const dob = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(dob.getTime())) return '';
  
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export default function EmployeesPage() {
  const { employees, loading, deleteEmployee, addEmployee } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (emp.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || emp.category === categoryFilter;
    const matchesBranch = branchFilter === 'All Branches' || emp.branch === branchFilter;
    return matchesSearch && matchesCategory && matchesBranch;
  });

  const handleDelete = async (id: string) => {
    await deleteEmployee(id);
  };

  const categories = ['All Categories', ...Array.from(new Set(employees.map(e => e.category).filter(Boolean)))];
  const branches = ['All Branches', ...Array.from(new Set(employees.map(e => e.branch).filter(Boolean)))];

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
        await addEmployee({
          fullName: row['Employee Name'] || '',
          employeeCode: row['Employee Code'] || '',
          branch: row['Branch'] || '',
          jobTitle: row['Job title'] || '',
          department: row['Department'] || '',
          startDate: row['Start date'] || '',
          idNumber: row['Id number'] || '',
          dateOfBirth: row['Date of birth'] || '',
          mobileNumber: row['Mobile Number'] || '',
          category: row['Category'] || 'White Collar',
          salary: Number(row['Current Salary']) || 0,
          status: 'Active',
        });
      }
      alert('Import completed successfully!');
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = () => {
    const data = filteredEmployees.map(emp => {
      const dob = extractDobFromId(emp.idNumber || '');
      const age = calculateAge(dob);
      return {
        'Employee Code': emp.employeeCode,
        'Employee Name': emp.fullName,
        'Branch': emp.branch,
        'Job title': emp.jobTitle,
        'Department': emp.department,
        'Start date': emp.startDate,
        'Id number': emp.idNumber,
        'Date of birth': dob,
        'Age': age,
        'Current Salary': emp.salary
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `Employees_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    const tableColumn = ["Code", "Name", "Branch", "Job Title", "Department", "Start Date", "ID Number", "DOB", "Age", "Salary"];
    const tableRows: any[] = [];

    filteredEmployees.forEach(emp => {
      const dob = extractDobFromId(emp.idNumber || '');
      const age = calculateAge(dob);
      const empData = [
        emp.employeeCode,
        emp.fullName,
        emp.branch,
        emp.jobTitle,
        emp.department,
        emp.startDate,
        emp.idNumber,
        dob,
        age,
        emp.salary
      ];
      tableRows.push(empData);
    });

    doc.text("Employees Report", 14, 15);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    doc.save(`Employees_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Employee Directory</h1>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Manage profiles, documents, and roles.
          </p>
        </div>
        <div className="mt-3 sm:ml-16 sm:mt-0 flex items-center gap-1.5">
          <div className="relative">
            <input
              type="file"
              onChange={handleImport}
              accept=".xlsx, .xls"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Button variant="outline" size="sm" className="flex items-center gap-1 text-slate-600 h-7 text-[10px]">
              <Upload className="h-3 w-3" />
              Import
            </Button>
          </div>
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="flex items-center gap-1 text-slate-600 h-7 text-[10px]">
            <Download className="h-3 w-3" />
            Export Excel
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="flex items-center gap-1 text-slate-600 h-7 text-[10px]">
            <FileText className="h-3 w-3" />
            Export PDF
          </Button>
          <div className="flex items-center border border-slate-200 rounded-md p-0.5 bg-white h-7">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <List className="h-3 w-3" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <Grid className="h-3 w-3" />
            </button>
          </div>
          <Link href="/dashboard/employees/new">
            <Button size="sm" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white h-7 text-[10px]">
              <Plus className="h-3 w-3" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-1 w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
            <Search className="h-3 w-3 text-slate-400" aria-hidden="true" />
          </div>
          <Input
            type="text"
            placeholder="Search employees..."
            className="pl-7 bg-white border-slate-200 h-7 text-[10px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 w-full sm:w-auto">
          <select 
            className="block w-full sm:w-32 pl-1.5 pr-7 py-0.5 text-[10px] border-slate-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md h-7"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            className="block w-full sm:w-32 pl-1.5 pr-7 py-0.5 text-[10px] border-slate-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md h-7"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="py-1.5 pl-3 pr-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Profile</th>
                <th scope="col" className="px-2 py-1.5 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-2 py-1.5 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Dept / Category</th>
                <th scope="col" className="px-2 py-1.5 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Job Title</th>
                <th scope="col" className="px-2 py-1.5 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Contacts</th>
                <th scope="col" className="px-2 py-1.5 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative py-1.5 pl-2 pr-3 text-right text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-[10px] text-slate-500">Loading employees...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-[10px] text-slate-500">No employees found.</td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="whitespace-nowrap py-1.5 pl-3 pr-2">
                      <div className="flex items-center">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden border border-slate-200 text-[10px]">
                          {employee.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={employee.photoUrl} alt={employee.fullName} className="h-full w-full object-cover" />
                          ) : (
                            (employee.fullName || 'U').charAt(0)
                          )}
                        </div>
                        <div className="ml-2">
                          <div className="font-semibold text-slate-900 text-[10px]">{employee.fullName}</div>
                          <div className="text-slate-500 text-[8px] mt-0.5">{employee.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-[10px] text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        {employee.idNumber && (
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-2.5 w-2.5 text-slate-400" />
                            <span>{employee.idNumber}</span>
                          </div>
                        )}
                        {employee.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5 text-slate-400" />
                            <span>{employee.startDate}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-[10px]">
                      <div className="flex flex-col gap-0.5">
                        {employee.department && (
                          <span className="inline-flex w-max items-center rounded-md bg-blue-50 px-1 py-0.5 text-[8px] font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
                            {employee.department}
                          </span>
                        )}
                        {employee.category && (
                          <span className="inline-flex w-max items-center rounded-md bg-purple-50 px-1 py-0.5 text-[8px] font-medium text-purple-700 ring-1 ring-inset ring-purple-600/10">
                            {employee.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-[10px]">
                      <div className="font-medium text-slate-700">{employee.jobTitle}</div>
                      <div className="text-slate-500 text-[8px] mt-0.5">{employee.branch}</div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-[10px] text-slate-600">
                      {employee.mobileNumber && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5 text-slate-400" />
                          <span>{employee.mobileNumber}</span>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-[10px]">
                      <span className={`inline-flex items-center rounded-md px-1 py-0.5 text-[8px] font-medium ring-1 ring-inset ${
                        employee.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                        employee.status === 'On Leave' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' :
                        'bg-rose-50 text-rose-700 ring-rose-600/10'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-1.5 pl-2 pr-3 text-right text-[10px] font-medium">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/employees/${employee.id}`} className="text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit className="h-3 w-3" />
                          <span className="sr-only">Edit, {employee.fullName}</span>
                        </Link>
                        <button onClick={() => handleDelete(employee.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="h-3 w-3" />
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-4 text-center text-[10px] text-slate-500">Loading employees...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="col-span-full py-4 text-center text-[10px] text-slate-500">No employees found.</div>
          ) : (
            filteredEmployees.map((employee) => (
              <div key={employee.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden border border-slate-200 text-sm">
                      {employee.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={employee.photoUrl} alt={employee.fullName} className="h-full w-full object-cover" />
                      ) : (
                        (employee.fullName || 'U').charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">{employee.fullName}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">{employee.employeeCode}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-inset ${
                    employee.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                    employee.status === 'On Leave' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' :
                    'bg-rose-50 text-rose-700 ring-rose-600/10'
                  }`}>
                    {employee.status}
                  </span>
                </div>
                
                <div className="space-y-1.5 text-[10px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3 text-slate-400" />
                    <span className="truncate">{employee.jobTitle}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{employee.mobileNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>Started: {employee.startDate || 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {employee.department && (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">
                        {employee.department}
                      </span>
                    )}
                    {employee.branch && (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                        {employee.branch}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/employees/${employee.id}`} className="p-1 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded">
                      <Edit className="h-3 w-3" />
                    </Link>
                    <button onClick={() => handleDelete(employee.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 rounded">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
