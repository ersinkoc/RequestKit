/**
 * URL manipulation utilities
 */

/**
 * Check if a URL is absolute (has protocol)
 */
export function isAbsoluteURL(url: string): boolean {
  // A URL is absolute if it starts with a scheme (http://, https://, //, etc.)
  return /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(url)
}

/**
 * Combine base URL with relative URL
 * Handles trailing/leading slashes correctly
 */
export function combineURLs(baseURL: string, relativeURL: string): string {
  if (!baseURL) {
    return relativeURL
  }

  if (!relativeURL) {
    return baseURL
  }

  // If relative URL is absolute, return it as-is
  if (isAbsoluteURL(relativeURL)) {
    return relativeURL
  }

  // Remove trailing slash from base and leading slash from relative
  const base = baseURL.replace(/\/+$/, '')
  const relative = relativeURL.replace(/^\/+/, '')

  return `${base}/${relative}`
}

/**
 * Build URL with query parameters
 */
export function buildURL(url: string, params?: Record<string, unknown> | URLSearchParams | string): string {
  if (!params) {
    return url
  }

  let serializedParams: string

  if (typeof params === 'string') {
    serializedParams = params
  } else if (params instanceof URLSearchParams) {
    serializedParams = params.toString()
  } else {
    // Import serializeParams dynamically to avoid circular dependency
    const entries: string[] = []

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        continue
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== null && item !== undefined) {
            entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
          }
        }
      } else if (value instanceof Date) {
        entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.toISOString())}`)
      } else if (typeof value === 'object') {
        entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`)
      } else {
        entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      }
    }

    serializedParams = entries.join('&')
  }

  if (!serializedParams) {
    return url
  }

  // Check if URL already has query string
  const hashIndex = url.indexOf('#')
  let baseUrl = url
  let hash = ''

  if (hashIndex !== -1) {
    hash = url.slice(hashIndex)
    baseUrl = url.slice(0, hashIndex)
  }

  const separator = baseUrl.includes('?') ? '&' : '?'

  return `${baseUrl}${separator}${serializedParams}${hash}`
}

/**
 * Parse URL into components
 */
export function parseURL(url: string): {
  protocol: string
  host: string
  pathname: string
  search: string
  hash: string
} {
  try {
    const parsed = new URL(url, 'http://localhost')
    return {
      protocol: parsed.protocol,
      host: parsed.host,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
    }
  } catch {
    return {
      protocol: '',
      host: '',
      pathname: url,
      search: '',
      hash: '',
    }
  }
}

/**
 * Get the origin from a URL
 */
export function getOrigin(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.origin
  } catch {
    return ''
  }
}

/**
 * Check if two URLs have the same origin
 */
export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const origin1 = new URL(url1).origin
    const origin2 = new URL(url2).origin
    return origin1 === origin2
  } catch {
    return false
  }
}
