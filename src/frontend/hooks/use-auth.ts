import { useEffect } from 'react';
import { auth, db } from '@/src/frontend/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail, 
  signOut 
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';

export function useAuth() {
  const { setUser, setRole, setEmployeeId, setRequiresPasswordChange, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && user.email) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setRole(userData.role);
            setEmployeeId(userData.employeeId || null);
            setRequiresPasswordChange(!!userData.requiresPasswordChange);
          } else {
            // Default role if not found in users collection
            setRole('employee');
            setEmployeeId(null);
            setRequiresPasswordChange(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole('employee');
          setEmployeeId(null);
          setRequiresPasswordChange(false);
        }
      } else {
        setRole(null);
        setEmployeeId(null);
        setRequiresPasswordChange(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setRole, setEmployeeId, setRequiresPasswordChange, setLoading]);

  return {
    login: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    loginWithGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()),
    resetPassword: (email: string) => sendPasswordResetEmail(auth, email),
    logout: () => signOut(auth),
  };
}
