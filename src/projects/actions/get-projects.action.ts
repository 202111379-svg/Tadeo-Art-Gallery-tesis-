import { collection, getDocs, query, where } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Project } from '../types/project';

export const getProjectsAction = async (
  uid: string,
  seasonId?: string
): Promise<Project[]> => {
  const col = collection(FirebaseDB, `${uid}/gallery/projects`);
  const q = seasonId
    ? query(col, where('seasonId', '==', seasonId))
    : col;

  const docs = await getDocs(q);
  return docs.docs.map((d) => ({ ...(d.data() as Project), id: d.id }));
};
