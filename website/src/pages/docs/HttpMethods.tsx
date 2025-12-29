import CodeBlock from '../../components/CodeBlock'

const getRequest = `import { createClient } from '@oxog/requestkit'

const api = createClient({ baseURL: 'https://api.example.com' })

// Simple GET request
const users = await api.get<User[]>('/users')

// GET with query parameters
const filteredUsers = await api.get<User[]>('/users', {
  params: {
    role: 'admin',
    active: true,
    page: 1,
    limit: 10,
  },
})
// Results in: /users?role=admin&active=true&page=1&limit=10

// GET with array parameters
const multiFilter = await api.get('/users', {
  params: {
    ids: [1, 2, 3],
  },
  paramsArrayFormat: 'brackets', // ids[]=1&ids[]=2&ids[]=3
})`

const postRequest = `// POST with JSON body
const newUser = await api.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com',
})

// POST with custom headers
const result = await api.post('/upload/json', data, {
  headers: {
    'X-Custom-Header': 'value',
  },
})

// POST with FormData
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('name', 'document.pdf')

const uploaded = await api.post('/upload', formData)`

const putPatchRequest = `// PUT - Replace entire resource
await api.put<User>('/users/1', {
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'admin',
})

// PATCH - Partial update
await api.patch<User>('/users/1', {
  role: 'admin',
})`

const deleteRequest = `// Simple DELETE
await api.delete('/users/1')

// DELETE with body (rare but supported)
await api.delete('/users/batch', {
  data: {
    ids: [1, 2, 3],
  },
})`

const headOptions = `// HEAD - Get headers only (no body)
const headers = await api.head('/users')
// Useful for checking if resource exists or getting metadata

// OPTIONS - Get allowed methods
const options = await api.options('/users')
// Returns CORS preflight information`

const genericRequest = `// Using the generic request method
const result = await api.request<User>('/users/1', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
  },
  timeout: 5000,
})

// Useful for dynamic method selection
const method = condition ? 'POST' : 'PUT'
await api.request('/resource', {
  method,
  data: payload,
})`

const responseTypes = `// JSON response (default)
const json = await api.get<User>('/users/1')

// Text response
const text = await api.get<string>('/file.txt', {
  responseType: 'text',
})

// Blob response
const blob = await api.get<Blob>('/image.png', {
  responseType: 'blob',
})

// ArrayBuffer response
const buffer = await api.get<ArrayBuffer>('/binary', {
  responseType: 'arraybuffer',
})`

const typeSafety = `interface User {
  id: number
  name: string
  email: string
}

interface CreateUserInput {
  name: string
  email: string
}

// Fully typed responses
const users = await api.get<User[]>('/users')
// users is typed as User[]

const user = await api.post<User>('/users', {
  name: 'John',
  email: 'john@example.com',
} satisfies CreateUserInput)
// user is typed as User`

export default function HttpMethods() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">HTTP Methods</h1>
      <p className="mt-4 text-slate-400">
        RequestKit provides methods for all standard HTTP verbs with full TypeScript support.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">GET Requests</h2>
        <p className="mt-4 text-slate-400">
          Use GET requests to retrieve data. Query parameters are automatically serialized:
        </p>
        <CodeBlock code={getRequest} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">POST Requests</h2>
        <p className="mt-4 text-slate-400">
          Use POST to create new resources. The body is automatically serialized as JSON:
        </p>
        <CodeBlock code={postRequest} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">PUT & PATCH Requests</h2>
        <p className="mt-4 text-slate-400">
          Use PUT to replace resources entirely, or PATCH for partial updates:
        </p>
        <CodeBlock code={putPatchRequest} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">DELETE Requests</h2>
        <p className="mt-4 text-slate-400">
          Use DELETE to remove resources:
        </p>
        <CodeBlock code={deleteRequest} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">HEAD & OPTIONS</h2>
        <p className="mt-4 text-slate-400">
          HEAD and OPTIONS are useful for metadata and CORS preflight:
        </p>
        <CodeBlock code={headOptions} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Generic Request Method</h2>
        <p className="mt-4 text-slate-400">
          Use the <code className="text-primary-400">request</code> method for dynamic method selection:
        </p>
        <CodeBlock code={genericRequest} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Response Types</h2>
        <p className="mt-4 text-slate-400">
          Control the response format with the <code className="text-primary-400">responseType</code> option:
        </p>
        <CodeBlock code={responseTypes} language="typescript" />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Type Safety</h2>
        <p className="mt-4 text-slate-400">
          All methods support TypeScript generics for fully typed responses:
        </p>
        <CodeBlock code={typeSafety} language="typescript" />
      </section>
    </div>
  )
}
