import CodeBlock from '../components/CodeBlock'

const authExample = `import { createClient } from '@oxog/requestkit'

const api = createClient({
  baseURL: 'https://api.example.com',
})

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: \`Bearer \${token}\`,
    }
  }
  return config
})

// Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Login function
async function login(email: string, password: string) {
  const { accessToken, refreshToken } = await api.post('/auth/login', {
    email,
    password,
  })
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}

// Protected API call
async function getProfile() {
  return api.get('/auth/me')
}`

const fileUploadExample = `import { createClient } from '@oxog/requestkit'

const api = createClient({
  baseURL: 'https://api.example.com',
})

async function uploadFile(file: File, onProgress: (percent: number) => void) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', file.name)

  return api.post('/upload', formData, {
    onUploadProgress: (progress) => {
      onProgress(progress.percent)
    },
  })
}

// React component example
function FileUploader() {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await uploadFile(file, setProgress)
      alert('Upload complete!')
    } catch (error) {
      alert('Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div>
      <input type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <progress value={progress} max={100} />}
    </div>
  )
}`

const paginationExample = `import { useInfiniteQuery } from '@oxog/requestkit/react'

interface Post {
  id: number
  title: string
  body: string
}

interface PostsPage {
  posts: Post[]
  nextPage?: number
  totalPages: number
}

function PostsList() {
  const {
    data,
    loading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery<PostsPage>(
    (cursor) => \`/posts?page=\${cursor || 1}&limit=10\`,
    {
      getNextPageParam: (lastPage) =>
        lastPage.nextPage ? String(lastPage.nextPage) : undefined,
    }
  )

  if (loading) return <div>Loading posts...</div>
  if (error) return <div>Error: {error.message}</div>

  const allPosts = data?.flatMap(page => page.posts) ?? []

  return (
    <div>
      {allPosts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.body}</p>
        </article>
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load More Posts'}
        </button>
      )}
    </div>
  )
}`

const crudExample = `import { createClient } from '@oxog/requestkit'
import { useQuery, useMutation } from '@oxog/requestkit/react'

interface Todo {
  id: number
  title: string
  completed: boolean
}

const api = createClient({ baseURL: 'https://api.example.com' })

// CRUD operations
const todoApi = {
  getAll: () => api.get<Todo[]>('/todos'),
  getOne: (id: number) => api.get<Todo>(\`/todos/\${id}\`),
  create: (data: Omit<Todo, 'id'>) => api.post<Todo>('/todos', data),
  update: (id: number, data: Partial<Todo>) => api.patch<Todo>(\`/todos/\${id}\`, data),
  delete: (id: number) => api.delete(\`/todos/\${id}\`),
}

// React component
function TodoApp() {
  const { data: todos, refetch } = useQuery<Todo[]>('/todos')

  const createMutation = useMutation<Todo, { title: string }>(
    (data) => todoApi.create({ ...data, completed: false }),
    { onSuccess: () => refetch() }
  )

  const toggleMutation = useMutation<Todo, { id: number; completed: boolean }>(
    ({ id, completed }) => todoApi.update(id, { completed }),
    { onSuccess: () => refetch() }
  )

  const deleteMutation = useMutation<void, number>(
    (id) => todoApi.delete(id),
    { onSuccess: () => refetch() }
  )

  const handleCreate = async (title: string) => {
    await createMutation.mutateAsync({ title })
  }

  return (
    <div>
      <form onSubmit={(e) => {
        e.preventDefault()
        const input = e.currentTarget.elements.namedItem('title') as HTMLInputElement
        handleCreate(input.value)
        input.value = ''
      }}>
        <input name="title" placeholder="New todo" />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos?.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleMutation.mutate({
                id: todo.id,
                completed: !todo.completed
              })}
            />
            <span>{todo.title}</span>
            <button onClick={() => deleteMutation.mutate(todo.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}`

const cancelExample = `import { createClient, CancelToken } from '@oxog/requestkit'

const api = createClient({ baseURL: 'https://api.example.com' })

// Cancel on component unmount
function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState([])

  useEffect(() => {
    const source = CancelToken.source()

    api.get('/search', {
      params: { q: query },
      cancelToken: source.token,
    })
      .then(setResults)
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') {
          console.error('Search failed:', error)
        }
      })

    // Cancel previous request when query changes
    return () => source.cancel('Query changed')
  }, [query])

  return <ul>{results.map(r => <li key={r.id}>{r.title}</li>)}</ul>
}

// Cancel with AbortController
async function fetchWithAbort() {
  const controller = new AbortController()

  // Cancel after 5 seconds
  setTimeout(() => controller.abort(), 5000)

  try {
    return await api.get('/data', { signal: controller.signal })
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request was aborted')
    }
    throw error
  }
}`

const errorBoundaryExample = `import { useQuery, isRequestError } from '@oxog/requestkit/react'

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

// Error fallback with typed errors
function ErrorFallback({ error }: { error: Error }) {
  if (isRequestError(error)) {
    switch (error.status) {
      case 404:
        return <NotFound />
      case 403:
        return <Forbidden />
      case 500:
        return <ServerError />
      default:
        return <GenericError message={error.message} />
    }
  }
  return <GenericError message={error.message} />
}

// Usage
function App() {
  return (
    <ErrorBoundary>
      <UserProfile userId={123} />
    </ErrorBoundary>
  )
}`

export default function Examples() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">Examples</h1>
      <p className="mt-4 text-slate-400">
        Real-world examples showing common patterns and use cases with RequestKit.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Authentication</h2>
        <p className="mt-4 text-slate-400">
          Complete authentication setup with token management and automatic redirects:
        </p>
        <CodeBlock code={authExample} language="typescript" filename="auth.ts" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">File Upload with Progress</h2>
        <p className="mt-4 text-slate-400">
          Upload files with progress tracking:
        </p>
        <CodeBlock code={fileUploadExample} language="tsx" filename="FileUploader.tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Infinite Scroll Pagination</h2>
        <p className="mt-4 text-slate-400">
          Implement infinite scroll with <code className="text-primary-400">useInfiniteQuery</code>:
        </p>
        <CodeBlock code={paginationExample} language="tsx" filename="PostsList.tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">CRUD Operations</h2>
        <p className="mt-4 text-slate-400">
          Complete CRUD implementation with React hooks:
        </p>
        <CodeBlock code={crudExample} language="tsx" filename="TodoApp.tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Request Cancellation</h2>
        <p className="mt-4 text-slate-400">
          Cancel requests when components unmount or queries change:
        </p>
        <CodeBlock code={cancelExample} language="tsx" filename="SearchResults.tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Error Boundaries</h2>
        <p className="mt-4 text-slate-400">
          Handle errors with React error boundaries:
        </p>
        <CodeBlock code={errorBoundaryExample} language="tsx" filename="ErrorBoundary.tsx" />
      </section>
    </div>
  )
}
