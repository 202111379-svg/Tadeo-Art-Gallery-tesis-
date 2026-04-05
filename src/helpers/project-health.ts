import { differenceInDays, isPast, isValid, parseISO } from 'date-fns';
import type { Project } from '../projects/types/project';

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export type HealthState = 'green' | 'amber' | 'red';

export interface HealthDimension {
  key: string;
  label: string;
  score: number;   // 0–100 dentro de la dimensión
  weight: number;  // peso relativo (suma = 1)
  passed: boolean;
  detail: string;
}

export interface ProjectHealthResult {
  state: HealthState;
  score: number;          // 0–100 ponderado final
  dimensions: HealthDimension[];
  riskFactors: string[];
}

// ─── Etiquetas y colores ───────────────────────────────────────────────────────

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

// ─── Umbrales globales ─────────────────────────────────────────────────────────
const THRESHOLD_GREEN = 75;
const THRESHOLD_AMBER = 45;

// ─── Umbrales de proximidad de cierre ─────────────────────────────────────────
// > 90 días  → Saludable  (score 100)
// 31–90 días → En atención (score 55)
// 1–30 días  → Crítico     (score 20)
// vencido    → Crítico     (score 0)
// sin fechas → sin datos   (score 0)

const DEADLINE_GREEN_DAYS = 90;   // más de 3 meses → saludable
const DEADLINE_AMBER_DAYS = 30;   // 1–3 meses      → en atención
// ≤ 30 días o vencido            → crítico

// ─── Motor de cálculo ──────────────────────────────────────────────────────────

export const computeProjectHealth = (p: Project): HealthState =>
  computeProjectHealthFull(p).state;

export const computeProjectHealthFull = (p: Project): ProjectHealthResult => {
  const now = Date.now();
  const dimensions: HealthDimension[] = [];
  const riskFactors: string[] = [];

  // Parsear fechas una sola vez
  const startDate = p.startDate ? parseISO(p.startDate) : null;
  const endDate   = p.endDate   ? parseISO(p.endDate)   : null;
  const datesValid = startDate && endDate && isValid(startDate) && isValid(endDate);
  const isOverdue  = datesValid ? isPast(endDate!) : false;
  const daysRemaining = datesValid ? differenceInDays(endDate!, now) : null;
  const totalDays     = datesValid ? differenceInDays(endDate!, startDate!) : null;

  // ── 1. Documentación (20%) ──────────────────────────────────────────────────
  const titleOk = !!p.title && p.title.trim().length >= 5;
  const descLen = p.description?.trim().length ?? 0;
  const descOk  = descLen >= 100;
  const docScore = (titleOk ? 50 : 0) + (descOk ? 50 : descLen >= 30 ? 25 : 0);

  dimensions.push({
    key: 'documentation',
    label: 'Documentación',
    score: docScore,
    weight: 0.20,
    passed: docScore >= 75,
    detail: !titleOk
      ? 'Título demasiado corto (mín. 5 caracteres)'
      : !descOk
      ? `Descripción insuficiente (${descLen}/100 caracteres mínimos)`
      : 'Título y descripción completos',
  });
  if (!titleOk) riskFactors.push('Sin título válido');
  if (descLen < 30) riskFactors.push('Descripción muy corta o ausente');

  // ── 2. Proximidad de cierre (20%) ──────────────────────────────────────────
  // Regla directa definida por el cliente:
  //   > 90 días  → saludable  (100 pts)
  //   31–90 días → en atención (55 pts)
  //   1–30 días  → crítico     (20 pts)
  //   vencido    → crítico     (0 pts)
  //   sin fechas → crítico     (0 pts)

  let deadlineScore = 0;
  let deadlineDetail = '';
  let deadlinePassed = false;

  if (!datesValid) {
    deadlineScore  = 0;
    deadlineDetail = 'Fecha de cierre no definida';
    riskFactors.push('Sin fecha de cierre');
  } else if (isOverdue) {
    deadlineScore  = 0;
    deadlineDetail = `Proyecto vencido hace ${Math.abs(daysRemaining!)} día(s)`;
    riskFactors.push('Proyecto vencido');
  } else if (daysRemaining! <= DEADLINE_AMBER_DAYS) {
    // ≤ 30 días → crítico
    deadlineScore  = 20;
    deadlineDetail = `Cierre en ${daysRemaining} día(s) — zona crítica (≤ 30 días)`;
    riskFactors.push(`Cierre en ${daysRemaining} día(s)`);
  } else if (daysRemaining! <= DEADLINE_GREEN_DAYS) {
    // 31–90 días → en atención
    deadlineScore  = 55;
    deadlineDetail = `Cierre en ${daysRemaining} día(s) — zona de atención (31–90 días)`;
    deadlinePassed = false;
  } else {
    // > 90 días → saludable
    deadlineScore  = 100;
    deadlineDetail = `Cierre en ${daysRemaining} día(s) — margen amplio (> 90 días)`;
    deadlinePassed = true;
  }

  dimensions.push({
    key: 'deadline',
    label: 'Proximidad de cierre',
    score: deadlineScore,
    weight: 0.20,
    passed: deadlinePassed,
    detail: deadlineDetail,
  });

  // ── 3. Planificación temporal (20%) ────────────────────────────────────────
  // Evalúa si las fechas están bien definidas y el proyecto no está vencido
  let planScore = 0;
  let planDetail = '';

  if (!datesValid) {
    planScore  = 0;
    planDetail = 'Fechas de inicio o fin no definidas';
  } else if (isOverdue) {
    planScore  = 10;
    planDetail = `Proyecto vencido — duración planificada: ${totalDays} día(s)`;
  } else {
    // Porcentaje de tiempo transcurrido (más tiempo restante = mejor planificación activa)
    const elapsed = totalDays! - daysRemaining!;
    const pctElapsed = totalDays! > 0 ? elapsed / totalDays! : 0;
    // Score alto si el proyecto está en curso y tiene tiempo razonable
    planScore  = Math.round((1 - pctElapsed * 0.5) * 100);
    planDetail = `${daysRemaining} días restantes de ${totalDays} totales (${Math.round(pctElapsed * 100)}% transcurrido)`;
  }

  dimensions.push({
    key: 'planning',
    label: 'Planificación temporal',
    score: Math.min(100, Math.max(0, planScore)),
    weight: 0.20,
    passed: planScore >= 75,
    detail: planDetail,
  });
  if (!datesValid) riskFactors.push('Sin fechas de planificación');

  // ── 4. Hitos (20%) ─────────────────────────────────────────────────────────
  const milestoneCount = p.milestones?.length ?? 0;
  const overdueMs = p.milestones?.filter((m) => isPast(new Date(m.date))).length ?? 0;
  const milestoneScore = Math.max(
    0,
    milestoneCount === 0 ? 0
    : milestoneCount >= 5 ? 100 - overdueMs * 10
    : milestoneCount >= 2 ? 70  - overdueMs * 10
    :                       40  - overdueMs * 10
  );

  dimensions.push({
    key: 'milestones',
    label: 'Hitos definidos',
    score: milestoneScore,
    weight: 0.20,
    passed: milestoneCount >= 2 && overdueMs === 0,
    detail:
      milestoneCount === 0
        ? 'Sin hitos definidos'
        : overdueMs > 0
        ? `${milestoneCount} hito(s), ${overdueMs} vencido(s)`
        : `${milestoneCount} hito(s) al día`,
  });
  if (milestoneCount === 0) riskFactors.push('Sin hitos de seguimiento');
  if (overdueMs > 0) riskFactors.push(`${overdueMs} hito(s) vencido(s)`);

  // ── 5. Criterios de aceptación (15%) ───────────────────────────────────────
  const criteriaCount = p.acceptanceCriteria?.length ?? 0;
  const criteriaScore =
    criteriaCount >= 5 ? 100
    : criteriaCount >= 3 ? 80
    : criteriaCount >= 1 ? 50
    : 0;

  dimensions.push({
    key: 'criteria',
    label: 'Criterios de aceptación',
    score: criteriaScore,
    weight: 0.15,
    passed: criteriaCount >= 3,
    detail:
      criteriaCount === 0
        ? 'Sin criterios de aceptación definidos'
        : `${criteriaCount} criterio(s) definido(s)`,
  });
  if (criteriaCount === 0) riskFactors.push('Sin criterios de aceptación');

  // ── 6. Actividad y avance (5%) ─────────────────────────────────────────────
  // Hitos próximos en los siguientes 30 días
  const upcomingMs = p.milestones?.filter((m) => {
    const diff = differenceInDays(new Date(m.date), now);
    return diff >= 0 && diff <= 30;
  }).length ?? 0;

  const progressScore = !datesValid || isOverdue
    ? 0
    : upcomingMs > 0
    ? 100
    : 40;

  dimensions.push({
    key: 'progress',
    label: 'Actividad próxima',
    score: progressScore,
    weight: 0.05,
    passed: progressScore >= 50,
    detail:
      upcomingMs > 0
        ? `${upcomingMs} hito(s) en los próximos 30 días`
        : isOverdue
        ? 'Sin actividad — proyecto vencido'
        : 'Sin hitos próximos registrados',
  });

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

// ─── Versión binaria para Dashboard y Reportes ────────────────────────────────

export const isProjectHealthy = (p: Project): boolean =>
  computeProjectHealthFull(p).score >= THRESHOLD_GREEN;
