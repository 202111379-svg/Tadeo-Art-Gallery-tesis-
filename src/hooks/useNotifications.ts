import { useMemo } from 'react';
import { isPast, differenceInDays } from 'date-fns';
import { useProjects } from '../projects/hooks/useProjects';

export interface AppNotification {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  projectId: string;
  projectTitle: string;
}

export const useNotifications = (): AppNotification[] => {
  const { data: projects = [] } = useProjects();

  return useMemo(() => {
    const notifications: AppNotification[] = [];

    projects.forEach((p) => {
      if (p.status === 'closed') return;

      // Hitos vencidos
      p.milestones?.forEach((m) => {
        if (isPast(new Date(m.date))) {
          notifications.push({
            id: `milestone-${p.id}-${m.date}`,
            type: 'error',
            message: `Hito vencido: "${m.title}"`,
            projectId: p.id,
            projectTitle: p.title,
          });
        }
      });

      // Proyecto próximo a vencer (≤ 7 días)
      if (p.endDate) {
        const days = differenceInDays(new Date(p.endDate), new Date());
        if (days >= 0 && days <= 7) {
          notifications.push({
            id: `deadline-${p.id}`,
            type: 'warning',
            message: `Vence en ${days} día(s)`,
            projectId: p.id,
            projectTitle: p.title,
          });
        }
        // Proyecto vencido
        if (days < 0) {
          notifications.push({
            id: `overdue-${p.id}`,
            type: 'error',
            message: `Proyecto vencido hace ${Math.abs(days)} día(s)`,
            projectId: p.id,
            projectTitle: p.title,
          });
        }
      }

      // Riesgos abiertos de alto impacto
      p.risks?.forEach((r) => {
        if (r.status === 'open' && r.impact === 'high') {
          notifications.push({
            id: `risk-${p.id}-${r.id}`,
            type: 'warning',
            message: `Riesgo alto sin mitigar: "${r.description.slice(0, 50)}"`,
            projectId: p.id,
            projectTitle: p.title,
          });
        }
      });
    });

    return notifications;
  }, [projects]);
};
