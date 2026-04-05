export type NotificationType = 'warning' | 'error' | 'info';

export interface StoredNotification {
  id: string;
  type: NotificationType;
  message: string;
  projectId: string;
  projectTitle: string;
  read: boolean;
  createdAt: string; // ISO string
}
