// Mock Firebase before importing
jest.mock('../firebase', () => ({
  auth: {
    currentUser: null,
  },
}))

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithRedirect: jest.fn(),
  getRedirectResult: jest.fn(),
}))

jest.mock('../firestore', () => ({
  getUserData: jest.fn(),
  createUserData: jest.fn(),
}))

import { getErrorMessage } from '../auth'

describe('Auth Utilities', () => {
  describe('getErrorMessage', () => {
    it('returns user-friendly message for email-already-in-use', () => {
      const error = { code: 'auth/email-already-in-use' }
      expect(getErrorMessage(error)).toBe(
        'This email is already registered. Please sign in instead.'
      )
    })

    it('returns user-friendly message for invalid-credential', () => {
      const error = { code: 'auth/invalid-credential' }
      expect(getErrorMessage(error)).toBe(
        'Invalid email or password. Please check your credentials and try again.'
      )
    })

    it('returns user-friendly message for invalid-email', () => {
      const error = { code: 'auth/invalid-email' }
      expect(getErrorMessage(error)).toBe(
        'Invalid email address. Please check and try again.'
      )
    })

    it('returns user-friendly message for weak-password', () => {
      const error = { code: 'auth/weak-password' }
      expect(getErrorMessage(error)).toBe(
        'Password is too weak. Please use a stronger password.'
      )
    })

    it('returns default message for unknown errors', () => {
      const error = { code: 'auth/unknown-error' }
      expect(getErrorMessage(error)).toBe('An error occurred. Please try again.')
    })

    it('handles errors without code', () => {
      const error = { message: 'Some error' }
      expect(getErrorMessage(error)).toBe('Some error')
    })
  })
})

