import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Branch, Department, JobTitle, Branding, MonthRange, AttendanceRule } from '../types/organization';

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

  useEffect(() => {
    const unsubBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
      setBranches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch)));
    });

    const unsubDepartments = onSnapshot(collection(db, 'departments'), (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
    });

    const unsubJobTitles = onSnapshot(collection(db, 'jobTitles'), (snapshot) => {
      setJobTitles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobTitle)));
    });

    const unsubMonthRanges = onSnapshot(collection(db, 'monthRanges'), (snapshot) => {
      setMonthRanges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonthRange)));
    });

    const unsubAttendanceRules = onSnapshot(collection(db, 'attendanceRules'), (snapshot) => {
      setAttendanceRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRule)));
    });

    const unsubBranding = onSnapshot(doc(db, 'organization', 'branding'), (docSnap) => {
      if (docSnap.exists()) {
        setBranding(docSnap.data() as Branding);
      } else {
        setBranding(initialBranding);
      }
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
  }, []);

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

  const addAttendanceRule = async (categoryName: string, startTime: string, type: AttendanceRule['type']) => {
    const id = Date.now().toString();
    await setDoc(doc(db, 'attendanceRules', id), { categoryName, startTime, type });
  };
  const updateAttendanceRule = async (id: string, categoryName: string, startTime: string, type: AttendanceRule['type']) => {
    await setDoc(doc(db, 'attendanceRules', id), { categoryName, startTime, type }, { merge: true });
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
