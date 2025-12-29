import CodeBlock from '../../components/CodeBlock'

const createClientCode = `import { createClient } from '@oxog/requestkit'

// Create a basic client
const api = createClient({
  baseURL: 'https://api.example.com',
})

// Create a configured client
const configuredApi = createClient({
  baseURL: 'https://api.example.com/v1',
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value',
  },
  timeout: 10000,
  retry: {
    limit: 3,
    delay: 1000,
  },
})`

const configOptions = `interface ClientConfig {
  // Base URL prepended to all requests
  baseURL?: string

  // Default headers for all requests
  headers?: Record<string, string>

  // Request timeout in milliseconds
  timeout?: number

  // Retry configuration
  retry?: {
    limit: number      // Max retry attempts
    delay: number      // Initial delay in ms
    backoff?: 'linear' | 'exponential'
    retryOn?: number[] // Status codes to retry
  }

  // Custom status validation
  validateStatus?: (status: number) => boolean

  // Response type
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'

  // Query parameter serialization
  paramsSerializer?: (params: Record<string, unknown>) => string
}`

const interceptorsCode = `const api = createClient({
  baseURL: 'https://api.example.com',
})

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to every request
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: \`Bearer \${token}\`,
      }
    }
    return config
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error)
  }
)

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Transform response data
    return response
  },
  (error) => {
    // Handle 401 errors globally
    if (error.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)`

const methodsCode = `const api = createClient({ baseURL: 'https://api.example.com' })

// HTTP methods available on the client
await api.get('/users')
await api.post('/users', { name: 'John' })
await api.put('/users/1', { name: 'Jane' })
await api.patch('/users/1', { name: 'Jane' })
await api.delete('/users/1')
await api.head('/users')
await api.options('/users')

// Generic request method
await api.request('/users', {
  method: 'GET',
  headers: { 'X-Custom': 'value' },
})`

const defaultsCode = `const api = createClient({
  baseURL: 'https://api.example.com',
})

// Update defaults after creation
api.defaults.headers = {
  ...api.defaults.headers,
  'Authorization': 'Bearer new-token',
}

api.defaults.timeout = 15000`

export default function ClientInstance() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">Client Instance</h1>
      <p className="mt-4 text-slate-400">
        The client instance is created using the <code className="text-primary-400">createClient</code> factory function.
        It provides all HTTP methods and configuration options.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Creating a Client</h2>
        <p className="mt-4 text-slate-400">
          Use <code className="text-primary-400">createClient</code> to create a new HTTP client instance:
        </p>
        <CodeBlock code={createClientCode} language="typescript" filename="api.ts" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Configuration Options</h2>
        <p className="mt-4 text-slate-400">
          The client accepts the following configuration options:
        </p>
        <CodeBlock code={configOptions} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">HTTP Methods</h2>
        <p className="mt-4 text-slate-400">
          The client provides methods for all standard HTTP verbs:
        </p>
        <CodeBlock code={methodsCode} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Interceptors</h2>
        <p className="mt-4 text-slate-400">
          Add request and response interceptors to modify requests or handle responses globally:
        </p>
        <CodeBlock code={interceptorsCode} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Updating Defaults</h2>
        <p className="mt-4 text-slate-400">
          You can update client defaults after creation:
        </p>
        <CodeBlock code={defaultsCode} language="typescript" />
      </section>
    </div>
  )
}
