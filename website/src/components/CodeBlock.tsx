import { useState, useEffect, useRef } from 'react'
import { Copy, Check, FileCode } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
}

export default function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current.querySelector('code')!)
    }
  }, [code, language])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-6 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      {/* Header */}
      {filename && (
        <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
          <FileCode className="h-4 w-4 text-slate-400" />
          <span className="font-mono text-sm text-slate-400">{filename}</span>
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={copyToClipboard}
        className="absolute right-3 top-3 rounded-lg bg-slate-700 p-2 text-slate-400 opacity-0 transition-opacity hover:bg-slate-600 hover:text-white group-hover:opacity-100"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre
          ref={codeRef}
          className={`language-${language} !m-0 !rounded-none !bg-transparent ${showLineNumbers ? 'line-numbers' : ''}`}
        >
          <code className={`language-${language} font-mono`}>
            {code.trim()}
          </code>
        </pre>
      </div>
    </div>
  )
}
