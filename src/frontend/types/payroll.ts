export interface SalaryConfig {
  id: string;
  employeeId: string;
  basicSalary: number;
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
}

export interface Payroll {
  id: string;
  employeeId: string;
  monthRangeId: string;
  basicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  attendancePenalties: number;
  cashAdvanceDeduction: number;
  unpaidLeaveDeduction?: number;
  bonus: number;
  netSalary: number;
  status: 'Draft' | 'Published' | 'Paid';
  generatedAt: string;
}
