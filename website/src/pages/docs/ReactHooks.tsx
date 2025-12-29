import CodeBlock from '../../components/CodeBlock'

const providerSetup = `import { createClient, RequestProvider } from '@oxog/requestkit/react'

const client = createClient({
  baseURL: 'https://api.example.com',
})

function App() {
  return (
    <RequestProvider client={client}>
      <YourApp />
    </RequestProvider>
  )
}`

const useQueryBasic = `import { useQuery } from '@oxog/requestkit/react'

interface User {
  id: number
  name: string
  email: string
}

function UserList() {
  const { data, loading, error, refetch } = useQuery<User[]>('/users')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {data?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}`

const useQueryOptions = `// Conditional fetching
const { data } = useQuery<User>(\`/users/\${userId}\`, {
  enabled: !!userId, // Only fetch when userId exists
})

// URL function (useful for conditional queries)
const { data } = useQuery<User>(() => userId ? \`/users/\${userId}\` : null)

// Custom fetch options
const { data } = useQuery<User[]>('/users', {
  params: { role: 'admin' },
  headers: { 'X-Custom': 'value' },
})

// Callbacks
const { data } = useQuery<User[]>('/users', {
  onSuccess: (data) => console.log('Fetched:', data.length),
  onError: (error) => console.error('Failed:', error),
})`

const useMutationBasic = `import { useMutation } from '@oxog/requestkit/react'

interface CreateUserInput {
  name: string
  email: string
}

function CreateUserForm() {
  const { mutate, mutateAsync, loading, error, data } = useMutation<User, CreateUserInput>(
    (input) => client.post('/users', input)
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    // Option 1: Fire and forget
    mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    })

    // Option 2: Await result
    try {
      const user = await mutateAsync({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
      })
      console.log('Created:', user)
    } catch (err) {
      console.error('Failed:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" />
      <input name="email" placeholder="Email" />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  )
}`

const useMutationOptions = `const { mutate } = useMutation<User, CreateUserInput>(
  (input) => client.post('/users', input),
  {
    onSuccess: (data, variables) => {
      console.log('Created user:', data.name)
      // Invalidate and refetch
      queryClient.invalidateQueries('/users')
    },
    onError: (error, variables) => {
      console.error('Failed to create:', variables.name)
    },
    onSettled: (data, error, variables) => {
      // Called regardless of success or error
      console.log('Mutation finished')
    },
  }
)`

const useInfiniteQueryBasic = `import { useInfiniteQuery } from '@oxog/requestkit/react'

interface Page {
  items: User[]
  nextCursor?: string
}

function InfiniteUserList() {
  const {
    data,
    loading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery<Page>(
    (cursor) => \`/users?cursor=\${cursor || ''}\`,
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  return (
    <div>
      {data?.map((page, i) => (
        <div key={i}>
          {page.items.map(user => (
            <div key={user.id}>{user.name}</div>
          ))}
        </div>
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  )
}`

const useRequestBasic = `import { useRequest } from '@oxog/requestkit/react'

function DataFetcher() {
  // Manual mode - doesn't fetch automatically
  const { data, loading, execute, reset } = useRequest<User>(
    '/users/1',
    { manual: true }
  )

  return (
    <div>
      <button onClick={() => execute()}>Fetch User</button>
      <button onClick={() => reset()}>Reset</button>
      {loading && <div>Loading...</div>}
      {data && <div>{data.name}</div>}
    </div>
  )
}`

const useClientHook = `import { useClient } from '@oxog/requestkit/react'

function CustomFetcher() {
  const client = useClient()

  const handleClick = async () => {
    // Direct access to client methods
    const user = await client.get<User>('/users/1')
    const created = await client.post<User>('/users', { name: 'New' })
  }

  return <button onClick={handleClick}>Fetch</button>
}`

const typeSafeHooks = `// All hooks are fully typed

interface User {
  id: number
  name: string
}

interface CreateUserInput {
  name: string
  email: string
}

// useQuery returns typed data
const { data } = useQuery<User[]>('/users')
// data is User[] | undefined

// useMutation is typed for both input and output
const { mutate } = useMutation<User, CreateUserInput>(
  (input) => client.post('/users', input)
)
// mutate accepts CreateUserInput, returns User

// useInfiniteQuery with typed pages
interface Page {
  items: User[]
  nextCursor?: string
}

const { data } = useInfiniteQuery<Page>(
  (cursor) => \`/users?cursor=\${cursor}\`,
  { getNextPageParam: (page) => page.nextCursor }
)
// data is Page[] | undefined`

export default function ReactHooks() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">React Hooks</h1>
      <p className="mt-4 text-slate-400">
        RequestKit provides React hooks for easy data fetching with automatic loading states,
        error handling, and TypeScript support.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Provider Setup</h2>
        <p className="mt-4 text-slate-400">
          Wrap your app with <code className="text-primary-400">RequestProvider</code>:
        </p>
        <CodeBlock code={providerSetup} language="tsx" filename="App.tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">useQuery</h2>
        <p className="mt-4 text-slate-400">
          Fetch data on component mount with automatic refetching:
        </p>
        <CodeBlock code={useQueryBasic} language="tsx" />
        <h3 className="mt-8 text-xl font-semibold text-white">Options</h3>
        <CodeBlock code={useQueryOptions} language="tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">useMutation</h2>
        <p className="mt-4 text-slate-400">
          Execute mutations (POST, PUT, DELETE) with loading states:
        </p>
        <CodeBlock code={useMutationBasic} language="tsx" />
        <h3 className="mt-8 text-xl font-semibold text-white">Callbacks</h3>
        <CodeBlock code={useMutationOptions} language="tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">useInfiniteQuery</h2>
        <p className="mt-4 text-slate-400">
          Fetch paginated data with infinite scroll support:
        </p>
        <CodeBlock code={useInfiniteQueryBasic} language="tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">useRequest</h2>
        <p className="mt-4 text-slate-400">
          Low-level hook for manual request control:
        </p>
        <CodeBlock code={useRequestBasic} language="tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">useClient</h2>
        <p className="mt-4 text-slate-400">
          Access the client instance directly:
        </p>
        <CodeBlock code={useClientHook} language="tsx" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Type Safety</h2>
        <p className="mt-4 text-slate-400">
          All hooks support TypeScript generics for full type safety:
        </p>
        <CodeBlock code={typeSafeHooks} language="tsx" />
      </section>
    </div>
  )
}
