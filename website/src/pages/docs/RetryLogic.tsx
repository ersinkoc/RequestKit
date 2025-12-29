import CodeBlock from '../../components/CodeBlock'

const basicRetry = `import { createClient } from '@oxog/requestkit'

const api = createClient({
  baseURL: 'https://api.example.com',
  retry: {
    limit: 3,        // Maximum number of retry attempts
    delay: 1000,     // Initial delay between retries (ms)
  },
})`

const retryConfig = `interface RetryConfig {
  // Maximum number of retry attempts
  limit: number

  // Initial delay between retries in milliseconds
  delay: number

  // Backoff strategy: 'linear' or 'exponential'
  // linear: delay stays constant (1000, 1000, 1000)
  // exponential: delay doubles each time (1000, 2000, 4000)
  backoff?: 'linear' | 'exponential'

  // HTTP status codes that should trigger a retry
  // Default: [408, 429, 500, 502, 503, 504]
  retryOn?: number[]

  // Maximum delay between retries (caps exponential growth)
  maxDelay?: number
}`

const exponentialBackoff = `const api = createClient({
  baseURL: 'https://api.example.com',
  retry: {
    limit: 5,
    delay: 1000,
    backoff: 'exponential',
  },
})

// Retry delays: 1000ms, 2000ms, 4000ms, 8000ms, 16000ms`

const linearBackoff = `const api = createClient({
  baseURL: 'https://api.example.com',
  retry: {
    limit: 3,
    delay: 2000,
    backoff: 'linear',
  },
})

// Retry delays: 2000ms, 2000ms, 2000ms`

const customRetryOn = `const api = createClient({
  baseURL: 'https://api.example.com',
  retry: {
    limit: 3,
    delay: 1000,
    // Only retry on these status codes
    retryOn: [429, 503, 504],
  },
})

// Default retryOn includes:
// 408 - Request Timeout
// 429 - Too Many Requests
// 500 - Internal Server Error
// 502 - Bad Gateway
// 503 - Service Unavailable
// 504 - Gateway Timeout`

const perRequestRetry = `const api = createClient({
  baseURL: 'https://api.example.com',
  // Default retry config
  retry: {
    limit: 2,
    delay: 1000,
  },
})

// Override retry for specific request
const data = await api.get('/important-data', {
  retry: {
    limit: 5,
    delay: 500,
    backoff: 'exponential',
  },
})

// Disable retry for specific request
const quickCheck = await api.get('/health', {
  retry: { limit: 0 },
})`

const maxDelay = `const api = createClient({
  baseURL: 'https://api.example.com',
  retry: {
    limit: 10,
    delay: 1000,
    backoff: 'exponential',
    maxDelay: 30000, // Cap delay at 30 seconds
  },
})

// Without maxDelay: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s
// With maxDelay=30s: 1s, 2s, 4s, 8s, 16s, 30s, 30s, 30s, 30s, 30s`

const rateLimiting = `const api = createClient({
  baseURL: 'https://api.example.com',
  retry: {
    limit: 5,
    delay: 1000,
    backoff: 'exponential',
    retryOn: [429], // Rate limit responses
  },
})

// The 429 status with Retry-After header will be respected
// if the server sends one`

const networkErrors = `// Network errors (no response) are automatically retried
// This includes:
// - Connection refused
// - DNS resolution failures
// - Network timeouts
// - Connection reset

const api = createClient({
  baseURL: 'https://api.example.com',
  retry: {
    limit: 3,
    delay: 2000,
    backoff: 'exponential',
  },
  timeout: 5000,
})

// If the request times out or network fails,
// it will be retried according to the config`

export default function RetryLogic() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">Retry Logic</h1>
      <p className="mt-4 text-slate-400">
        RequestKit provides automatic retry with configurable backoff strategies for handling
        transient failures and rate limiting.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Basic Configuration</h2>
        <p className="mt-4 text-slate-400">
          Enable retry with a simple configuration:
        </p>
        <CodeBlock code={basicRetry} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Configuration Options</h2>
        <p className="mt-4 text-slate-400">
          Full retry configuration interface:
        </p>
        <CodeBlock code={retryConfig} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Exponential Backoff</h2>
        <p className="mt-4 text-slate-400">
          Exponential backoff doubles the delay between each retry:
        </p>
        <CodeBlock code={exponentialBackoff} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Linear Backoff</h2>
        <p className="mt-4 text-slate-400">
          Linear backoff uses a constant delay between retries:
        </p>
        <CodeBlock code={linearBackoff} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Custom Retry Conditions</h2>
        <p className="mt-4 text-slate-400">
          Specify which HTTP status codes should trigger a retry:
        </p>
        <CodeBlock code={customRetryOn} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Per-Request Override</h2>
        <p className="mt-4 text-slate-400">
          Override retry configuration for specific requests:
        </p>
        <CodeBlock code={perRequestRetry} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Maximum Delay</h2>
        <p className="mt-4 text-slate-400">
          Cap exponential growth with a maximum delay:
        </p>
        <CodeBlock code={maxDelay} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Rate Limiting</h2>
        <p className="mt-4 text-slate-400">
          Handle rate limiting (429) responses gracefully:
        </p>
        <CodeBlock code={rateLimiting} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Network Errors</h2>
        <p className="mt-4 text-slate-400">
          Network errors are automatically retried:
        </p>
        <CodeBlock code={networkErrors} language="typescript" />
      </section>
    </div>
  )
}
