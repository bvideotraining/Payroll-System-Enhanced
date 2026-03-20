'use client';

import { CheckCircle2, Copy, ExternalLink, ShieldAlert } from 'lucide-react';
import { Button } from '@/src/frontend/components/ui/button';

export function AuthSettingsTab() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">Google Authentication Setup Guide</h3>
            <p className="text-[11px] text-slate-500 mt-1 mb-6">
              Follow these steps to enable &quot;Login with Google&quot; for your application using Firebase Authentication.
            </p>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="relative pl-6 border-l-2 border-slate-100 pb-2">
                <div className="absolute -left-[9px] top-0 bg-blue-100 text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">1</div>
                <h4 className="text-[11px] font-semibold text-slate-800">Go to Firebase Console</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Firebase Console <ExternalLink className="h-3 w-3" /></a> and select your project.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative pl-6 border-l-2 border-slate-100 pb-2">
                <div className="absolute -left-[9px] top-0 bg-blue-100 text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">2</div>
                <h4 className="text-[11px] font-semibold text-slate-800">Enable Google Sign-In Provider</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Navigate to <strong>Authentication</strong> &gt; <strong>Sign-in method</strong>. Click on <strong>Add new provider</strong> and choose <strong>Google</strong>.
                </p>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-md text-[10px] text-slate-600">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Toggle the <strong>Enable</strong> switch.</li>
                    <li>Select a <strong>Project support email</strong> from the dropdown.</li>
                    <li>Click <strong>Save</strong>.</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative pl-6 border-l-2 border-slate-100 pb-2">
                <div className="absolute -left-[9px] top-0 bg-blue-100 text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">3</div>
                <h4 className="text-[11px] font-semibold text-slate-800">Add Authorized Domains</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  In the <strong>Authentication</strong> &gt; <strong>Settings</strong> &gt; <strong>Authorized domains</strong> section, ensure your application&apos;s domain is listed.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-800 font-mono border border-slate-200">
                    {typeof window !== 'undefined' ? window.location.hostname : 'your-app.run.app'}
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 text-[9px] px-2 gap-1"
                    onClick={() => copyToClipboard(typeof window !== 'undefined' ? window.location.hostname : 'your-app.run.app')}
                  >
                    <Copy className="h-3 w-3" /> Copy Domain
                  </Button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative pl-6 border-l-2 border-transparent">
                <div className="absolute -left-[9px] top-0 bg-blue-100 text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">4</div>
                <h4 className="text-[11px] font-semibold text-slate-800">Google Cloud Credentials (Optional)</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  If you need to configure specific OAuth scopes or use Google APIs (like Calendar or Drive), you will need the Web Client ID and Secret.
                  You can find these in the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a> under <strong>Credentials</strong> &gt; <strong>OAuth 2.0 Client IDs</strong>.
                </p>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md text-[10px] text-blue-800 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Note:</strong> For standard Firebase Authentication (just logging in), the default configuration provided by Firebase is sufficient. You do not need to manually enter the Client ID or Secret into this application.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
