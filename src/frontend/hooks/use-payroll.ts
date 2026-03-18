/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SalaryConfig, CashAdvance, Payroll } from '../types/payroll';
import { useAuthStore } from '../store/use-auth-store';

export function usePayroll() {
  const [salaryConfigs, setSalaryConfigs] = useState<SalaryConfig[]>([]);
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setSalaryConfigs([]);
      setCashAdvances([]);
      setPayrolls([]);
      setLoading(false);
      return;
    }

    const unsubSalary = onSnapshot(collection(db, 'salaryConfigs'), (snapshot) => {
      setSalaryConfigs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalaryConfig)));
    }, (error) => console.error("Error fetching salaryConfigs:", error));

    const unsubAdvances = onSnapshot(collection(db, 'cashAdvances'), (snapshot) => {
      setCashAdvances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CashAdvance)));
    }, (error) => console.error("Error fetching cashAdvances:", error));

    const unsubPayrolls = onSnapshot(collection(db, 'payrolls'), (snapshot) => {
      setPayrolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching payrolls:", error);
      setLoading(false);
    });

    return () => {
      unsubSalary();
      unsubAdvances();
      unsubPayrolls();
    };
  }, [user]);

  // Salary Config Actions
  const saveSalaryConfig = async (config: Omit<SalaryConfig, 'id'> & { id?: string }) => {
    const id = config.id || config.employeeId; // One config per employee
    await setDoc(doc(db, 'salaryConfigs', id), config, { merge: true });
  };

  // Cash Advance Actions
  const addCashAdvance = async (advance: Omit<CashAdvance, 'id'>) => {
    await addDoc(collection(db, 'cashAdvances'), advance);
  };

  const updateCashAdvanceStatus = async (id: string, status: CashAdvance['status']) => {
    await setDoc(doc(db, 'cashAdvances', id), { status }, { merge: true });
  };

  const deleteCashAdvance = async (id: string) => {
    await deleteDoc(doc(db, 'cashAdvances', id));
  };

  // Payroll Actions
  const generatePayroll = async (payroll: Omit<Payroll, 'id' | 'generatedAt'>) => {
    const id = `${payroll.employeeId}_${payroll.monthRangeId}`;
    await setDoc(doc(db, 'payrolls', id), {
      ...payroll,
      generatedAt: new Date().toISOString()
    });
  };

  const updatePayrollStatus = async (id: string, status: Payroll['status']) => {
    await setDoc(doc(db, 'payrolls', id), { status }, { merge: true });
  };

  const deletePayroll = async (id: string) => {
    await deleteDoc(doc(db, 'payrolls', id));
  };

  return {
    salaryConfigs, saveSalaryConfig,
    cashAdvances, addCashAdvance, updateCashAdvanceStatus, deleteCashAdvance,
    payrolls, generatePayroll, updatePayrollStatus, deletePayroll,
    loading
  };
}
