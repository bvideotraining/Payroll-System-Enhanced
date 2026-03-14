import { useEffect } from 'react';
import { auth } from '@/src/frontend/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail, 
  signOut 
} from 'firebase/auth';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';

export function useAuth() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  return {
    login: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    loginWithGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()),
    resetPassword: (email: string) => sendPasswordResetEmail(auth, email),
    logout: () => signOut(auth),
  };
}
