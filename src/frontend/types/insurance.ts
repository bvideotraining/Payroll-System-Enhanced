export interface SocialInsurance {
  id: string;
  employeeId: string;
  insuranceNumber: string;
  insurableWage: number;
  enrollmentDate: string;
}

export interface MedicalDependent {
  id: string;
  name: string;
  relation: string;
  amount: number;
  startDate: string;
  nationalId: string;
}

export interface MedicalInsurance {
  id: string;
  employeeId: string;
  billingMonth: string;
  monthlyAmount: number;
  startDate: string;
  dependents: MedicalDependent[];
}
