'use client';

import { useState } from 'react';
import { 
  Banknote, 
  Wallet, 
  Calculator, 
  FileText, 
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/src/frontend/components/ui/button';
import { SalaryConfigTab } from './components/SalaryConfigTab';
import { CashAdvanceTab } from './components/CashAdvanceTab';
import { GeneratePayrollTab } from './components/GeneratePayrollTab';
import { PayrollSummaryTab } from './components/PayrollSummaryTab';

type TabType = 'summary' | 'config' | 'advances' | 'generate';

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  return (
    <div className="space-y-3 text-[11px]">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Payroll Management</h1>
          <p className="mt-0.5 text-[10px] text-slate-500">Manage employee salaries, cash advances, and monthly payroll generation.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('summary')}
              className={`w-1/4 py-2 px-1 text-center border-b-2 font-medium text-[10px] flex items-center justify-center gap-1 ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <FileText className="h-3 w-3" />
              Payroll Summary
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`w-1/4 py-2 px-1 text-center border-b-2 font-medium text-[10px] flex items-center justify-center gap-1 ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Banknote className="h-3 w-3" />
              Salary Config
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`w-1/4 py-2 px-1 text-center border-b-2 font-medium text-[10px] flex items-center justify-center gap-1 ${
                activeTab === 'advances'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Wallet className="h-3 w-3" />
              Cash in Advance
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`w-1/4 py-2 px-1 text-center border-b-2 font-medium text-[10px] flex items-center justify-center gap-1 ${
                activeTab === 'generate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Calculator className="h-3 w-3" />
              Generate Payroll
            </button>
          </nav>
        </div>

        <div className="p-3">
          {activeTab === 'summary' && <PayrollSummaryTab />}
          {activeTab === 'config' && <SalaryConfigTab />}
          {activeTab === 'advances' && <CashAdvanceTab />}
          {activeTab === 'generate' && <GeneratePayrollTab />}
        </div>
      </div>
    </div>
  );
}
