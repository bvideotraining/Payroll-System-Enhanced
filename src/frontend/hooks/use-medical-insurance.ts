import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';
import { MedicalInsurance } from '../types/insurance';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';

export function useMedicalInsurance() {
  const [medicalInsurances, setMedicalInsurances] = useState<MedicalInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setMedicalInsurances([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'medical_insurances'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const insurances: MedicalInsurance[] = [];
      snapshot.forEach((doc) => {
        insurances.push({ id: doc.id, ...doc.data() } as MedicalInsurance);
      });
      setMedicalInsurances(insurances);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching medical insurances:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addMedicalInsurance = async (insurance: Omit<MedicalInsurance, 'id'>) => {
    try {
      const newDocRef = doc(collection(db, 'medical_insurances'));
      await setDoc(newDocRef, {
        ...insurance,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return newDocRef.id;
    } catch (err: any) {
      console.error("Error adding medical insurance:", err);
      throw new Error(err.message || "Failed to add medical insurance");
    }
  };

  const updateMedicalInsurance = async (id: string, updates: Partial<MedicalInsurance>) => {
    try {
      const docRef = doc(db, 'medical_insurances', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (err: any) {
      console.error("Error updating medical insurance:", err);
      throw new Error(err.message || "Failed to update medical insurance");
    }
  };

  const deleteMedicalInsurance = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'medical_insurances', id));
    } catch (err: any) {
      console.error("Error deleting medical insurance:", err);
      throw new Error(err.message || "Failed to delete medical insurance");
    }
  };

  return {
    medicalInsurances,
    loading,
    error,
    addMedicalInsurance,
    updateMedicalInsurance,
    deleteMedicalInsurance
  };
}
