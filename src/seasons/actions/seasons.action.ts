import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Season } from '../types/season';

const col = (uid: string) =>
  collection(FirebaseDB, `${uid}/gallery/seasons`);

export const getSeasonsAction = async (uid: string): Promise<Season[]> => {
  const snap = await getDocs(col(uid));
  const seasons = snap.docs.map((d) => ({ ...(d.data() as Season), id: d.id }));
  // Ordenar en memoria para evitar requerir índice en Firestore
  return seasons.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const createSeasonAction = async (
  uid: string,
  season: Omit<Season, 'id'>
): Promise<Season> => {
  const ref = await addDoc(col(uid), season);
  return { ...season, id: ref.id };
};

export const closeSeasonAction = async (
  uid: string,
  seasonId: string,
  summary: Season['closingSummary']
): Promise<void> => {
  const ref = doc(FirebaseDB, `${uid}/gallery/seasons/${seasonId}`);
  await updateDoc(ref, {
    status: 'closed',
    endDate: new Date().toISOString(),
    closingSummary: summary,
  });
};
