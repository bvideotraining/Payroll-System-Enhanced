'use client';

import { useState } from 'react';
import { useAuthStore } from '@/src/frontend/store/use-auth-store';
import { MyLeavesTab } from './components/MyLeavesTab';
import { ApprovalsTab } from './components/ApprovalsTab';
import { BalanceTab } from './components/BalanceTab';
import { LeaveReportTab } from './components/LeaveReportTab';
import { FileText, CheckSquare, Clock, BarChart2 } from 'lucide-react';

export default function LeavesPage() {
  const { user, role } = useAuthStore();
  const [activeTab, setActiveTab] = useState('my-leaves');

  // Assuming user role is stored in user object or we have a way to check
  // For now, let's assume everyone can see all tabs, but we'll restrict data inside
  const isAdminOrApprover = role === 'admin' || role === 'approver' || role === 'System Administrator';

  const tabs = [
    { id: 'my-leaves', name: isAdminOrApprover ? 'All Leaves' : 'My Leaves', icon: FileText },
    { id: 'approvals', name: 'Approvals', icon: CheckSquare, hidden: !isAdminOrApprover },
    { id: 'balance', name: 'Balance', icon: Clock },
    { id: 'report', name: 'Leave Report', icon: BarChart2, hidden: !isAdminOrApprover },
  ].filter(t => !t.hidden);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Leave Management</h1>
        <p className="mt-1 text-sm text-slate-500">Manage leave requests, approvals, and balances.</p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                `}
              >
                <tab.icon className={`h-4 w-4 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === 'my-leaves' && <MyLeavesTab />}
        {activeTab === 'approvals' && <ApprovalsTab />}
        {activeTab === 'balance' && <BalanceTab />}
        {activeTab === 'report' && <LeaveReportTab />}
      </div>
    </div>
  );
}
