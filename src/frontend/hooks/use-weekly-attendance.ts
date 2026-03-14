import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where,
  onSnapshot, 
} from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';
import { AttendanceRecord } from '@/src/frontend/types/attendance';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';

export function useWeeklyAttendance(startDate: string, endDate: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !startDate || !endDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecords([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        recs.push({ ...doc.data() as AttendanceRecord, id: doc.id });
      });
      setRecords(recs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching weekly attendance:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, startDate, endDate]);

  return {
    records,
    loading,
    error,
  };
}
