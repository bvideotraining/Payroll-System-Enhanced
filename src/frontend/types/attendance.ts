export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  excuseMinutes?: number;
  lateMinutes?: number; // Manually entered for flexible rules
  shiftInfo?: string;
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
}
