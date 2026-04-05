import { collection, doc, setDoc } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import type { Project } from '../types/project';
import { fileUpload } from '../../helpers';

export const createUpdateProjectAction = async (
  uid: string,
  projectLike: Partial<Project> & { files?: File[] }
): Promise<Project> => {
  const { id, files = [], imagesUrls = [], ...rest } = projectLike;

  const isCreating = id === 'new';

  // Subir nuevas imágenes si las hay
  if (files.length > 0) {
    const uploadPromises = files.map((file) => fileUpload(file));
    const newUrls = await Promise.all(uploadPromises);
    imagesUrls.push(...newUrls);
  }

  // Limpiar campos undefined para que Firestore no los rechace
  const cleanRest = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined)
  );

  const projectToSend = {
    ...cleanRest,
    id,
    imagesUrls,
  };

  if (isCreating) {
    const newDoc = doc(collection(FirebaseDB, `${uid}/gallery/projects`));
    projectToSend.id = newDoc.id;
    await setDoc(newDoc, projectToSend);
  } else {
    // updateDoc con merge para no sobreescribir campos no enviados
    const docRef = doc(FirebaseDB, `${uid}/gallery/projects/${id}`);
    await setDoc(docRef, projectToSend, { merge: true });
  }

  return projectToSend as Project;
};
