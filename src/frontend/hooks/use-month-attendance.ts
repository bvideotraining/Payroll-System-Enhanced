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

export function useMonthAttendance(yearMonth: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !yearMonth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecords([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-31`;

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
      console.error("Error fetching month attendance:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, yearMonth]);

  return {
    records,
    loading,
    error
  };
}
