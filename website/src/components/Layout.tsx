import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Github, Moon, Sun, ChevronRight } from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Docs', href: '/docs/getting-started' },
  { name: 'Examples', href: '/examples' },
  { name: 'Playground', href: '/playground' },
]

const docsNav = [
  { name: 'Getting Started', href: '/docs/getting-started' },
  { name: 'Client Instance', href: '/docs/client-instance' },
  { name: 'HTTP Methods', href: '/docs/http-methods' },
  { name: 'Interceptors', href: '/docs/interceptors' },
  { name: 'Retry Logic', href: '/docs/retry-logic' },
  { name: 'Error Handling', href: '/docs/error-handling' },
  { name: 'React Hooks', href: '/docs/react-hooks' },
  { name: 'API Reference', href: '/docs/api-reference' },
]

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const location = useLocation()
  const isDocsPage = location.pathname.startsWith('/docs')

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
        <nav className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="RequestKit" className="h-8 w-8" />
              <span className="text-xl font-bold text-white">RequestKit</span>
            </Link>

            <div className="hidden md:flex md:gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === item.href ||
                    (item.href !== '/' && location.pathname.startsWith(item.href))
                      ? 'text-primary-500'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <a
              href="https://github.com/ersinkoc/requestkit"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <Github className="h-5 w-5" />
            </a>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-64 bg-slate-800 p-6">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <nav className="mt-8 space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-lg font-medium text-slate-300 hover:text-white"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex">
        {/* Sidebar for docs */}
        {isDocsPage && (
          <aside className="hidden w-64 shrink-0 border-r border-slate-700 lg:block">
            <nav className="sticky top-16 p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Documentation
              </h3>
              <ul className="space-y-2">
                {docsNav.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        location.pathname === item.href
                          ? 'bg-primary-500/10 text-primary-500'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        {/* Page content */}
        <main className={`flex-1 ${isDocsPage ? 'max-w-4xl' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8">
        <div className="container text-center text-sm text-slate-400">
          <p>MIT License - {new Date().getFullYear()} Ersin KOC</p>
          <p className="mt-2">
            <a
              href="https://github.com/ersinkoc/requestkit"
              className="text-primary-500 hover:underline"
            >
              GitHub
            </a>
            {' | '}
            <a
              href="https://www.npmjs.com/package/@oxog/requestkit"
              className="text-primary-500 hover:underline"
            >
              NPM
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
