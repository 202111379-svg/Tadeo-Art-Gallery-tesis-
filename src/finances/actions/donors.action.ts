import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Donor } from '../types/donor';

const col = (uid: string) => collection(FirebaseDB, `${uid}/gallery/donors`);

export const getDonorsAction = async (uid: string, seasonId?: string): Promise<Donor[]> => {
  const q = seasonId
    ? query(col(uid), where('seasonId', '==', seasonId))
    : col(uid);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Donor), id: d.id }));
};

export const addDonorAction = async (uid: string, donor: Omit<Donor, 'id'>): Promise<Donor> => {
  const ref = await addDoc(col(uid), donor);
  return { ...donor, id: ref.id } as Donor;
};

export const deleteDonorAction = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(doc(FirebaseDB, `${uid}/gallery/donors/${id}`));
};
