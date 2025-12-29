import { describe, it, expect, vi } from 'vitest'
import {
  createProgress,
  trackDownloadProgress,
  createProgressStream,
  getBodySize,
  bodyToStream,
  wrapBodyWithProgress,
} from '../../../src/features/progress'

describe('Progress Utilities', () => {
  describe('createProgress', () => {
    it('should calculate percent correctly', () => {
      expect(createProgress(50, 100)).toEqual({
        loaded: 50,
        total: 100,
        percent: 50,
      })
    })

    it('should round percent', () => {
      expect(createProgress(33, 100)).toEqual({
        loaded: 33,
        total: 100,
        percent: 33,
      })
    })

    it('should handle 0 total', () => {
      expect(createProgress(50, 0)).toEqual({
        loaded: 50,
        total: 0,
        percent: 0,
      })
    })

    it('should handle 100%', () => {
      expect(createProgress(100, 100)).toEqual({
        loaded: 100,
        total: 100,
        percent: 100,
      })
    })
  })

  describe('trackDownloadProgress', () => {
    it('should track download progress', async () => {
      const progressUpdates: Array<{ loaded: number; total: number; percent: number }> = []
      const onProgress = vi.fn((p) => progressUpdates.push(p))

      const data = new TextEncoder().encode('Hello, World!')
      const response = new Response(data, {
        headers: { 'Content-Length': String(data.length) },
      })

      const tracked = trackDownloadProgress(response, onProgress)

      // Read the response
      const reader = tracked.body!.getReader()
      const chunks: Uint8Array[] = []

      let done = false
      while (!done) {
        const result = await reader.read()
        done = result.done
        if (result.value) {
          chunks.push(result.value)
        }
      }

      expect(onProgress).toHaveBeenCalled()
      expect(progressUpdates[progressUpdates.length - 1]?.percent).toBe(100)
    })

    it('should handle response with no body', () => {
      const onProgress = vi.fn()
      const response = new Response(null)

      // Force body to be null
      Object.defineProperty(response, 'body', { value: null })

      trackDownloadProgress(response, onProgress)

      expect(onProgress).toHaveBeenCalledWith({ loaded: 0, total: 0, percent: 0 })
    })
  })

  describe('getBodySize', () => {
    it('should return 0 for undefined', () => {
      expect(getBodySize(undefined)).toBe(0)
    })

    it('should calculate string size', () => {
      expect(getBodySize('hello')).toBe(5)
      expect(getBodySize('日本語')).toBe(9) // 3 chars * 3 bytes each
    })

    it('should return blob size', () => {
      const blob = new Blob(['hello world'])
      expect(getBodySize(blob)).toBe(11)
    })

    it('should return ArrayBuffer size', () => {
      const buffer = new ArrayBuffer(16)
      expect(getBodySize(buffer)).toBe(16)
    })

    it('should return TypedArray size', () => {
      const array = new Uint8Array(10)
      expect(getBodySize(array)).toBe(10)
    })

    it('should calculate FormData size (approximate)', () => {
      const formData = new FormData()
      formData.append('name', 'test')
      formData.append('file', new Blob(['content']))

      const size = getBodySize(formData)
      expect(size).toBeGreaterThan(0)
    })

    it('should calculate URLSearchParams size', () => {
      const params = new URLSearchParams({ a: '1', b: '2' })
      expect(getBodySize(params)).toBe(7) // "a=1&b=2"
    })
  })

  describe('bodyToStream', () => {
    it('should return stream as-is', () => {
      const stream = new ReadableStream()
      expect(bodyToStream(stream)).toBe(stream)
    })

    it('should convert string to stream', async () => {
      const stream = bodyToStream('hello')
      expect(stream).toBeInstanceOf(ReadableStream)

      const reader = stream!.getReader()
      const { value } = await reader.read()

      expect(new TextDecoder().decode(value)).toBe('hello')
    })

    it('should convert Blob to stream or return null if not supported', () => {
      const blob = new Blob(['test'])
      const stream = bodyToStream(blob)
      // In JSDOM, blob.stream() may not be available, so it returns null
      // In real browsers, it returns a ReadableStream
      if (typeof blob.stream === 'function') {
        expect(stream).toBeInstanceOf(ReadableStream)
      } else {
        expect(stream).toBeNull()
      }
    })

    it('should convert ArrayBuffer to stream', async () => {
      // Create a proper ArrayBuffer directly
      const buffer = new ArrayBuffer(4)
      const view = new Uint8Array(buffer)
      view.set([116, 101, 115, 116]) // 'test' in ASCII

      const stream = bodyToStream(buffer)
      expect(stream).toBeInstanceOf(ReadableStream)

      const reader = stream!.getReader()
      const { value } = await reader.read()
      expect(new TextDecoder().decode(value)).toBe('test')
    })

    it('should convert TypedArray to stream', async () => {
      const array = new TextEncoder().encode('test')
      const stream = bodyToStream(array)
      expect(stream).toBeInstanceOf(ReadableStream)
    })

    it('should return null for FormData', () => {
      const formData = new FormData()
      expect(bodyToStream(formData)).toBeNull()
    })

    it('should return null for URLSearchParams', () => {
      const params = new URLSearchParams()
      expect(bodyToStream(params)).toBeNull()
    })
  })

  describe('wrapBodyWithProgress', () => {
    it('should wrap streamable body', async () => {
      const onProgress = vi.fn()
      const body = 'hello world'

      const wrapped = wrapBodyWithProgress(body, onProgress)
      expect(wrapped).toBeInstanceOf(ReadableStream)

      // Read the stream
      const reader = (wrapped as ReadableStream).getReader()
      await reader.read()

      expect(onProgress).toHaveBeenCalled()
    })

    it('should call progress for non-streamable body', () => {
      const onProgress = vi.fn()
      const formData = new FormData()
      formData.append('test', 'value')

      const wrapped = wrapBodyWithProgress(formData, onProgress)

      // FormData cannot be streamed, so it returns as-is
      expect(wrapped).toBe(formData)
      expect(onProgress).toHaveBeenCalled()
    })
  })

  describe('createProgressStream', () => {
    it('should track progress through stream', async () => {
      const progressUpdates: number[] = []
      const onProgress = vi.fn((p) => progressUpdates.push(p.percent))

      const sourceData = new TextEncoder().encode('Hello, World!')
      const sourceStream = new ReadableStream({
        start(controller) {
          controller.enqueue(sourceData)
          controller.close()
        },
      })

      const trackedStream = createProgressStream(sourceStream, sourceData.length, onProgress)

      const reader = trackedStream.getReader()
      await reader.read()
      await reader.read() // Read until done

      expect(onProgress).toHaveBeenCalled()
      expect(progressUpdates).toContain(0) // Initial
      expect(progressUpdates).toContain(100) // Final
    })
  })
})
