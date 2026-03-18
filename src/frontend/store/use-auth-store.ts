import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  role: string | null;
  employeeId: string | null;
  requiresPasswordChange: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: string | null) => void;
  setEmployeeId: (employeeId: string | null) => void;
  setRequiresPasswordChange: (requiresPasswordChange: boolean) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  employeeId: null,
  requiresPasswordChange: false,
  isLoading: true,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setEmployeeId: (employeeId) => set({ employeeId }),
  setRequiresPasswordChange: (requiresPasswordChange) => set({ requiresPasswordChange }),
  setLoading: (isLoading) => set({ isLoading }),
}));
