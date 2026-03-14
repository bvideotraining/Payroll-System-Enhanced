export const EMPLOYEE_CATEGORIES = ['White Collar', 'Blue Collar', 'Management', 'Part Time'];

export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated';

export interface EmployeeDocument {
  id: string;
  type: string;
  receivedDate: string;
  expiryDate: string;
  notes?: string;
  fileUrl?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  employeeCode: string;
  idNumber: string;
  dateOfBirth: string;
  mobileNumber: string;
  
  category: string;
  branch: string;
  jobTitle: string;
  salary: number;
  startDate: string;
  resignDate?: string;
  
  status: EmployeeStatus;
  photoUrl?: string;
  documents?: EmployeeDocument[];

  // Legacy fields for backward compatibility
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  role?: string;
  joinDate?: string;

  createdAt?: number;
  updatedAt?: number;
}
