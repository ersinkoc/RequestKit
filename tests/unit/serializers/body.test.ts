import { describe, it, expect } from 'vitest'
import {
  serializeBody,
  getContentType,
  objectToFormData,
  objectToURLSearchParams,
  shouldHaveBody,
} from '../../../src/serializers/body'

describe('Body Serializer', () => {
  describe('getContentType', () => {
    it('should return undefined for FormData', () => {
      expect(getContentType(new FormData())).toBeUndefined()
    })

    it('should return blob type for Blob', () => {
      expect(getContentType(new Blob(['test'], { type: 'text/plain' }))).toBe('text/plain')
      expect(getContentType(new Blob(['test']))).toBe('application/octet-stream')
    })

    it('should return urlencoded for URLSearchParams', () => {
      expect(getContentType(new URLSearchParams())).toBe('application/x-www-form-urlencoded;charset=UTF-8')
    })

    it('should return octet-stream for ArrayBuffer', () => {
      expect(getContentType(new ArrayBuffer(8))).toBe('application/octet-stream')
    })

    it('should return text/plain for strings', () => {
      expect(getContentType('hello')).toBe('text/plain;charset=UTF-8')
    })

    it('should return application/json for objects', () => {
      expect(getContentType({ a: 1 })).toBe('application/json;charset=UTF-8')
      expect(getContentType([1, 2, 3])).toBe('application/json;charset=UTF-8')
    })

    it('should return undefined for unknown types', () => {
      // Number, boolean, etc. are not handled types
      expect(getContentType(123)).toBeUndefined()
      expect(getContentType(true)).toBeUndefined()
      expect(getContentType(null)).toBeUndefined()
    })
  })

  describe('objectToFormData', () => {
    it('should convert object to FormData', () => {
      const formData = objectToFormData({ name: 'test', age: 25 })
      expect(formData.get('name')).toBe('test')
      expect(formData.get('age')).toBe('25')
    })

    it('should handle nested objects', () => {
      const formData = objectToFormData({ user: { name: 'test' } })
      expect(formData.get('user[name]')).toBe('test')
    })

    it('should handle arrays', () => {
      const formData = objectToFormData({ tags: ['a', 'b'] })
      expect(formData.get('tags[]')).toBe('a')
    })

    it('should skip null and undefined', () => {
      const formData = objectToFormData({ a: 1, b: null, c: undefined })
      expect(formData.get('a')).toBe('1')
      expect(formData.has('b')).toBe(false)
      expect(formData.has('c')).toBe(false)
    })

    it('should handle File objects', () => {
      const file = new File(['content'], 'test.txt')
      const formData = objectToFormData({ file })
      expect(formData.get('file')).toBeInstanceOf(File)
    })

    it('should handle Blob objects', () => {
      const blob = new Blob(['content'])
      const formData = objectToFormData({ blob })
      expect(formData.get('blob')).toBeInstanceOf(Blob)
    })

    it('should handle array of Files', () => {
      const file1 = new File(['content1'], 'file1.txt')
      const file2 = new File(['content2'], 'file2.txt')
      const formData = objectToFormData({ files: [file1, file2] })
      expect(formData.get('files[0]')).toBeInstanceOf(File)
      expect(formData.get('files[1]')).toBeInstanceOf(File)
    })

    it('should handle array of Blobs', () => {
      const blob1 = new Blob(['content1'])
      const blob2 = new Blob(['content2'])
      const formData = objectToFormData({ blobs: [blob1, blob2] })
      expect(formData.get('blobs[0]')).toBeInstanceOf(Blob)
      expect(formData.get('blobs[1]')).toBeInstanceOf(Blob)
    })

    it('should handle array of nested objects', () => {
      const formData = objectToFormData({ items: [{ name: 'item1' }, { name: 'item2' }] })
      expect(formData.get('items[0][name]')).toBe('item1')
      expect(formData.get('items[1][name]')).toBe('item2')
    })
  })

  describe('objectToURLSearchParams', () => {
    it('should convert object to URLSearchParams', () => {
      const params = objectToURLSearchParams({ a: 1, b: 'hello' })
      expect(params.get('a')).toBe('1')
      expect(params.get('b')).toBe('hello')
    })

    it('should handle arrays', () => {
      const params = objectToURLSearchParams({ tags: ['a', 'b'] })
      expect(params.getAll('tags')).toEqual(['a', 'b'])
    })

    it('should skip null and undefined', () => {
      const params = objectToURLSearchParams({ a: 1, b: null, c: undefined })
      expect(params.get('a')).toBe('1')
      expect(params.has('b')).toBe(false)
      expect(params.has('c')).toBe(false)
    })
  })

  describe('serializeBody', () => {
    it('should handle json option', () => {
      const { body, contentType } = serializeBody({ json: { a: 1 } })
      expect(body).toBe('{"a":1}')
      expect(contentType).toBe('application/json;charset=UTF-8')
    })

    it('should handle form option with FormData', () => {
      const formData = new FormData()
      formData.append('name', 'test')
      const { body, contentType } = serializeBody({ form: formData })
      expect(body).toBe(formData)
      expect(contentType).toBeUndefined()
    })

    it('should handle form option with object as FormData', () => {
      const { body, contentType } = serializeBody({ form: { name: 'test' } })
      expect(body).toBeInstanceOf(FormData)
      expect(contentType).toBeUndefined()
    })

    it('should handle form option with urlencoded content-type', () => {
      const { body, contentType } = serializeBody({
        form: { name: 'test' },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      expect(body).toBeInstanceOf(URLSearchParams)
      expect(contentType).toBe('application/x-www-form-urlencoded;charset=UTF-8')
    })

    it('should handle form option with array headers format', () => {
      const { body, contentType } = serializeBody({
        form: { name: 'test' },
        headers: [['Content-Type', 'application/x-www-form-urlencoded']],
      })
      expect(body).toBeInstanceOf(URLSearchParams)
      expect(contentType).toBe('application/x-www-form-urlencoded;charset=UTF-8')
    })

    it('should handle form option with Headers instance', () => {
      const headers = new Headers()
      headers.set('Content-Type', 'application/x-www-form-urlencoded')
      const { body, contentType } = serializeBody({
        form: { name: 'test' },
        headers,
      })
      expect(body).toBeInstanceOf(URLSearchParams)
      expect(contentType).toBe('application/x-www-form-urlencoded;charset=UTF-8')
    })

    it('should handle raw body - string', () => {
      const { body, contentType } = serializeBody({ body: 'raw text' })
      expect(body).toBe('raw text')
      expect(contentType).toBe('text/plain;charset=UTF-8')
    })

    it('should handle raw body - Blob', () => {
      const blob = new Blob(['content'], { type: 'text/plain' })
      const { body, contentType } = serializeBody({ body: blob })
      expect(body).toBe(blob)
      expect(contentType).toBe('text/plain')
    })

    it('should handle raw body - plain object', () => {
      const { body, contentType } = serializeBody({ body: { a: 1 } })
      expect(body).toBe('{"a":1}')
      expect(contentType).toBe('application/json;charset=UTF-8')
    })

    it('should return undefined for no body', () => {
      const { body, contentType } = serializeBody({})
      expect(body).toBeUndefined()
      expect(contentType).toBeUndefined()
    })

    it('should handle unknown body type by stringifying', () => {
      // Use a Symbol which is an unknown type that will be stringified
      const unknownValue = Symbol.for('test')
      const { body, contentType } = serializeBody({ body: unknownValue as unknown as BodyInit })
      expect(body).toBe('Symbol(test)')
      expect(contentType).toBe('text/plain;charset=UTF-8')
    })

    it('should handle raw body - ReadableStream', () => {
      const stream = new ReadableStream()
      const { body, contentType } = serializeBody({ body: stream })
      expect(body).toBe(stream)
      expect(contentType).toBe('application/octet-stream')
    })

    it('should handle raw body - ArrayBuffer', () => {
      const buffer = new ArrayBuffer(8)
      const { body, contentType } = serializeBody({ body: buffer })
      expect(body).toBe(buffer)
      expect(contentType).toBe('application/octet-stream')
    })

    it('should handle raw body - Uint8Array', () => {
      const array = new Uint8Array(8)
      const { body, contentType } = serializeBody({ body: array })
      expect(body).toBe(array)
      expect(contentType).toBe('application/octet-stream')
    })

    it('should handle raw body - FormData', () => {
      const formData = new FormData()
      formData.append('test', 'value')
      const { body, contentType } = serializeBody({ body: formData })
      expect(body).toBe(formData)
      expect(contentType).toBeUndefined() // Browser sets boundary
    })

    it('should handle raw body - URLSearchParams', () => {
      const params = new URLSearchParams({ a: '1' })
      const { body, contentType } = serializeBody({ body: params })
      expect(body).toBe(params)
      expect(contentType).toBe('application/x-www-form-urlencoded;charset=UTF-8')
    })
  })

  describe('shouldHaveBody', () => {
    it('should return false for GET and HEAD', () => {
      expect(shouldHaveBody('GET')).toBe(false)
      expect(shouldHaveBody('HEAD')).toBe(false)
      expect(shouldHaveBody('get')).toBe(false)
      expect(shouldHaveBody('head')).toBe(false)
    })

    it('should return true for other methods', () => {
      expect(shouldHaveBody('POST')).toBe(true)
      expect(shouldHaveBody('PUT')).toBe(true)
      expect(shouldHaveBody('PATCH')).toBe(true)
      expect(shouldHaveBody('DELETE')).toBe(true)
    })
  })
})
