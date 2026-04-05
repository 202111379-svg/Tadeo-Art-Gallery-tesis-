import { deleteDoc, doc } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { AppDispach, RootState } from '../../store/store';
import { deleteProjectById } from './projects-slice';

export const startDeletingProject = (id: string) => {
  return async (dispatch: AppDispach, getState: () => RootState) => {
    const { uid } = getState().auth;
    await deleteDoc(doc(FirebaseDB, `${uid}/gallery/projects/${id}`));
    dispatch(deleteProjectById(id));
  };
};
