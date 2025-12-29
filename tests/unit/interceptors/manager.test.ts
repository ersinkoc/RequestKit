import { describe, it, expect, vi } from 'vitest'
import {
  InterceptorManagerImpl,
  createInterceptorManager,
} from '../../../src/interceptors/manager'

describe('Interceptor Manager', () => {
  describe('InterceptorManagerImpl', () => {
    it('should add interceptors with use()', () => {
      const manager = new InterceptorManagerImpl<string>()
      const id = manager.use((value) => value.toUpperCase())

      expect(typeof id).toBe('number')
      expect(manager.size).toBe(1)
    })

    it('should return incremental IDs', () => {
      const manager = new InterceptorManagerImpl<string>()
      const id1 = manager.use((v) => v)
      const id2 = manager.use((v) => v)
      const id3 = manager.use((v) => v)

      expect(id1).toBe(0)
      expect(id2).toBe(1)
      expect(id3).toBe(2)
    })

    it('should remove interceptors with eject()', () => {
      const manager = new InterceptorManagerImpl<string>()
      const id = manager.use((v) => v)

      expect(manager.size).toBe(1)

      manager.eject(id)

      expect(manager.size).toBe(0)
    })

    it('should clear all interceptors', () => {
      const manager = new InterceptorManagerImpl<string>()
      manager.use((v) => v)
      manager.use((v) => v)
      manager.use((v) => v)

      expect(manager.size).toBe(3)

      manager.clear()

      expect(manager.size).toBe(0)
    })

    it('should iterate with forEach()', () => {
      const manager = new InterceptorManagerImpl<number>()
      const fn1 = vi.fn((v: number) => v * 2)
      const fn2 = vi.fn((v: number) => v + 1)

      manager.use(fn1)
      manager.use(fn2)

      const handlers: Array<{ fulfilled?: (v: number) => number }> = []
      manager.forEach((handler) => handlers.push(handler))

      expect(handlers).toHaveLength(2)
      expect(handlers[0]?.fulfilled).toBe(fn1)
      expect(handlers[1]?.fulfilled).toBe(fn2)
    })

    it('should get handlers array with getHandlers()', () => {
      const manager = new InterceptorManagerImpl<number>()
      const fn = (v: number) => v

      manager.use(fn)

      const handlers = manager.getHandlers()

      expect(handlers).toHaveLength(1)
      expect(handlers[0]?.fulfilled).toBe(fn)
    })

    it('should store both fulfilled and rejected handlers', () => {
      const manager = new InterceptorManagerImpl<string>()
      const fulfilled = (v: string) => v
      const rejected = (e: Error) => { throw e }

      manager.use(fulfilled, rejected)

      const handlers = manager.getHandlers()
      expect(handlers[0]?.fulfilled).toBe(fulfilled)
      expect(handlers[0]?.rejected).toBe(rejected)
    })

    it('should handle undefined handlers', () => {
      const manager = new InterceptorManagerImpl<string>()
      manager.use(undefined, undefined)

      const handlers = manager.getHandlers()
      expect(handlers[0]?.fulfilled).toBeUndefined()
      expect(handlers[0]?.rejected).toBeUndefined()
    })

    it('should handle eject of non-existent ID', () => {
      const manager = new InterceptorManagerImpl<string>()
      manager.use((v) => v)

      // Should not throw
      expect(() => manager.eject(999)).not.toThrow()
      expect(manager.size).toBe(1)
    })
  })

  describe('createInterceptorManager', () => {
    it('should create a new InterceptorManagerImpl', () => {
      const manager = createInterceptorManager<string>()
      expect(manager).toBeInstanceOf(InterceptorManagerImpl)
    })
  })
})
