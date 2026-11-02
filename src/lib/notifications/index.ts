import { prisma } from '@/lib/db/prisma';

export interface CreateNotificationParams {
  userId: string;
  complaintId?: string;
  title: string;
  message: string;
  type?: 'STATUS_CHANGE' | 'ASSIGNMENT' | 'RESOLUTION' | 'ALERT' | 'INFO_REQUEST';
}

export async function createNotification({
  userId,
  complaintId,
  title,
  message,
  type = 'STATUS_CHANGE',
}: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        complaintId,
        title,
        message,
        type,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
