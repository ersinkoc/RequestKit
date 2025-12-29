import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  normalizeRetryConfig,
  calculateDelay,
  shouldRetry,
  withRetry,
  getRetryAfterDelay,
  DEFAULT_RETRY_CONFIG,
} from '../../../src/features/retry'
import { createError } from '../../../src/core/error'
import type { InternalRequestConfig, RequestError } from '../../../src/types'

const mockConfig: InternalRequestConfig = {
  url: '/test',
  method: 'GET',
  headers: new Headers(),
}

describe('Retry Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('normalizeRetryConfig', () => {
    it('should return default config for undefined', () => {
      const config = normalizeRetryConfig(undefined)
      expect(config.limit).toBe(0)
    })

    it('should return default config for 0', () => {
      const config = normalizeRetryConfig(0)
      expect(config.limit).toBe(0)
    })

    it('should convert number to config', () => {
      const config = normalizeRetryConfig(3)
      expect(config.limit).toBe(3)
      expect(config.methods).toEqual(DEFAULT_RETRY_CONFIG.methods)
    })

    it('should merge partial config with defaults', () => {
      const config = normalizeRetryConfig({ limit: 5, delay: 500 })
      expect(config.limit).toBe(5)
      expect(config.delay).toBe(500)
      expect(config.backoff).toBe('exponential')
    })
  })

  describe('calculateDelay', () => {
    it('should calculate linear delay', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, limit: 3, delay: 1000, backoff: 'linear' as const }

      expect(calculateDelay(1, config)).toBe(1000)
      expect(calculateDelay(2, config)).toBe(2000)
      expect(calculateDelay(3, config)).toBe(3000)
    })

    it('should calculate exponential delay', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, limit: 3, delay: 1000, backoff: 'exponential' as const }

      expect(calculateDelay(1, config)).toBe(1000)
      expect(calculateDelay(2, config)).toBe(2000)
      expect(calculateDelay(3, config)).toBe(4000)
    })

    it('should respect maxDelay', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, limit: 10, delay: 1000, backoff: 'exponential' as const, maxDelay: 5000 }

      expect(calculateDelay(5, config)).toBe(5000) // 2^4 * 1000 = 16000 > 5000
    })
  })

  describe('shouldRetry', () => {
    it('should return false if attempt exceeds limit', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, limit: 3 }
      const error = createError('Test', mockConfig, 'ERR_NETWORK')

      expect(shouldRetry(error, 3, config, 'GET')).toBe(false)
      expect(shouldRetry(error, 4, config, 'GET')).toBe(false)
    })

    it('should return false for cancel errors', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, limit: 3 }
      const error = createError('Canceled', mockConfig, 'ERR_CANCELED')

      expect(shouldRetry(error, 1, config, 'GET')).toBe(false)
    })

    it('should return false for non-retryable methods', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, limit: 3, methods: ['GET'] }
      const error = createError('Test', mockConfig, 'ERR_NETWORK')

      expect(shouldRetry(error, 1, config, 'POST')).toBe(false)
    })

    it('should return false for non-retryable status codes', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, limit: 3, statusCodes: [500, 502, 503] }
      const error = createError('Bad request', mockConfig, 'ERR_BAD_REQUEST') as RequestError
      error.status = 400

      expect(shouldRetry(error, 1, config, 'GET')).toBe(false)
    })

    it('should return false if retryCondition returns false', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, limit: 3, retryCondition: () => false }
      const error = createError('Test', mockConfig, 'ERR_NETWORK')

      expect(shouldRetry(error, 1, config, 'GET')).toBe(false)
    })

    it('should return true for valid retry', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, limit: 3, statusCodes: [500] }
      const error = createError('Server error', mockConfig, 'ERR_BAD_RESPONSE') as RequestError
      error.status = 500

      expect(shouldRetry(error, 1, config, 'GET')).toBe(true)
    })
  })

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await withRetry(fn, 3, mockConfig)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should not retry if limit is 0', async () => {
      const error = createError('Network error', mockConfig, 'ERR_NETWORK')
      const fn = vi.fn().mockRejectedValue(error)

      await expect(withRetry(fn, 0, mockConfig)).rejects.toThrow()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      const error = createError('Network error', mockConfig, 'ERR_NETWORK')
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success')

      const resultPromise = withRetry(fn, { limit: 3, delay: 100 }, mockConfig)

      // First call fails
      await vi.advanceTimersByTimeAsync(0)

      // Wait for retry delay
      await vi.advanceTimersByTimeAsync(100)

      // Second call fails
      await vi.advanceTimersByTimeAsync(0)

      // Wait for retry delay
      await vi.advanceTimersByTimeAsync(200)

      const result = await resultPromise

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn()
      const error = createError('Network error', mockConfig, 'ERR_NETWORK')
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success')

      const resultPromise = withRetry(fn, { limit: 2, delay: 100, onRetry }, mockConfig)

      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(100)

      await resultPromise

      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onRetry).toHaveBeenCalledWith(1, error, mockConfig)
    })

    it('should stop retrying if signal is aborted during delay', async () => {
      vi.useRealTimers() // Use real timers for this test

      const error = createError('Network error', mockConfig, 'ERR_NETWORK')
      const fn = vi.fn().mockRejectedValue(error)

      const controller = new AbortController()
      const configWithSignal: InternalRequestConfig = { ...mockConfig, signal: controller.signal }

      const resultPromise = withRetry(fn, { limit: 3, delay: 50 }, configWithSignal)

      // Wait for first call to fail
      await new Promise(resolve => setTimeout(resolve, 10))

      // Abort during delay
      controller.abort()

      // Wait for promise to complete
      await expect(resultPromise).rejects.toThrow()

      // Should only call once since abort happened during delay
      expect(fn).toHaveBeenCalledTimes(1)

      vi.useFakeTimers() // Restore for other tests
    })

    it('should throw immediately when error is not retryable (non-retryable method)', async () => {
      // Create a POST config which is not in the default retryable methods
      const postConfig: InternalRequestConfig = { ...mockConfig, method: 'POST' }
      const error = createError('Network error', postConfig, 'ERR_NETWORK')
      const fn = vi.fn().mockRejectedValue(error)

      // POST is not in default retryable methods, so it should throw after first failure
      await expect(withRetry(fn, { limit: 3, delay: 100 }, postConfig)).rejects.toThrow('Network error')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should throw immediately when retryCondition returns false', async () => {
      const error = createError('Network error', mockConfig, 'ERR_NETWORK')
      const fn = vi.fn().mockRejectedValue(error)

      // retryCondition always returns false
      await expect(withRetry(fn, { limit: 3, delay: 100, retryCondition: () => false }, mockConfig)).rejects.toThrow('Network error')
      expect(fn).toHaveBeenCalledTimes(1)
    })

  })

  describe('getRetryAfterDelay', () => {
    it('should parse seconds', () => {
      const response = new Response(null, {
        headers: { 'Retry-After': '120' },
      })

      expect(getRetryAfterDelay(response)).toBe(120000)
    })

    it('should parse date', () => {
      const futureDate = new Date(Date.now() + 60000)
      const response = new Response(null, {
        headers: { 'Retry-After': futureDate.toUTCString() },
      })

      const delay = getRetryAfterDelay(response)
      expect(delay).toBeGreaterThan(0)
      expect(delay).toBeLessThanOrEqual(60000)
    })

    it('should return undefined for missing header', () => {
      const response = new Response(null)
      expect(getRetryAfterDelay(response)).toBeUndefined()
    })

    it('should return undefined for past date', () => {
      const pastDate = new Date(Date.now() - 60000)
      const response = new Response(null, {
        headers: { 'Retry-After': pastDate.toUTCString() },
      })

      expect(getRetryAfterDelay(response)).toBeUndefined()
    })

    it('should return undefined for invalid date', () => {
      const response = new Response(null, {
        headers: { 'Retry-After': 'invalid-date-string' },
      })

      expect(getRetryAfterDelay(response)).toBeUndefined()
    })
  })
})
