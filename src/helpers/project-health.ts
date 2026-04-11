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

  // ── 1. Documentación (15%) ─────────────────────────────────────────────────
  // Título, descripción y responsable asignado
  const titleOk       = !!p.title && p.title.trim().length >= 5;
  const descLen       = p.description?.trim().length ?? 0;
  const descOk        = descLen >= 100;
  const responsibleOk = !!p.responsible?.trim();

  const docScore = Math.round(
    (titleOk ? 35 : 0) +
    (descOk ? 40 : descLen >= 30 ? 20 : 0) +
    (responsibleOk ? 25 : 0)
  );

  dimensions.push({
    key: 'documentation',
    label: 'Documentación y responsable',
    score: docScore,
    weight: 0.15,
    passed: docScore >= 75,
    detail: !titleOk
      ? 'Título demasiado corto (mín. 5 caracteres)'
      : !responsibleOk
      ? 'Sin responsable asignado'
      : !descOk
      ? `Descripción insuficiente (${descLen}/100 caracteres)`
      : `Completo — Responsable: ${p.responsible}`,
  });
  if (!titleOk) riskFactors.push('Sin título válido');
  if (!responsibleOk) riskFactors.push('Sin responsable asignado');
  if (descLen < 30) riskFactors.push('Descripción muy corta');

  // ── 2. Planificación temporal (20%) ────────────────────────────────────────
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
    weight: 0.20,
    passed: planScore >= 70,
    detail: planDetail,
  });

  // ── 3. Hitos (20%) ─────────────────────────────────────────────────────────
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
    weight: 0.20,
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

  // ── 4. Criterios de aceptación (15%) ───────────────────────────────────────
  const criteriaCount = p.acceptanceCriteria?.length ?? 0;
  const criteriaScore = criteriaCount >= 5 ? 100
    : criteriaCount >= 3 ? 80
    : criteriaCount >= 1 ? 50
    : 0;

  dimensions.push({
    key: 'criteria',
    label: 'Criterios de aceptación',
    score: criteriaScore,
    weight: 0.15,
    passed: criteriaCount >= 3,
    detail: criteriaCount === 0
      ? 'Sin criterios definidos'
      : `${criteriaCount} criterio(s) definido(s)`,
  });
  if (criteriaCount === 0) riskFactors.push('Sin criterios de aceptación');

  // ── 5. Gestión de riesgos (15%) ────────────────────────────────────────────
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
    weight: 0.15,
    passed: riskScore >= 60,
    detail: riskDetail,
  });

  // ── 6. Logística del evento (10%) ──────────────────────────────────────────
  const venue    = p.logistics?.venue?.name?.trim();
  const artists  = p.logistics?.artists?.length ?? 0;
  const capacity = p.logistics?.capacity ?? 0;
  const sectors  = p.logistics?.sectors?.length ?? 0;

  const logScore = Math.round(
    (venue    ? 40 : 0) +
    (artists  > 0 ? 30 : 0) +
    (capacity > 0 ? 20 : 0) +
    (sectors  > 0 ? 10 : 0)
  );

  dimensions.push({
    key: 'logistics',
    label: 'Logística del evento',
    score: logScore,
    weight: 0.10,
    passed: logScore >= 60,
    detail: !venue
      ? 'Sin lugar del evento definido'
      : `${venue}${artists > 0 ? ` · ${artists} artista(s)` : ''}${capacity > 0 ? ` · Aforo: ${capacity}` : ''}`,
  });
  if (!venue) riskFactors.push('Sin lugar del evento definido');

  // ── 7. Presupuesto asignado (5%) ───────────────────────────────────────────
  const hasBudget  = !!p.budget && p.budget > 0;
  const budgetScore = hasBudget ? 100 : 0;

  dimensions.push({
    key: 'budget',
    label: 'Presupuesto asignado',
    score: budgetScore,
    weight: 0.05,
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
