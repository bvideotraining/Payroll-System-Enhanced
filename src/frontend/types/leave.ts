export type LeaveType = 'Annual' | 'Casual' | 'Sick' | 'Maternity' | 'Unpaid' | 'Death' | 'Lieu';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  duration: number; // calculated days
  attachmentUrl?: string; // required for sick leave
  status: LeaveStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LeaveBalance {
  employeeId: string;
  annual: number;
  casual: number;
  sick: number;
  maternity: number;
  unpaid: number;
  death: number;
  lieu: number;
  year: number;
}
