import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { StoredNotification } from '../types/notification';

const col = (uid: string) =>
  collection(FirebaseDB, `${uid}/gallery/notifications`);

export const getNotificationsAction = async (
  uid: string
): Promise<StoredNotification[]> => {
  const q = query(col(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as StoredNotification), id: d.id }));
};

/** Guarda una notificación solo si no existe ya (evita duplicados por id) */
export const upsertNotificationAction = async (
  uid: string,
  notification: StoredNotification
): Promise<void> => {
  const ref = doc(FirebaseDB, `${uid}/gallery/notifications/${notification.id}`);
  await setDoc(ref, notification, { merge: true });
};

/** Marca una notificación como leída */
export const markAsReadAction = async (
  uid: string,
  notificationId: string
): Promise<void> => {
  const ref = doc(FirebaseDB, `${uid}/gallery/notifications/${notificationId}`);
  await updateDoc(ref, { read: true });
};

/** Marca todas como leídas */
export const markAllAsReadAction = async (uid: string): Promise<void> => {
  const snap = await getDocs(col(uid));
  const unread = snap.docs.filter((d) => !d.data().read);
  if (unread.length === 0) return;

  const batch = writeBatch(FirebaseDB);
  unread.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
};

/** Elimina notificaciones cuyos IDs ya no son relevantes */
export const cleanObsoleteNotificationsAction = async (
  uid: string,
  activeIds: string[]
): Promise<void> => {
  const snap = await getDocs(col(uid));
  const toDelete = snap.docs.filter((d) => !activeIds.includes(d.id));
  if (toDelete.length === 0) return;
  const batch = writeBatch(FirebaseDB);
  toDelete.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};
