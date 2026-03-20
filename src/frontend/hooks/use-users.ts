/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, firebaseConfig, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from '../store/use-auth-store';
import { NotificationService } from '../lib/notification-service';

export interface AppUser {
  id: string;
  email: string;
  role: string;
  employeeId: string;
  status: 'Active' | 'Inactive';
  requiresPasswordChange?: boolean;
  createdAt: number;
  updatedAt: number;
}

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const saveUser = async (user: Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, password?: string) => {
    const isNew = !user.id;
    let id = user.id;
    const now = Date.now();

    if (isNew && password) {
      // Use a secondary Firebase app to create the user so the admin doesn't get logged out
      const secondaryAppName = 'SecondaryApp';
      const secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, user.email, password);
        id = userCredential.user.uid;
        await secondaryAuth.signOut();
      } catch (error) {
        console.error("Error creating user in Firebase Auth:", error);
        throw error;
      }
    } else if (isNew) {
      id = Date.now().toString(); // Fallback if no password provided, though not ideal for real auth
    }
    
    const userData = {
      ...user,
      updatedAt: now,
      ...(isNew ? { createdAt: now, requiresPasswordChange: true } : {})
    };

    if (id) {
      const cleanUserData = JSON.parse(JSON.stringify(userData));
      try {
        await setDoc(doc(db, 'users', id), cleanUserData, { merge: true });
        await NotificationService.notifySystemAdmin(isNew ? 'User Created' : 'User Updated', `User ${user.email} was ${isNew ? 'created' : 'updated'}.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${id}`);
      }
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      await NotificationService.notifySystemAdmin('User Deleted', `User ${id} was deleted.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  return {
    users,
    loading,
    saveUser,
    deleteUser
  };
}
