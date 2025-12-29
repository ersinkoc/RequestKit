import { vi, beforeEach, afterEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Reset mocks before each test
beforeEach(() => {
  mockFetch.mockReset()
})

// Cleanup after each test
afterEach(() => {
  vi.clearAllTimers()
})

// Export for use in tests
export { mockFetch }
