import { describe, it, expect } from 'vitest'
import {
  deepMerge,
  shallowMerge,
  deepClone,
  pick,
  omit,
} from '../../../src/utils/merge'

describe('Merge Utilities', () => {
  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const a = { x: 1, nested: { a: 1 } }
      const b = { y: 2, nested: { b: 2 } }
      const result = deepMerge(a, b)

      expect(result).toEqual({
        x: 1,
        y: 2,
        nested: { a: 1, b: 2 },
      })
    })

    it('should override primitive values', () => {
      const a = { x: 1 }
      const b = { x: 2 }
      expect(deepMerge(a, b)).toEqual({ x: 2 })
    })

    it('should replace arrays', () => {
      const a = { arr: [1, 2] }
      const b = { arr: [3, 4, 5] }
      expect(deepMerge(a, b)).toEqual({ arr: [3, 4, 5] })
    })

    it('should handle undefined sources', () => {
      const a = { x: 1 }
      expect(deepMerge(a, undefined)).toEqual({ x: 1 })
      expect(deepMerge(undefined, a)).toEqual({ x: 1 })
    })

    it('should handle multiple sources', () => {
      const a = { a: 1 }
      const b = { b: 2 }
      const c = { c: 3 }
      expect(deepMerge(a, b, c)).toEqual({ a: 1, b: 2, c: 3 })
    })

    it('should not mutate original objects', () => {
      const a = { nested: { x: 1 } }
      const b = { nested: { y: 2 } }
      deepMerge(a, b)

      expect(a).toEqual({ nested: { x: 1 } })
      expect(b).toEqual({ nested: { y: 2 } })
    })
  })

  describe('shallowMerge', () => {
    it('should merge objects shallowly', () => {
      const a = { x: 1, nested: { a: 1 } }
      const b = { y: 2, nested: { b: 2 } }
      const result = shallowMerge(a, b)

      expect(result).toEqual({
        x: 1,
        y: 2,
        nested: { b: 2 },
      })
    })

    it('should handle undefined sources', () => {
      const a = { x: 1 }
      expect(shallowMerge(a, undefined)).toEqual({ x: 1 })
    })

    it('should skip undefined values', () => {
      const a = { x: 1 }
      const b = { x: undefined, y: 2 }
      expect(shallowMerge(a, b)).toEqual({ x: 1, y: 2 })
    })
  })

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42)
      expect(deepClone('hello')).toBe('hello')
      expect(deepClone(null)).toBe(null)
      expect(deepClone(undefined)).toBe(undefined)
    })

    it('should clone arrays', () => {
      const arr = [1, 2, [3, 4]]
      const cloned = deepClone(arr)

      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[2]).not.toBe(arr[2])
    })

    it('should clone objects', () => {
      const obj = { a: 1, nested: { b: 2 } }
      const cloned = deepClone(obj)

      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.nested).not.toBe(obj.nested)
    })

    it('should clone Date objects', () => {
      const date = new Date('2024-01-01')
      const cloned = deepClone(date)

      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
    })

    it('should clone Map objects', () => {
      const map = new Map([['a', 1], ['b', 2]])
      const cloned = deepClone(map)

      expect(cloned.get('a')).toBe(1)
      expect(cloned).not.toBe(map)
    })

    it('should clone Set objects', () => {
      const set = new Set([1, 2, 3])
      const cloned = deepClone(set)

      expect(cloned.has(1)).toBe(true)
      expect(cloned).not.toBe(set)
    })

    it('should clone Headers objects', () => {
      const headers = new Headers({ 'Content-Type': 'application/json' })
      const cloned = deepClone(headers)

      expect(cloned.get('Content-Type')).toBe('application/json')
      expect(cloned).not.toBe(headers)
    })
  })

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 }
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
    })

    it('should handle missing keys', () => {
      const obj = { a: 1 }
      expect(pick(obj, ['a', 'b' as keyof typeof obj])).toEqual({ a: 1 })
    })
  })

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 }
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 })
    })

    it('should handle missing keys', () => {
      const obj = { a: 1, b: 2 }
      expect(omit(obj, ['c' as keyof typeof obj])).toEqual({ a: 1, b: 2 })
    })
  })
})
