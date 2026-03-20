'use client';

import { useState } from 'react';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { usePayroll } from '@/src/frontend/hooks/use-payroll';
import { useOrganization } from '@/src/frontend/hooks/use-organization';
import { useAttendanceRange } from '@/src/frontend/hooks/use-attendance-range';
import { Button } from '@/src/frontend/components/ui/button';
import { Label } from '@/src/frontend/components/ui/label';
import { Calculator, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Payroll } from '@/src/frontend/types/payroll';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';
import { AttendanceRecord } from '@/src/frontend/types/attendance';

export function GeneratePayrollTab() {
  const { employees } = useEmployees();
  const { salaryConfigs, cashAdvances, generatePayroll, payrolls } = usePayroll();
  const { monthRanges, attendanceRules } = useOrganization();
  
  const [selectedMonthRangeId, setSelectedMonthRangeId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleGenerate = async () => {
    if (!selectedMonthRangeId) {
      alert('Please select a month range');
      return;
    }

    const range = monthRanges.find(r => r.id === selectedMonthRangeId);
    if (!range) return;

    setIsGenerating(true);
    setResult(null);
    setProgress({ current: 0, total: employees.length });

    try {
      // Fetch ALL attendance for the range once to avoid multiple queries
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('date', '>=', range.startDate),
        where('date', '<=', range.endDate)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const allAttendance = attendanceSnapshot.docs.map(doc => doc.data() as AttendanceRecord);
      
      // Fetch ALL bonuses for the range
      const bonusQuery = query(
        collection(db, 'bonuses'),
        where('monthRangeId', '==', selectedMonthRangeId)
      );
      const bonusSnapshot = await getDocs(bonusQuery);
      const allBonuses = bonusSnapshot.docs.map(doc => doc.data() as any);

      // Fetch ALL approved leaves for the range
      const leavesQuery = query(
        collection(db, 'leaves'),
        where('status', '==', 'Approved')
      );
      const leavesSnapshot = await getDocs(leavesQuery);
      const allLeaves = leavesSnapshot.docs.map(doc => doc.data() as any).filter(
        leave => leave.startDate <= range.endDate && leave.endDate >= range.startDate
      );

      // Fetch ALL social insurances
      const socialInsuranceQuery = query(collection(db, 'social_insurances'));
      const socialInsuranceSnapshot = await getDocs(socialInsuranceQuery);
      const allSocialInsurances = socialInsuranceSnapshot.docs.map(doc => doc.data() as any);

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const config = salaryConfigs.find(c => c.employeeId === emp.id && c.monthRangeId === selectedMonthRangeId);
        
        if (!config) {
          console.warn(`No salary config for ${emp.fullName}`);
          setProgress(prev => ({ ...prev, current: i + 1 }));
          continue;
        }

        // Get employee's attendance rules
        const rule = attendanceRules.find(r => r.categoryName === emp.category);
        
        // Use dynamic rules or defaults
        const gracePeriod = rule?.gracePeriodMinutes ?? 60;
        const lateStep = rule?.lateDeductionStepMinutes ?? 60;
        const lateDaysPerStep = rule?.lateDeductionDaysPerStep ?? 1;
        const absenceDays = rule?.absenceDeductionDays ?? 1;

        // Filter attendance for this employee
        const empAttendance = allAttendance.filter(a => a.employeeId === emp.id);
        
        // Calculate penalties
        const totalLateMinutes = empAttendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
        const totalAbsences = empAttendance.filter(a => a.status === 'Absent').length;
        
        // Cumulative Late Rule:
        let lateDaysDeduction = 0;
        if (totalLateMinutes > gracePeriod) {
          lateDaysDeduction = Math.ceil((totalLateMinutes - gracePeriod) / lateStep) * lateDaysPerStep;
        }

        let dailyWage = 0;
        let calculatedBasicSalary = 0;
        let absencePenaltyAmount = 0;
        const increaseAmount = config.increaseAmount || 0;

        if (emp.category === 'Part Time') {
          dailyWage = config.dailyRate || 0;
          
          let totalAttendedDays = 0;
          empAttendance.forEach(a => {
            if (a.status === 'Present' || a.status === 'Late') totalAttendedDays += 1;
            else if (a.status === 'Half Day') totalAttendedDays += 0.5;
          });
          
          calculatedBasicSalary = totalAttendedDays * dailyWage;
          absencePenaltyAmount = 0; // Part time are paid by attendance, so no extra penalty for absence
        } else {
          dailyWage = (config.basicSalary + increaseAmount) / 30;
          calculatedBasicSalary = config.basicSalary;
          absencePenaltyAmount = (totalAbsences * absenceDays) * dailyWage;
        }

        const grossSalary = calculatedBasicSalary + increaseAmount;
        const latePenaltyAmount = lateDaysDeduction * dailyWage;
        const attendancePenalties = latePenaltyAmount + absencePenaltyAmount;

        // Calculate totals
        const totalAllowances = config.allowances.reduce((sum, a) => sum + a.amount, 0);
        const totalSalary = grossSalary + totalAllowances;
        
        // Exclude Social Insurance and Cash Advance from totalDeductions as they are handled separately
        const totalDeductions = config.deductions
          .filter(d => !d.name.toLowerCase().includes('social insurance') && !d.name.toLowerCase().includes('cash advance'))
          .reduce((sum, d) => sum + d.amount, 0);
        
        // Fetch social insurance from social insurance module
        const empSocialInsurance = allSocialInsurances.find(si => si.employeeId === emp.id);
        const socialInsuranceAmount = empSocialInsurance ? empSocialInsurance.insurableWage * 0.11 : 0; // Assuming 11% employee share, adjust as needed or fetch from config if available
        
        const medicalInsuranceAmount = config.deductions.find(d => d.name.toLowerCase().includes('medical'))?.amount || 0;
        
        // Check for cash advances in this month
        let cashAdvanceDeduction = 0;
        
        // Sort month ranges to determine chronological order
        const sortedRanges = [...monthRanges].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        const currentRangeIndex = sortedRanges.findIndex(r => r.id === selectedMonthRangeId);

        if (currentRangeIndex !== -1) {
          const activeAdvances = cashAdvances.filter(a => 
            a.employeeId === emp.id && 
            a.status === 'Approved'
          );

          activeAdvances.forEach(adv => {
            const startRangeIndex = sortedRanges.findIndex(r => r.id === adv.repaymentMonth);
            if (startRangeIndex !== -1 && currentRangeIndex >= startRangeIndex) {
              const installments = adv.installments || 1;
              const monthlyAmount = Math.floor((adv.amount / installments) * 100) / 100;
              
              // Calculate how much has already been paid in previous payrolls
              let paidAmount = 0;
              let payrollsCount = 0;
              for (let i = startRangeIndex; i < currentRangeIndex; i++) {
                const rangeId = sortedRanges[i].id;
                const hasPayroll = payrolls.some(p => p.employeeId === adv.employeeId && p.monthRangeId === rangeId);
                if (hasPayroll) {
                  payrollsCount++;
                  const isLast = payrollsCount === installments;
                  const amountForThisMonth = isLast ? (adv.amount - (monthlyAmount * (installments - 1))) : monthlyAmount;
                  paidAmount += amountForThisMonth;
                  
                  if (payrollsCount >= installments) {
                    break;
                  }
                }
              }

              const remainingAmount = Math.max(0, adv.amount - paidAmount);
              
              if (remainingAmount > 0) {
                // Determine if this is the final installment
                const isLastInstallment = payrollsCount === installments - 1 || remainingAmount <= monthlyAmount * 1.01;

                if (isLastInstallment) {
                  cashAdvanceDeduction += remainingAmount;
                } else {
                  cashAdvanceDeduction += monthlyAmount;
                }
              }
            }
          });
        }

        // Check for bonuses in this month
        const empBonus = allBonuses.find(b => b.employeeId === emp.id);
        const bonus = empBonus ? (empBonus.totalBonus || 0) : 0;

        // Calculate unpaid leave deduction
        const empUnpaidLeaves = allLeaves.filter(l => l.employeeId === emp.id && l.leaveType === 'Unpaid');
        let totalUnpaidDays = 0;
        empUnpaidLeaves.forEach(leave => {
          // Calculate overlap days
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          const rangeStart = new Date(range.startDate);
          const rangeEnd = new Date(range.endDate);
          
          const start = leaveStart > rangeStart ? leaveStart : rangeStart;
          const end = leaveEnd < rangeEnd ? leaveEnd : rangeEnd;
          
          if (start <= end) {
            let days = 0;
            let current = new Date(start);
            while (current <= end) {
              const dayOfWeek = current.getDay();
              if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Exclude Friday and Saturday
                days++;
              }
              current.setDate(current.getDate() + 1);
            }
            totalUnpaidDays += days;
          }
        });
        const unpaidLeaveDeduction = totalUnpaidDays * dailyWage;

        // Deduct social insurance from net salary
        const netSalary = totalSalary - totalDeductions - attendancePenalties - cashAdvanceDeduction - unpaidLeaveDeduction + bonus - socialInsuranceAmount;

        await generatePayroll({
          employeeId: emp.id,
          monthRangeId: selectedMonthRangeId,
          basicSalary: calculatedBasicSalary,
          increaseAmount,
          grossSalary,
          totalSalary,
          totalAllowances,
          totalDeductions,
          attendancePenalties,
          cashAdvanceDeduction,
          unpaidLeaveDeduction,
          bonus,
          netSalary,
          status: 'Draft',
          dailyWage,
          latePenaltyAmount,
          absencePenaltyAmount,
          socialInsuranceAmount,
          medicalInsuranceAmount
        });

        setProgress(prev => ({ ...prev, current: i + 1 }));
      }

      setResult({ success: true, message: `Payroll generated successfully for ${employees.length} employees.` });
    } catch (error) {
      console.error('Error generating payroll:', error);
      setResult({ success: false, message: 'Failed to generate payroll. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 py-6 text-[11px]">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600 mb-2">
          <Calculator className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">Generate Monthly Payroll</h3>
        <p className="text-[10px] text-slate-500">
          This process will calculate salaries, allowances, deductions, and cash advances for all employees based on their configurations.
        </p>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
        <div>
          <Label htmlFor="monthRange" className="text-[10px]">Select Month Range</Label>
          <select
            id="monthRange"
            className="w-full mt-1.5 h-8 rounded-lg border border-slate-200 bg-white px-3 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={selectedMonthRangeId}
            onChange={(e) => setSelectedMonthRangeId(e.target.value)}
            disabled={isGenerating}
          >
            <option value="">Choose a range...</option>
            {monthRanges.map(range => (
              <option key={range.id} value={range.id}>{range.month} ({range.startDate} to {range.endDate})</option>
            ))}
          </select>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !selectedMonthRangeId}
          className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium rounded-lg gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating ({progress.current}/{progress.total})...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4" />
              Generate Now
            </>
          )}
        </Button>

        {result && (
          <div className={`p-2.5 rounded-lg flex items-start gap-2 border ${result.success ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
            {result.success ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />}
            <p className="text-[10px] font-medium">{result.message}</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-blue-900 flex items-center gap-1.5 text-[10px]">
          <AlertCircle className="h-3 w-3" />
          Important Notes
        </h4>
        <ul className="text-[9px] text-blue-800 space-y-1 list-disc pl-4">
          <li>Ensure all employees have a <strong>Salary Configuration</strong> before generating.</li>
          <li>Attendance penalties are calculated based on the rules defined in the Organization module.</li>
          <li>Approved <strong>Cash Advances</strong> for the selected month will be automatically deducted.</li>
          <li>Generated payrolls will be saved as <strong>Drafts</strong> for review.</li>
        </ul>
      </div>
    </div>
  );
}
