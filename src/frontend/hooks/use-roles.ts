/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthStore } from '../store/use-auth-store';
import { NotificationService } from '../lib/notification-service';

export interface RolePermission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  scope: 'all' | 'branch' | 'department';
  specificBranch?: string; // Legacy
  specificDepartment?: string; // Legacy
  specificBranches?: string[];
  specificDepartments?: string[];
}

export interface AppRole {
  id: string;
  name: string;
  description: string;
  accessType?: 'full' | 'custom';
  customPermissions?: RolePermission[];
}

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

export function useRoles() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(collection(db, 'roles'), (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppRole)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'roles');
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const saveRole = async (role: Omit<AppRole, 'id'> & { id?: string }) => {
    try {
      const id = role.id || Date.now().toString();
      // Firestore does not support undefined values, so we strip them out
      const cleanRole = JSON.parse(JSON.stringify(role));
      await setDoc(doc(db, 'roles', id), { ...cleanRole, id }, { merge: true });
      await NotificationService.notifySystemAdmin(role.id ? 'Role Updated' : 'Role Created', `Role ${role.name} was ${role.id ? 'updated' : 'created'}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'roles');
    }
  };

  const deleteRole = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'roles', id));
      await NotificationService.notifySystemAdmin('Role Deleted', `Role ${id} was deleted.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `roles/${id}`);
    }
  };

  return {
    roles,
    loading,
    saveRole,
    deleteRole
  };
}
