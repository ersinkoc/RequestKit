# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [1.0.0] - 2025-12-29

### Added

- Initial release of RequestKit
- **Core HTTP Client**
  - All standard HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
  - Factory pattern with `createClient()`
  - Configurable base URL, headers, and defaults
  - Request and response interceptors
  - Custom status validation
- **Retry Logic**
  - Automatic retry with configurable limits
  - Linear and exponential backoff strategies
  - Configurable retry conditions and status codes
  - `onRetry` callback for monitoring
- **Request Cancellation**
  - CancelToken pattern (Axios-compatible)
  - Native AbortController support
  - `cancelable` option for automatic abort controller
- **Progress Tracking**
  - Upload progress via `onUploadProgress`
  - Download progress via `onDownloadProgress`
- **TypeScript Support**
  - Full type definitions
  - Strict mode compatible
  - Generic response types
- **React Adapter** (`@oxog/requestkit/react`)
  - `RequestProvider` - Context provider
  - `useClient` - Access client instance
  - `useRequest` - Manual request execution
  - `useQuery` - Auto-fetching with caching
  - `useMutation` - Mutation handling
  - `useInfiniteQuery` - Paginated/infinite scroll
- **Serializers**
  - Query parameter serialization (brackets, repeat, comma formats)
  - Automatic JSON body serialization
  - FormData and URLSearchParams support
- **Utilities**
  - URL utilities (combineURLs, parseURL, isAbsoluteURL)
  - Deep merge and clone helpers
  - Type guards for common types
- **Documentation**
  - Comprehensive README
  - Documentation website with interactive playground

### Technical Details

- Zero runtime dependencies
- Built on native Fetch API
- ESM and CommonJS dual package
- Tree-shakeable exports
- Bundle size: ~20KB core, ~6.5KB React adapter (uncompressed)
- 355 tests with full coverage
