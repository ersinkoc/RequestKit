// ============ HTTP METHODS ============

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

// ============ RESPONSE TYPES ============

export type ResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream' | 'raw'

// ============ ERROR CODES ============

export type ErrorCode =
  | 'ERR_NETWORK'
  | 'ERR_TIMEOUT'
  | 'ERR_CANCELED'
  | 'ERR_BAD_REQUEST'
  | 'ERR_BAD_RESPONSE'

// ============ PROGRESS ============

export interface Progress {
  loaded: number
  total: number
  percent: number
}

export type ProgressCallback = (progress: Progress) => void

// ============ PARAMS SERIALIZER ============

export interface ParamsSerializer {
  encode?: (params: Record<string, unknown>) => string
  arrayFormat?: 'indices' | 'brackets' | 'repeat' | 'comma'
}

// ============ TRANSFORM ============

export type TransformFn = (data: unknown, headers?: Headers) => unknown

// ============ HOOKS ============

export type RequestHook = (config: InternalRequestConfig) => InternalRequestConfig | Promise<InternalRequestConfig>
export type ResponseHook = (response: Response) => Response | Promise<Response>
export type ErrorHook = (error: RequestError) => unknown

// ============ RETRY CONFIG ============

export interface RetryConfig {
  /** Max retry attempts */
  limit: number
  /** Methods to retry (default: GET, HEAD, OPTIONS, PUT, DELETE) */
  methods?: HttpMethod[]
  /** Status codes to retry (default: 408, 429, 500, 502, 503, 504) */
  statusCodes?: number[]
  /** Initial delay in ms (default: 1000) */
  delay?: number
  /** Backoff strategy (default: exponential) */
  backoff?: 'linear' | 'exponential'
  /** Max delay in ms (default: 30000) */
  maxDelay?: number
  /** Custom retry condition */
  retryCondition?: (error: RequestError) => boolean
  /** Retry callback */
  onRetry?: (attempt: number, error: RequestError, config: InternalRequestConfig) => void
}

// ============ CLIENT CONFIG ============

export interface ClientConfig {
  /** Base URL for all requests */
  baseURL?: string
  /** Default headers */
  headers?: HeadersInit | Record<string, string>
  /** Timeout in ms (0 = no timeout) */
  timeout?: number
  /** Retry config or number of retries */
  retry?: number | RetryConfig
  /** Response type (default: json) */
  responseType?: ResponseType
  /** Credentials mode */
  credentials?: RequestCredentials
  /** Cache mode */
  cache?: RequestCache
  /** Request mode */
  mode?: RequestMode
  /** Query params serialization */
  paramsSerializer?: ParamsSerializer
  /** Status validation (default: 200-299) */
  validateStatus?: (status: number) => boolean
  /** Transform request data */
  transformRequest?: TransformFn | TransformFn[]
  /** Transform response data */
  transformResponse?: TransformFn | TransformFn[]
  /** Request hook */
  onRequest?: RequestHook
  /** Response hook */
  onResponse?: ResponseHook
  /** Error hook */
  onError?: ErrorHook
}

// ============ REQUEST OPTIONS ============

export interface RequestOptions extends Omit<ClientConfig, 'baseURL'> {
  /** HTTP method */
  method?: HttpMethod
  /** URL params (query string) */
  params?: Record<string, unknown> | URLSearchParams
  /** Request body */
  body?: BodyInit | Record<string, unknown>
  /** JSON body (auto-serialized) */
  json?: Record<string, unknown>
  /** Form body (FormData or URLSearchParams) */
  form?: Record<string, unknown> | FormData
  /** Abort signal */
  signal?: AbortSignal
  /** Upload progress callback */
  onUploadProgress?: ProgressCallback
  /** Download progress callback */
  onDownloadProgress?: ProgressCallback
  /** Return cancelable request */
  cancelable?: boolean
  /** Return raw response with metadata */
  raw?: boolean
}

// ============ INTERNAL REQUEST CONFIG ============

export interface InternalRequestConfig extends RequestOptions {
  url: string
  method: HttpMethod
  headers: Headers
  baseURL?: string
  /** Internal: retry attempt tracking */
  _retry?: boolean
  /** Internal: current retry count */
  _retryCount?: number
}

// ============ REQUEST RESPONSE ============

export interface RequestResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Headers
  config: InternalRequestConfig
  request?: Request
  ok: boolean
}

// ============ REQUEST ERROR ============

export interface RequestError extends Error {
  name: 'RequestError'
  message: string
  status?: number
  statusText?: string
  data?: unknown
  config: InternalRequestConfig
  request?: Request
  response?: Response
  code?: ErrorCode
}

// ============ INTERCEPTOR HANDLER ============

export interface InterceptorHandler<T> {
  fulfilled?: (value: T) => T | Promise<T>
  rejected?: (error: RequestError) => unknown
}

// ============ INTERCEPTOR MANAGER ============

export interface InterceptorManager<T> {
  /**
   * Add an interceptor
   * @returns Interceptor ID for removal
   */
  use(
    onFulfilled?: (value: T) => T | Promise<T>,
    onRejected?: (error: RequestError) => unknown
  ): number

  /**
   * Remove an interceptor by ID
   */
  eject(id: number): void

  /**
   * Clear all interceptors
   */
  clear(): void
}

// ============ INTERCEPTORS ============

export interface Interceptors {
  request: InterceptorManager<InternalRequestConfig>
  response: InterceptorManager<Response>
}

// ============ CANCELABLE REQUEST ============

export interface CancelableRequest<T> {
  data: Promise<T>
  cancel: () => void
}

// ============ CANCEL TOKEN ============

export interface CancelToken {
  promise: Promise<Cancel>
  reason?: Cancel
  throwIfRequested(): void
}

export interface CancelTokenSource {
  token: CancelToken
  cancel: (message?: string) => void
}

export interface Cancel {
  message?: string
}

// ============ REQUEST CLIENT ============

export interface RequestClient {
  // HTTP methods - return data directly
  get<T = unknown>(url: string, options?: RequestOptions): Promise<T>
  post<T = unknown>(url: string, body?: unknown, options?: RequestOptions): Promise<T>
  put<T = unknown>(url: string, body?: unknown, options?: RequestOptions): Promise<T>
  patch<T = unknown>(url: string, body?: unknown, options?: RequestOptions): Promise<T>
  delete<T = unknown>(url: string, options?: RequestOptions): Promise<T>
  head(url: string, options?: RequestOptions): Promise<void>
  options(url: string, options?: RequestOptions): Promise<void>

  // Generic request
  request<T = unknown>(url: string, options?: RequestOptions): Promise<T>
  request<T = unknown>(options: RequestOptions & { url: string }): Promise<T>

  // Interceptors
  interceptors: Interceptors

  // Defaults
  defaults: ClientConfig

  // Instance management
  extend(config: ClientConfig): RequestClient
  clone(): RequestClient
}

// ============ REACT HOOKS ============

export interface UseRequestOptions<T> {
  /** Don't fetch on mount */
  manual?: boolean
  /** Success callback */
  onSuccess?: (data: T) => void
  /** Error callback */
  onError?: (error: RequestError) => void
}

export interface UseRequestResult<T> {
  data: T | undefined
  loading: boolean
  error: RequestError | null
  execute: (options?: RequestOptions) => Promise<T>
  reset: () => void
}

export interface UseQueryOptions<T> {
  /** Enable/disable query */
  enabled?: boolean
  /** Time until data is stale (ms) */
  staleTime?: number
  /** Time to keep in cache (ms) */
  cacheTime?: number
  /** Refetch on window focus */
  refetchOnWindowFocus?: boolean
  /** Refetch on reconnect */
  refetchOnReconnect?: boolean
  /** Polling interval (ms) */
  refetchInterval?: number
  /** Retry failed requests */
  retry?: number | boolean
  /** Success callback */
  onSuccess?: (data: T) => void
  /** Error callback */
  onError?: (error: RequestError) => void
}

export interface UseQueryResult<T> {
  data: T | undefined
  loading: boolean
  error: RequestError | null
  isStale: boolean
  isFetching: boolean
  refetch: () => Promise<void>
}

export interface UseMutationOptions<T, V> {
  /** Success callback */
  onSuccess?: (data: T, variables: V) => void
  /** Error callback */
  onError?: (error: RequestError, variables: V) => void
  /** Settled callback (always called) */
  onSettled?: (data: T | undefined, error: RequestError | null, variables: V) => void
}

export interface UseMutationResult<T, V> {
  data: T | undefined
  loading: boolean
  error: RequestError | null
  mutate: (variables: V) => void
  mutateAsync: (variables: V) => Promise<T>
  reset: () => void
}

export interface UseInfiniteQueryOptions<T> {
  /** Get next page param from last page */
  getNextPageParam: (lastPage: T, pages: T[]) => unknown | undefined
  /** Get previous page param from first page */
  getPreviousPageParam?: (firstPage: T, pages: T[]) => unknown | undefined
  /** Enable/disable query */
  enabled?: boolean
  /** Time until data is stale (ms) */
  staleTime?: number
  /** Success callback */
  onSuccess?: (data: T[]) => void
  /** Error callback */
  onError?: (error: RequestError) => void
}

export interface UseInfiniteQueryResult<T> {
  data: T[] | undefined
  loading: boolean
  error: RequestError | null
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
  hasNextPage: boolean
  hasPreviousPage: boolean
  fetchNextPage: () => Promise<void>
  fetchPreviousPage: () => Promise<void>
  refetch: () => Promise<void>
}
