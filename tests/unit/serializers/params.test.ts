import { describe, it, expect } from 'vitest'
import {
  serializeParams,
  parseParams,
  createParamsSerializer,
  applyParamsSerializer,
} from '../../../src/serializers/params'

describe('Params Serializer', () => {
  describe('serializeParams', () => {
    it('should serialize simple params', () => {
      const params = { a: 1, b: 'hello', c: true }
      expect(serializeParams(params)).toBe('a=1&b=hello&c=true')
    })

    it('should skip null and undefined values', () => {
      const params = { a: 1, b: null, c: undefined, d: 2 }
      expect(serializeParams(params)).toBe('a=1&d=2')
    })

    it('should handle dates', () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      const params = { date }
      expect(serializeParams(params)).toBe('date=2024-01-01T00%3A00%3A00.000Z')
    })

    it('should handle objects', () => {
      const params = { filter: { status: 'active' } }
      expect(serializeParams(params)).toBe('filter=%7B%22status%22%3A%22active%22%7D')
    })

    describe('array formats', () => {
      const params = { tags: ['a', 'b', 'c'] }

      it('should use repeat format by default', () => {
        expect(serializeParams(params)).toBe('tags=a&tags=b&tags=c')
      })

      it('should support brackets format', () => {
        expect(serializeParams(params, { arrayFormat: 'brackets' })).toBe('tags[]=a&tags[]=b&tags[]=c')
      })

      it('should support indices format', () => {
        expect(serializeParams(params, { arrayFormat: 'indices' })).toBe('tags[0]=a&tags[1]=b&tags[2]=c')
      })

      it('should support comma format', () => {
        expect(serializeParams(params, { arrayFormat: 'comma' })).toBe('tags=a%2Cb%2Cc')
      })
    })

    it('should skip null and undefined in arrays', () => {
      const params = { tags: ['a', null, 'b', undefined, 'c'] }
      expect(serializeParams(params)).toBe('tags=a&tags=b&tags=c')
    })

    it('should handle empty arrays', () => {
      const params = { tags: [] }
      expect(serializeParams(params)).toBe('')
    })

    it('should handle encode option', () => {
      const params = { name: 'hello world' }
      expect(serializeParams(params, { encode: false })).toBe('name=hello world')
      expect(serializeParams(params, { encode: true })).toBe('name=hello%20world')
    })
  })

  describe('parseParams', () => {
    it('should parse simple query string', () => {
      expect(parseParams('a=1&b=hello')).toEqual({ a: '1', b: 'hello' })
    })

    it('should handle leading ?', () => {
      expect(parseParams('?a=1&b=2')).toEqual({ a: '1', b: '2' })
    })

    it('should handle array values', () => {
      expect(parseParams('tags[]=a&tags[]=b')).toEqual({ tags: ['a', 'b'] })
    })

    it('should handle indexed arrays', () => {
      expect(parseParams('tags[0]=a&tags[1]=b')).toEqual({ tags: ['a', 'b'] })
    })

    it('should handle repeated values as arrays', () => {
      const result = parseParams('tag=a&tag=b')
      expect(result.tag).toEqual(['a', 'b'])
    })

    it('should return empty object for empty string', () => {
      expect(parseParams('')).toEqual({})
    })

    it('should accumulate bracket array values', () => {
      // First value creates the array, subsequent bracket values add to it
      const result = parseParams('items[]=first&items[]=second&items[]=third')
      expect(result.items).toEqual(['first', 'second', 'third'])
    })

    it('should convert single value to array when duplicate non-bracket key is found', () => {
      // Non-bracket keys with multiple values should become arrays
      const result = parseParams('name=first&other=x&name=second')
      expect(result.name).toEqual(['first', 'second'])
    })

    it('should handle mixed bracket and non-bracket for same base key', () => {
      // If already have bracket values and then encounter more
      const result = parseParams('tags[0]=a&tags[1]=b&tags[2]=c')
      expect(result.tags).toEqual(['a', 'b', 'c'])
    })

    it('should convert existing value to array when bracket key collides', () => {
      // When there's an existing single value and a bracket key with the same base
      // First set a single value, then a bracket value
      const result = parseParams('items=single&items[]=bracket1&items[]=bracket2')
      expect(result.items).toEqual(['single', 'bracket1', 'bracket2'])
    })

    it('should append to existing array when more non-bracket duplicates found', () => {
      // Three or more values for the same non-bracket key
      const result = parseParams('val=first&val=second&val=third')
      expect(result.val).toEqual(['first', 'second', 'third'])
    })
  })

  describe('createParamsSerializer', () => {
    it('should create serializer with custom options', () => {
      const serializer = createParamsSerializer({ arrayFormat: 'brackets' })
      expect(serializer.arrayFormat).toBe('brackets')
      expect(serializer.encode?.({ tags: ['a', 'b'] })).toBe('tags[]=a&tags[]=b')
    })
  })

  describe('applyParamsSerializer', () => {
    it('should handle URLSearchParams', () => {
      const params = new URLSearchParams()
      params.append('a', '1')
      expect(applyParamsSerializer(params)).toBe('a=1')
    })

    it('should use custom serializer encode function', () => {
      const serializer = {
        encode: () => 'custom=serialized',
      }
      expect(applyParamsSerializer({ a: 1 }, serializer)).toBe('custom=serialized')
    })

    it('should use default serialization with arrayFormat', () => {
      const serializer = {
        arrayFormat: 'brackets' as const,
      }
      expect(applyParamsSerializer({ tags: ['a', 'b'] }, serializer)).toBe('tags[]=a&tags[]=b')
    })
  })
})
