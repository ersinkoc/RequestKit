import { useState, useEffect } from 'react'
import { Copy, Check, FileCode } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'

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

  useEffect(() => {
    Prism.highlightAll()
  }, [code])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = code.trim().split('\n')

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
        <pre className={`language-${language} !m-0 !rounded-none !bg-transparent`}>
          <code className={`language-${language} font-mono`}>
            {showLineNumbers ? (
              <div className="flex">
                <div className="flex flex-col pr-4 text-right text-slate-500">
                  {lines.map((_, i) => (
                    <span key={i} className="select-none">
                      {i + 1}
                    </span>
                  ))}
                </div>
                <div>{code.trim()}</div>
              </div>
            ) : (
              code.trim()
            )}
          </code>
        </pre>
      </div>
    </div>
  )
}
