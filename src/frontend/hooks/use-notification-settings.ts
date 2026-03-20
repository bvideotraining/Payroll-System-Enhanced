'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/src/frontend/lib/firebase';

export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  systemNotifications: boolean;
  roles: string[];
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'notificationSettings', user.uid);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as NotificationSettings);
      } else {
        // Default settings
        setSettings({
          userId: user.uid,
          emailNotifications: true,
          pushNotifications: true,
          systemNotifications: true,
          roles: []
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'notificationSettings', user.uid);
    try {
      await setDoc(docRef, {
        userId: user.uid,
        ...settings,
        ...newSettings
      }, { merge: true });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  };

  return {
    settings,
    loading,
    updateSettings
  };
}
