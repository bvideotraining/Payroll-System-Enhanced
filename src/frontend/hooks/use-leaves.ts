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
import { db, handleFirestoreError, OperationType } from '@/src/frontend/lib/firebase';
import { LeaveRequest, LeaveBalance } from '@/src/frontend/types/leave';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';
import { NotificationService } from '@/src/frontend/lib/notification-service';
import { useEmployees } from './use-employees';

export function useLeaves() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { employees } = useEmployees();

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
      handleFirestoreError(err, OperationType.GET, 'leaves');
    });

    const unsubscribeBalances = onSnapshot(balancesQuery, (snapshot) => {
      const recs: LeaveBalance[] = [];
      snapshot.forEach((doc) => {
        recs.push({ ...doc.data(), employeeId: doc.id } as LeaveBalance);
      });
      setBalances(recs);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'leaveBalances');
    });

    return () => {
      unsubscribeLeaves();
      unsubscribeBalances();
    };
  }, [user]);

  const addLeave = async (leave: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRef = doc(collection(db, 'leaves'));
      const newLeave: any = {
        ...leave,
        id: newRef.id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Remove undefined fields
      Object.keys(newLeave).forEach(key => {
        if (newLeave[key] === undefined) {
          delete newLeave[key];
        }
      });

      await setDoc(newRef, newLeave);
      
      // Trigger notification
      const emp = employees.find(e => e.id === leave.employeeId);
      const empName = emp ? emp.fullName : 'An employee';
      await NotificationService.notifyLeavePending(empName, leave.leaveType);
      await NotificationService.notifySystemAdmin('Leave Created', `${empName} requested ${leave.leaveType} leave.`);

      return newLeave as LeaveRequest;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'leaves');
    }
  };

  const updateLeave = async (id: string, updates: Partial<LeaveRequest>) => {
    try {
      const ref = doc(db, 'leaves', id);
      const updateData: any = { ...updates, updatedAt: Date.now() };
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await setDoc(ref, updateData, { merge: true });
      await NotificationService.notifySystemAdmin('Leave Updated', `Leave request ${id} was updated.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `leaves/${id}`);
    }
  };

  const deleteLeave = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'leaves', id));
      await NotificationService.notifySystemAdmin('Leave Deleted', `Leave request ${id} was deleted.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `leaves/${id}`);
    }
  };

  const updateBalance = async (employeeId: string, updates: Partial<LeaveBalance>) => {
    try {
      const ref = doc(db, 'leaveBalances', employeeId);
      const updateData: any = { ...updates };
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await setDoc(ref, updateData, { merge: true });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `leaveBalances/${employeeId}`);
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
