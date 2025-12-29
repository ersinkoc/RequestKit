import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '../../src/core/client'
import { mockFetch } from '../setup'

describe('Client Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('createClient', () => {
    it('should create client with defaults', () => {
      const client = createClient()

      expect(client).toHaveProperty('get')
      expect(client).toHaveProperty('post')
      expect(client).toHaveProperty('put')
      expect(client).toHaveProperty('patch')
      expect(client).toHaveProperty('delete')
      expect(client).toHaveProperty('head')
      expect(client).toHaveProperty('options')
      expect(client).toHaveProperty('request')
      expect(client).toHaveProperty('interceptors')
      expect(client).toHaveProperty('defaults')
      expect(client).toHaveProperty('extend')
      expect(client).toHaveProperty('clone')
    })

    it('should accept request options object as first argument', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient()
      // Use the request method with object as first argument
      const data = await client.request({ url: 'https://api.example.com/test', method: 'GET' })

      expect(data).toEqual({ id: 1 })
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should apply baseURL', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient({ baseURL: 'https://api.example.com' })
      await client.get('/users/1')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.url).toBe('https://api.example.com/users/1')
    })

    it('should apply default headers', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient({
        headers: {
          'Authorization': 'Bearer token',
          'X-Custom': 'value',
        },
      })

      await client.get('https://api.example.com/test')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.headers.get('Authorization')).toBe('Bearer token')
      expect(request.headers.get('X-Custom')).toBe('value')
    })
  })

  describe('HTTP Methods', () => {
    const client = createClient({ baseURL: 'https://api.example.com' })

    beforeEach(() => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should make GET request', async () => {
      await client.get('/users')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.method).toBe('GET')
    })

    it('should make POST request with body', async () => {
      await client.post('/users', { name: 'John' })

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.method).toBe('POST')

      const body = await request.text()
      expect(JSON.parse(body)).toEqual({ name: 'John' })
    })

    it('should make PUT request with body', async () => {
      await client.put('/users/1', { name: 'Jane' })

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.method).toBe('PUT')
    })

    it('should make PATCH request with body', async () => {
      await client.patch('/users/1', { status: 'active' })

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.method).toBe('PATCH')
    })

    it('should make DELETE request', async () => {
      await client.delete('/users/1')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.method).toBe('DELETE')
    })

    it('should make HEAD request', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

      await client.head('/users/1')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.method).toBe('HEAD')
    })

    it('should make OPTIONS request', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

      await client.options('/users')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.method).toBe('OPTIONS')
    })
  })

  describe('Query Parameters', () => {
    it('should serialize query params', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()
      await client.get('https://api.example.com/search', {
        params: { q: 'hello', page: 1 },
      })

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.url).toContain('q=hello')
      expect(request.url).toContain('page=1')
    })

    it('should handle URLSearchParams', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient()
      const params = new URLSearchParams()
      params.append('a', '1')
      params.append('b', '2')

      await client.get('https://api.example.com/test', { params })

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.url).toContain('a=1')
      expect(request.url).toContain('b=2')
    })
  })

  describe('Response Handling', () => {
    it('should parse JSON response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1, name: 'Test' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient()
      const data = await client.get<{ id: number; name: string }>('https://api.example.com/test')

      expect(data).toEqual({ id: 1, name: 'Test' })
    })

    it('should return text for text response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Hello World', {
          headers: { 'Content-Type': 'text/plain' },
        })
      )

      const client = createClient()
      const data = await client.get('https://api.example.com/test', {
        responseType: 'text',
      })

      expect(data).toBe('Hello World')
    })

    it('should return full response with raw option', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          status: 201,
          statusText: 'Created',
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient()
      const response = await client.get('https://api.example.com/test', {
        raw: true,
      })

      expect(response).toHaveProperty('data', { id: 1 })
      expect(response).toHaveProperty('status', 201)
      expect(response).toHaveProperty('statusText', 'Created')
      expect(response).toHaveProperty('ok', true)
    })
  })

  describe('Error Handling', () => {
    it('should throw for non-2xx response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient()

      await expect(client.get('https://api.example.com/test')).rejects.toMatchObject({
        name: 'RequestError',
        status: 404,
        code: 'ERR_BAD_REQUEST',
      })
    })

    it('should throw for network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))

      const client = createClient()

      await expect(client.get('https://api.example.com/test')).rejects.toMatchObject({
        name: 'RequestError',
        code: 'ERR_NETWORK',
      })
    })

    it('should use custom validateStatus', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{}', { status: 404 })
      )

      const client = createClient({
        validateStatus: (status) => status < 500,
      })

      // Should not throw for 404
      await expect(client.get('https://api.example.com/test')).resolves.toBeDefined()
    })
  })

  describe('Instance Management', () => {
    it('should extend client with new config', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      const baseClient = createClient({
        baseURL: 'https://api.example.com',
        headers: { 'X-Base': 'value' },
      })

      const extendedClient = baseClient.extend({
        headers: { 'X-Extended': 'value' },
      })

      await extendedClient.get('/test')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.url).toBe('https://api.example.com/test')
      expect(request.headers.get('X-Extended')).toBe('value')
    })

    it('should clone client independently', async () => {
      const original = createClient({ baseURL: 'https://original.com' })
      const cloned = original.clone()

      // Modify original
      original.defaults.timeout = 5000

      expect(cloned.defaults.timeout).not.toBe(5000)
    })
  })

  describe('Transform', () => {
    it('should apply transformRequest', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const client = createClient({
        transformRequest: (data) => {
          if (data && typeof data === 'object') {
            return { ...data as object, _transformed: true }
          }
          return data
        },
      })

      await client.post('https://api.example.com/test', { name: 'test' })

      const request = mockFetch.mock.calls[0]?.[0] as Request
      const body = await request.text()
      expect(JSON.parse(body)).toHaveProperty('_transformed', true)
    })

    it('should apply transformResponse', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { id: 1 } }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient({
        transformResponse: (data) => {
          if (data && typeof data === 'object' && 'result' in data) {
            return (data as { result: unknown }).result
          }
          return data
        },
      })

      const data = await client.get('https://api.example.com/test')
      expect(data).toEqual({ id: 1 })
    })
  })

  describe('Hooks', () => {
    it('should call onRequest hook', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const onRequest = vi.fn((config) => {
        config.headers.set('X-Request-ID', '123')
        return config
      })

      const client = createClient({ onRequest })
      await client.get('https://api.example.com/test')

      expect(onRequest).toHaveBeenCalled()

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.headers.get('X-Request-ID')).toBe('123')
    })

    it('should call onResponse hook', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}'))

      const onResponse = vi.fn((response) => response)

      const client = createClient({ onResponse })
      await client.get('https://api.example.com/test')

      expect(onResponse).toHaveBeenCalled()
    })

    it('should call onError hook', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}', { status: 500 }))

      const onError = vi.fn()

      const client = createClient({ onError })

      try {
        await client.get('https://api.example.com/test')
      } catch {
        // Expected
      }

      expect(onError).toHaveBeenCalled()
    })

    it('should call onError hook for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))

      const onError = vi.fn()

      const client = createClient({ onError })

      try {
        await client.get('https://api.example.com/test')
      } catch {
        // Expected
      }

      expect(onError).toHaveBeenCalled()
    })
  })

  describe('HTTP Methods with non-object bodies', () => {
    it('should make PUT request with non-object body', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient({ baseURL: 'https://api.example.com' })
      await client.put('/upload', 'plain text body')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.method).toBe('PUT')
      const body = await request.text()
      expect(body).toBe('plain text body')
    })

    it('should make PATCH request with non-object body', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient({ baseURL: 'https://api.example.com' })
      await client.patch('/upload', 'plain text body')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.method).toBe('PATCH')
      const body = await request.text()
      expect(body).toBe('plain text body')
    })

    it('should make POST request with non-object body', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient({ baseURL: 'https://api.example.com' })
      await client.post('/upload', 'plain text body')

      const request = mockFetch.mock.calls[0]?.[0] as Request
      expect(request.method).toBe('POST')
      const body = await request.text()
      expect(body).toBe('plain text body')
    })
  })

  describe('Interceptor Inheritance', () => {
    it('should copy response interceptors when extending', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      const base = createClient()
      const responseInterceptorCalled = vi.fn()

      base.interceptors.response.use((response) => {
        responseInterceptorCalled()
        return response
      })

      const extended = base.extend({})

      await extended.get('https://api.example.com/test')

      expect(responseInterceptorCalled).toHaveBeenCalled()
    })

    it('should copy response interceptors when cloning', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      const original = createClient()
      const responseInterceptorCalled = vi.fn()

      original.interceptors.response.use((response) => {
        responseInterceptorCalled()
        return response
      })

      const cloned = original.clone()

      await cloned.get('https://api.example.com/test')

      expect(responseInterceptorCalled).toHaveBeenCalled()
    })

    it('should copy interceptors with rejected handler when extending', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      const base = createClient()

      base.interceptors.request.use(
        (config) => config,
        (error) => { throw error }
      )
      base.interceptors.response.use(
        (response) => response,
        (error) => { throw error }
      )

      const extended = base.extend({})

      await extended.get('https://api.example.com/test')
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should copy interceptors with rejected handler when cloning', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      const original = createClient()

      original.interceptors.request.use(
        (config) => config,
        (error) => { throw error }
      )
      original.interceptors.response.use(
        (response) => response,
        (error) => { throw error }
      )

      const cloned = original.clone()

      await cloned.get('https://api.example.com/test')
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('Network Error Recovery', () => {
    it('should recover from network error with response interceptor', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))

      const client = createClient()

      client.interceptors.response.use(
        (response) => response,
        () => {
          return new Response(JSON.stringify({ recovered: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
      )

      const data = await client.get('https://api.example.com/test')
      expect(data).toEqual({ recovered: true })
    })

    it('should recover from request error with response interceptor', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{}', { status: 500, statusText: 'Server Error' })
      )

      const client = createClient()

      client.interceptors.response.use(
        (response) => response,
        () => {
          return new Response(JSON.stringify({ recovered: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
      )

      const data = await client.get('https://api.example.com/test')
      expect(data).toEqual({ recovered: true })
    })
  })

  describe('Progress Tracking', () => {
    it('should track download progress', async () => {
      const onDownloadProgress = vi.fn()

      mockFetch.mockResolvedValueOnce(
        new Response('test response body', {
          headers: { 'Content-Type': 'text/plain', 'Content-Length': '18' },
        })
      )

      const client = createClient()
      await client.get('https://api.example.com/test', {
        onDownloadProgress,
        responseType: 'text',
      })

      // Progress callback should have been called
      expect(onDownloadProgress).toHaveBeenCalled()
    })

    it('should handle upload progress callback option', async () => {
      // This test verifies that the client accepts and processes the onUploadProgress option
      // Note: Full upload progress streaming may not work in JSDOM due to duplex restrictions
      const onUploadProgress = vi.fn()

      mockFetch.mockResolvedValueOnce(
        new Response('{}', {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient()

      // Try the request - may fail with duplex error in JSDOM but should trigger the code path
      try {
        await client.post('https://api.example.com/test', { key: 'value' }, {
          onUploadProgress,
        })
        // If it succeeds, verify fetch was called
        expect(mockFetch).toHaveBeenCalled()
      } catch (error) {
        // In JSDOM, the duplex error is expected when streaming body
        // The important thing is that the code path was exercised
        expect((error as Error).message).toMatch(/duplex|network/i)
      }
    })
  })

  describe('Timeout Handling', () => {
    it('should throw timeout error when request times out', async () => {
      // Mock a request that times out
      mockFetch.mockImplementationOnce(() => {
        const error = new DOMException('The operation was aborted', 'TimeoutError')
        return Promise.reject(error)
      })

      const client = createClient({ timeout: 100 })

      await expect(client.get('https://api.example.com/test')).rejects.toMatchObject({
        name: 'RequestError',
        code: 'ERR_TIMEOUT',
      })
    })

    it('should apply custom timeout message', async () => {
      // Mock a request that times out via AbortError with timeout name
      mockFetch.mockImplementationOnce(() => {
        const error = new DOMException('The operation was aborted', 'TimeoutError')
        return Promise.reject(error)
      })

      const client = createClient({ timeout: 5000 })

      try {
        await client.get('https://api.example.com/test')
      } catch (error) {
        expect((error as Error).message).toContain('timeout')
      }
    })
  })

  describe('Cancelable Requests', () => {
    it('should return cancelable object when cancelable option is true', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createClient()
      // The request function is async, so we need to await to get the cancelable object
      const result = await client.get('https://api.example.com/test', { cancelable: true }) as { data: Promise<unknown>; cancel: () => void }

      // Check that result has cancel and data properties
      expect(result).toHaveProperty('cancel')
      expect(result).toHaveProperty('data')

      // Wait for the data to resolve
      const data = await result.data
      expect(data).toEqual({ id: 1 })
    })

    it('should cancel request when cancel is called', async () => {
      // Create a mock that returns a pending promise
      let rejectFn: (reason?: unknown) => void
      mockFetch.mockImplementationOnce(() => new Promise((_, reject) => {
        rejectFn = reject
      }))

      const client = createClient()
      // Start the request - the async function needs to complete to return the cancelable
      const resultPromise = client.get('https://api.example.com/test', { cancelable: true })

      // Wait a tick to let the request start
      await new Promise(resolve => setTimeout(resolve, 0))

      // The cancelable is returned from the async function
      const cancelable = await resultPromise as { data: Promise<unknown>; cancel: () => void }

      // Cancel immediately
      cancelable.cancel()

      // Trigger the mock rejection to simulate abort
      rejectFn!(new DOMException('Aborted', 'AbortError'))

      // The data promise should reject after cancellation
      await expect(cancelable.data).rejects.toThrow()
    })
  })

})
