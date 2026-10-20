export type AuthErrorCode =
  | 'auth/invalid-credential'
  | 'auth/wrong-password'
  | 'auth/user-not-found'
  | 'auth/too-many-requests'
  | 'auth/network-request-failed'
  | 'auth/email-already-in-use'
  | 'auth/invalid-email'
  | 'auth/weak-password'
  | string;

export interface AuthError {
  code?: AuthErrorCode;
  message?: string;
}
