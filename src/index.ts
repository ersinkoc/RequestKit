/**
 * RequestKit - Zero-dependency HTTP client built on native fetch
 *
 * @packageDocumentation
 */

// ============ MAIN EXPORT ============
export { createClient } from './core/client.js'

// ============ TYPES ============
export type {
  // HTTP
  HttpMethod,
  ResponseType,
  ErrorCode,

  // Config
  ClientConfig,
  RequestOptions,
  RetryConfig,
  ParamsSerializer,

  // Progress
  Progress,
  ProgressCallback,

  // Transform
  TransformFn,

  // Hooks
  RequestHook,
  ResponseHook,
  ErrorHook,

  // Internal
  InternalRequestConfig,

  // Response
  RequestResponse,
  RequestError,

  // Interceptors
  InterceptorManager,
  InterceptorHandler,
  Interceptors,

  // Client
  RequestClient,

  // Cancelable
  CancelableRequest,
  CancelToken as CancelTokenInterface,
  CancelTokenSource,
  Cancel,

  // React Hooks (types only)
  UseRequestOptions,
  UseRequestResult,
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from './types.js'

// ============ ERROR UTILITIES ============
export {
  isRequestError,
  isNetworkError,
  isTimeoutError,
  isCancelError,
  isClientError,
  isServerError,
  createError,
} from './core/error.js'

// ============ URL UTILITIES ============
export {
  buildURL,
  combineURLs,
  isAbsoluteURL,
  parseURL,
  getOrigin,
  isSameOrigin,
} from './utils/url.js'

// ============ PARAMS UTILITIES ============
export {
  serializeParams,
  parseParams,
  createParamsSerializer,
} from './serializers/params.js'

// ============ HEADERS UTILITIES ============
export {
  mergeHeaders,
  normalizeHeaders,
  parseHeaders,
  getHeader,
  hasHeader,
  ContentTypes,
  isJSONContentType,
  isTextContentType,
} from './serializers/headers.js'

// ============ BODY UTILITIES ============
export {
  getContentType,
  objectToFormData,
  objectToURLSearchParams,
} from './serializers/body.js'

// ============ TYPE GUARDS ============
export {
  isFormData,
  isBlob,
  isFile,
  isArrayBuffer,
  isArrayBufferView,
  isURLSearchParams,
  isStream,
  isPlainObject,
  isFunction,
  isString,
  isNumber,
  isUndefined,
  isNullOrUndefined,
  isDate,
  isBoolean,
  isArray,
  isObject,
  isHeaders,
  isRequest,
  isResponse,
  isAbortSignal,
} from './utils/is.js'

// ============ CANCEL UTILITIES ============
export {
  CancelToken,
  isCancel,
} from './features/cancel.js'

// ============ MERGE UTILITIES ============
export {
  deepMerge,
  shallowMerge,
  deepClone,
  pick,
  omit,
} from './utils/merge.js'

// ============ DELAY UTILITIES ============
export {
  delay,
  abortableDelay,
} from './utils/delay.js'
