import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Project } from '../types/project';
import { validarProyectoEditable } from '../utils/project-business-rules';

export const deleteProjectByIdAction = async (uid: string, id: string) => {
  const docRef = doc(FirebaseDB, `${uid}/gallery/projects/${id}`);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    validarProyectoEditable(snapshot.data() as Project);
  }
  await deleteDoc(docRef);
};
