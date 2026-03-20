'use client';

import { useState, useMemo } from 'react';
import { useLeaves } from '@/src/frontend/hooks/use-leaves';
import { useEmployees } from '@/src/frontend/hooks/use-employees';
import { Button } from '@/src/frontend/components/ui/button';
import { CheckCircle, XCircle, Clock, Edit2, Trash2 } from 'lucide-react';
import { LeaveRequestModal } from './LeaveRequestModal';
import { LeaveRequest } from '@/src/frontend/types/leave';

export function ApprovalsTab() {
  const { leaves, updateLeave, balances, updateBalance, deleteLeave } = useLeaves();
  const { employees } = useEmployees();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | undefined>(undefined);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);

  const pendingLeaves = useMemo(() => {
    return leaves.filter(l => l.status === 'Pending').sort((a, b) => a.createdAt - b.createdAt);
  }, [leaves]);

  const handleEdit = (leave: LeaveRequest) => {
    setEditingLeave(leave);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (leaveToDelete) {
      await deleteLeave(leaveToDelete);
      setLeaveToDelete(null);
    }
  };

  const handleApprove = async (id: string, employeeId: string, leaveType: string, duration: number = 0) => {
    try {
      if (!id) throw new Error('Leave ID is missing.');
      if (!employeeId) throw new Error('Employee ID is missing.');
      
      await updateLeave(id, { status: 'Approved' });
      
      // Deduct from balance if applicable
      const balance = balances.find(b => b.employeeId === employeeId);
      const updates: any = {};
      const safeDuration = Number(duration) || 0;
      
      if (balance) {
        if (leaveType === 'Annual') updates.annual = Math.max(0, balance.annual - safeDuration);
        if (leaveType === 'Casual') updates.casual = Math.max(0, balance.casual - safeDuration);
        if (leaveType === 'Sick') updates.sick = Math.max(0, balance.sick - safeDuration);
        if (leaveType === 'Death') updates.death = Math.max(0, balance.death - safeDuration);
        if (leaveType === 'Unpaid') updates.unpaid = (balance.unpaid || 0) + safeDuration;
      } else {
        // Initialize balance if it doesn't exist
        updates.employeeId = employeeId;
        updates.annual = leaveType === 'Annual' ? Math.max(0, 15 - safeDuration) : 15;
        updates.casual = leaveType === 'Casual' ? Math.max(0, 6 - safeDuration) : 6;
        updates.sick = leaveType === 'Sick' ? Math.max(0, 5 - safeDuration) : 5;
        updates.maternity = 0;
        updates.death = leaveType === 'Death' ? Math.max(0, 3 - safeDuration) : 3;
        updates.lieu = 0;
        updates.unpaid = leaveType === 'Unpaid' ? safeDuration : 0;
        updates.year = new Date().getFullYear();
      }
      
      if (Object.keys(updates).length > 0) {
        await updateBalance(employeeId, updates);
      }
    } catch (error: any) {
      console.error('Failed to approve leave:', error);
      alert('Failed to approve leave: ' + error.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      if (!id) throw new Error('Leave ID is missing.');
      await updateLeave(id, { status: 'Rejected' });
    } catch (error: any) {
      console.error('Failed to reject leave:', error);
      alert('Failed to reject leave: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Pending Approvals</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {pendingLeaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    <Clock className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    No pending approvals
                  </td>
                </tr>
              ) : (
                pendingLeaves.map((leave) => {
                  const emp = employees.find(e => e.id === leave.employeeId);
                  return (
                    <tr key={leave.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{emp?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{emp?.employeeCode || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{leave.leaveType}</div>
                        {leave.attachmentUrl && (
                          <div className="text-xs text-blue-600 hover:underline cursor-pointer">View Attachment</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {leave.startDate} to {leave.endDate}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {leave.duration} Days
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(leave)} className="text-blue-600 hover:text-blue-800 transition-colors mr-2">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setLeaveToDelete(leave.id)} className="text-red-600 hover:text-red-800 transition-colors mr-2">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <Button 
                            onClick={() => handleApprove(leave.id, leave.employeeId, leave.leaveType, leave.duration)}
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 h-8 text-xs"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleReject(leave.id)}
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1 h-8 text-xs"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeaveRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        employee={undefined}
        employees={employees}
        isAdmin={true}
        record={editingLeave}
      />

      {leaveToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Delete Leave Request</h3>
            <p className="text-[11px] text-slate-500">Are you sure you want to delete this leave request? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setLeaveToDelete(null)} className="h-7 text-[10px]">
                Cancel
              </Button>
              <Button type="button" variant="default" size="sm" onClick={handleDelete} className="h-7 text-[10px] bg-red-600 hover:bg-red-700 text-white">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
