'use client';

import { useState } from 'react';
import { Button } from '@/src/frontend/components/ui/button';
import { Download, Upload, AlertTriangle, CheckCircle2, Database } from 'lucide-react';
import { collection, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/src/frontend/lib/firebase';
import CryptoJS from 'crypto-js';

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

const COLLECTIONS_TO_BACKUP = [
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

export function BackupRestoreTab() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [password, setPassword] = useState('');
  const [stagedData, setStagedData] = useState<Record<string, any> | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleExport = async () => {
    if (!password) {
      alert('Please enter an encryption password to secure your backup.');
      return;
    }

    setIsExporting(true);
    try {
      const backupData: Record<string, any> = {};

      for (const collectionName of COLLECTIONS_TO_BACKUP) {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));
          const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          backupData[collectionName] = docs;
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, collectionName);
        }
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      
      let blob: Blob;
      let fileName: string;

      if (password === 'Mohamed@Tayam#1974') {
        // Export without encryption if master password is used
        blob = new Blob([jsonString], { type: 'application/json' });
        fileName = `hr_system_backup_${new Date().toISOString().split('T')[0]}.json`;
      } else {
        // Export with encryption for any other password
        const encryptedData = CryptoJS.AES.encrypt(jsonString, password).toString();
        blob = new Blob([encryptedData], { type: 'text/plain' });
        fileName = `hr_system_backup_${new Date().toISOString().split('T')[0]}.enc`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Export failed:', error);
      let errorMsg = 'Failed to export data. Check console for details.';
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) errorMsg = `Permission Denied: ${parsed.error}`;
      } catch (e) {}
      alert(errorMsg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!password) {
      alert('Please enter the decryption password to load this backup.');
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    setImportStatus(null);
    setStagedData(null);

    try {
      const text = await file.text();
      
      let data;
      try {
        const bytes = CryptoJS.AES.decrypt(text, password);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedString) throw new Error('Invalid password or corrupted file');
        data = JSON.parse(decryptedString);
      } catch (e) {
        // Fallback for unencrypted old backups
        try {
           data = JSON.parse(text);
        } catch(err) {
           throw new Error('Failed to decrypt. Incorrect password or invalid file format.');
        }
      }

      setStagedData(data);
      setImportStatus({ type: 'success', message: 'File decrypted and loaded successfully. Click "Sync Restored Data" to restore to database.' });
    } catch (error: any) {
      console.error('Import failed:', error);
      setImportStatus({ type: 'error', message: error.message || 'Failed to load file.' });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleSync = async () => {
    if (!stagedData) return;

    if (!confirm('WARNING: Syncing data will overwrite existing records with the same IDs. Are you sure you want to proceed?')) {
      return;
    }

    setIsSyncing(true);
    setImportStatus(null);

    try {
      // We'll process collections sequentially to avoid overwhelming the network
      for (const collectionName of Object.keys(stagedData)) {
        if (!COLLECTIONS_TO_BACKUP.includes(collectionName)) continue;

        const docs = stagedData[collectionName];
        if (!Array.isArray(docs)) continue;

        // Use batches for efficiency (Firestore limit is 500 writes per batch)
        let batch = writeBatch(db);
        let count = 0;

        for (const docData of docs) {
          const { id, ...fields } = docData;
          if (!id) continue;

          try {
            const docRef = doc(db, collectionName, id);
            batch.set(docRef, fields, { merge: true });
            count++;

            if (count === 400) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          } catch (error) {
             handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${id}`);
          }
        }

        if (count > 0) {
          try {
            await batch.commit();
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, collectionName);
          }
        }
      }

      setImportStatus({ type: 'success', message: 'Data synced to database successfully!' });
      setStagedData(null);
    } catch (error: any) {
      console.error('Sync failed:', error);
      let errorMsg = 'Failed to sync data. Ensure the file is a valid backup JSON.';
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) errorMsg = `Permission Denied: ${parsed.error}`;
      } catch (e) {}
      setImportStatus({ type: 'error', message: errorMsg });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Encryption Password</h3>
        <p className="text-[11px] text-slate-500 mb-4">
          Enter a password to encrypt your backup file during export, or to decrypt it during import. 
          <span className="block mt-1 font-medium text-slate-700 italic">Use master password &quot;Mohamed@Tayam#1974&quot; to export as unencrypted JSON.</span>
        </p>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter encryption password"
          className="w-full max-w-sm px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Download className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">Export Data (Backup)</h3>
            <p className="text-[11px] text-slate-500 mt-1 mb-4">
              Download a complete JSON backup of all your system data, including employees, payrolls, attendance, and settings.
            </p>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-8"
            >
              {isExporting ? 'Exporting...' : 'Download Backup'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <Upload className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">Import Data (Restore)</h3>
            <p className="text-[11px] text-slate-500 mt-1 mb-4">
              Restore your system data from a previously downloaded JSON backup file. This will merge and overwrite existing records with matching IDs.
            </p>
            
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".json,.enc"
                onChange={handleImport}
                disabled={isImporting || isSyncing}
                className="block w-full text-[11px] text-slate-500
                  file:mr-4 file:py-1.5 file:px-3
                  file:rounded-md file:border-0
                  file:text-[11px] file:font-medium
                  file:bg-orange-50 file:text-orange-700
                  hover:file:bg-orange-100 cursor-pointer"
              />
            </div>

            {isImporting && <p className="text-[11px] text-orange-600 mt-3">Decrypting and loading data, please wait...</p>}
            
            {stagedData && (
              <div className="mt-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800 mb-1">Data Ready to Sync</p>
                    <p className="text-[11px] text-orange-600 mb-3">
                      The backup file has been decrypted and loaded into memory. Click the button below to sync the data with the Firebase database.
                    </p>
                    <Button 
                      onClick={handleSync} 
                      disabled={isSyncing}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-[11px] h-8"
                    >
                      {isSyncing ? 'Syncing to Database...' : 'Sync Restored Data'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {importStatus && (
              <div className={`mt-4 p-3 rounded-md flex items-center gap-2 text-[11px] ${
                importStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {importStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {importStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
