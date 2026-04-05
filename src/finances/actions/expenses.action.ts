import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Expense } from '../types/expense';

const col = (uid: string) =>
  collection(FirebaseDB, `${uid}/gallery/expenses`);

export const getExpensesAction = async (uid: string): Promise<Expense[]> => {
  const snap = await getDocs(col(uid));
  return snap.docs.map((d) => ({ ...(d.data() as Expense), id: d.id }));
};

export const addExpenseAction = async (
  uid: string,
  expense: Omit<Expense, 'id'>
): Promise<Expense> => {
  const ref = await addDoc(col(uid), expense);
  return { ...expense, id: ref.id };
};

export const deleteExpenseAction = async (
  uid: string,
  id: string
): Promise<void> => {
  await deleteDoc(doc(FirebaseDB, `${uid}/gallery/expenses/${id}`));
};

/**
 * Marca como 'terminated' todos los gastos de un trabajador específico.
 * El gasto histórico se conserva (correcto contablemente) pero queda
 * señalizado como perteneciente a un trabajador dado de baja.
 */
export const markWorkerExpensesAsTerminated = async (
  uid: string,
  workerId: string
): Promise<void> => {
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
