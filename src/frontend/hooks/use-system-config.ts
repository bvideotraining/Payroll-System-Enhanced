/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthStore } from '../store/use-auth-store';

export interface SystemConfig {
  currency: string;
  standardWorkingHours: number;
  weekendDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  autoLeaveApproval: boolean;
}

const initialConfig: SystemConfig = {
  currency: 'EGP',
  standardWorkingHours: 8,
  weekendDays: [5, 6], // Friday, Saturday
  autoLeaveApproval: false,
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig>(initialConfig);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setConfig(initialConfig);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'system', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as SystemConfig);
      } else {
        setConfig(initialConfig);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system/config');
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const updateConfig = async (newConfig: SystemConfig) => {
    try {
      await setDoc(doc(db, 'system', 'config'), newConfig, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'system/config');
    }
  };

  return {
    config,
    updateConfig,
    loading
  };
}
