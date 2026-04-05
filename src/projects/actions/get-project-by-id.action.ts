import { collection, doc, getDoc } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Project } from '../types/project';
import { addDays, formatISO } from 'date-fns';

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

  return project.data() as Project;
};
