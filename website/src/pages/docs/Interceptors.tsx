import CodeBlock from '../../components/CodeBlock'

const basicInterceptors = `import { createClient } from '@oxog/requestkit'

const api = createClient({ baseURL: 'https://api.example.com' })

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Modify config before request is sent
    console.log('Request:', config.method, config.url)
    return config
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Handle successful response
    console.log('Response:', response.status)
    return response
  },
  (error) => {
    // Handle response errors
    console.error('Error:', error.message)
    return Promise.reject(error)
  }
)`

const authInterceptor = `// Add authentication token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: \`Bearer \${token}\`,
    }
  }

  return config
})`

const refreshToken = `// Token refresh interceptor
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: Error) => void
}> = []

const processQueue = (error: Error | null, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = \`Bearer \${token}\`
          return api.request(originalRequest.url, originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { accessToken } = await api.post('/auth/refresh', { refreshToken })

        localStorage.setItem('accessToken', accessToken)
        processQueue(null, accessToken)

        originalRequest.headers.Authorization = \`Bearer \${accessToken}\`
        return api.request(originalRequest.url, originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)`

const loggingInterceptor = `// Request/response logging
api.interceptors.request.use((config) => {
  config._startTime = Date.now()
  console.log(\`[\${config.method?.toUpperCase()}] \${config.url}\`)
  return config
})

api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config._startTime
    console.log(\`[DONE] \${response.config.url} - \${duration}ms\`)
    return response
  },
  (error) => {
    const duration = Date.now() - error.config._startTime
    console.error(\`[ERROR] \${error.config.url} - \${error.status} - \${duration}ms\`)
    return Promise.reject(error)
  }
)`

const transformData = `// Transform response data
api.interceptors.response.use((response) => {
  // Unwrap API envelope
  if (response.data?.data) {
    return {
      ...response,
      data: response.data.data,
    }
  }
  return response
})

// Transform dates in response
api.interceptors.response.use((response) => {
  const transformDates = (obj: unknown): unknown => {
    if (obj === null || typeof obj !== 'object') return obj

    if (Array.isArray(obj)) {
      return obj.map(transformDates)
    }

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        result[key] = new Date(value)
      } else if (typeof value === 'object') {
        result[key] = transformDates(value)
      } else {
        result[key] = value
      }
    }
    return result
  }

  return {
    ...response,
    data: transformDates(response.data),
  }
})`

const removeInterceptor = `// Interceptors return an ID that can be used to remove them
const requestId = api.interceptors.request.use((config) => {
  console.log('Request interceptor')
  return config
})

const responseId = api.interceptors.response.use((response) => {
  console.log('Response interceptor')
  return response
})

// Remove interceptors when no longer needed
api.interceptors.request.eject(requestId)
api.interceptors.response.eject(responseId)`

const orderOfExecution = `// Interceptors execute in order they were added
// Request: first added -> last added
// Response: last added -> first added (reverse order)

api.interceptors.request.use((config) => {
  console.log('Request interceptor 1') // Runs first
  return config
})

api.interceptors.request.use((config) => {
  console.log('Request interceptor 2') // Runs second
  return config
})

api.interceptors.response.use((response) => {
  console.log('Response interceptor 1') // Runs second
  return response
})

api.interceptors.response.use((response) => {
  console.log('Response interceptor 2') // Runs first
  return response
})

// Output order:
// Request interceptor 1
// Request interceptor 2
// Response interceptor 2
// Response interceptor 1`

export default function Interceptors() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">Interceptors</h1>
      <p className="mt-4 text-slate-400">
        Interceptors allow you to modify requests before they are sent and responses before they are returned.
        They're perfect for authentication, logging, error handling, and data transformation.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Basic Usage</h2>
        <p className="mt-4 text-slate-400">
          Add request and response interceptors to your client:
        </p>
        <CodeBlock code={basicInterceptors} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Authentication</h2>
        <p className="mt-4 text-slate-400">
          Automatically add authentication tokens to all requests:
        </p>
        <CodeBlock code={authInterceptor} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Token Refresh</h2>
        <p className="mt-4 text-slate-400">
          Automatically refresh expired tokens and retry failed requests:
        </p>
        <CodeBlock code={refreshToken} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Logging</h2>
        <p className="mt-4 text-slate-400">
          Log all requests and responses for debugging:
        </p>
        <CodeBlock code={loggingInterceptor} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Data Transformation</h2>
        <p className="mt-4 text-slate-400">
          Transform response data before it reaches your application:
        </p>
        <CodeBlock code={transformData} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Removing Interceptors</h2>
        <p className="mt-4 text-slate-400">
          Remove interceptors when they're no longer needed:
        </p>
        <CodeBlock code={removeInterceptor} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Order of Execution</h2>
        <p className="mt-4 text-slate-400">
          Request interceptors run in order added, response interceptors run in reverse order:
        </p>
        <CodeBlock code={orderOfExecution} language="typescript" />
      </section>
    </div>
  )
}
