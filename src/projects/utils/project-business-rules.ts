import type { Expense } from '../../finances/types/expense';
import type { Actividad, ActividadEstado } from '../types/activity';
import type { Project, ProjectPhase } from '../types/project';

export interface RecursosActividadResumen {
  obtenidos: number;
  total: number;
  etiqueta: string;
}

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

const PHASE_ORDER: ProjectPhase[] = ['planning', 'organizing', 'executing', 'evaluating'];

const phaseReachesOrganizing = (phase?: ProjectPhase) =>
  phase ? PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf('organizing') : false;

const phaseReachesExecution = (phase?: ProjectPhase) =>
  phase ? PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf('executing') : false;

const MS_POR_DIA = 1000 * 60 * 60 * 24;

/**
 * Duración en días entre dos fechas, contando ambos extremos
 * (mismo día = 1 día). Devuelve null si faltan datos o el rango es inválido.
 */
export const calcularDuracionDias = (
  inicio?: string,
  fin?: string
): number | null => {
  if (!inicio || !fin) return null;
  const desde = new Date(inicio).getTime();
  const hasta = new Date(fin).getTime();
  if (Number.isNaN(desde) || Number.isNaN(hasta) || hasta < desde) return null;
  return Math.floor((hasta - desde) / MS_POR_DIA) + 1;
};

/**
 * Desviación de cierre en días: positivo = terminó tarde (retraso),
 * negativo = terminó antes (adelanto), 0 = a tiempo.
 */
export const calcularDesviacionDias = (
  finPlanificado?: string,
  finReal?: string
): number | null => {
  if (!finPlanificado || !finReal) return null;
  const plan = new Date(finPlanificado).getTime();
  const real = new Date(finReal).getTime();
  if (Number.isNaN(plan) || Number.isNaN(real)) return null;
  return Math.round((real - plan) / MS_POR_DIA);
};

export const contarRecursosObtenidos = (
  actividad: Pick<Actividad, 'recursos_requeridos'>
): RecursosActividadResumen => {
  const total = actividad.recursos_requeridos.length;
  const obtenidos = actividad.recursos_requeridos.filter((recurso) => recurso.obtenido).length;

  return {
    total,
    obtenidos,
    etiqueta: `${obtenidos} de ${total} recursos obtenidos`,
  };
};

export const puedeEjecutarActividad = (
  actividad: Pick<Actividad, 'recursos_requeridos'>
) => contarRecursosObtenidos(actividad).obtenidos === actividad.recursos_requeridos.length;

export const contarEvidenciasActividad = (
  actividad: Pick<Actividad, 'evidencias' | 'recursos_requeridos'>
) =>
  actividad.evidencias.length +
  actividad.recursos_requeridos.reduce(
    (total, recurso) => total + (recurso.evidencias?.length ?? 0),
    0
  );

export const validarCambioEstadoActividad = (
  actividad: Actividad,
  estadoDestino: ActividadEstado = actividad.estado
) => {
  const siguiente = { ...actividad, estado: estadoDestino };

  if (
    (siguiente.estado === 'En Ejecución' || siguiente.estado === 'Completado') &&
    !puedeEjecutarActividad(siguiente)
  ) {
    throw new BusinessRuleError(
      'La actividad no puede ejecutarse o completarse hasta obtener todos sus recursos requeridos.'
    );
  }

  if (siguiente.estado === 'Completado') {
    if (!siguiente.fecha_real) {
      throw new BusinessRuleError(
        'La actividad debe registrar una fecha real antes de completarse.'
      );
    }

    if (contarEvidenciasActividad(siguiente) === 0) {
      throw new BusinessRuleError(
        'La actividad debe tener al menos una evidencia documental para completarse.'
      );
    }
  }
};

export const validarActividadAntesDeGuardar = (actividad: Actividad) => {
  if (!actividad.nombre_actividad.trim()) {
    throw new BusinessRuleError('El nombre de la actividad es obligatorio.');
  }

  // El responsable se asigna en la fase de Organización, no al crear la actividad.

  if (!actividad.fecha_planificada) {
    throw new BusinessRuleError('La fecha planificada de la actividad es obligatoria.');
  }

  if (actividad.costo_planificado < 0 || actividad.costo_real < 0) {
    throw new BusinessRuleError('Los costos de una actividad no pueden ser negativos.');
  }

  if (
    actividad.fecha_fin_planificada &&
    new Date(actividad.fecha_fin_planificada) < new Date(actividad.fecha_planificada)
  ) {
    throw new BusinessRuleError(
      'La fecha de fin planificada no puede ser anterior a la fecha de inicio planificada.'
    );
  }

  if (
    actividad.fecha_inicio_real &&
    actividad.fecha_real &&
    new Date(actividad.fecha_real) < new Date(actividad.fecha_inicio_real)
  ) {
    throw new BusinessRuleError(
      'La fecha de fin real no puede ser anterior a la fecha de inicio real.'
    );
  }

  validarCambioEstadoActividad(actividad);
};

export const validarProyectoEditable = (project: Pick<Project, 'status'>) => {
  if (project.status === 'closed') {
    throw new BusinessRuleError('El proyecto está cerrado y quedó en modo solo lectura.');
  }
};

export const validarActividadesPlanificadas = (
  project: Pick<Project, 'actividades'>
) => {
  const actividades = project.actividades ?? [];

  if (actividades.length === 0) {
    throw new BusinessRuleError(
      'Planifica al menos una actividad antes de pasar a Organizacion.'
    );
  }

  actividades.forEach(validarActividadAntesDeGuardar);
};

export const validarActividadesOrganizadas = (
  project: Pick<Project, 'actividades'>
) => {
  const actividades = project.actividades ?? [];

  const sinResponsable = actividades.find((actividad) => !actividad.responsable.trim());
  if (sinResponsable) {
    throw new BusinessRuleError(
      `Asigna un responsable a la actividad "${sinResponsable.nombre_actividad}" antes de pasar a Ejecución.`
    );
  }
};

export const validarLocalConfirmadoParaEjecucion = (
  project: Pick<Project, 'logistics'>
) => {
  const venue = project.logistics?.venue;

  if (!venue?.name?.trim()) {
    throw new BusinessRuleError(
      'Define el lugar del evento antes de pasar a ejecucion.'
    );
  }

  if (!venue.confirmed) {
    throw new BusinessRuleError(
      'Confirma el local antes de pasar a ejecucion.'
    );
  }

  if ((venue.evidenceUrls ?? []).length === 0) {
    throw new BusinessRuleError(
      'Adjunta al menos una evidencia del local, como el permiso municipal o contrato, antes de pasar a ejecucion.'
    );
  }
};

export const validarTransicionAEjecucion = (
  project: Pick<Project, 'phase' | 'logistics' | 'actividades'>,
  currentPhase?: ProjectPhase
) => {
  if (!phaseReachesExecution(currentPhase) && phaseReachesExecution(project.phase)) {
    validarActividadesOrganizadas(project);
    validarLocalConfirmadoParaEjecucion(project);
  }
};

export const validarTransicionDeFase = (
  project: Pick<Project, 'phase' | 'logistics' | 'actividades'>,
  currentPhase?: ProjectPhase
) => {
  if (!phaseReachesOrganizing(currentPhase) && phaseReachesOrganizing(project.phase)) {
    validarActividadesPlanificadas(project);
  }

  if (!phaseReachesExecution(currentPhase) && phaseReachesExecution(project.phase)) {
    validarActividadesOrganizadas(project);
    validarLocalConfirmadoParaEjecucion(project);
  }
};

export const validarProyectoPuedeCerrar = (project: Pick<Project, 'actividades'>) => {
  const actividades = project.actividades ?? [];

  if (actividades.length === 0) {
    throw new BusinessRuleError('Registra al menos una actividad antes de cerrar el proyecto.');
  }

  const pendiente = actividades.find((actividad) => actividad.estado !== 'Completado');
  if (pendiente) {
    throw new BusinessRuleError(
      `No se puede cerrar el proyecto: la actividad "${pendiente.nombre_actividad}" no está completada.`
    );
  }
};

export const getProjectClosureReadiness = (
  project: Pick<Project, 'actividades'>
): { canClose: boolean; reason?: string } => {
  try {
    validarProyectoPuedeCerrar(project);
    return { canClose: true };
  } catch (error) {
    return {
      canClose: false,
      reason: error instanceof Error ? error.message : 'El proyecto no cumple las reglas de cierre.',
    };
  }
};

export const getProjectExecutionReadiness = (
  project: Pick<Project, 'logistics'>
): { canExecute: boolean; reason?: string } => {
  try {
    validarLocalConfirmadoParaEjecucion(project);
    return { canExecute: true };
  } catch (error) {
    return {
      canExecute: false,
      reason: error instanceof Error ? error.message : 'El proyecto no puede pasar a ejecucion.',
    };
  }
};

export const validarFlujoCajaRealAntesDeGuardar = (
  project: Project,
  expense: Pick<Expense, 'actividadId' | 'projectId'>
) => {
  validarProyectoEditable(project);

  if (!expense.projectId) return;

  const actividades = project.actividades ?? [];
  if (actividades.length === 0) {
    throw new BusinessRuleError(
      'Planifica y ejecuta una actividad antes de registrar gastos reales del proyecto.'
    );
  }

  if (!expense.actividadId) {
    throw new BusinessRuleError(
      'Selecciona la actividad ejecutada antes de registrar un gasto del proyecto.'
    );
  }

  const actividad = actividades.find((item) => item.id === expense.actividadId);
  if (!actividad) {
    throw new BusinessRuleError('La actividad vinculada al gasto no existe en el proyecto.');
  }

  if (!actividad.fecha_real) {
    throw new BusinessRuleError(
      'No se puede registrar un gasto real si la actividad no tiene fecha real registrada.'
    );
  }
};
