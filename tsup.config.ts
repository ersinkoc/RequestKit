import { defineConfig } from 'tsup'

export default defineConfig([
  // Main package
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: true,
    treeshake: true,
    splitting: false,
    outDir: 'dist',
  },
  // React adapter
  {
    entry: ['src/adapters/react/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    minify: true,
    treeshake: true,
    splitting: false,
    outDir: 'dist/react',
    external: ['react', 'react-dom'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
    },
  },
])
