/**
 * Progress tracking for uploads and downloads
 */

import type { Progress, ProgressCallback } from '../types.js'

/**
 * Create a progress event
 */
export function createProgress(loaded: number, total: number): Progress {
  const percent = total > 0 ? Math.round((loaded / total) * 100) : 0
  return { loaded, total, percent }
}

/**
 * Track download progress from a Response
 * Returns a new Response with progress tracking
 */
export function trackDownloadProgress(
  response: Response,
  onProgress: ProgressCallback
): Response {
  const contentLength = response.headers.get('content-length')
  const total = contentLength ? parseInt(contentLength, 10) : 0

  if (!response.body) {
    // No body to track
    onProgress(createProgress(0, 0))
    return response
  }

  let loaded = 0
  const reader = response.body.getReader()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            // Final progress update
            onProgress(createProgress(loaded, total || loaded))
            controller.close()
            break
          }

          loaded += value.byteLength
          onProgress(createProgress(loaded, total))
          controller.enqueue(value)
        }
      } catch (error) {
        controller.error(error)
      }
    },

    cancel(reason) {
      reader.cancel(reason)
    },
  })

  // Create new response with the transformed stream
  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

/**
 * Create a ReadableStream that tracks upload progress
 * Used to wrap request body for progress tracking
 */
export function createProgressStream(
  body: ReadableStream<Uint8Array>,
  total: number,
  onProgress: ProgressCallback
): ReadableStream<Uint8Array> {
  let loaded = 0
  const reader = body.getReader()

  return new ReadableStream({
    async start() {
      // Initial progress
      onProgress(createProgress(0, total))
    },

    async pull(controller) {
      try {
        const { done, value } = await reader.read()

        if (done) {
          // Final progress update
          onProgress(createProgress(loaded, total || loaded))
          controller.close()
          return
        }

        loaded += value.byteLength
        onProgress(createProgress(loaded, total))
        controller.enqueue(value)
      } catch (error) {
        controller.error(error)
      }
    },

    cancel(reason) {
      reader.cancel(reason)
    },
  })
}

/**
 * Get size of a body value
 */
export function getBodySize(body: BodyInit | undefined): number {
  if (!body) {
    return 0
  }

  if (typeof body === 'string') {
    return new TextEncoder().encode(body).length
  }

  if (body instanceof Blob) {
    return body.size
  }

  if (body instanceof ArrayBuffer) {
    return body.byteLength
  }

  if (ArrayBuffer.isView(body)) {
    return body.byteLength
  }

  if (body instanceof FormData) {
    // Cannot determine FormData size easily
    // This is an approximation
    let size = 0
    body.forEach((value) => {
      if (typeof value === 'string') {
        size += new TextEncoder().encode(value).length
      } else if (value instanceof Blob) {
        size += value.size
      }
    })
    return size
  }

  if (body instanceof URLSearchParams) {
    return new TextEncoder().encode(body.toString()).length
  }

  return 0
}

/**
 * Convert body to a stream for progress tracking
 */
export function bodyToStream(body: BodyInit): ReadableStream<Uint8Array> | null {
  if (body instanceof ReadableStream) {
    return body
  }

  if (typeof body === 'string') {
    const encoder = new TextEncoder()
    const data = encoder.encode(body)
    return new ReadableStream({
      start(controller) {
        controller.enqueue(data)
        controller.close()
      },
    })
  }

  if (body instanceof Blob) {
    // Blob.stream() may not be available in all environments (e.g., JSDOM)
    if (typeof body.stream === 'function') {
      return body.stream()
    }
    // Fallback: cannot stream blob synchronously, return null
    return null
  }

  if (body instanceof ArrayBuffer) {
    const uint8Array = new Uint8Array(body)
    return new ReadableStream({
      start(controller) {
        controller.enqueue(uint8Array)
        controller.close()
      },
    })
  }

  if (ArrayBuffer.isView(body)) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(body.buffer, body.byteOffset, body.byteLength))
        controller.close()
      },
    })
  }

  // For FormData and URLSearchParams, we cannot easily create a stream
  // These will be handled by the browser
  return null
}

/**
 * Wrap body with upload progress tracking
 */
export function wrapBodyWithProgress(
  body: BodyInit,
  onProgress: ProgressCallback
): BodyInit {
  const size = getBodySize(body)
  const stream = bodyToStream(body)

  if (!stream) {
    // Cannot track progress for this body type
    // Just call progress with estimated size
    onProgress(createProgress(size, size))
    return body
  }

  return createProgressStream(stream, size, onProgress)
}
