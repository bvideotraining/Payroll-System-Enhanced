export interface BonusEntry {
  id: string;
  employeeId: string;
  monthRangeId: string; // Link to organization month ranges
  saturdayShift: number;
  dutyAllowance: number;
  pottyTraining: number;
  afterSchool: number;
  transportation: number;
  extraBonus: number;
  totalBonus: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
}
