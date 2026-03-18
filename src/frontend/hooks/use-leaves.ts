/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';
import { LeaveRequest, LeaveBalance } from '@/src/frontend/types/leave';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';

export function useLeaves() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setLeaves([]);
      setBalances([]);
      setLoading(false);
      return;
    }

    const leavesQuery = query(collection(db, 'leaves'));
    const balancesQuery = query(collection(db, 'leaveBalances'));

    const unsubscribeLeaves = onSnapshot(leavesQuery, (snapshot) => {
      const recs: LeaveRequest[] = [];
      snapshot.forEach((doc) => {
        recs.push({ ...doc.data(), id: doc.id } as LeaveRequest);
      });
      setLeaves(recs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching leaves:", err);
      setError(err.message);
      setLoading(false);
    });

    const unsubscribeBalances = onSnapshot(balancesQuery, (snapshot) => {
      const recs: LeaveBalance[] = [];
      snapshot.forEach((doc) => {
        recs.push({ ...doc.data(), employeeId: doc.id } as LeaveBalance);
      });
      setBalances(recs);
    }, (err) => {
      console.error("Error fetching leave balances:", err);
    });

    return () => {
      unsubscribeLeaves();
      unsubscribeBalances();
    };
  }, [user]);

  const addLeave = async (leave: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRef = doc(collection(db, 'leaves'));
      const newLeave: LeaveRequest = {
        ...leave,
        id: newRef.id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(newRef, newLeave);
      return newLeave;
    } catch (err: any) {
      console.error("Error adding leave:", err);
      throw err;
    }
  };

  const updateLeave = async (id: string, updates: Partial<LeaveRequest>) => {
    try {
      const ref = doc(db, 'leaves', id);
      await setDoc(ref, { ...updates, updatedAt: Date.now() }, { merge: true });
    } catch (err: any) {
      console.error("Error updating leave:", err);
      throw err;
    }
  };

  const deleteLeave = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'leaves', id));
    } catch (err: any) {
      console.error("Error deleting leave:", err);
      throw err;
    }
  };

  const updateBalance = async (employeeId: string, updates: Partial<LeaveBalance>) => {
    try {
      const ref = doc(db, 'leaveBalances', employeeId);
      await setDoc(ref, updates, { merge: true });
    } catch (err: any) {
      console.error("Error updating leave balance:", err);
      throw err;
    }
  };

  return {
    leaves,
    balances,
    loading,
    error,
    addLeave,
    updateLeave,
    deleteLeave,
    updateBalance
  };
}
