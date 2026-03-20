/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/frontend/lib/firebase';
import { Employee } from '@/src/frontend/types/employee';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';
import { NotificationService } from '@/src/frontend/lib/notification-service';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps: Employee[] = [];
      snapshot.forEach((doc) => {
        emps.push({ id: doc.id, ...doc.data() } as Employee);
      });
      setEmployees(emps);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'employees');
    });

    return () => unsubscribe();
  }, [user]);

  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      const newDocRef = doc(collection(db, 'employees'));
      
      // Add a 10-second timeout to prevent infinite hanging if Firestore isn't set up
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Please check if Firestore Database is created in your Firebase Console and rules are set.')), 10000)
      );
      
      const cleanEmployeeData = JSON.parse(JSON.stringify({
        ...employeeData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));
      
      const setDocPromise = setDoc(newDocRef, cleanEmployeeData);

      await Promise.race([setDocPromise, timeoutPromise]);
      await NotificationService.notifySystemAdmin('Employee Created', `New employee ${employeeData.fullName} was added.`);
      return newDocRef.id;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'employees');
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      const docRef = doc(db, 'employees', id);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Please check if Firestore Database is created in your Firebase Console and rules are set.')), 10000)
      );
      
      const cleanEmployeeData = JSON.parse(JSON.stringify({
        ...employeeData,
        updatedAt: Date.now()
      }));
      
      const updateDocPromise = updateDoc(docRef, cleanEmployeeData);

      await Promise.race([updateDocPromise, timeoutPromise]);
      await NotificationService.notifySystemAdmin('Employee Updated', `Employee ${id} was updated.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `employees/${id}`);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Please check if Firestore Database is created in your Firebase Console and rules are set.')), 10000)
      );
      const deleteDocPromise = deleteDoc(doc(db, 'employees', id));
      await Promise.race([deleteDocPromise, timeoutPromise]);
      
      await NotificationService.notifySystemAdmin('Employee Deleted', `Employee ${id} was deleted.`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `employees/${id}`);
    }
  };

  const getEmployee = useCallback(async (id: string): Promise<Employee | null> => {
    try {
      const docRef = doc(db, 'employees', id);
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Please check if Firestore Database is created in your Firebase Console and rules are set.')), 10000)
      );
      
      const getDocPromise = getDoc(docRef);
      const docSnap = await Promise.race([getDocPromise, timeoutPromise]) as any;
      
      if (docSnap && docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Employee;
      }
      return null;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, `employees/${id}`);
      return null;
    }
  }, []);

  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee
  };
}
