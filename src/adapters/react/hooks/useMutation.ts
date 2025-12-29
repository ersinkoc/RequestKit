/**
 * useMutation Hook
 * For creating, updating, or deleting data
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  RequestError,
  UseMutationOptions,
  UseMutationResult,
} from '../../../types.js'
import { isCancelError } from '../../../core/error.js'
import { useClient } from './useClient.js'

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE)
 * Best for data modifications that need to be triggered by user actions
 *
 * @example
 * ```tsx
 * interface CreateUserInput {
 *   name: string
 *   email: string
 * }
 *
 * function CreateUserForm() {
 *   const { mutate, loading, error } = useMutation<User, CreateUserInput>(
 *     (input) => client.post('/users', input),
 *     {
 *       onSuccess: (user) => {
 *         toast.success(`Created ${user.name}`)
 *         router.push(`/users/${user.id}`)
 *       },
 *       onError: (error) => {
 *         toast.error(error.message)
 *       },
 *     }
 *   )
 *
 *   const handleSubmit = (e: FormEvent) => {
 *     e.preventDefault()
 *     mutate({ name: 'John', email: 'john@example.com' })
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button type="submit" disabled={loading}>
 *         {loading ? 'Creating...' : 'Create User'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 */
export function useMutation<T = unknown, V = void>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { onSuccess, onError, onSettled } = options

  // Get client to ensure we're in a provider
  useClient()

  const [state, setState] = useState<{
    data: T | undefined
    loading: boolean
    error: RequestError | null
  }>({
    data: undefined,
    loading: false,
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

  const mutateAsync = useCallback(
    async (variables: V): Promise<T> => {
      // Abort previous request
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: true, error: null }))
      }

      try {
        const data = await mutationFn(variables)

        if (mountedRef.current) {
          setState({ data, loading: false, error: null })
        }

        onSuccess?.(data, variables)
        onSettled?.(data, null, variables)

        return data
      } catch (error) {
        const requestError = error as RequestError

        // Don't update state for canceled requests
        if (!isCancelError(error) && mountedRef.current) {
          setState(prev => ({ ...prev, loading: false, error: requestError }))
        }

        onError?.(requestError, variables)
        onSettled?.(undefined, requestError, variables)

        throw requestError
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  )

  const mutate = useCallback(
    (variables: V): void => {
      mutateAsync(variables).catch(() => {
        // Error already handled in mutateAsync
      })
    },
    [mutateAsync]
  )

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    setState({ data: undefined, loading: false, error: null })
  }, [])

  return {
    ...state,
    mutate,
    mutateAsync,
    reset,
  }
}
