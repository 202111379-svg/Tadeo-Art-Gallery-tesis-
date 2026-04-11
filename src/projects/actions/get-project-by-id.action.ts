import { collection, doc, getDoc } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Project } from '../types/project';
import { addDays, formatISO } from 'date-fns';

// Convierte Timestamp de Firestore, número o string a string ISO
const toISOString = (value: unknown): string => {
  if (!value) return formatISO(Date.now());
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return formatISO(value);
  if (typeof value === 'object' && 'seconds' in (value as object)) {
    return formatISO((value as { seconds: number }).seconds * 1000);
  }
  return formatISO(Date.now());
};

export const getProjectByIdAction = async (
  uid: string,
  id: string
): Promise<Project> => {
  if (!id) throw new Error('El id del proyecto es requerido');

  if (id === 'new') {
    const newDate = Date.now();

    return {
      id: 'new',
      title: 'Nuevo proyecto',
      description: '',
      startDate: formatISO(newDate),
      endDate: formatISO(addDays(newDate, 2)),
      milestones: [],
      acceptanceCriteria: [],
      imagesUrls: [],
    };
  }

  const collectionRef = collection(FirebaseDB, `${uid}/gallery/projects`);
  const docRef = doc(collectionRef, id);
  const project = await getDoc(docRef);

  if (!project.exists()) throw new Error('Proyecto no encontrado');

  const data = project.data() as Project;
  return {
    ...data,
    id: project.id,
    startDate: toISOString(data.startDate),
    endDate: toISOString(data.endDate),
  } as Project;
};
