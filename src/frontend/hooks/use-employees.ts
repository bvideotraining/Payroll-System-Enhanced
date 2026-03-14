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
import { db } from '@/src/frontend/lib/firebase';
import { Employee } from '@/src/frontend/types/employee';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmployees([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      console.error("Error fetching employees:", err);
      setError(err.message);
      setLoading(false);
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
      
      const setDocPromise = setDoc(newDocRef, {
        ...employeeData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      await Promise.race([setDocPromise, timeoutPromise]);
      return newDocRef.id;
    } catch (err: any) {
      console.error("Error adding employee:", err);
      throw new Error(err.message || "Failed to add employee");
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      const docRef = doc(db, 'employees', id);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Please check if Firestore Database is created in your Firebase Console and rules are set.')), 10000)
      );
      
      const updateDocPromise = updateDoc(docRef, {
        ...employeeData,
        updatedAt: Date.now()
      });

      await Promise.race([updateDocPromise, timeoutPromise]);
    } catch (err: any) {
      console.error("Error updating employee:", err);
      throw new Error(err.message || "Failed to update employee");
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out. Please check if Firestore Database is created in your Firebase Console and rules are set.')), 10000)
      );
      const deleteDocPromise = deleteDoc(doc(db, 'employees', id));
      await Promise.race([deleteDocPromise, timeoutPromise]);
    } catch (err: any) {
      console.error("Error deleting employee:", err);
      throw new Error(err.message || "Failed to delete employee");
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
      console.error("Error getting employee:", err);
      throw new Error(err.message || "Failed to get employee");
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
