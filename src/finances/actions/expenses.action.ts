import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Expense } from '../types/expense';

const col = (uid: string) => collection(FirebaseDB, `${uid}/gallery/expenses`);

export const getExpensesAction = async (uid: string, seasonId?: string): Promise<Expense[]> => {
  const q = seasonId
    ? query(col(uid), where('seasonId', '==', seasonId))
    : col(uid);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Expense), id: d.id }));
};

export const addExpenseAction = async (uid: string, expense: Omit<Expense, 'id'>): Promise<Expense> => {
  const ref = await addDoc(col(uid), expense);
  return { ...expense, id: ref.id };
};

export const deleteExpenseAction = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(doc(FirebaseDB, `${uid}/gallery/expenses/${id}`));
};

export const markWorkerExpensesAsTerminated = async (uid: string, workerId: string): Promise<void> => {
  const snap = await getDocs(col(uid));
  const toUpdate = snap.docs.filter(
    (d) => d.data().workerId === workerId && d.data().workerStatus === 'active'
  );
  await Promise.all(
    toUpdate.map((d) =>
      updateDoc(d.ref, {
        workerStatus: 'terminated',
        notes: `${d.data().notes ?? ''} | Trabajador dado de baja`.trim(),
      })
    )
  );
};
