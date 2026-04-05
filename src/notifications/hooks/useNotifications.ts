import { useEffect, useState, useCallback } from 'react';
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

  // Cargar notificaciones guardadas desde Firestore
  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const stored = await getNotificationsAction(uid);
      setNotifications(stored);
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  // Detectar nuevos eventos y persistirlos
  useEffect(() => {
    if (!uid || projects.length === 0) return;

    const detected: StoredNotification[] = [];

    projects.forEach((p) => {
      if (p.status === 'closed') return;

      // Hitos vencidos
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

      // Proyecto próximo a vencer (≤ 7 días)
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

      // Riesgos altos sin mitigar
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

    // Persistir solo las nuevas (upsert — no sobreescribe read:true)
    detected.forEach((n) => upsertNotificationAction(uid, n));

    // Actualizar estado local con las detectadas + las ya guardadas
    setNotifications((prev) => {
      const map = new Map(prev.map((n) => [n.id, n]));
      detected.forEach((n) => {
        if (!map.has(n.id)) map.set(n.id, n);
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [uid, projects]);

  const markRead = async (id: string) => {
    if (!uid) return;
    await markAsReadAction(uid, id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = async () => {
    if (!uid) return;
    await markAllAsReadAction(uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
};
