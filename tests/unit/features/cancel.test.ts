import { describe, it, expect } from 'vitest'
import {
  CancelToken,
  isCancel,
  cancelTokenToAbortController,
  makeCancelable,
  isCancellationError,
} from '../../../src/features/cancel'

describe('Cancel Utilities', () => {
  describe('CancelToken.source', () => {
    it('should create token and cancel function', () => {
      const source = CancelToken.source()

      expect(source.token).toBeDefined()
      expect(source.token.promise).toBeInstanceOf(Promise)
      expect(source.cancel).toBeInstanceOf(Function)
    })

    it('should resolve promise when canceled', async () => {
      const source = CancelToken.source()

      source.cancel('User canceled')

      const reason = await source.token.promise
      expect(reason.message).toBe('User canceled')
    })

    it('should set reason on token', () => {
      const source = CancelToken.source()

      expect(source.token.reason).toBeUndefined()

      source.cancel('Canceled')

      expect(source.token.reason).toBeDefined()
      expect(source.token.reason?.message).toBe('Canceled')
    })

    it('should not cancel twice', () => {
      const source = CancelToken.source()

      source.cancel('First')
      source.cancel('Second')

      expect(source.token.reason?.message).toBe('First')
    })

    it('should throw on throwIfRequested', () => {
      const source = CancelToken.source()

      expect(() => source.token.throwIfRequested()).not.toThrow()

      source.cancel('Canceled')

      expect(() => source.token.throwIfRequested()).toThrow()
    })
  })

  describe('isCancel', () => {
    it('should return true for cancel reason', () => {
      const source = CancelToken.source()
      source.cancel('Canceled')

      expect(isCancel(source.token.reason)).toBe(true)
    })

    it('should return false for other values', () => {
      expect(isCancel(new Error('Error'))).toBe(false)
      expect(isCancel('string')).toBe(false)
      expect(isCancel(null)).toBe(false)
    })
  })

  describe('Cancel.toString', () => {
    it('should return message when provided', () => {
      const source = CancelToken.source()
      source.cancel('Custom message')

      expect(source.token.reason?.toString()).toBe('Custom message')
    })

    it('should return default message when no message provided', () => {
      const source = CancelToken.source()
      source.cancel()

      expect(source.token.reason?.toString()).toBe('Request canceled')
    })
  })

  describe('cancelTokenToAbortController', () => {
    it('should create AbortController from token', () => {
      const source = CancelToken.source()
      const controller = cancelTokenToAbortController(source.token)

      expect(controller).toBeInstanceOf(AbortController)
      expect(controller.signal.aborted).toBe(false)
    })

    it('should abort when token is canceled', async () => {
      const source = CancelToken.source()
      const controller = cancelTokenToAbortController(source.token)

      source.cancel('Canceled')

      // Wait for promise to resolve
      await source.token.promise

      expect(controller.signal.aborted).toBe(true)
    })

    it('should abort immediately if already canceled', () => {
      const source = CancelToken.source()
      source.cancel('Already canceled')

      const controller = cancelTokenToAbortController(source.token)

      expect(controller.signal.aborted).toBe(true)
    })
  })

  describe('makeCancelable', () => {
    it('should return data promise and cancel function', async () => {
      const controller = new AbortController()
      const promise = Promise.resolve('success')

      const cancelable = makeCancelable(promise, controller)

      expect(cancelable.data).toBeInstanceOf(Promise)
      expect(cancelable.cancel).toBeInstanceOf(Function)

      const result = await cancelable.data
      expect(result).toBe('success')
    })

    it('should abort controller when cancel is called', () => {
      const controller = new AbortController()
      const promise = new Promise(() => {}) // Never resolves

      const cancelable = makeCancelable(promise, controller)

      expect(controller.signal.aborted).toBe(false)

      cancelable.cancel()

      expect(controller.signal.aborted).toBe(true)
    })
  })

  describe('isCancellationError', () => {
    it('should return true for Cancel', () => {
      const source = CancelToken.source()
      source.cancel('Canceled')

      expect(isCancellationError(source.token.reason)).toBe(true)
    })

    it('should return true for DOMException AbortError', () => {
      const error = new DOMException('Aborted', 'AbortError')
      expect(isCancellationError(error)).toBe(true)
    })

    it('should return true for Error with AbortError name', () => {
      const error = new Error('Aborted')
      error.name = 'AbortError'
      expect(isCancellationError(error)).toBe(true)
    })

    it('should return false for other errors', () => {
      expect(isCancellationError(new Error('Some error'))).toBe(false)
      expect(isCancellationError('string')).toBe(false)
    })
  })
})
