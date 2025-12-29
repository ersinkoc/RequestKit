import { useState } from 'react'
import CodeBlock from '../components/CodeBlock'

export default function Playground() {
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [selectedExample, setSelectedExample] = useState('basic')

  const examples: Record<string, { title: string; code: string }> = {
    basic: {
      title: 'Basic GET Request',
      code: `// Basic GET request
const response = await fetch('https://jsonplaceholder.typicode.com/users/1')
const user = await response.json()
console.log('User:', JSON.stringify(user, null, 2))`,
    },
    post: {
      title: 'POST Request',
      code: `// POST request with JSON body
const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Hello World',
    body: 'This is a test post',
    userId: 1,
  }),
})
const post = await response.json()
console.log('Created:', JSON.stringify(post, null, 2))`,
    },
    params: {
      title: 'Query Parameters',
      code: `// GET request with query parameters
const params = new URLSearchParams({
  _limit: '5',
  _page: '1',
})
const response = await fetch(\`https://jsonplaceholder.typicode.com/posts?\${params}\`)
const posts = await response.json()
console.log('Posts:', JSON.stringify(posts, null, 2))`,
    },
    error: {
      title: 'Error Handling',
      code: `// Error handling
try {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts/999999')
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`)
  }
  const data = await response.json()
  console.log('Data:', data)
} catch (error) {
  console.error('Error:', error.message)
}`,
    },
  }

  const runCode = async () => {
    setLoading(true)
    setOutput('')

    const logs: string[] = []
    const originalLog = console.log
    const originalError = console.error

    console.log = (...args) => {
      logs.push(args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '))
    }
    console.error = (...args) => {
      logs.push('ERROR: ' + args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '))
    }

    try {
      const code = examples[selectedExample]?.code ?? ''
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
      const fn = new AsyncFunction(code)
      await fn()
    } catch (error) {
      logs.push(`Error: ${(error as Error).message}`)
    } finally {
      console.log = originalLog
      console.error = originalError
      setOutput(logs.join('\n'))
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">Playground</h1>
      <p className="mt-4 text-slate-400">
        Try RequestKit patterns directly in your browser using the JSONPlaceholder API.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {Object.entries(examples).map(([key, example]) => (
          <button
            key={key}
            onClick={() => setSelectedExample(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedExample === key
                ? 'bg-primary-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {example.title}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">Code</h2>
          <div className="rounded-lg bg-slate-900 p-4">
            <CodeBlock
              code={examples[selectedExample]?.code ?? ''}
              language="typescript"
            />
            <button
              onClick={runCode}
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">Output</h2>
          <div className="min-h-[300px] rounded-lg bg-slate-900 p-4">
            <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap">
              {output || 'Click "Run Code" to see the output'}
            </pre>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">How RequestKit Works</h2>
        <p className="mt-4 text-slate-400">
          The examples above show raw fetch API calls. With RequestKit, you get a cleaner API:
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-medium text-white">Without RequestKit</h3>
            <CodeBlock
              code={`const response = await fetch(
  'https://api.example.com/users/1',
  {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token',
    },
  }
)
if (!response.ok) {
  throw new Error('Request failed')
}
const user = await response.json()`}
              language="typescript"
            />
          </div>
          <div>
            <h3 className="mb-2 text-lg font-medium text-white">With RequestKit</h3>
            <CodeBlock
              code={`const api = createClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer token',
  },
})

const user = await api.get('/users/1')`}
              language="typescript"
            />
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Key Benefits</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <li className="rounded-lg bg-slate-800/50 p-4">
            <h3 className="font-semibold text-white">Automatic JSON</h3>
            <p className="mt-2 text-sm text-slate-400">
              Request and response bodies are automatically serialized/parsed
            </p>
          </li>
          <li className="rounded-lg bg-slate-800/50 p-4">
            <h3 className="font-semibold text-white">Error Handling</h3>
            <p className="mt-2 text-sm text-slate-400">
              Non-2xx responses throw typed errors with status and data
            </p>
          </li>
          <li className="rounded-lg bg-slate-800/50 p-4">
            <h3 className="font-semibold text-white">Interceptors</h3>
            <p className="mt-2 text-sm text-slate-400">
              Add auth tokens, logging, or transforms globally
            </p>
          </li>
          <li className="rounded-lg bg-slate-800/50 p-4">
            <h3 className="font-semibold text-white">Retry Logic</h3>
            <p className="mt-2 text-sm text-slate-400">
              Built-in retry with exponential backoff
            </p>
          </li>
          <li className="rounded-lg bg-slate-800/50 p-4">
            <h3 className="font-semibold text-white">TypeScript</h3>
            <p className="mt-2 text-sm text-slate-400">
              Full type safety for requests and responses
            </p>
          </li>
          <li className="rounded-lg bg-slate-800/50 p-4">
            <h3 className="font-semibold text-white">React Hooks</h3>
            <p className="mt-2 text-sm text-slate-400">
              useQuery, useMutation, useInfiniteQuery included
            </p>
          </li>
        </ul>
      </section>
    </div>
  )
}
