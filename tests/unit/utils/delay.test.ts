import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  delay,
  abortableDelay,
  timeout,
  withTimeout,
} from '../../../src/utils/delay'

describe('Delay Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('delay', () => {
    it('should resolve after specified time', async () => {
      const promise = delay(1000)

      vi.advanceTimersByTime(999)
      await Promise.resolve()

      vi.advanceTimersByTime(1)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should resolve immediately for 0ms', async () => {
      const promise = delay(0)
      vi.advanceTimersByTime(0)
      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('abortableDelay', () => {
    it('should resolve after specified time', async () => {
      const promise = abortableDelay(1000)

      vi.advanceTimersByTime(1000)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should reject when signal is aborted', async () => {
      const controller = new AbortController()
      const promise = abortableDelay(1000, controller.signal)

      controller.abort()

      await expect(promise).rejects.toThrow()
    })

    it('should reject immediately if signal is already aborted', async () => {
      const controller = new AbortController()
      controller.abort()

      const promise = abortableDelay(1000, controller.signal)

      await expect(promise).rejects.toThrow()
    })
  })

  describe('timeout', () => {
    it('should reject after specified time', async () => {
      const promise = timeout(1000, 'Custom timeout')

      vi.advanceTimersByTime(1000)

      await expect(promise).rejects.toThrow('Custom timeout')
    })

    it('should use default message', async () => {
      const promise = timeout(1000)

      vi.advanceTimersByTime(1000)

      await expect(promise).rejects.toThrow('Timeout')
    })
  })

  describe('withTimeout', () => {
    it('should resolve if promise completes before timeout', async () => {
      const promise = Promise.resolve('success')
      const result = withTimeout(promise, 1000)

      await expect(result).resolves.toBe('success')
    })

    it('should reject if timeout expires first', async () => {
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve('too late'), 2000)
      })

      const result = withTimeout(slowPromise, 1000, 'Timed out')

      vi.advanceTimersByTime(1000)

      await expect(result).rejects.toThrow('Timed out')
    })

    it('should not apply timeout if ms is 0 or negative', async () => {
      const promise = Promise.resolve('success')

      await expect(withTimeout(promise, 0)).resolves.toBe('success')
      await expect(withTimeout(promise, -1)).resolves.toBe('success')
    })
  })
})
