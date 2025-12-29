/**
 * useClient Hook
 * Returns the RequestKit client from context
 */

import { useContext } from 'react'
import type { RequestClient } from '../../../types.js'
import { RequestContext } from '../context.js'

/**
 * Get the RequestKit client from context
 * Must be used within a RequestProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const client = useClient()
 *
 *   const handleClick = async () => {
 *     const data = await client.get('/endpoint')
 *     console.log(data)
 *   }
 *
 *   return <button onClick={handleClick}>Fetch</button>
 * }
 * ```
 */
export function useClient(): RequestClient {
  const client = useContext(RequestContext)

  if (!client) {
    throw new Error(
      'useClient must be used within a RequestProvider. ' +
      'Make sure to wrap your component tree with <RequestProvider client={client}>.'
    )
  }

  return client
}
