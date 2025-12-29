import CodeBlock from '../../components/CodeBlock'

const createClientApi = `// Factory function to create HTTP client
function createClient(config?: ClientConfig): RequestClient

interface ClientConfig {
  baseURL?: string
  headers?: Record<string, string>
  timeout?: number
  retry?: RetryConfig
  validateStatus?: (status: number) => boolean
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
  paramsSerializer?: (params: Record<string, unknown>) => string
  paramsArrayFormat?: 'brackets' | 'indices' | 'repeat' | 'comma'
}`

const requestClientApi = `interface RequestClient {
  // HTTP Methods
  get<T>(url: string, options?: RequestOptions): Promise<T>
  post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>
  put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>
  patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>
  delete<T>(url: string, options?: RequestOptions): Promise<T>
  head<T>(url: string, options?: RequestOptions): Promise<T>
  options<T>(url: string, options?: RequestOptions): Promise<T>
  request<T>(url: string, options?: RequestOptions): Promise<T>

  // Configuration
  defaults: ClientConfig

  // Interceptors
  interceptors: {
    request: InterceptorManager<RequestOptions>
    response: InterceptorManager<Response>
  }
}`

const requestOptionsApi = `interface RequestOptions {
  // Request configuration
  method?: HttpMethod
  headers?: Record<string, string>
  params?: Record<string, unknown>
  data?: unknown
  timeout?: number

  // Response handling
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
  validateStatus?: (status: number) => boolean

  // Retry configuration
  retry?: RetryConfig

  // Cancellation
  signal?: AbortSignal
  cancelToken?: CancelToken

  // Progress tracking
  onUploadProgress?: (progress: Progress) => void
  onDownloadProgress?: (progress: Progress) => void

  // Query parameters
  paramsArrayFormat?: 'brackets' | 'indices' | 'repeat' | 'comma'
  paramsSerializer?: (params: Record<string, unknown>) => string
}`

const retryConfigApi = `interface RetryConfig {
  limit: number
  delay: number
  backoff?: 'linear' | 'exponential'
  retryOn?: number[]
  maxDelay?: number
}`

const progressApi = `interface Progress {
  loaded: number
  total: number
  percent: number
}`

const cancelTokenApi = `// Create a cancel token
const source = CancelToken.source()

// Use the token
api.get('/data', { cancelToken: source.token })

// Cancel the request
source.cancel('Operation canceled')

// Check if request was canceled
source.token.reason // 'Operation canceled'`

const interceptorApi = `interface InterceptorManager<T> {
  // Add interceptor, returns ID
  use(
    onFulfilled?: (value: T) => T | Promise<T>,
    onRejected?: (error: Error) => Error | Promise<Error>
  ): number

  // Remove interceptor by ID
  eject(id: number): void
}`

const requestErrorApi = `interface RequestError extends Error {
  message: string
  status?: number
  data?: unknown
  config: RequestOptions
  response?: Response
  code?: string
}

// Type guard
function isRequestError(error: unknown): error is RequestError`

const reactHooksApi = `// Provider
function RequestProvider(props: {
  client: RequestClient
  children: ReactNode
}): JSX.Element

// Hooks
function useClient(): RequestClient

function useQuery<T>(
  url: string | (() => string | null),
  options?: UseQueryOptions
): UseQueryResult<T>

function useMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: UseMutationOptions<T, V>
): UseMutationResult<T, V>

function useInfiniteQuery<T>(
  getUrl: (cursor?: string) => string,
  options: UseInfiniteQueryOptions<T>
): UseInfiniteQueryResult<T>

function useRequest<T>(
  url: string,
  options?: UseRequestOptions
): UseRequestResult<T>`

const useQueryOptionsApi = `interface UseQueryOptions {
  enabled?: boolean
  params?: Record<string, unknown>
  headers?: Record<string, string>
  onSuccess?: (data: T) => void
  onError?: (error: RequestError) => void
}`

const useMutationOptionsApi = `interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void
  onError?: (error: RequestError, variables: V) => void
  onSettled?: (data: T | undefined, error: RequestError | null, variables: V) => void
}`

const useInfiniteQueryOptionsApi = `interface UseInfiniteQueryOptions<T> {
  enabled?: boolean
  getNextPageParam: (lastPage: T) => string | undefined
  onSuccess?: (data: T[]) => void
  onError?: (error: RequestError) => void
}`

export default function ApiReference() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">API Reference</h1>
      <p className="mt-4 text-slate-400">
        Complete API reference for RequestKit core and React adapter.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Core API</h2>

        <h3 className="mt-8 text-xl font-semibold text-white">createClient</h3>
        <CodeBlock code={createClientApi} language="typescript" />

        <h3 className="mt-8 text-xl font-semibold text-white">RequestClient</h3>
        <CodeBlock code={requestClientApi} language="typescript" />

        <h3 className="mt-8 text-xl font-semibold text-white">RequestOptions</h3>
        <CodeBlock code={requestOptionsApi} language="typescript" />

        <h3 className="mt-8 text-xl font-semibold text-white">RetryConfig</h3>
        <CodeBlock code={retryConfigApi} language="typescript" />

        <h3 className="mt-8 text-xl font-semibold text-white">Progress</h3>
        <CodeBlock code={progressApi} language="typescript" />

        <h3 className="mt-8 text-xl font-semibold text-white">CancelToken</h3>
        <CodeBlock code={cancelTokenApi} language="typescript" />

        <h3 className="mt-8 text-xl font-semibold text-white">InterceptorManager</h3>
        <CodeBlock code={interceptorApi} language="typescript" />

        <h3 className="mt-8 text-xl font-semibold text-white">RequestError</h3>
        <CodeBlock code={requestErrorApi} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">React API</h2>

        <h3 className="mt-8 text-xl font-semibold text-white">Components & Hooks</h3>
        <CodeBlock code={reactHooksApi} language="typescript" />

        <h3 className="mt-8 text-xl font-semibold text-white">UseQueryOptions</h3>
        <CodeBlock code={useQueryOptionsApi} language="typescript" />

        <h3 className="mt-8 text-xl font-semibold text-white">UseMutationOptions</h3>
        <CodeBlock code={useMutationOptionsApi} language="typescript" />

        <h3 className="mt-8 text-xl font-semibold text-white">UseInfiniteQueryOptions</h3>
        <CodeBlock code={useInfiniteQueryOptionsApi} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Type Exports</h2>
        <p className="mt-4 text-slate-400">
          All types are exported from the main package:
        </p>
        <CodeBlock
          code={`import type {
  ClientConfig,
  RequestOptions,
  RequestClient,
  RetryConfig,
  Progress,
  CancelToken,
  RequestError,
  HttpMethod,
  InterceptorManager,
} from '@oxog/requestkit'

import type {
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseRequestOptions,
  UseRequestResult,
} from '@oxog/requestkit/react'`}
          language="typescript"
        />
      </section>
    </div>
  )
}
