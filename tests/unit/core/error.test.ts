import { describe, it, expect } from 'vitest'
import {
  RequestErrorImpl,
  createError,
  createNetworkError,
  createResponseError,
  isRequestError,
  isNetworkError,
  isTimeoutError,
  isCancelError,
  isClientError,
  isServerError,
  getErrorStatus,
} from '../../../src/core/error'
import type { InternalRequestConfig } from '../../../src/types'

const mockConfig: InternalRequestConfig = {
  url: '/test',
  method: 'GET',
  headers: new Headers(),
}

describe('Error Utilities', () => {
  describe('RequestErrorImpl', () => {
    it('should create error with all properties', () => {
      const response = new Response('Not found', { status: 404, statusText: 'Not Found' })
      const error = new RequestErrorImpl(
        'Request failed',
        mockConfig,
        'ERR_BAD_REQUEST',
        undefined,
        response,
        { message: 'Resource not found' }
      )

      expect(error.name).toBe('RequestError')
      expect(error.message).toBe('Request failed')
      expect(error.config).toBe(mockConfig)
      expect(error.code).toBe('ERR_BAD_REQUEST')
      expect(error.status).toBe(404)
      expect(error.statusText).toBe('Not Found')
      expect(error.data).toEqual({ message: 'Resource not found' })
      expect(error.response).toBe(response)
    })

    it('should be an instance of Error', () => {
      const error = new RequestErrorImpl('Test', mockConfig)
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(RequestErrorImpl)
    })

    it('should have toJSON method', () => {
      const error = new RequestErrorImpl('Test', mockConfig, 'ERR_NETWORK')
      const json = error.toJSON()

      expect(json).toEqual({
        name: 'RequestError',
        message: 'Test',
        status: undefined,
        statusText: undefined,
        code: 'ERR_NETWORK',
        data: undefined,
        config: {
          url: '/test',
          method: 'GET',
          baseURL: undefined,
        },
      })
    })
  })

  describe('createError', () => {
    it('should create RequestError', () => {
      const error = createError('Test error', mockConfig, 'ERR_NETWORK')
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('ERR_NETWORK')
    })
  })

  describe('createNetworkError', () => {
    it('should create network error', () => {
      const originalError = new Error('Network failure')
      const error = createNetworkError(originalError, mockConfig)

      expect(error.message).toBe('Network failure')
      expect(error.code).toBe('ERR_NETWORK')
    })

    it('should handle AbortError', () => {
      const abortError = new DOMException('Aborted', 'AbortError')
      const error = createNetworkError(abortError, mockConfig)

      expect(error.code).toBe('ERR_CANCELED')
    })

    it('should handle TimeoutError', () => {
      const timeoutError = new DOMException('Timeout', 'TimeoutError')
      const error = createNetworkError(timeoutError, mockConfig)

      expect(error.code).toBe('ERR_TIMEOUT')
    })

    it('should detect timeout from message', () => {
      const error = new Error('Request timeout')
      const requestError = createNetworkError(error, mockConfig)

      expect(requestError.code).toBe('ERR_TIMEOUT')
    })
  })

  describe('createResponseError', () => {
    it('should create error from 404 response', async () => {
      const response = new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      })

      const error = await createResponseError(response, mockConfig)

      expect(error.status).toBe(404)
      expect(error.code).toBe('ERR_BAD_REQUEST')
      expect(error.data).toEqual({ message: 'Not found' })
    })

    it('should create error from 500 response', async () => {
      const response = new Response('Server error', { status: 500, statusText: 'Internal Server Error' })
      const error = await createResponseError(response, mockConfig)

      expect(error.status).toBe(500)
      expect(error.code).toBe('ERR_BAD_RESPONSE')
      expect(error.data).toBe('Server error')
    })

    it('should handle response with no body', async () => {
      const response = new Response(null, { status: 500 })
      const error = await createResponseError(response, mockConfig)

      expect(error.status).toBe(500)
    })
  })

  describe('isRequestError', () => {
    it('should return true for RequestErrorImpl', () => {
      const error = new RequestErrorImpl('Test', mockConfig)
      expect(isRequestError(error)).toBe(true)
    })

    it('should return true for duck-typed RequestError', () => {
      const error = Object.assign(new Error('Test'), {
        name: 'RequestError' as const,
        config: mockConfig,
      })
      expect(isRequestError(error)).toBe(true)
    })

    it('should return false for regular Error', () => {
      expect(isRequestError(new Error('Test'))).toBe(false)
    })

    it('should return false for non-errors', () => {
      expect(isRequestError(null)).toBe(false)
      expect(isRequestError('error')).toBe(false)
    })
  })

  describe('isNetworkError', () => {
    it('should return true for network errors', () => {
      const error = createError('Network error', mockConfig, 'ERR_NETWORK')
      expect(isNetworkError(error)).toBe(true)
    })

    it('should return false for other errors', () => {
      const error = createError('Timeout', mockConfig, 'ERR_TIMEOUT')
      expect(isNetworkError(error)).toBe(false)
    })
  })

  describe('isTimeoutError', () => {
    it('should return true for timeout errors', () => {
      const error = createError('Timeout', mockConfig, 'ERR_TIMEOUT')
      expect(isTimeoutError(error)).toBe(true)
    })
  })

  describe('isCancelError', () => {
    it('should return true for cancel errors', () => {
      const error = createError('Canceled', mockConfig, 'ERR_CANCELED')
      expect(isCancelError(error)).toBe(true)
    })

    it('should return true for AbortError', () => {
      // Create an error that mimics AbortError behavior
      const error = new Error('Aborted')
      error.name = 'AbortError'
      expect(isCancelError(error)).toBe(true)
    })
  })

  describe('isClientError', () => {
    it('should return true for client errors', () => {
      const error = createError('Bad request', mockConfig, 'ERR_BAD_REQUEST')
      expect(isClientError(error)).toBe(true)
    })
  })

  describe('isServerError', () => {
    it('should return true for server errors', () => {
      const error = createError('Server error', mockConfig, 'ERR_BAD_RESPONSE')
      expect(isServerError(error)).toBe(true)
    })
  })

  describe('getErrorStatus', () => {
    it('should return status from RequestError', () => {
      const response = new Response(null, { status: 404 })
      const error = new RequestErrorImpl('Not found', mockConfig, 'ERR_BAD_REQUEST', undefined, response)
      expect(getErrorStatus(error)).toBe(404)
    })

    it('should return undefined for non-RequestError', () => {
      expect(getErrorStatus(new Error('Test'))).toBeUndefined()
    })
  })
})
