'use client';

import { useState, useEffect } from 'react';
import { useNotificationSettings, NotificationSettings } from '@/src/frontend/hooks/use-notification-settings';
import { useRoles } from '@/src/frontend/hooks/use-roles';
import { Button } from '@/src/frontend/components/ui/button';
import { Label } from '@/src/frontend/components/ui/label';
import { Bell, Mail, Smartphone, Monitor, Save, Loader2, Shield } from 'lucide-react';

export function NotificationSettingsTab() {
  const { settings, loading, updateSettings } = useNotificationSettings();
  const { roles } = useRoles();
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      alert('Notification settings saved successfully!');
    } catch (error) {
      alert('Failed to save notification settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRole = (roleName: string) => {
    if (!localSettings) return;
    const currentRoles = localSettings.roles || [];
    const newRoles = currentRoles.includes(roleName)
      ? currentRoles.filter(r => r !== roleName)
      : [...currentRoles, roleName];
    setLocalSettings({ ...localSettings, roles: newRoles });
  };

  if (loading || !localSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-500" />
          General Notification Preferences
        </h3>
        <p className="text-[10px] text-slate-500 mt-1">Choose how you want to receive system notifications.</p>
      </div>

      <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-md border border-slate-200">
              <Mail className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <Label className="text-[11px] font-medium">Email Notifications</Label>
              <p className="text-[10px] text-slate-500">Receive notifications via your registered email.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={localSettings.emailNotifications}
            onChange={e => setLocalSettings({ ...localSettings, emailNotifications: e.target.checked })}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-md border border-slate-200">
              <Smartphone className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <Label className="text-[11px] font-medium">Push Notifications</Label>
              <p className="text-[10px] text-slate-500">Receive push notifications on your mobile device.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={localSettings.pushNotifications}
            onChange={e => setLocalSettings({ ...localSettings, pushNotifications: e.target.checked })}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-md border border-slate-200">
              <Monitor className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <Label className="text-[11px] font-medium">In-App System Notifications</Label>
              <p className="text-[10px] text-slate-500">Receive notifications within the application dashboard.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={localSettings.systemNotifications}
            onChange={e => setLocalSettings({ ...localSettings, systemNotifications: e.target.checked })}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          Role-Based Notification Subscriptions
        </h3>
        <p className="text-[10px] text-slate-500 mt-1">Select which roles you want to receive notifications for.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {['System Administrator', 'Approver', 'Branch Approver', 'Finance'].map(roleName => (
          <button
            key={roleName}
            onClick={() => toggleRole(roleName)}
            className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
              localSettings.roles?.includes(roleName)
                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-700">{roleName}</span>
            <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
              localSettings.roles?.includes(roleName)
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white border-slate-300'
            }`}>
              {localSettings.roles?.includes(roleName) && (
                <div className="h-1.5 w-1.5 bg-white rounded-full" />
              )}
            </div>
          </button>
        ))}
        {roles.map(role => (
          <button
            key={role.id}
            onClick={() => toggleRole(role.name)}
            className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
              localSettings.roles?.includes(role.name)
                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-700">{role.name}</span>
            <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
              localSettings.roles?.includes(role.name)
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white border-slate-300'
            }`}>
              {localSettings.roles?.includes(role.name) && (
                <div className="h-1.5 w-1.5 bg-white rounded-full" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-8 text-[11px] px-4">
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-2" />
              Save Notification Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
