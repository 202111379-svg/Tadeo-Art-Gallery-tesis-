import { describe, expect, test } from 'vitest';
import {
  authSlice,
  checkingCredencials,
  login,
  logout,
} from '../../store/auth/auth-slice';
import {
  authenticatedState,
  demoUser,
  initialState,
} from '../../../test/fixtures/auth-fixtures';

describe('Pruebas en el auth-slice', () => {
  test('debe de regresar el estado inicial y llamarse "auth"', () => {
    expect(authSlice.name).toBe('auth');
    const state = authSlice.reducer(initialState, {
      type: '',
    });

    expect(state).toEqual(initialState);
  });

  test('debe de realizar la autenticacion', () => {
    const state = authSlice.reducer(initialState, login(demoUser));

    expect(state).toEqual({
      status: 'authenticated',
      uid: demoUser.uid,
      email: demoUser.email,
      fullName: demoUser.fullName,
      photoURL: demoUser.photoURL,
      errorMessage: null,
    });
  });

  test('debe de realizar el logout sin argumentos', () => {
    const state = authSlice.reducer(authenticatedState, logout());

    expect(state).toEqual({
      status: 'not-authenticated',
      uid: null,
      email: null,
      fullName: null,
      photoURL: null,
      errorMessage: null,
    });
  });

  test('debe de realizar el logout con argumentos', () => {
    const errorMessage = 'Credenciales no son correctas';

    const state = authSlice.reducer(
      authenticatedState,
      logout({ errorMessage })
    );

    expect(state).toEqual({
      status: 'not-authenticated',
      uid: null,
      email: null,
      fullName: null,
      photoURL: null,
      errorMessage: errorMessage,
    });
  });

  test('debe de cambiar el estado a checking', () => {
    const state = authSlice.reducer(initialState, checkingCredencials());
    expect(state.status).toEqual('checking');
  });
});
