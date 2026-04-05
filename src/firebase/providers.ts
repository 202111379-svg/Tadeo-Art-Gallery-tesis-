import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import type { LoginFormInputs, RegisterFormInputs } from '../auth/types';
import { FirebaseAuth } from './config';

export const loginWithEmailAndPassword = async ({
  email,
  password,
}: LoginFormInputs) => {
  try {
    const resp = await signInWithEmailAndPassword(FirebaseAuth, email, password);
    const { uid, displayName, photoURL } = resp.user;
    return { ok: true, uid, displayName, email, photoURL };
  } catch (error) {
    const errorMessage =
      error instanceof Error && 'code' in error
        ? 'Usuario o contraseña incorrectos'
        : 'Ha ocurrido un error, inténtalo nuevamente';
    return { ok: false, errorMessage };
  }
};

export const registerUserWithEmailPassword = async ({
  email,
  password,
  fullName: displayName,
}: RegisterFormInputs) => {
  try {
    const resp = await createUserWithEmailAndPassword(FirebaseAuth, email, password);
    const { uid, photoURL } = resp.user;
    await updateProfile(FirebaseAuth.currentUser!, { displayName });
    return { ok: true, uid, photoURL, email, displayName };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? 'No se pudo crear la cuenta, inténtalo nuevamente'
        : 'Ha ocurrido un error inesperado';
    return { ok: false, errorMessage };
  }
};

export const logoutFirebase = async () => {
  return await FirebaseAuth.signOut();
};
