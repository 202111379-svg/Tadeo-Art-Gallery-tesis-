import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Project } from '../types/project';
import {
  validarProyectoEditable,
  validarProyectoPuedeCerrar,
} from '../utils/project-business-rules';

export const cerrarProyecto = async (
  uid: string,
  proyectoId: string
): Promise<Project> => {
  const docRef = doc(FirebaseDB, `${uid}/gallery/projects/${proyectoId}`);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) throw new Error('Proyecto no encontrado');

  const project = { ...(snapshot.data() as Project), id: snapshot.id };
  validarProyectoEditable(project);
  validarProyectoPuedeCerrar(project);

  const closedAt = new Date().toISOString();
  const closedProject: Project = {
    ...project,
    status: 'closed',
    phase: 'evaluating',
    closedAt,
  };

  await updateDoc(docRef, {
    status: closedProject.status,
    phase: closedProject.phase,
    closedAt,
  });

  return closedProject;
};
