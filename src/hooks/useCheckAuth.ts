import { useEffect } from 'react';
import { onAuthStateChanged, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { FirebaseAuth } from '../firebase/config';
import { login, logout } from '../store/auth';
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';

/**
 * Usa browserSessionPersistence: la sesión dura mientras la pestaña esté abierta.
 * Al cerrar el navegador o la pestaña, el usuario debe volver a iniciar sesión.
 */
export const useCheckAuth = () => {
  const { status } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Configurar persistencia por sesión (no persiste al cerrar el navegador)
    setPersistence(FirebaseAuth, browserSessionPersistence).then(() => {
      const unsub = onAuthStateChanged(FirebaseAuth, (user) => {
        if (!user) return dispatch(logout());
        const { uid, email, displayName, photoURL } = user;
        dispatch(login({ uid, email, fullName: displayName, photoURL }));
      });
      return unsub;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return status;
};
