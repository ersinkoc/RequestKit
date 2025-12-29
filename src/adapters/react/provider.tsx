/**
 * RequestProvider Component
 * Provides the RequestKit client to the React component tree
 */

import type { ReactNode } from 'react'
import type { RequestClient } from '../../types.js'
import { RequestContext } from './context.js'

export interface RequestProviderProps {
  /**
   * The RequestKit client instance
   */
  client: RequestClient

  /**
   * Children components
   */
  children: ReactNode
}

/**
 * Provider component for RequestKit
 * Wrap your app with this to use the hooks
 *
 * @example
 * ```tsx
 * import { createClient } from '@oxog/requestkit'
 * import { RequestProvider } from '@oxog/requestkit/react'
 *
 * const client = createClient({ baseURL: 'https://api.example.com' })
 *
 * function App() {
 *   return (
 *     <RequestProvider client={client}>
 *       <MyApp />
 *     </RequestProvider>
 *   )
 * }
 * ```
 */
export function RequestProvider({ client, children }: RequestProviderProps) {
  return (
    <RequestContext.Provider value={client}>
      {children}
    </RequestContext.Provider>
  )
}
