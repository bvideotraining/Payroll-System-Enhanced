export interface SalaryConfig {
  id: string;
  employeeId: string;
  monthRangeId: string;
  basicSalary: number;
  increaseAmount?: number;
  grossSalary?: number;
  totalSalary?: number;
  dailyRate?: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
}

export interface CashAdvance {
  id: string;
  employeeId: string;
  amount: number;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  reason: string;
  repaymentMonth: string; // monthRangeId
  installments?: number;
}

export interface SalaryIncrease {
  id: string;
  employeeId: string;
  amount: number;
  monthRangeId: string;
  status: 'Scheduled' | 'Applied';
  appliedAt?: string;
  createdAt: number;
}

export interface Payroll {
  id: string;
  employeeId: string;
  monthRangeId: string;
  basicSalary: number;
  increaseAmount?: number;
  grossSalary?: number;
  totalSalary?: number;
  totalAllowances: number;
  totalDeductions: number;
  attendancePenalties: number;
  cashAdvanceDeduction: number;
  unpaidLeaveDeduction?: number;
  bonus: number;
  netSalary: number;
  status: 'Draft' | 'Published' | 'Paid';
  generatedAt: string;
  
  // Granular fields for reporting
  dailyWage?: number;
  latePenaltyAmount?: number;
  absencePenaltyAmount?: number;
  socialInsuranceAmount?: number;
  medicalInsuranceAmount?: number;
}
