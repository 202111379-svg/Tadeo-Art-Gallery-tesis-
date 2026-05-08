import { useEffect, useState, useCallback } from 'react';
import { isPast, differenceInDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../../store/reduxHooks';
import { useSeasonContext } from '../../seasons/context/season-context';
import { getProjectsAction } from '../../projects/actions/get-projects.action';
import {
  getNotificationsAction,
  upsertNotificationAction,
  markAsReadAction,
  markAllAsReadAction,
  cleanObsoleteNotificationsAction,
} from '../actions/notifications.action';
import type { StoredNotification } from '../types/notification';
import type { Project } from '../../projects/types/project';

const buildDetected = (projects: Project[]): StoredNotification[] => {
  const detected: StoredNotification[] = [];

  projects.forEach((p) => {
    if (p.status === 'closed') return;

    p.milestones?.forEach((m) => {
      if (isPast(new Date(m.date))) {
        detected.push({
          id: `milestone-${p.id}-${m.id ?? m.date}`,
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
      } else if (days > 7 && days <= 30) {
        detected.push({
          id: `deadline-${p.id}`,
          type: 'info',
          message: `El proyecto vence en ${days} día(s)`,
          projectId: p.id,
          projectTitle: p.title,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } else if (days < 0) {
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

  return detected;
};

const sortByCreatedAtDesc = (items: StoredNotification[]) =>
  [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

const mergeDetectedWithStored = (
  detected: StoredNotification[],
  stored: StoredNotification[]
): StoredNotification[] => {
  const storedMap = new Map(stored.map((notification) => [notification.id, notification]));

  return detected.map((notification) => {
    const saved = storedMap.get(notification.id);

    return {
      ...notification,
      read: saved?.read ?? notification.read,
      createdAt: saved?.createdAt ?? notification.createdAt,
    };
  });
};

export const useNotifications = () => {
  const { uid } = useAppSelector((s) => s.auth);
  const { activeSeason } = useSeasonContext();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-all', uid, activeSeason?.id],
    queryFn: () => getProjectsAction(uid!, activeSeason?.id),
    enabled: !!uid,
    staleTime: 1000 * 60 * 2,
  });

  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cada vez que cambian los proyectos, recalcula y sincroniza con Firestore
  const sync = useCallback(async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const detected = buildDetected(projects);
      const activeIds = detected.map((n) => n.id);
      const stored = await getNotificationsAction(uid);
      const merged = mergeDetectedWithStored(detected, stored);

      // Limpiar obsoletas y persistir/actualizar las activas.
      await cleanObsoleteNotificationsAction(uid, activeIds);
      await Promise.all(merged.map((n) => upsertNotificationAction(uid, n)));

      setNotifications(sortByCreatedAtDesc(merged));
    } finally {
      setIsLoading(false);
    }
  }, [uid, projects]);

  useEffect(() => { sync(); }, [sync]);

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
