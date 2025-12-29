import CodeBlock from '../../components/CodeBlock'

const basicError = `import { createClient, RequestError, isRequestError } from '@oxog/requestkit'

const api = createClient({ baseURL: 'https://api.example.com' })

try {
  const user = await api.get('/users/999')
} catch (error) {
  if (isRequestError(error)) {
    console.log('Status:', error.status)      // 404
    console.log('Message:', error.message)    // "Not Found"
    console.log('URL:', error.config.url)     // "/users/999"
    console.log('Data:', error.data)          // Server response body
  }
}`

const errorInterface = `interface RequestError extends Error {
  // Error message
  message: string

  // HTTP status code (undefined for network errors)
  status?: number

  // Server response data
  data?: unknown

  // Original request configuration
  config: RequestOptions

  // Original Response object (if available)
  response?: Response

  // Error code for categorization
  code?: string
}`

const errorCodes = `// Error codes for different failure types
const ERROR_CODES = {
  ERR_NETWORK: 'ERR_NETWORK',           // Network failure
  ERR_TIMEOUT: 'ERR_TIMEOUT',           // Request timeout
  ERR_CANCELED: 'ERR_CANCELED',         // Request was canceled
  ERR_BAD_REQUEST: 'ERR_BAD_REQUEST',   // 4xx client error
  ERR_SERVER: 'ERR_SERVER',             // 5xx server error
}

try {
  await api.get('/data')
} catch (error) {
  if (isRequestError(error)) {
    switch (error.code) {
      case 'ERR_NETWORK':
        console.log('Network error - check connection')
        break
      case 'ERR_TIMEOUT':
        console.log('Request timed out')
        break
      case 'ERR_CANCELED':
        console.log('Request was canceled')
        break
      case 'ERR_BAD_REQUEST':
        console.log('Client error:', error.status)
        break
      case 'ERR_SERVER':
        console.log('Server error:', error.status)
        break
    }
  }
}`

const statusValidation = `const api = createClient({
  baseURL: 'https://api.example.com',
  // Custom status validation
  validateStatus: (status) => status >= 200 && status < 300,
})

// By default, status codes 200-299 are considered successful
// You can customize this behavior:

const permissiveApi = createClient({
  baseURL: 'https://api.example.com',
  // Accept redirects as success
  validateStatus: (status) => status >= 200 && status < 400,
})`

const globalErrorHandler = `// Handle errors globally with interceptors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isRequestError(error)) {
      // Log all errors
      console.error(\`API Error: \${error.status} \${error.config.url}\`)

      // Handle specific status codes
      switch (error.status) {
        case 401:
          // Redirect to login
          window.location.href = '/login'
          break
        case 403:
          // Show forbidden message
          showToast('You do not have permission')
          break
        case 404:
          // Show not found
          showToast('Resource not found')
          break
        case 429:
          // Rate limited
          showToast('Too many requests, please slow down')
          break
        case 500:
        case 502:
        case 503:
          // Server error
          showToast('Server error, please try again later')
          break
      }
    }
    return Promise.reject(error)
  }
)`

const typedErrors = `interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

try {
  await api.post('/users', { email: 'invalid' })
} catch (error) {
  if (isRequestError(error)) {
    // Type the error data
    const apiError = error.data as ApiError

    if (apiError.details) {
      // Handle validation errors
      Object.entries(apiError.details).forEach(([field, messages]) => {
        console.log(\`\${field}: \${messages.join(', ')}\`)
      })
    }
  }
}`

const timeoutError = `const api = createClient({
  baseURL: 'https://api.example.com',
  timeout: 5000, // 5 second timeout
})

try {
  await api.get('/slow-endpoint')
} catch (error) {
  if (isRequestError(error) && error.code === 'ERR_TIMEOUT') {
    console.log('Request timed out after 5 seconds')
  }
}`

const cancelError = `import { CancelToken } from '@oxog/requestkit'

const source = CancelToken.source()

// Cancel after 1 second
setTimeout(() => source.cancel('User navigated away'), 1000)

try {
  await api.get('/data', { cancelToken: source.token })
} catch (error) {
  if (isRequestError(error) && error.code === 'ERR_CANCELED') {
    console.log('Request canceled:', error.message)
    // Don't show error to user for intentional cancellation
  }
}`

const reactErrorHandling = `import { useQuery } from '@oxog/requestkit/react'

function UserProfile({ userId }: { userId: string }) {
  const { data, error, loading } = useQuery<User>(\`/users/\${userId}\`)

  if (loading) return <Spinner />

  if (error) {
    // error is a RequestError
    if (error.status === 404) {
      return <NotFound message="User not found" />
    }
    if (error.status === 403) {
      return <Forbidden message="Access denied" />
    }
    return <ErrorMessage error={error} />
  }

  return <UserCard user={data} />
}`

export default function ErrorHandling() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">Error Handling</h1>
      <p className="mt-4 text-slate-400">
        RequestKit provides comprehensive error handling with typed errors, status codes,
        and helpful metadata for debugging.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Basic Error Handling</h2>
        <p className="mt-4 text-slate-400">
          Use try/catch to handle errors and the <code className="text-primary-400">isRequestError</code> type guard:
        </p>
        <CodeBlock code={basicError} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Error Interface</h2>
        <p className="mt-4 text-slate-400">
          The <code className="text-primary-400">RequestError</code> interface:
        </p>
        <CodeBlock code={errorInterface} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Error Codes</h2>
        <p className="mt-4 text-slate-400">
          Categorize errors by their code:
        </p>
        <CodeBlock code={errorCodes} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Status Validation</h2>
        <p className="mt-4 text-slate-400">
          Customize which status codes are considered successful:
        </p>
        <CodeBlock code={statusValidation} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Global Error Handler</h2>
        <p className="mt-4 text-slate-400">
          Handle all errors in one place with interceptors:
        </p>
        <CodeBlock code={globalErrorHandler} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Typed Error Data</h2>
        <p className="mt-4 text-slate-400">
          Type the error response data for better type safety:
        </p>
        <CodeBlock code={typedErrors} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Timeout Errors</h2>
        <p className="mt-4 text-slate-400">
          Handle timeout errors specifically:
        </p>
        <CodeBlock code={timeoutError} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Cancellation Errors</h2>
        <p className="mt-4 text-slate-400">
          Handle canceled requests gracefully:
        </p>
        <CodeBlock code={cancelError} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">React Error Handling</h2>
        <p className="mt-4 text-slate-400">
          Handle errors in React components:
        </p>
        <CodeBlock code={reactErrorHandling} language="tsx" />
      </section>
    </div>
  )
}
