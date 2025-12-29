/**
 * useInfiniteQuery Hook
 * For paginated/infinite scroll data fetching
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type {
  RequestOptions,
  RequestError,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from '../../../types.js'
import { isCancelError } from '../../../core/error.js'
import { useClient } from './useClient.js'

/**
 * Hook for infinite/paginated queries
 * Best for lists with load more or infinite scroll
 *
 * @example
 * ```tsx
 * interface UsersPage {
 *   users: User[]
 *   nextCursor?: string
 * }
 *
 * function UserList() {
 *   const {
 *     data,
 *     loading,
 *     hasNextPage,
 *     isFetchingNextPage,
 *     fetchNextPage,
 *   } = useInfiniteQuery<UsersPage>(
 *     (pageParam) => `/users?cursor=${pageParam || ''}`,
 *     {
 *       getNextPageParam: (lastPage) => lastPage.nextCursor,
 *     }
 *   )
 *
 *   const allUsers = data?.flatMap(page => page.users) || []
 *
 *   return (
 *     <div>
 *       {allUsers.map(user => <UserCard key={user.id} user={user} />)}
 *       {hasNextPage && (
 *         <button onClick={fetchNextPage} disabled={isFetchingNextPage}>
 *           {isFetchingNextPage ? 'Loading...' : 'Load More'}
 *         </button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useInfiniteQuery<T = unknown>(
  getUrl: (pageParam: unknown) => string,
  options: RequestOptions & UseInfiniteQueryOptions<T>
): UseInfiniteQueryResult<T> {
  const client = useClient()

  const {
    getNextPageParam,
    getPreviousPageParam,
    enabled = true,
    staleTime: _staleTime = 0,
    onSuccess,
    onError,
    ...requestOptions
  } = options

  // Note: staleTime is reserved for future cache implementation
  void _staleTime

  const [state, setState] = useState<{
    pages: T[]
    loading: boolean
    error: RequestError | null
    isFetchingNextPage: boolean
    isFetchingPreviousPage: boolean
    dataUpdatedAt: number | null
  }>({
    pages: [],
    loading: true,
    error: null,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    dataUpdatedAt: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  // Calculate pagination state
  const { hasNextPage, hasPreviousPage, nextPageParam, previousPageParam } = useMemo(() => {
    if (state.pages.length === 0) {
      return {
        hasNextPage: false,
        hasPreviousPage: false,
        nextPageParam: undefined,
        previousPageParam: undefined,
      }
    }

    const lastPage = state.pages[state.pages.length - 1]
    const firstPage = state.pages[0]

    const nextParam = lastPage ? getNextPageParam(lastPage, state.pages) : undefined
    const prevParam = firstPage && getPreviousPageParam
      ? getPreviousPageParam(firstPage, state.pages)
      : undefined

    return {
      hasNextPage: nextParam !== undefined,
      hasPreviousPage: prevParam !== undefined,
      nextPageParam: nextParam,
      previousPageParam: prevParam,
    }
  }, [state.pages, getNextPageParam, getPreviousPageParam])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const fetchPage = useCallback(
    async (
      pageParam: unknown,
      direction: 'next' | 'previous' | 'initial'
    ): Promise<void> => {
      // Abort previous request
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: direction === 'initial',
          isFetchingNextPage: direction === 'next',
          isFetchingPreviousPage: direction === 'previous',
          error: direction === 'initial' ? null : prev.error,
        }))
      }

      try {
        const url = getUrl(pageParam)
        const data = await client.get<T>(url, {
          ...requestOptions,
          signal: abortControllerRef.current.signal,
        })

        if (mountedRef.current) {
          setState(prev => {
            let newPages: T[]

            if (direction === 'initial') {
              newPages = [data]
            } else if (direction === 'next') {
              newPages = [...prev.pages, data]
            } else {
              newPages = [data, ...prev.pages]
            }

            return {
              pages: newPages,
              loading: false,
              error: null,
              isFetchingNextPage: false,
              isFetchingPreviousPage: false,
              dataUpdatedAt: Date.now(),
            }
          })
        }

        if (direction === 'initial') {
          onSuccess?.([data])
        }
      } catch (error) {
        const requestError = error as RequestError

        // Don't update state for canceled requests
        if (isCancelError(error)) {
          return
        }

        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            loading: false,
            isFetchingNextPage: false,
            isFetchingPreviousPage: false,
            error: requestError,
          }))
        }

        onError?.(requestError)
      }
    },
    [client, getUrl, requestOptions, onSuccess, onError]
  )

  const fetchNextPage = useCallback(async (): Promise<void> => {
    if (!hasNextPage || state.isFetchingNextPage) {
      return
    }
    await fetchPage(nextPageParam, 'next')
  }, [hasNextPage, state.isFetchingNextPage, nextPageParam, fetchPage])

  const fetchPreviousPage = useCallback(async (): Promise<void> => {
    if (!hasPreviousPage || state.isFetchingPreviousPage) {
      return
    }
    await fetchPage(previousPageParam, 'previous')
  }, [hasPreviousPage, state.isFetchingPreviousPage, previousPageParam, fetchPage])

  const refetch = useCallback(async (): Promise<void> => {
    // Reset and fetch first page
    await fetchPage(undefined, 'initial')
  }, [fetchPage])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchPage(undefined, 'initial')
    } else {
      setState(prev => ({ ...prev, loading: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return {
    data: state.pages.length > 0 ? state.pages : undefined,
    loading: state.loading,
    error: state.error,
    isFetchingNextPage: state.isFetchingNextPage,
    isFetchingPreviousPage: state.isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    refetch,
  }
}
