import type { AuthState } from '../../src/auth/types/auth-state';

export const initialState: AuthState = {
  status: 'checking', // 'checking', 'not-authenticated, 'authenticated''
  uid: null,
  email: null,
  fullName: null,
  photoURL: null,
  errorMessage: null,
};

export const authenticatedState: AuthState = {
  status: 'authenticated', // 'checking', 'not-authenticated, 'authenticated''
  uid: '123ABC',
  email: 'demo@email.com',
  fullName: 'Demo User',
  photoURL: 'https://demo.jpg',
  errorMessage: null,
};

export const notAuthenticatedState: AuthState = {
  status: 'not-authenticated', // 'checking', 'not-authenticated, 'authenticated''
  uid: null,
  email: null,
  fullName: null,
  photoURL: null,
  errorMessage: null,
};

export const demoUser: AuthState = {
  uid: 'ABC123',
  email: 'demo@email.com',
  fullName: 'Demo User',
  photoURL: 'https://demo.jpg',
} as AuthState;
