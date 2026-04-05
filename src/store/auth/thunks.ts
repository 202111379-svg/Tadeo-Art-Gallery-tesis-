import type { AppDispach } from '../store';
import type { LoginFormInputs, RegisterFormInputs } from '../../auth';
import { checkingCredencials, login, logout } from '.';
import { clearProjectsLogout } from '../../projects/store';
import {
  loginWithEmailAndPassword,
  logoutFirebase,
  registerUserWithEmailPassword,
} from '../../firebase/providers';

export const startLoginWithEmailAndPassword = ({ email, password }: LoginFormInputs) => {
  return async (dispatch: AppDispach) => {
    dispatch(checkingCredencials());

    const result = await loginWithEmailAndPassword({ email, password });

    if (!result.ok) {
      return dispatch(logout({ errorMessage: result.errorMessage }));
    }

    const { uid, displayName, photoURL } = result;
    dispatch(login({ uid, fullName: displayName, email, photoURL }));
  };
};

export const startCreatingUserWithEmailAndPassword = ({
  email,
  password,
  fullName,
}: RegisterFormInputs) => {
  return async (dispatch: AppDispach) => {
    dispatch(checkingCredencials());

    const { ok, uid, photoURL, errorMessage } = await registerUserWithEmailPassword({
      email,
      password,
      fullName,
    });

    if (!ok) return dispatch(logout({ errorMessage }));
    dispatch(login({ uid, fullName, email, photoURL }));
  };
};

export const startLogout = () => {
  return async (dispatch: AppDispach) => {
    await logoutFirebase();
    dispatch(clearProjectsLogout());
    dispatch(logout());
  };
};
