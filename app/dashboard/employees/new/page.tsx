'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { EmployeeStatus, EmployeeDocument, EMPLOYEE_CATEGORIES } from '@/src/frontend/types/employee';
import { ArrowLeft, User, Briefcase, FileText, Trash2 } from 'lucide-react';

export default function NewEmployeePage() {
  const router = useRouter();
  const { addEmployee } = useEmployees();
  const { departments, branches, jobTitles, loading: orgLoading } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [formData, setFormData] = useState({
    fullName: '',
    employeeCode: '',
    idNumber: '',
    dateOfBirth: '',
    mobileNumber: '',
    category: '',
    department: '',
    branch: '',
    jobTitle: '',
    salary: '' as string | number,
    startDate: today,
    resignDate: '',
    status: 'Active' as EmployeeStatus,
    photoUrl: '',
    documents: [] as EmployeeDocument[],
  });

  // Update initial select values when org data loads
  useEffect(() => {
    if (!orgLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({
        ...prev,
        category: prev.category || EMPLOYEE_CATEGORIES[0],
        department: prev.department || (departments.length > 0 ? departments[0].name : ''),
        branch: prev.branch || (branches.length > 0 ? branches[0].name : ''),
        jobTitle: prev.jobTitle || (jobTitles.length > 0 ? jobTitles[0].title : ''),
      }));
    }
  }, [orgLoading, departments, branches, jobTitles]);

  const [docForm, setDocForm] = useState({
    type: '',
    receivedDate: '',
    expiryDate: '',
    notes: '',
    fileUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDocForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocForm(prev => ({ ...prev, fileUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addDocument = () => {
    if (!docForm.type || !docForm.receivedDate || !docForm.expiryDate) return;
    
    const newDoc: EmployeeDocument = {
      id: Math.random().toString(36).substring(7),
      ...docForm
    };
    
    setFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc]
    }));
    
    setDocForm({ type: '', receivedDate: '', expiryDate: '', notes: '', fileUrl: '' });
  };

  const removeDocument = (id: string) => {
    setFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(d => d.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const submitData = { ...formData, salary: Number(formData.salary) || 0 };
      await addEmployee(submitData);
      router.push('/dashboard/employees');
    } catch (err: any) {
      setError(err.message || 'Failed to add employee');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Add New Employee</h1>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4 border-b pb-2">
              <User className="h-5 w-5 text-indigo-600" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-12">
              <div className="sm:col-span-3 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 relative overflow-hidden group">
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2 relative">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <Label htmlFor="photoUpload" className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  Upload Photo
                </Label>
                <input 
                  id="photoUpload"
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              <div className="sm:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" required value={formData.fullName} onChange={handleChange} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="employeeCode">Employee Code</Label>
                  <Input id="employeeCode" name="employeeCode" required value={formData.employeeCode} onChange={handleChange} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input id="idNumber" name="idNumber" required value={formData.idNumber} onChange={handleChange} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" required value={formData.dateOfBirth} onChange={handleChange} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input id="mobileNumber" name="mobileNumber" required value={formData.mobileNumber} onChange={handleChange} className="mt-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4 border-b pb-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              Employment Details
            </h2>
            
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {EMPLOYEE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  name="department"
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.department}
                  onChange={handleChange}
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="branch">Branch</Label>
                <select
                  id="branch"
                  name="branch"
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.branch}
                  onChange={handleChange}
                >
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <select
                  id="jobTitle"
                  name="jobTitle"
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.jobTitle}
                  onChange={handleChange}
                >
                  {jobTitles.map(job => (
                    <option key={job.id} value={job.title}>{job.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="salary">Current Salary (EGP)</Label>
                <Input id="salary" name="salary" type="number" min="0" required value={formData.salary} onChange={handleChange} className="mt-2" />
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" required value={formData.startDate} onChange={handleChange} className="mt-2" />
              </div>

              <div>
                <Label htmlFor="resignDate">Resign Date (Optional)</Label>
                <Input id="resignDate" name="resignDate" type="date" value={formData.resignDate} onChange={handleChange} className="mt-2" />
              </div>
            </div>
          </div>

          {/* Employee File / Documents */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4 border-b pb-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Employee File / Documents
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-3">
                  <Label htmlFor="docType" className="text-xs">Document Type</Label>
                  <Input id="docType" name="type" placeholder="e.g. Contract" value={docForm.type} onChange={handleDocChange} className="mt-1" />
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor="docReceived" className="text-xs">Received Date</Label>
                  <Input id="docReceived" name="receivedDate" type="date" value={docForm.receivedDate} onChange={handleDocChange} className="mt-1" />
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor="docExpiry" className="text-xs">Expiry Date</Label>
                  <Input id="docExpiry" name="expiryDate" type="date" value={docForm.expiryDate} onChange={handleDocChange} className="mt-1" />
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor="docFile" className="text-xs">Attachment</Label>
                  <Input id="docFile" type="file" onChange={handleDocFileChange} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-9">
                  <Label htmlFor="docNotes" className="text-xs">Notes (Optional)</Label>
                  <Input id="docNotes" name="notes" placeholder="Notes..." value={docForm.notes} onChange={handleDocChange} className="mt-1" />
                </div>
                <div className="sm:col-span-3">
                  <Button type="button" onClick={addDocument} className="w-full bg-slate-800 hover:bg-slate-900">
                    Add Document
                  </Button>
                </div>
              </div>
            </div>

            {formData.documents && formData.documents.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attachment</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.type}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{doc.receivedDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{doc.expiryDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{doc.notes}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                              View
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <button type="button" onClick={() => removeDocument(doc.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-x-4 pt-6 border-t border-gray-100">
            <Link href="/dashboard/employees">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
