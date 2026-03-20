import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/frontend/lib/firebase';

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface CreateNotificationParams {
  userId?: string;
  role?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export const NotificationService = {
  async createNotification(params: CreateNotificationParams) {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...params,
        read: false,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },

  async notifySystemAdmin(action: string, details: string) {
    await this.createNotification({
      role: 'System Administrator',
      title: `System Change: ${action}`,
      message: details,
      type: 'info',
    });
  },

  async notifyLeavePending(employeeName: string, leaveType: string) {
    // Notify Approvers and Branch Approvers
    const message = `${employeeName} has requested ${leaveType} leave. Status: Pending.`;
    
    await this.createNotification({
      role: 'Approver',
      title: 'New Leave Request',
      message,
      type: 'warning',
      link: '/dashboard/leaves',
    });

    await this.createNotification({
      role: 'Branch Approver',
      title: 'New Leave Request',
      message,
      type: 'warning',
      link: '/dashboard/leaves',
    });
  },

  async notifyCashAdvanceApproved(employeeName: string, amount: number) {
    // Notify Finance
    await this.createNotification({
      role: 'Finance',
      title: 'Cash Advance Approved',
      message: `Cash advance for ${employeeName} of ${amount} has been approved.`,
      type: 'success',
      link: '/dashboard/cash-advance',
    });
  }
};
