import { collection, getDocs, query, where } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Project } from '../types/project';
import { formatISO } from 'date-fns';

const toISOString = (value: unknown): string => {
  if (!value) return formatISO(Date.now());
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return formatISO(value);
  if (typeof value === 'object' && 'seconds' in (value as object)) {
    return formatISO((value as { seconds: number }).seconds * 1000);
  }
  return formatISO(Date.now());
};

export const getProjectsAction = async (
  uid: string,
  seasonId?: string
): Promise<Project[]> => {
  const col = collection(FirebaseDB, `${uid}/gallery/projects`);
  const q = seasonId
    ? query(col, where('seasonId', '==', seasonId))
    : col;

  const docs = await getDocs(q);
  return docs.docs.map((d) => {
    const data = d.data() as Project;
    return {
      ...data,
      id: d.id,
      startDate: toISOString(data.startDate),
      endDate: toISOString(data.endDate),
    };
  });
};
