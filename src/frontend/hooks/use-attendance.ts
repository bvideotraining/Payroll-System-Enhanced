import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where,
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';
import { AttendanceRecord, AttendanceStatus } from '@/src/frontend/types/attendance';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';

export function useAttendance(date: string) {
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !date) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecords({});
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'attendance'),
      where('date', '==', date)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs: Record<string, AttendanceRecord> = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as AttendanceRecord;
        recs[data.employeeId] = { ...data, id: doc.id };
      });
      setRecords(recs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching attendance:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, date]);

  const markAttendance = async (employeeId: string, status: AttendanceStatus, additionalData?: Partial<AttendanceRecord>) => {
    try {
      const existingRecord = records[employeeId];
      
      if (existingRecord) {
        const docRef = doc(db, 'attendance', existingRecord.id);
        await updateDoc(docRef, {
          status,
          ...additionalData,
          updatedAt: Date.now()
        });
      } else {
        const newDocRef = doc(collection(db, 'attendance'));
        await setDoc(newDocRef, {
          employeeId,
          date,
          status,
          ...additionalData,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    } catch (err: any) {
      console.error("Error marking attendance:", err);
      throw new Error(err.message || "Failed to mark attendance");
    }
  };

  return {
    records,
    loading,
    error,
    markAttendance
  };
}
