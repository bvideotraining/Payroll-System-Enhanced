/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';
import { AttendanceRecord } from '@/src/frontend/types/attendance';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';

export function useAttendanceRange(startDate: string, endDate: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !startDate || !endDate) {
      setRecords([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'attendance'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs: AttendanceRecord[] = [];
      snapshot.forEach((doc) => {
        recs.push({ ...doc.data(), id: doc.id } as AttendanceRecord);
      });
      setRecords(recs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching attendance range:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, startDate, endDate]);

  return {
    records,
    loading,
    error
  };
}
