/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Branch, Department, JobTitle, Branding, MonthRange, AttendanceRule } from '../types/organization';
import { useAuthStore } from '../store/use-auth-store';

const initialBranding: Branding = {
  appName: "Enterprise HR",
  logoUrl: '',
};

export function useOrganization() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [monthRanges, setMonthRanges] = useState<MonthRange[]>([]);
  const [attendanceRules, setAttendanceRules] = useState<AttendanceRule[]>([]);
  const [branding, setBranding] = useState<Branding>(initialBranding);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setBranches([]);
      setDepartments([]);
      setJobTitles([]);
      setMonthRanges([]);
      setAttendanceRules([]);
      setBranding(initialBranding);
      setLoading(false);
      return;
    }

    const unsubBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
      setBranches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch)));
    }, (error) => console.error("Error fetching branches:", error));

    const unsubDepartments = onSnapshot(collection(db, 'departments'), (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
    }, (error) => console.error("Error fetching departments:", error));

    const unsubJobTitles = onSnapshot(collection(db, 'jobTitles'), (snapshot) => {
      setJobTitles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobTitle)));
    }, (error) => console.error("Error fetching jobTitles:", error));

    const unsubMonthRanges = onSnapshot(collection(db, 'monthRanges'), (snapshot) => {
      setMonthRanges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonthRange)));
    }, (error) => console.error("Error fetching monthRanges:", error));

    const unsubAttendanceRules = onSnapshot(collection(db, 'attendanceRules'), (snapshot) => {
      setAttendanceRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRule)));
    }, (error) => console.error("Error fetching attendanceRules:", error));

    const unsubBranding = onSnapshot(doc(db, 'organization', 'branding'), (docSnap) => {
      if (docSnap.exists()) {
        setBranding(docSnap.data() as Branding);
      } else {
        setBranding(initialBranding);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching branding:", error);
      setLoading(false);
    });

    return () => {
      unsubBranches();
      unsubDepartments();
      unsubJobTitles();
      unsubMonthRanges();
      unsubAttendanceRules();
      unsubBranding();
    };
  }, [user]);

  const addBranch = async (name: string) => {
    const id = Date.now().toString();
    await setDoc(doc(db, 'branches', id), { name });
  };
  const updateBranch = async (id: string, name: string) => {
    await setDoc(doc(db, 'branches', id), { name }, { merge: true });
  };
  const deleteBranch = async (id: string) => {
    await deleteDoc(doc(db, 'branches', id));
  };

  const addDepartment = async (name: string, type: Department['type']) => {
    const id = Date.now().toString();
    await setDoc(doc(db, 'departments', id), { name, type });
  };
  const updateDepartment = async (id: string, name: string, type: Department['type']) => {
    await setDoc(doc(db, 'departments', id), { name, type }, { merge: true });
  };
  const deleteDepartment = async (id: string) => {
    await deleteDoc(doc(db, 'departments', id));
  };

  const addJobTitle = async (title: string, type: JobTitle['type'], departmentId: string) => {
    const id = Date.now().toString();
    await setDoc(doc(db, 'jobTitles', id), { title, type, departmentId });
  };
  const updateJobTitle = async (id: string, title: string, type: JobTitle['type'], departmentId: string) => {
    await setDoc(doc(db, 'jobTitles', id), { title, type, departmentId }, { merge: true });
  };
  const deleteJobTitle = async (id: string) => {
    await deleteDoc(doc(db, 'jobTitles', id));
  };

  const addMonthRange = async (month: string, startDate: string, endDate: string) => {
    const id = Date.now().toString();
    await setDoc(doc(db, 'monthRanges', id), { month, startDate, endDate });
  };
  const updateMonthRange = async (id: string, month: string, startDate: string, endDate: string) => {
    await setDoc(doc(db, 'monthRanges', id), { month, startDate, endDate }, { merge: true });
  };
  const deleteMonthRange = async (id: string) => {
    await deleteDoc(doc(db, 'monthRanges', id));
  };

  const addAttendanceRule = async (
    categoryName: string, 
    startTime: string, 
    type: AttendanceRule['type'], 
    gracePeriodMinutes: number = 60,
    lateDeductionStepMinutes: number = 60,
    lateDeductionDaysPerStep: number = 1,
    absenceDeductionDays: number = 1
  ) => {
    const id = Date.now().toString();
    await setDoc(doc(db, 'attendanceRules', id), { 
      categoryName, 
      startTime, 
      type, 
      gracePeriodMinutes, 
      lateDeductionStepMinutes, 
      lateDeductionDaysPerStep, 
      absenceDeductionDays 
    });
  };
  const updateAttendanceRule = async (
    id: string, 
    categoryName: string, 
    startTime: string, 
    type: AttendanceRule['type'], 
    gracePeriodMinutes: number,
    lateDeductionStepMinutes: number,
    lateDeductionDaysPerStep: number,
    absenceDeductionDays: number
  ) => {
    await setDoc(doc(db, 'attendanceRules', id), { 
      categoryName, 
      startTime, 
      type, 
      gracePeriodMinutes, 
      lateDeductionStepMinutes, 
      lateDeductionDaysPerStep, 
      absenceDeductionDays 
    }, { merge: true });
  };
  const deleteAttendanceRule = async (id: string) => {
    await deleteDoc(doc(db, 'attendanceRules', id));
  };

  const updateBranding = async (newBranding: Branding) => {
    await setDoc(doc(db, 'organization', 'branding'), newBranding);
  };

  return {
    branches, addBranch, updateBranch, deleteBranch,
    departments, addDepartment, updateDepartment, deleteDepartment,
    jobTitles, addJobTitle, updateJobTitle, deleteJobTitle,
    monthRanges, addMonthRange, updateMonthRange, deleteMonthRange,
    attendanceRules, addAttendanceRule, updateAttendanceRule, deleteAttendanceRule,
    branding, updateBranding,
    loading
  };
}
