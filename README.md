# RequestKit

<div align="center">

![RequestKit Logo](website/public/logo.svg)

**Zero-dependency HTTP client built on native fetch**

[![npm version](https://img.shields.io/npm/v/@oxog/requestkit.svg)](https://www.npmjs.com/package/@oxog/requestkit)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@oxog/requestkit)](https://bundlephobia.com/package/@oxog/requestkit)
[![license](https://img.shields.io/npm/l/@oxog/requestkit.svg)](LICENSE)

[Documentation](https://oxog.github.io/requestkit) | [Examples](https://oxog.github.io/requestkit/examples) | [Playground](https://oxog.github.io/requestkit/playground)

</div>

## Features

- **Zero Dependencies** - Built entirely on native fetch API
- **TypeScript First** - Full type safety with excellent DX
- **Interceptors** - Request/response interceptors like axios
- **Automatic Retry** - Configurable retry with exponential backoff
- **Request Cancellation** - Cancel tokens and AbortController support
- **Progress Tracking** - Upload and download progress callbacks
- **React Hooks** - Built-in useQuery, useMutation, useInfiniteQuery
- **Tiny Bundle** - < 4KB core, < 6KB with React adapter (gzipped)

## Installation

```bash
npm install @oxog/requestkit

# or with yarn
yarn add @oxog/requestkit

# or with pnpm
pnpm add @oxog/requestkit
```

## Quick Start

```typescript
import { createClient } from '@oxog/requestkit'

// Create a client instance
const api = createClient({
  baseURL: 'https://api.example.com',
})

// Make requests
const users = await api.get<User[]>('/users')
const user = await api.post<User>('/users', { name: 'John' })
```

## Configuration

```typescript
const api = createClient({
  baseURL: 'https://api.example.com/v1',
  headers: {
    'Authorization': 'Bearer token',
  },
  timeout: 10000,
  retry: {
    limit: 3,
    delay: 1000,
    backoff: 'exponential',
  },
})
```

## Interceptors

```typescript
// Request interceptor
api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    'X-Request-Id': crypto.randomUUID(),
  }
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## React Integration

```tsx
import { createClient } from '@oxog/requestkit'
import { RequestProvider, useQuery } from '@oxog/requestkit/react'

const client = createClient({
  baseURL: 'https://api.example.com',
})

function App() {
  return (
    <RequestProvider client={client}>
      <UserList />
    </RequestProvider>
  )
}

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
}
```

## Available Hooks

### useQuery

Fetch data on component mount with automatic refetching.

```tsx
const { data, loading, error, refetch } = useQuery<User[]>('/users', {
  enabled: true,
  onSuccess: (data) => console.log('Fetched:', data),
})
```

### useMutation

Execute mutations with loading states.

```tsx
const { mutate, mutateAsync, loading } = useMutation<User, CreateUserInput>(
  (input) => client.post('/users', input),
  { onSuccess: (user) => console.log('Created:', user) }
)
```

### useInfiniteQuery

Fetch paginated data with infinite scroll.

```tsx
const { data, hasNextPage, fetchNextPage } = useInfiniteQuery<Page>(
  (cursor) => `/items?cursor=${cursor}`,
  { getNextPageParam: (page) => page.nextCursor }
)
```

## Error Handling

```typescript
import { isRequestError } from '@oxog/requestkit'

try {
  await api.get('/users/999')
} catch (error) {
  if (isRequestError(error)) {
    console.log('Status:', error.status)
    console.log('Data:', error.data)
  }
}
```

## Request Cancellation

```typescript
import { CancelToken } from '@oxog/requestkit'

const source = CancelToken.source()

api.get('/data', { cancelToken: source.token })

// Cancel the request
source.cancel('Operation canceled')
```

## Progress Tracking

```typescript
await api.post('/upload', formData, {
  onUploadProgress: (progress) => {
    console.log(`${progress.percent}% uploaded`)
  },
})
```

## API Reference

### createClient(config)

Creates a new HTTP client instance.

| Option | Type | Description |
|--------|------|-------------|
| `baseURL` | `string` | Base URL for all requests |
| `headers` | `Record<string, string>` | Default headers |
| `timeout` | `number` | Request timeout in ms |
| `retry` | `RetryConfig` | Retry configuration |
| `validateStatus` | `(status: number) => boolean` | Custom status validation |
| `responseType` | `'json' \| 'text' \| 'blob' \| 'arraybuffer'` | Response type |

### HTTP Methods

```typescript
api.get<T>(url, options?)
api.post<T>(url, data?, options?)
api.put<T>(url, data?, options?)
api.patch<T>(url, data?, options?)
api.delete<T>(url, options?)
api.head<T>(url, options?)
api.options<T>(url, options?)
```

### RetryConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `limit` | `number` | - | Max retry attempts |
| `delay` | `number` | - | Initial delay in ms |
| `backoff` | `'linear' \| 'exponential'` | `'exponential'` | Backoff strategy |
| `retryOn` | `number[]` | `[408, 429, 500, 502, 503, 504]` | Status codes to retry |
| `maxDelay` | `number` | - | Maximum delay cap |

## Browser Support

RequestKit works in all modern browsers that support the fetch API:

- Chrome 42+
- Firefox 39+
- Safari 10.1+
- Edge 14+

For older browsers, you may need a fetch polyfill.

## License

MIT
