import CodeBlock from '../../components/CodeBlock'

const installCode = `npm install @oxog/requestkit

# or with yarn
yarn add @oxog/requestkit

# or with pnpm
pnpm add @oxog/requestkit`

const basicUsage = `import { createClient } from '@oxog/requestkit'

// Create a client instance
const api = createClient({
  baseURL: 'https://api.example.com',
})

// Make a GET request
const users = await api.get<User[]>('/users')

// Make a POST request
const newUser = await api.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com',
})`

const withConfig = `import { createClient } from '@oxog/requestkit'

const api = createClient({
  // Base URL for all requests
  baseURL: 'https://api.example.com/v1',

  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': '1.0',
  },

  // Request timeout (ms)
  timeout: 10000,

  // Retry failed requests
  retry: {
    limit: 3,
    delay: 1000,
    backoff: 'exponential',
  },

  // Custom status validation
  validateStatus: (status) => status >= 200 && status < 400,
})`

const reactUsage = `import { createClient } from '@oxog/requestkit'
import { RequestProvider, useQuery } from '@oxog/requestkit/react'

// Create client
const client = createClient({
  baseURL: 'https://api.example.com',
})

// Wrap your app
function App() {
  return (
    <RequestProvider client={client}>
      <UserList />
    </RequestProvider>
  )
}

// Use hooks in components
function UserList() {
  const { data, loading, error } = useQuery<User[]>('/users')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}`

export default function GettingStarted() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">Getting Started</h1>
      <p className="mt-4 text-slate-400">
        RequestKit is a zero-dependency HTTP client built on native fetch. It provides
        interceptors, automatic retry, progress tracking, and React hooks out of the box.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Installation</h2>
        <p className="mt-4 text-slate-400">
          Install RequestKit using your preferred package manager:
        </p>
        <CodeBlock code={installCode} language="bash" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Basic Usage</h2>
        <p className="mt-4 text-slate-400">
          Create a client instance and start making requests:
        </p>
        <CodeBlock code={basicUsage} language="typescript" filename="api.ts" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Configuration</h2>
        <p className="mt-4 text-slate-400">
          Configure your client with default settings:
        </p>
        <CodeBlock code={withConfig} language="typescript" filename="api.ts" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">React Integration</h2>
        <p className="mt-4 text-slate-400">
          RequestKit includes React hooks for easy data fetching:
        </p>
        <CodeBlock code={reactUsage} language="tsx" filename="App.tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Next Steps</h2>
        <ul className="mt-4 space-y-2 text-slate-400">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Learn about the <a href="/docs/client-instance" className="text-primary-500 hover:underline">client instance</a>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Explore <a href="/docs/http-methods" className="text-primary-500 hover:underline">HTTP methods</a>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Set up <a href="/docs/interceptors" className="text-primary-500 hover:underline">interceptors</a>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Configure <a href="/docs/retry-logic" className="text-primary-500 hover:underline">retry logic</a>
          </li>
        </ul>
      </section>
    </div>
  )
}
