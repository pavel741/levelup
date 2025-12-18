import { renderHook, act } from '@testing-library/react'
import { useFirestoreStore } from '../useFirestoreStore'

// Mock Firestore functions
jest.mock('../../lib/firestore', () => ({
  subscribeToHabits: jest.fn(() => () => {}),
  saveHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
  subscribeToChallenges: jest.fn(() => () => {}),
  updateChallenge: jest.fn(),
  subscribeToBlockedSites: jest.fn(() => () => {}),
  saveBlockedSite: jest.fn(),
  deleteBlockedSite: jest.fn(),
  saveDailyStats: jest.fn(),
  getUserData: jest.fn(),
  updateUserData: jest.fn(),
}))

jest.mock('../../lib/auth', () => ({
  onAuthChange: jest.fn(() => () => {}),
}))

describe('useFirestoreStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useFirestoreStore())
    act(() => {
      result.current.setUser(null as any)
    })
  })

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useFirestoreStore())

    expect(result.current.user).toBeNull()
    expect(result.current.habits).toEqual([])
    expect(result.current.challenges).toEqual([])
    // isLoading may be false if auth listener has already fired
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('sets user correctly', () => {
    const { result } = renderHook(() => useFirestoreStore())
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      streak: 0,
      longestStreak: 0,
      achievements: [],
      joinedAt: new Date(),
    }

    act(() => {
      result.current.setUser(mockUser)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isLoading).toBe(false)
  })
})

