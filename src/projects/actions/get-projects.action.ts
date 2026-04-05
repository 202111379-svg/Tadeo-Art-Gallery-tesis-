import { collection, getDocs } from 'firebase/firestore';

import { FirebaseDB } from '../../firebase/config';
import type { Project } from '../types/project';

export const getProjectsAction = async (uid: string): Promise<Project[]> => {
  const collectionRef = collection(FirebaseDB, `${uid}/gallery/projects`);
  const docs = await getDocs(collectionRef);

  const projects: Project[] = [];

  docs.forEach((doc) => {
    const projectDoc = doc.data() as Project;
    projects.push({ ...projectDoc, id: projectDoc.id });
  });

  return projects;
};
