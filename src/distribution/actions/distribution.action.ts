import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
} from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Sector, Worker } from '../types/items';

const col = (uid: string) =>
  collection(FirebaseDB, `${uid}/gallery/sectors`);

export const getSectorsAction = async (
  uid: string,
  seasonId?: string
): Promise<Sector[]> => {
  const q = seasonId
    ? query(col(uid), where('seasonId', '==', seasonId))
    : col(uid);
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Sector;
    return { ...data, id: d.id, workers: data.workers ?? [] };
  });
};

export const addSectorAction = async (
  uid: string,
  sector: Omit<Sector, 'id' | 'workers'>
): Promise<Sector> => {
  const clean: Record<string, unknown> = {
    name: sector.name,
    workers: [],
  };
  if (sector.description) clean.description = sector.description;
  if (sector.seasonId) clean.seasonId = sector.seasonId;

  const ref = await addDoc(col(uid), clean);
  return { ...sector, id: ref.id, workers: [] };
};

export const deleteSectorAction = async (
  uid: string,
  sectorId: string
): Promise<void> => {
  await deleteDoc(doc(FirebaseDB, `${uid}/gallery/sectors/${sectorId}`));
};

export const addWorkerToSectorAction = async (
  uid: string,
  sectorId: string,
  worker: Worker
): Promise<void> => {
  const cleanWorker: Record<string, unknown> = {
    id: worker.id,
    name: worker.name,
    role: worker.role,
    salary: worker.salary,
    currency: worker.currency,
    addedAt: worker.addedAt,
  };
  // Incluir projectId y projectTitle si existen
  if (worker.projectId) cleanWorker.projectId = worker.projectId;
  if (worker.projectTitle) cleanWorker.projectTitle = worker.projectTitle;

  const ref = doc(FirebaseDB, `${uid}/gallery/sectors/${sectorId}`);
  await updateDoc(ref, { workers: arrayUnion(cleanWorker) });
};

export const removeWorkerFromSectorAction = async (
  uid: string,
  sectorId: string,
  worker: Worker
): Promise<void> => {
  // Para arrayRemove, el objeto debe coincidir exactamente con lo guardado en Firestore
  // Reconstruimos el objeto con los mismos campos que se guardaron
  const cleanWorker: Record<string, unknown> = {
    id: worker.id,
    name: worker.name,
    role: worker.role,
    salary: worker.salary,
    currency: worker.currency,
    addedAt: worker.addedAt,
  };
  if (worker.projectId) cleanWorker.projectId = worker.projectId;
  if (worker.projectTitle) cleanWorker.projectTitle = worker.projectTitle;

  const ref = doc(FirebaseDB, `${uid}/gallery/sectors/${sectorId}`);
  await updateDoc(ref, { workers: arrayRemove(cleanWorker) });
};
