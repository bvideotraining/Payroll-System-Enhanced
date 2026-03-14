export interface MonthRange {
  id: string;
  month: string;
  startDate: string;
  endDate: string;
}

export interface Branch {
  id: string;
  name: string;
}

export type DepartmentType = 'Operation' | 'Non-Operation';

export interface Department {
  id: string;
  name: string;
  type: DepartmentType;
}

export type JobTitleType = string;

export interface JobTitle {
  id: string;
  title: string;
  type: JobTitleType;
  departmentId: string;
}

export type AttendanceType = 'Fixed' | 'Flexible';

export interface AttendanceRule {
  id: string;
  categoryName: string;
  startTime: string;
  type: AttendanceType;
}

export interface Branding {
  appName: string;
  logoUrl: string;
}
