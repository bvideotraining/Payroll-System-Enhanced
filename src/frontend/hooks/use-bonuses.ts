/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BonusEntry } from '../types/bonus';
import { AttendanceRecord } from '../types/attendance';
import { Employee } from '../types/employee';
import { useAuthStore } from '../store/use-auth-store';

export function useBonuses(monthRangeId?: string) {
  const [bonuses, setBonuses] = useState<BonusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !monthRangeId) {
      setBonuses([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'bonuses'),
      where('monthRangeId', '==', monthRangeId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BonusEntry));
      setBonuses(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bonuses:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, monthRangeId]);

  const saveBonus = async (bonus: Omit<BonusEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const id = bonus.id || doc(collection(db, 'bonuses')).id;
    const now = Date.now();
    
    const data = {
      ...bonus,
      id,
      updatedAt: now,
      createdAt: bonus.id ? undefined : now,
    };

    // Remove undefined fields for Firestore
    Object.keys(data).forEach(key => (data as any)[key] === undefined && delete (data as any)[key]);

    await setDoc(doc(db, 'bonuses', id), data, { merge: true });
  };

  const deleteBonus = async (id: string) => {
    await deleteDoc(doc(db, 'bonuses', id));
  };

  const calculateSaturdayBonus = async (employee: Employee, startDate: string, endDate: string) => {
    // Only helper or cleaner
    const jobTitle = employee.jobTitle.toLowerCase();
    if (!jobTitle.includes('helper') && !jobTitle.includes('cleaner')) {
      return 0;
    }

    const rate = jobTitle.includes('helper') ? 200 : 100;

    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', employee.id),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      where('status', '==', 'Present')
    );

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => doc.data() as AttendanceRecord);

    // Filter for Saturdays
    const saturdayCount = records.filter(record => {
      const date = new Date(record.date);
      return date.getDay() === 6; // 6 is Saturday
    }).length;

    return saturdayCount * rate;
  };

  return {
    bonuses,
    loading,
    saveBonus,
    deleteBonus,
    calculateSaturdayBonus
  };
}
