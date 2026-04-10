import { useEffect, useState, useCallback, useRef } from 'react';
import { isPast, differenceInDays } from 'date-fns';
import { useAppSelector } from '../../store/reduxHooks';
import { useProjects } from '../../projects/hooks/useProjects';
import {
  getNotificationsAction,
  upsertNotificationAction,
  markAsReadAction,
  markAllAsReadAction,
} from '../actions/notifications.action';
import type { StoredNotification } from '../types/notification';

export const useNotifications = () => {
  const { uid } = useAppSelector((s) => s.auth);
  const { data: projects = [] } = useProjects();
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Evitar múltiples escrituras a Firestore en el mismo ciclo
  const persistedIds = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const stored = await getNotificationsAction(uid);
      setNotifications(stored);
      // Marcar como ya persistidas para no re-escribirlas
      stored.forEach((n) => persistedIds.current.add(n.id));
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  // Detectar nuevos eventos — solo persiste los que no existen aún
  useEffect(() => {
    if (!uid || projects.length === 0 || isLoading) return;

    const detected: StoredNotification[] = [];

    projects.forEach((p) => {
      if (p.status === 'closed') return;

      p.milestones?.forEach((m) => {
        if (isPast(new Date(m.date))) {
          detected.push({
            id: `milestone-${p.id}-${m.date}`,
            type: 'error',
            message: `Hito vencido: "${m.title}"`,
            projectId: p.id,
            projectTitle: p.title,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      });

      if (p.endDate) {
        const days = differenceInDays(new Date(p.endDate), new Date());
        if (days >= 0 && days <= 7) {
          detected.push({
            id: `deadline-${p.id}`,
            type: 'warning',
            message: `El proyecto vence en ${days} día(s)`,
            projectId: p.id,
            projectTitle: p.title,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
        if (days < 0) {
          detected.push({
            id: `overdue-${p.id}`,
            type: 'error',
            message: `Proyecto vencido hace ${Math.abs(days)} día(s)`,
            projectId: p.id,
            projectTitle: p.title,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      p.risks?.forEach((r) => {
        if (r.status === 'open' && r.impact === 'high') {
          detected.push({
            id: `risk-${p.id}-${r.id}`,
            type: 'warning',
            message: `Riesgo alto sin mitigar: "${r.description.slice(0, 60)}"`,
            projectId: p.id,
            projectTitle: p.title,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      });
    });

    // Solo persistir las que NO existen ya en Firestore
    const newOnes = detected.filter((n) => !persistedIds.current.has(n.id));
    newOnes.forEach((n) => {
      persistedIds.current.add(n.id);
      upsertNotificationAction(uid, n);
    });

    if (newOnes.length > 0 || detected.length > 0) {
      setNotifications((prev) => {
        const map = new Map(prev.map((n) => [n.id, n]));
        detected.forEach((n) => { if (!map.has(n.id)) map.set(n.id, n); });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, projects, isLoading]);

  const markRead = async (id: string) => {
    if (!uid) return;
    await markAsReadAction(uid, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!uid) return;
    await markAllAsReadAction(uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
};
