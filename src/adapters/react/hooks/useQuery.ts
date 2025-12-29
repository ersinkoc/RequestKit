/**
 * useQuery Hook
 * Auto-fetching data with caching and refetch support
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type {
  RequestOptions,
  RequestError,
  UseQueryOptions,
  UseQueryResult,
} from '../../../types.js'
import { isCancelError } from '../../../core/error.js'
import { useClient } from './useClient.js'

/**
 * Hook for data fetching with automatic execution
 * Best for GET requests that should load on mount
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, loading, error, refetch } = useQuery<User>(
 *     `/users/${userId}`,
 *     {
 *       enabled: !!userId,
 *       staleTime: 60000,
 *       retry: 3,
 *     }
 *   )
 *
 *   if (loading) return <Spinner />
 *   if (error) return <Error error={error} />
 *
 *   return (
 *     <div>
 *       <h1>{data?.name}</h1>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useQuery<T = unknown>(
  url: string | (() => string | null),
  options: RequestOptions & UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const client = useClient()

  const {
    enabled = true,
    staleTime = 0,
    refetchOnWindowFocus = false,
    refetchOnReconnect = false,
    refetchInterval,
    retry = 0,
    onSuccess,
    onError,
    ...requestOptions
  } = options

  const [state, setState] = useState<{
    data: T | undefined
    loading: boolean
    error: RequestError | null
    isFetching: boolean
    dataUpdatedAt: number | null
  }>({
    data: undefined,
    loading: true,
    error: null,
    isFetching: false,
    dataUpdatedAt: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)

  // Resolve URL
  const resolvedUrl = useMemo(() => {
    if (typeof url === 'function') {
      return url()
    }
    return url
  }, [url])

  // Check if data is stale
  const isStale = useMemo(() => {
    if (!state.dataUpdatedAt || staleTime <= 0) {
      return true
    }
    return Date.now() - state.dataUpdatedAt > staleTime
  }, [state.dataUpdatedAt, staleTime])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const fetchData = useCallback(
    async (isRefetch = false): Promise<void> => {
      if (!resolvedUrl) {
        return
      }

      // Abort previous request
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: !isRefetch && !prev.data,
          isFetching: true,
          error: isRefetch ? prev.error : null,
        }))
      }

      try {
        const data = await client.get<T>(resolvedUrl, {
          ...requestOptions,
          signal: abortControllerRef.current.signal,
        })

        if (mountedRef.current) {
          setState({
            data,
            loading: false,
            error: null,
            isFetching: false,
            dataUpdatedAt: Date.now(),
          })
          retryCountRef.current = 0
        }

        onSuccess?.(data)
      } catch (error) {
        const requestError = error as RequestError

        // Don't update state for canceled requests
        if (isCancelError(error)) {
          return
        }

        // Handle retry
        const maxRetries = typeof retry === 'boolean' ? (retry ? 3 : 0) : retry
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 30000)
          setTimeout(() => fetchData(isRefetch), delay)
          return
        }

        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            loading: false,
            isFetching: false,
            error: requestError,
          }))
        }

        onError?.(requestError)
      }
    },
    [client, resolvedUrl, requestOptions, retry, onSuccess, onError]
  )

  const refetch = useCallback(async (): Promise<void> => {
    retryCountRef.current = 0
    await fetchData(true)
  }, [fetchData])

  // Initial fetch
  useEffect(() => {
    if (enabled && resolvedUrl) {
      fetchData()
    } else if (!enabled || !resolvedUrl) {
      // Set loading to false when disabled or URL is null
      setState(prev => ({ ...prev, loading: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, resolvedUrl])

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) {
      return
    }

    const handleFocus = () => {
      if (isStale) {
        fetchData(true)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, enabled, isStale, fetchData])

  // Refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect || !enabled) {
      return
    }

    const handleOnline = () => {
      if (isStale) {
        fetchData(true)
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [refetchOnReconnect, enabled, isStale, fetchData])

  // Polling
  useEffect(() => {
    if (!refetchInterval || refetchInterval <= 0 || !enabled) {
      return
    }

    const intervalId = setInterval(() => {
      fetchData(true)
    }, refetchInterval)

    return () => clearInterval(intervalId)
  }, [refetchInterval, enabled, fetchData])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    isStale,
    isFetching: state.isFetching,
    refetch,
  }
}
