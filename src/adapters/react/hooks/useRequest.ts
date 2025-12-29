/**
 * useRequest Hook
 * Manual request execution with state management
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  RequestOptions,
  RequestError,
  UseRequestOptions,
  UseRequestResult,
} from '../../../types.js'
import { isCancelError } from '../../../core/error.js'
import { useClient } from './useClient.js'

/**
 * Hook for manual request execution
 * Use this when you need to trigger requests manually (e.g., on button click)
 *
 * @example
 * ```tsx
 * function DeleteButton({ id }: { id: string }) {
 *   const { loading, error, execute } = useRequest<void>(
 *     `/items/${id}`,
 *     {
 *       manual: true,
 *       method: 'DELETE',
 *       onSuccess: () => toast.success('Deleted!'),
 *     }
 *   )
 *
 *   return (
 *     <button onClick={() => execute()} disabled={loading}>
 *       {loading ? 'Deleting...' : 'Delete'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useRequest<T = unknown>(
  url: string,
  options: RequestOptions & UseRequestOptions<T> = {}
): UseRequestResult<T> {
  const client = useClient()
  const { manual = false, onSuccess, onError, ...requestOptions } = options

  const [state, setState] = useState<{
    data: T | undefined
    loading: boolean
    error: RequestError | null
  }>({
    data: undefined,
    loading: !manual,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const execute = useCallback(
    async (executeOptions?: RequestOptions): Promise<T> => {
      // Abort previous request
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: true, error: null }))
      }

      try {
        const mergedOptions: RequestOptions = {
          ...requestOptions,
          ...executeOptions,
          signal: abortControllerRef.current.signal,
        }

        const data = await client.request<T>(url, mergedOptions)

        if (mountedRef.current) {
          setState({ data, loading: false, error: null })
        }

        onSuccess?.(data)
        return data
      } catch (error) {
        const requestError = error as RequestError

        // Don't update state for canceled requests
        if (!isCancelError(error) && mountedRef.current) {
          setState(prev => ({ ...prev, loading: false, error: requestError }))
        }

        onError?.(requestError)
        throw requestError
      }
    },
    [client, url, requestOptions, onSuccess, onError]
  )

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    setState({ data: undefined, loading: false, error: null })
  }, [])

  // Auto-execute on mount if not manual
  useEffect(() => {
    if (!manual) {
      execute().catch(() => {
        // Error already handled in execute
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual])

  return {
    ...state,
    execute,
    reset,
  }
}
