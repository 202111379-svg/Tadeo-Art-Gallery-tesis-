import { differenceInDays, isPast, isValid, parseISO } from 'date-fns';
import type { Project } from '../projects/types/project';

// Firestore puede devolver Timestamps, números o strings ISO
export const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  // Firestore Timestamp
  if (typeof value === 'object' && 'seconds' in (value as object)) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const d = parseISO(value);
    return isValid(d) ? d : null;
  }
  return null;
};

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export type HealthState = 'green' | 'amber' | 'red';

export interface HealthDimension {
  key: string;
  label: string;
  score: number;
  weight: number;
  passed: boolean;
  detail: string;
}

export interface ProjectHealthResult {
  state: HealthState;
  score: number;
  dimensions: HealthDimension[];
  riskFactors: string[];
}

export const healthLabel: Record<HealthState, string> = {
  green: 'Saludable',
  amber: 'En atención',
  red: 'Crítico',
};

export const healthColor: Record<HealthState, string> = {
  green: '#2e7d32',
  amber: '#f57c00',
  red: '#c62828',
};

export const healthBgColor: Record<HealthState, string> = {
  green: '#e8f5e9',
  amber: '#fff3e0',
  red: '#ffebee',
};

const THRESHOLD_GREEN = 75;
const THRESHOLD_AMBER = 45;

export const computeProjectHealth = (p: Project): HealthState =>
  computeProjectHealthFull(p).state;

export const computeProjectHealthFull = (p: Project): ProjectHealthResult => {
  const now = Date.now();
  const dimensions: HealthDimension[] = [];
  const riskFactors: string[] = [];

  const startDate  = toDate(p.startDate);
  const endDate    = toDate(p.endDate);
  const datesValid = startDate && endDate && isValid(startDate) && isValid(endDate);
  const isOverdue  = datesValid ? isPast(endDate!) : false;
  const daysRemaining = datesValid ? differenceInDays(endDate!, now) : null;
  const totalDays     = datesValid ? differenceInDays(endDate!, startDate!) : null;

  // ── 1. Documentación (10%) ─────────────────────────────────────────────────
  // Título, responsable y una descripción mínima. El detalle real del proyecto
  // se evalúa en la dimensión "Detalle de actividades", no por el largo del texto.
  const titleOk       = !!p.title && p.title.trim().length >= 5;
  const descLen       = p.description?.trim().length ?? 0;
  const descOk        = descLen >= 30;
  const responsibleOk = !!p.responsible?.trim();

  const docScore = Math.round(
    (titleOk ? 40 : 0) +
    (responsibleOk ? 40 : 0) +
    (descOk ? 20 : 0)
  );

  dimensions.push({
    key: 'documentation',
    label: 'Documentación y responsable',
    score: docScore,
    weight: 0.10,
    passed: docScore >= 75,
    detail: !titleOk
      ? 'Título demasiado corto (mín. 5 caracteres)'
      : !responsibleOk
      ? 'Sin responsable asignado'
      : !descOk
      ? 'Agrega una breve descripción del objetivo del proyecto'
      : `Completo — Responsable: ${p.responsible}`,
  });
  if (!titleOk) riskFactors.push('Sin título válido');
  if (!responsibleOk) riskFactors.push('Sin responsable asignado');

  // ── 2. Detalle de actividades (20%) ────────────────────────────────────────
  // El corazón del control de proyectos: actividades planificadas y qué tan
  // detalladas están (responsable, recursos, costo y duración estimada).
  const actividades   = p.actividades ?? [];
  const actCount      = actividades.length;
  const conResponsable = actividades.filter((a) => a.responsable?.trim()).length;
  const conRecursos    = actividades.filter((a) => (a.recursos_requeridos?.length ?? 0) > 0).length;
  const conCosto       = actividades.filter((a) => (a.costo_planificado ?? 0) > 0).length;
  const conDuracion    = actividades.filter((a) => !!a.fecha_fin_planificada).length;

  let actScore = 0;
  if (actCount > 0) {
    const base       = actCount >= 5 ? 40 : actCount >= 3 ? 30 : 20;
    const detallePct = (conResponsable + conRecursos + conCosto + conDuracion) / (actCount * 4);
    actScore = Math.round(base + detallePct * 60);
  }

  dimensions.push({
    key: 'activities',
    label: 'Detalle de actividades',
    score: Math.min(100, actScore),
    weight: 0.20,
    passed: actCount >= 3 && actScore >= 70,
    detail: actCount === 0
      ? 'Sin actividades planificadas — planifica el detalle del proyecto'
      : `${actCount} actividad(es) · ${conResponsable} con responsable · ${conRecursos} con recursos · ${conDuracion} con duración`,
  });
  if (actCount === 0) riskFactors.push('Sin actividades planificadas');
  else if (conResponsable < actCount) riskFactors.push(`${actCount - conResponsable} actividad(es) sin responsable`);

  // ── 3. Planificación temporal (15%) ────────────────────────────────────────
  // Fechas válidas + proximidad de cierre
  let planScore = 0;
  let planDetail = '';

  if (!datesValid) {
    planScore  = 0;
    planDetail = 'Fechas de inicio o fin no definidas';
    riskFactors.push('Sin fechas de planificación');
  } else if (isOverdue) {
    planScore  = 5;
    planDetail = `Proyecto vencido hace ${Math.abs(daysRemaining!)} día(s)`;
    riskFactors.push('Proyecto vencido');
  } else if (daysRemaining! <= 7) {
    planScore  = 15;
    planDetail = `Cierre en ${daysRemaining} día(s) — urgente`;
    riskFactors.push(`Cierre en ${daysRemaining} día(s)`);
  } else if (daysRemaining! <= 30) {
    planScore  = 40;
    planDetail = `Cierre en ${daysRemaining} día(s) — zona crítica`;
    riskFactors.push(`Cierre en ${daysRemaining} día(s)`);
  } else if (daysRemaining! <= 90) {
    planScore  = 70;
    planDetail = `Cierre en ${daysRemaining} día(s) — en atención`;
  } else {
    const pctElapsed = totalDays! > 0 ? (totalDays! - daysRemaining!) / totalDays! : 0;
    planScore  = Math.round((1 - pctElapsed * 0.3) * 100);
    planDetail = `${daysRemaining} días restantes (${Math.round(pctElapsed * 100)}% transcurrido)`;
  }

  dimensions.push({
    key: 'planning',
    label: 'Planificación temporal',
    score: Math.min(100, Math.max(0, planScore)),
    weight: 0.15,
    passed: planScore >= 70,
    detail: planDetail,
  });

  // ── 4. Hitos (15%) ─────────────────────────────────────────────────────────
  const milestoneCount = p.milestones?.length ?? 0;
  const overdueMs      = p.milestones?.filter((m) => isPast(new Date(m.date)) && !m.completed).length ?? 0;
  const upcomingMs     = p.milestones?.filter((m) => {
    const diff = differenceInDays(new Date(m.date), now);
    return diff >= 0 && diff <= 30;
  }).length ?? 0;
  const completedMs    = p.milestones?.filter((m) => m.completed).length ?? 0;

  const milestoneScore = Math.max(0,
    milestoneCount === 0 ? 0
    : milestoneCount >= 5 ? 100 - overdueMs * 15
    : milestoneCount >= 3 ? 80  - overdueMs * 15
    : milestoneCount >= 1 ? 50  - overdueMs * 15
    : 0
  );

  dimensions.push({
    key: 'milestones',
    label: 'Hitos y seguimiento',
    score: milestoneScore,
    weight: 0.15,
    passed: milestoneCount >= 2 && overdueMs === 0,
    detail: milestoneCount === 0
      ? 'Sin hitos definidos'
      : completedMs > 0
      ? `${completedMs}/${milestoneCount} hito(s) completado(s)${overdueMs > 0 ? `, ${overdueMs} vencido(s)` : ''}`
      : overdueMs > 0
      ? `${milestoneCount} hito(s), ${overdueMs} vencido(s)`
      : upcomingMs > 0
      ? `${milestoneCount} hito(s) — ${upcomingMs} próximo(s) en 30 días`
      : `${milestoneCount} hito(s) al día`,
  });
  if (milestoneCount === 0) riskFactors.push('Sin hitos de seguimiento');
  if (overdueMs > 0) riskFactors.push(`${overdueMs} hito(s) vencido(s)`);

  // ── 5. Criterios de aceptación (10%) ───────────────────────────────────────
  const criteriaCount = p.acceptanceCriteria?.length ?? 0;
  const criteriaScore = criteriaCount >= 5 ? 100
    : criteriaCount >= 3 ? 80
    : criteriaCount >= 1 ? 50
    : 0;

  dimensions.push({
    key: 'criteria',
    label: 'Criterios de aceptación',
    score: criteriaScore,
    weight: 0.10,
    passed: criteriaCount >= 3,
    detail: criteriaCount === 0
      ? 'Sin criterios definidos'
      : `${criteriaCount} criterio(s) definido(s)`,
  });
  if (criteriaCount === 0) riskFactors.push('Sin criterios de aceptación');

  // ── 6. Gestión de riesgos (10%) ────────────────────────────────────────────
  const risks         = p.risks ?? [];
  const openHighRisks = risks.filter((r) => r.status === 'open' && r.impact === 'high').length;
  const openRisks     = risks.filter((r) => r.status === 'open').length;
  const mitigated     = risks.filter((r) => r.status !== 'open').length;

  let riskScore = 0;
  let riskDetail = '';

  if (risks.length === 0) {
    riskScore  = 60; // no identificar riesgos no es ideal pero tampoco crítico
    riskDetail = 'Sin riesgos identificados (recomendado: identificar al menos 1)';
  } else if (openHighRisks > 0) {
    riskScore  = Math.max(0, 40 - openHighRisks * 15);
    riskDetail = `${openHighRisks} riesgo(s) de alto impacto sin mitigar`;
    riskFactors.push(`${openHighRisks} riesgo(s) alto(s) sin mitigar`);
  } else if (openRisks > 0) {
    riskScore  = Math.max(30, 80 - openRisks * 10);
    riskDetail = `${openRisks} riesgo(s) abierto(s), ${mitigated} mitigado(s)`;
  } else {
    riskScore  = 100;
    riskDetail = `${risks.length} riesgo(s) identificado(s) y gestionado(s)`;
  }

  dimensions.push({
    key: 'risks',
    label: 'Gestión de riesgos',
    score: riskScore,
    weight: 0.10,
    passed: riskScore >= 60,
    detail: riskDetail,
  });

  // ── 7. Logística del evento (10%) ──────────────────────────────────────────
  const venue    = p.logistics?.venue?.name?.trim();
  const venueConfirmed = !!p.logistics?.venue?.confirmed && (p.logistics.venue.evidenceUrls?.length ?? 0) > 0;
  const artists  = p.logistics?.artists?.length ?? 0;
  const capacity = p.logistics?.capacity ?? 0;
  const sectors  = p.logistics?.sectors?.length ?? 0;

  const logScore = Math.round(
    (venue    ? 20 : 0) +
    (venueConfirmed ? 30 : 0) +
    (artists  > 0 ? 20 : 0) +
    (capacity > 0 ? 20 : 0) +
    (sectors  > 0 ? 10 : 0)
  );

  dimensions.push({
    key: 'logistics',
    label: 'Logística del evento',
    score: logScore,
    weight: 0.10,
    passed: logScore >= 60 && venueConfirmed,
    detail: !venue
      ? 'Sin lugar del evento definido'
      : `${venue}${venueConfirmed ? ' · Local confirmado' : ' · Local sin evidencia'}${artists > 0 ? ` · ${artists} artista(s)` : ''}${capacity > 0 ? ` · Aforo: ${capacity}` : ''}`,
  });
  if (!venue) riskFactors.push('Sin lugar del evento definido');
  if (venue && !venueConfirmed) riskFactors.push('Local sin confirmacion documental');

  // ── 8. Presupuesto asignado (10%) ──────────────────────────────────────────
  const hasBudget  = !!p.budget && p.budget > 0;
  const budgetScore = hasBudget ? 100 : 0;

  dimensions.push({
    key: 'budget',
    label: 'Presupuesto asignado',
    score: budgetScore,
    weight: 0.10,
    passed: hasBudget,
    detail: hasBudget
      ? `S/ ${p.budget!.toLocaleString('es-PE')} asignados`
      : 'Sin presupuesto asignado al proyecto',
  });
  if (!hasBudget) riskFactors.push('Sin presupuesto asignado');

  // ── Score final ponderado ──────────────────────────────────────────────────
  const score = Math.round(
    dimensions.reduce((acc, d) => acc + d.score * d.weight, 0)
  );

  const state: HealthState =
    score >= THRESHOLD_GREEN ? 'green'
    : score >= THRESHOLD_AMBER ? 'amber'
    : 'red';

  return { state, score, dimensions, riskFactors };
};

export const isProjectHealthy = (p: Project): boolean =>
  computeProjectHealthFull(p).score >= THRESHOLD_GREEN;
