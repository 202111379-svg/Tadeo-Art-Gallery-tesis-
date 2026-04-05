import { deleteDoc, doc } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';

export const deleteProjectByIdAction = async (uid: string, id: string) => {
  const docRef = doc(FirebaseDB, `${uid}/gallery/projects/${id}`);
  await deleteDoc(docRef);
};
