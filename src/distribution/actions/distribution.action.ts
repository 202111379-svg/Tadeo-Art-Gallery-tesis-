import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Sector, Worker } from '../types/items';

const col = (uid: string) =>
  collection(FirebaseDB, `${uid}/gallery/sectors`);

export const getSectorsAction = async (uid: string): Promise<Sector[]> => {
  const snap = await getDocs(col(uid));
  return snap.docs.map((d) => {
    const data = d.data() as Sector;
    return { ...data, id: d.id, workers: data.workers ?? [] };
  });
};

export const addSectorAction = async (
  uid: string,
  sector: Omit<Sector, 'id' | 'workers'>
): Promise<Sector> => {
  // Limpiamos undefined para que Firestore no rechace el documento
  const clean: Record<string, unknown> = {
    name: sector.name,
    workers: [],
  };
  if (sector.description) clean.description = sector.description;

  const ref = await addDoc(col(uid), clean);
  return { name: sector.name, description: sector.description, id: ref.id, workers: [] };
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
  // Limpiamos el objeto worker para que no tenga undefined
  const cleanWorker: Record<string, unknown> = {
    id: worker.id,
    name: worker.name,
    role: worker.role,
    salary: worker.salary,
    currency: worker.currency,
    addedAt: worker.addedAt,
  };

  const ref = doc(FirebaseDB, `${uid}/gallery/sectors/${sectorId}`);
  await updateDoc(ref, { workers: arrayUnion(cleanWorker) });
};

export const removeWorkerFromSectorAction = async (
  uid: string,
  sectorId: string,
  worker: Worker
): Promise<void> => {
  // Para arrayRemove el objeto debe ser idéntico al guardado
  const cleanWorker: Record<string, unknown> = {
    id: worker.id,
    name: worker.name,
    role: worker.role,
    salary: worker.salary,
    currency: worker.currency,
    addedAt: worker.addedAt,
  };

  const ref = doc(FirebaseDB, `${uid}/gallery/sectors/${sectorId}`);
  await updateDoc(ref, { workers: arrayRemove(cleanWorker) });
};
