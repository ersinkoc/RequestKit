/**
 * RequestKit React Adapter
 * Provides React hooks for data fetching
 */

// Provider
export { RequestProvider } from './provider.js'
export type { RequestProviderProps } from './provider.js'

// Context
export { RequestContext } from './context.js'

// Hooks
export { useClient } from './hooks/useClient.js'
export { useRequest } from './hooks/useRequest.js'
export { useQuery } from './hooks/useQuery.js'
export { useMutation } from './hooks/useMutation.js'
export { useInfiniteQuery } from './hooks/useInfiniteQuery.js'

// Re-export types for convenience
export type {
  UseRequestOptions,
  UseRequestResult,
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from '../../types.js'
