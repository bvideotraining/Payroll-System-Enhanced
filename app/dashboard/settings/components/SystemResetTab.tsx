'use client';

import { useState } from 'react';
import { Button } from '@/src/frontend/components/ui/button';
import { Input } from '@/src/frontend/components/ui/input';
import { Label } from '@/src/frontend/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/src/frontend/lib/firebase';

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

const COLLECTIONS_TO_DELETE = [
  'users',
  'roles',
  'employees',
  'leaves',
  'leaveBalances',
  'attendance',
  'salaryConfigs',
  'cashAdvances',
  'payrolls',
  'salary_increases',
  'bonuses',
  'branches',
  'departments',
  'jobTitles',
  'monthRanges',
  'attendanceRules',
  'organization',
  'social_insurances',
  'medical_insurances',
  'system'
];

export function SystemResetTab() {
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.email !== 'hr.totscollege@gmail.com') {
      setError('Unauthorized: Only hr.totscollege@gmail.com can perform a system reset.');
      return;
    }

    if (password !== 'Mohamed@Tayam#1974') {
      setError('Invalid reset password.');
      return;
    }

    if (!confirm('CRITICAL WARNING: This will permanently delete ALL data in the system. This action CANNOT be undone. Are you absolutely sure?')) {
      return;
    }
    
    if (!confirm('Are you REALLY sure? All employees, payrolls, and settings will be lost.')) {
      return;
    }

    setIsResetting(true);
    try {
      for (const collectionName of COLLECTIONS_TO_DELETE) {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));
          const deletePromises = querySnapshot.docs.map(docSnapshot => 
            deleteDoc(doc(db, collectionName, docSnapshot.id))
          );
          await Promise.all(deletePromises);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, collectionName);
        }
      }
      setSuccess('System reset completed successfully. All data has been wiped.');
      setPassword('');
    } catch (err: any) {
      console.error('Reset failed:', err);
      let errorMsg = 'An error occurred during system reset. Check console for details.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) errorMsg = `Permission Denied: ${parsed.error}`;
      } catch (e) {}
      setError(errorMsg);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900">Factory Reset System</h3>
            <p className="text-[11px] text-red-700 mt-1 mb-4">
              This action will permanently delete all data from the database, including employees, payrolls, settings, and users. 
              Only the authorized super admin can perform this action.
            </p>

            <form onSubmit={handleReset} className="space-y-4 bg-white p-4 rounded-lg border border-red-100">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-slate-700">Super Admin Email</Label>
                <Input 
                  value={auth.currentUser?.email || 'Not logged in'} 
                  disabled 
                  className="h-8 text-[11px] bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] text-slate-700">Reset Password</Label>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the system reset password"
                  className="h-8 text-[11px]"
                  required
                />
              </div>

              {error && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[10px] rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-2 bg-green-50 border border-green-200 text-green-700 text-[10px] rounded">
                  {success}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isResetting || !password}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-[11px] h-8 gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isResetting ? 'Wiping Data...' : 'Permanently Delete All Data'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
