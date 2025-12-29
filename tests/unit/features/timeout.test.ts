import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createTimeoutSignal,
  combineSignals,
  createTimeoutError,
  applyTimeout,
  isTimeoutAbortError,
} from '../../../src/features/timeout'
import type { InternalRequestConfig } from '../../../src/types'

const mockConfig: InternalRequestConfig = {
  url: '/test',
  method: 'GET',
  headers: new Headers(),
  timeout: 5000,
}

describe('Timeout Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createTimeoutSignal', () => {
    it('should create AbortSignal that aborts after timeout', async () => {
      const signal = createTimeoutSignal(1000)

      expect(signal.aborted).toBe(false)

      vi.advanceTimersByTime(1000)

      expect(signal.aborted).toBe(true)
    })

    it('should have TimeoutError as abort reason', () => {
      const signal = createTimeoutSignal(1000)

      vi.advanceTimersByTime(1000)

      expect(signal.reason).toBeInstanceOf(DOMException)
      expect(signal.reason.name).toBe('TimeoutError')
    })
  })

  describe('combineSignals', () => {
    it('should combine multiple signals', () => {
      const controller1 = new AbortController()
      const controller2 = new AbortController()

      const combined = combineSignals(controller1.signal, controller2.signal)

      expect(combined.aborted).toBe(false)

      controller1.abort()

      expect(combined.aborted).toBe(true)
    })

    it('should handle undefined signals', () => {
      const controller = new AbortController()

      const combined = combineSignals(undefined, controller.signal, undefined)

      expect(combined.aborted).toBe(false)

      controller.abort()

      expect(combined.aborted).toBe(true)
    })

    it('should abort immediately if any signal is already aborted', () => {
      const controller1 = new AbortController()
      const controller2 = new AbortController()

      controller1.abort()

      const combined = combineSignals(controller1.signal, controller2.signal)

      expect(combined.aborted).toBe(true)
    })

    it('should propagate abort reason', () => {
      const controller = new AbortController()
      const reason = new Error('Custom reason')

      const combined = combineSignals(controller.signal)

      controller.abort(reason)

      expect(combined.reason).toBe(reason)
    })
  })

  describe('createTimeoutError', () => {
    it('should create timeout error with message', () => {
      const error = createTimeoutError(mockConfig)

      expect(error.message).toBe('Request timeout after 5000ms')
      expect(error.code).toBe('ERR_TIMEOUT')
      expect(error.config).toBe(mockConfig)
    })
  })

  describe('applyTimeout', () => {
    it('should return user signal if no timeout', () => {
      const controller = new AbortController()

      expect(applyTimeout(0, controller.signal)).toBe(controller.signal)
      expect(applyTimeout(undefined, controller.signal)).toBe(controller.signal)
      expect(applyTimeout(-1, controller.signal)).toBe(controller.signal)
    })

    it('should return timeout signal if no user signal', () => {
      const signal = applyTimeout(1000)

      expect(signal).toBeDefined()
      expect(signal?.aborted).toBe(false)

      vi.advanceTimersByTime(1000)

      expect(signal?.aborted).toBe(true)
    })

    it('should combine timeout and user signal', () => {
      const controller = new AbortController()
      const signal = applyTimeout(1000, controller.signal)

      expect(signal?.aborted).toBe(false)

      // User aborts before timeout
      controller.abort()

      expect(signal?.aborted).toBe(true)
    })

    it('should abort on timeout before user abort', () => {
      const controller = new AbortController()
      const signal = applyTimeout(1000, controller.signal)

      expect(signal?.aborted).toBe(false)

      vi.advanceTimersByTime(1000)

      expect(signal?.aborted).toBe(true)
    })
  })

  describe('isTimeoutAbortError', () => {
    it('should return true for TimeoutError DOMException', () => {
      const error = new DOMException('Timeout', 'TimeoutError')
      expect(isTimeoutAbortError(error)).toBe(true)
    })

    it('should return true for AbortError with timeout message', () => {
      const error = new Error('Request timeout')
      error.name = 'AbortError'
      expect(isTimeoutAbortError(error)).toBe(true)
    })

    it('should return false for regular AbortError', () => {
      const error = new DOMException('Aborted', 'AbortError')
      expect(isTimeoutAbortError(error)).toBe(false)
    })

    it('should return false for other errors', () => {
      expect(isTimeoutAbortError(new Error('Some error'))).toBe(false)
      expect(isTimeoutAbortError('string')).toBe(false)
    })
  })
})
