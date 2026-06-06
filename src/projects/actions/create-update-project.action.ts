import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Project } from '../types/project';
import { fileUpload } from '../../helpers';
import {
  validarActividadAntesDeGuardar,
  validarProyectoEditable,
  validarTransicionDeFase,
  validarProyectoPuedeCerrar,
} from '../utils/project-business-rules';

/**
 * Elimina recursivamente todos los campos undefined de un objeto.
 * Firestore rechaza undefined en cualquier nivel de anidamiento.
 */
const deepClean = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(deepClean).filter((v) => v !== undefined);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, deepClean(v)])
    );
  }
  return obj;
};

export const createUpdateProjectAction = async (
  uid: string,
  projectLike: Partial<Project> & { files?: File[] }
): Promise<Project> => {
  const { id, files = [], imagesUrls = [], ...rest } = projectLike;

  const isCreating = id === 'new';

  // Limpieza profunda — elimina undefined en todos los niveles
  // (todavía sin las nuevas imágenes; se añaden después de validar)
  const projectToSend = deepClean({
    ...rest,
    id,
    imagesUrls,
  }) as Record<string, unknown>;

  let currentProject: Project | undefined;
  let existingDocRef: ReturnType<typeof doc> | undefined;

  // ── 1. Leer proyecto actual y validar edición ────────────────────────────
  if (!isCreating) {
    existingDocRef = doc(FirebaseDB, `${uid}/gallery/projects/${id}`);
    const current = await getDoc(existingDocRef);
    if (current.exists()) {
      currentProject = current.data() as Project;
      validarProyectoEditable(currentProject);
    }
  }

  // ── 2. Validar reglas de negocio ANTES de subir archivos ─────────────────
  // Así, si hay un error de validación, los archivos no se suben y no se
  // generan duplicados al volver a intentar guardar.
  const actividades = (projectToSend.actividades ?? []) as Project['actividades'];
  actividades?.forEach(validarActividadAntesDeGuardar);
  validarTransicionDeFase(
    projectToSend as Pick<Project, 'phase' | 'logistics' | 'actividades'>,
    currentProject?.phase
  );

  if (projectToSend.status === 'closed') {
    validarProyectoPuedeCerrar(projectToSend as Pick<Project, 'actividades'>);
  }

  // ── 3. Subir nuevas imágenes (solo si la validación pasó) ────────────────
  if (files.length > 0) {
    const uploadPromises = files.map((file) => fileUpload(file));
    const newUrls = await Promise.all(uploadPromises);
    imagesUrls.push(...newUrls);
    (projectToSend as Record<string, unknown>).imagesUrls = imagesUrls;
  }

  // ── 4. Guardar en Firestore ───────────────────────────────────────────────
  if (isCreating) {
    const newDoc = doc(collection(FirebaseDB, `${uid}/gallery/projects`));
    projectToSend.id = newDoc.id;
    await setDoc(newDoc, projectToSend);
  } else {
    await setDoc(existingDocRef!, projectToSend, { merge: true });
  }

  return projectToSend as unknown as Project;
};
