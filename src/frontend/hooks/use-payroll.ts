/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { SalaryConfig, CashAdvance, Payroll, SalaryIncrease } from '../types/payroll';
import { useAuthStore } from '../store/use-auth-store';
import { NotificationService } from '../lib/notification-service';
import { useEmployees } from './use-employees';

export function usePayroll() {
  const [salaryConfigs, setSalaryConfigs] = useState<SalaryConfig[]>([]);
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [salaryIncreases, setSalaryIncreases] = useState<SalaryIncrease[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { employees } = useEmployees();

  useEffect(() => {
    if (!user) {
      setSalaryConfigs([]);
      setCashAdvances([]);
      setPayrolls([]);
      setSalaryIncreases([]);
      setLoading(false);
      return;
    }

    const unsubSalary = onSnapshot(collection(db, 'salaryConfigs'), (snapshot) => {
      setSalaryConfigs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalaryConfig)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'salaryConfigs');
    });

    const unsubAdvances = onSnapshot(collection(db, 'cashAdvances'), (snapshot) => {
      setCashAdvances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CashAdvance)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'cashAdvances');
    });

    const unsubPayrolls = onSnapshot(collection(db, 'payrolls'), (snapshot) => {
      setPayrolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'payrolls');
    });

    const unsubIncreases = onSnapshot(collection(db, 'salary_increases'), (snapshot) => {
      setSalaryIncreases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalaryIncrease)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'salary_increases');
      setLoading(false);
    });

    return () => {
      unsubSalary();
      unsubAdvances();
      unsubPayrolls();
      unsubIncreases();
    };
  }, [user]);

  // Salary Config Actions
  const saveSalaryConfig = async (config: Omit<SalaryConfig, 'id'> & { id?: string }) => {
    try {
      const id = config.id || `${config.employeeId}_${config.monthRangeId}`;
      await setDoc(doc(db, 'salaryConfigs', id), config, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'salaryConfigs');
    }
  };

  const deleteSalaryConfig = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'salaryConfigs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'salaryConfigs');
    }
  };

  // Cash Advance Actions
  const addCashAdvance = async (advance: Omit<CashAdvance, 'id'>) => {
    try {
      await addDoc(collection(db, 'cashAdvances'), advance);
      const emp = employees.find(e => e.id === advance.employeeId);
      const empName = emp ? emp.fullName : 'An employee';
      await NotificationService.notifySystemAdmin('Cash Advance Created', `Cash advance requested for ${empName}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cashAdvances');
    }
  };

  const updateCashAdvanceStatus = async (id: string, status: CashAdvance['status']) => {
    try {
      await setDoc(doc(db, 'cashAdvances', id), { status }, { merge: true });
      
      const advance = cashAdvances.find(a => a.id === id);
      if (advance && status === 'Approved') {
        const emp = employees.find(e => e.id === advance.employeeId);
        const empName = emp ? emp.fullName : 'An employee';
        await NotificationService.notifyCashAdvanceApproved(empName, advance.amount);
      }
      
      await NotificationService.notifySystemAdmin('Cash Advance Updated', `Cash advance ${id} status changed to ${status}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'cashAdvances');
    }
  };

  const deleteCashAdvance = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cashAdvances', id));
      await NotificationService.notifySystemAdmin('Cash Advance Deleted', `Cash advance ${id} was deleted.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'cashAdvances');
    }
  };

  // Payroll Actions
  const generatePayroll = async (payroll: Omit<Payroll, 'id' | 'generatedAt'>) => {
    try {
      const id = `${payroll.employeeId}_${payroll.monthRangeId}`;
      await setDoc(doc(db, 'payrolls', id), {
        ...payroll,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'payrolls');
    }
  };

  const updatePayrollStatus = async (id: string, status: Payroll['status']) => {
    try {
      await setDoc(doc(db, 'payrolls', id), { status }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'payrolls');
    }
  };

  const deletePayroll = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payrolls', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'payrolls');
    }
  };

  // Salary Increase Actions
  const scheduleSalaryIncrease = async (increase: Omit<SalaryIncrease, 'id'>) => {
    try {
      await addDoc(collection(db, 'salary_increases'), increase);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'salary_increases');
    }
  };

  const applySalaryIncrease = async (increaseId: string, employeeId: string, increaseAmount: number, monthRangeId: string) => {
    try {
      // Update the increase record
      await setDoc(doc(db, 'salary_increases', increaseId), { 
        status: 'Applied', 
        appliedAt: new Date().toISOString() 
      }, { merge: true });

      // Update the salary config for that specific month
      const existingConfig = salaryConfigs.find(c => c.employeeId === employeeId && c.monthRangeId === monthRangeId);
      if (existingConfig) {
        const currentIncrease = existingConfig.increaseAmount || 0;
        const newIncreaseAmount = currentIncrease + increaseAmount;
        const newGrossSalary = existingConfig.basicSalary + newIncreaseAmount;
        const totalAllowances = (existingConfig.allowances || []).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
        const newTotalSalary = newGrossSalary + totalAllowances;
        
        await setDoc(doc(db, 'salaryConfigs', existingConfig.id), { 
          increaseAmount: newIncreaseAmount,
          grossSalary: newGrossSalary,
          totalSalary: newTotalSalary
        }, { merge: true });
      } else {
        // Create a new config for this month if it doesn't exist
        await setDoc(doc(db, 'salaryConfigs', `${employeeId}_${monthRangeId}`), { 
          employeeId, 
          monthRangeId,
          basicSalary: 0,
          increaseAmount: increaseAmount,
          grossSalary: increaseAmount,
          totalSalary: increaseAmount,
          allowances: [],
          deductions: []
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'salary_increases');
    }
  };

  const deleteSalaryIncrease = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'salary_increases', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'salary_increases');
    }
  };

  const updateSalaryIncrease = async (id: string, data: Partial<SalaryIncrease>) => {
    try {
      await setDoc(doc(db, 'salary_increases', id), data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'salary_increases');
    }
  };

  return {
    salaryConfigs, saveSalaryConfig, deleteSalaryConfig,
    cashAdvances, addCashAdvance, updateCashAdvanceStatus, deleteCashAdvance,
    payrolls, generatePayroll, updatePayrollStatus, deletePayroll,
    salaryIncreases, scheduleSalaryIncrease, applySalaryIncrease, deleteSalaryIncrease, updateSalaryIncrease,
    loading
  };
}
