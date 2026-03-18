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
import { SocialInsurance } from '../types/insurance';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';

export function useSocialInsurance() {
  const [socialInsurances, setSocialInsurances] = useState<SocialInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setSocialInsurances([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'social_insurances'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const insurances: SocialInsurance[] = [];
      snapshot.forEach((doc) => {
        insurances.push({ id: doc.id, ...doc.data() } as SocialInsurance);
      });
      setSocialInsurances(insurances);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching social insurances:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addSocialInsurance = async (insurance: Omit<SocialInsurance, 'id'>) => {
    try {
      const newDocRef = doc(collection(db, 'social_insurances'));
      await setDoc(newDocRef, {
        ...insurance,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return newDocRef.id;
    } catch (err: any) {
      console.error("Error adding social insurance:", err);
      throw new Error(err.message || "Failed to add social insurance");
    }
  };

  const updateSocialInsurance = async (id: string, updates: Partial<SocialInsurance>) => {
    try {
      const docRef = doc(db, 'social_insurances', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (err: any) {
      console.error("Error updating social insurance:", err);
      throw new Error(err.message || "Failed to update social insurance");
    }
  };

  const deleteSocialInsurance = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'social_insurances', id));
    } catch (err: any) {
      console.error("Error deleting social insurance:", err);
      throw new Error(err.message || "Failed to delete social insurance");
    }
  };

  return {
    socialInsurances,
    loading,
    error,
    addSocialInsurance,
    updateSocialInsurance,
    deleteSocialInsurance
  };
}
