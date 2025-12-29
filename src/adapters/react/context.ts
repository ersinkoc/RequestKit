/**
 * React Context for RequestKit
 */

import { createContext } from 'react'
import type { RequestClient } from '../../types.js'

/**
 * Context for the RequestKit client
 * Use RequestProvider to provide the client
 */
export const RequestContext = createContext<RequestClient | null>(null)

RequestContext.displayName = 'RequestContext'
