import { useEffect } from 'react';
import { browserSessionPersistence, onAuthStateChanged, setPersistence } from 'firebase/auth';

import { FirebaseAuth } from '../firebase/config';
import { login, logout } from '../store/auth';
import { useAppDispatch, useAppSelector } from '../store/reduxHooks';

export const useCheckAuth = () => {
  const { status } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const subscribe = async () => {
      try {
        await setPersistence(FirebaseAuth, browserSessionPersistence);
        if (!isMounted) return;

        unsubscribe = onAuthStateChanged(FirebaseAuth, (user) => {
          if (!user) {
            dispatch(logout());
            return;
          }

          const { uid, email, displayName, photoURL } = user;
          dispatch(login({ uid, email, fullName: displayName, photoURL }));
        });
      } catch {
        dispatch(logout({ errorMessage: 'No se pudo validar la sesion' }));
      }
    };

    subscribe();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [dispatch]);

  return status;
};
