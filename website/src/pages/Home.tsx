import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  RefreshCw,
  Shield,
  Box,
  Code2,
  Timer,
  XCircle,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import CodeBlock from '../components/CodeBlock'

const features = [
  {
    icon: Zap,
    title: 'Native Fetch',
    description: 'Built on the standard Fetch API for maximum compatibility',
  },
  {
    icon: RefreshCw,
    title: 'Auto Retry',
    description: 'Automatic retry with exponential backoff for failed requests',
  },
  {
    icon: Shield,
    title: 'Interceptors',
    description: 'Request and response interceptors for authentication and logging',
  },
  {
    icon: Timer,
    title: 'Timeout',
    description: 'Configurable request timeout with AbortController support',
  },
  {
    icon: XCircle,
    title: 'Cancellation',
    description: 'Cancel pending requests with ease using AbortController',
  },
  {
    icon: BarChart3,
    title: 'Progress',
    description: 'Track upload and download progress for file operations',
  },
  {
    icon: Box,
    title: 'Zero Dependencies',
    description: 'No runtime dependencies - completely standalone',
  },
  {
    icon: Code2,
    title: 'TypeScript',
    description: 'Full TypeScript support with strict mode and generics',
  },
]

const comparison = [
  { feature: 'Bundle Size', requestkit: '< 4KB', axios: '~13KB', ky: '~6KB' },
  { feature: 'Dependencies', requestkit: '0', axios: '2', ky: '0' },
  { feature: 'TypeScript', requestkit: 'Native', axios: 'Types', ky: 'Native' },
  { feature: 'React Hooks', requestkit: 'Built-in', axios: 'External', ky: 'External' },
  { feature: 'Tree Shaking', requestkit: 'Yes', axios: 'Partial', ky: 'Yes' },
]

const quickStart = `import { createClient } from '@oxog/requestkit'

const api = createClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retry: 3,
})

// GET request
const users = await api.get<User[]>('/users')

// POST request
const user = await api.post<User>('/users', { name: 'Ersin' })

// With interceptors
api.interceptors.request.use((config) => {
  config.headers.set('Authorization', \`Bearer \${token}\`)
  return config
})`

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-1 text-sm font-medium text-primary-500 ring-1 ring-primary-500/20">
                <Zap className="h-4 w-4" />
                Under 4KB • Zero Dependencies
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Modern HTTP Client for{' '}
              <span className="text-primary-500">JavaScript</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Zero-dependency HTTP client built on native fetch with interceptors,
              automatic retry, progress tracking, and React hooks. The lightweight
              alternative to axios.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/docs/getting-started" className="btn-primary">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="https://github.com/ersinkoc/requestkit"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                View on GitHub
              </a>
            </div>

            {/* Install command */}
            <div className="mt-10">
              <div className="mx-auto max-w-md overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2">
                  <span className="font-mono text-sm text-slate-400">npm</span>
                </div>
                <div className="p-4 font-mono text-sm text-green-400">
                  npm install @oxog/requestkit
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-700 py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white">
              Everything You Need
            </h2>
            <p className="mt-4 text-slate-400">
              All the features you expect from a modern HTTP client
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
              >
                <feature.icon className="h-10 w-10 text-primary-500" />
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="border-t border-slate-700 py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white">
              How It Compares
            </h2>
            <p className="mt-4 text-slate-400">
              See how RequestKit stacks up against popular alternatives
            </p>
          </motion.div>

          <div className="mt-16 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary-500">
                    RequestKit
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">
                    axios
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">
                    ky
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-slate-700/50">
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-primary-500">
                      {row.requestkit}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-400">
                      {row.axios}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-400">
                      {row.ky}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="border-t border-slate-700 py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white">
              Quick Start
            </h2>
            <p className="mt-4 text-slate-400">
              Get up and running in seconds
            </p>
          </motion.div>

          <div className="mx-auto mt-10 max-w-3xl">
            <CodeBlock
              code={quickStart}
              language="typescript"
              filename="api.ts"
            />
          </div>

          <div className="mt-10 text-center">
            <Link to="/docs/getting-started" className="btn-primary">
              Read the Docs <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
