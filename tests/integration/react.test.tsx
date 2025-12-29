import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import React from 'react'
import type { ReactNode } from 'react'
import { RequestProvider } from '../../src/adapters/react/provider'
import { useClient } from '../../src/adapters/react/hooks/useClient'
import { useRequest } from '../../src/adapters/react/hooks/useRequest'
import { useQuery } from '../../src/adapters/react/hooks/useQuery'
import { useMutation } from '../../src/adapters/react/hooks/useMutation'
import { useInfiniteQuery } from '../../src/adapters/react/hooks/useInfiniteQuery'
import { createClient } from '../../src/core/client'
import { mockFetch } from '../setup'

// Create test client
const createTestClient = () => createClient({ baseURL: 'https://api.test.com' })

// Wrapper component for hooks
const createWrapper = (client = createTestClient()) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <RequestProvider client={client}>{children}</RequestProvider>
  }
}

describe('React Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('useClient', () => {
    it('should return client from context', () => {
      const client = createTestClient()
      const wrapper = createWrapper(client)

      const { result } = renderHook(() => useClient(), { wrapper })

      expect(result.current).toBe(client)
    })

    it('should throw if used outside provider', () => {
      expect(() => {
        renderHook(() => useClient())
      }).toThrow('useClient must be used within a RequestProvider')
    })
  })

  describe('useRequest', () => {
    it('should execute request manually', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useRequest<{ id: number }>('/users/1', { manual: true }),
        { wrapper }
      )

      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBeUndefined()

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.data).toEqual({ id: 1 })
      expect(result.current.loading).toBe(false)
    })

    it('should auto-execute when not manual', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useRequest<{ id: number }>('/users/1'),
        { wrapper }
      )

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual({ id: 1 })
    })

    it('should handle errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Not found', { status: 404 })
      )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useRequest('/users/999', { manual: true }),
        { wrapper }
      )

      await act(async () => {
        try {
          await result.current.execute()
        } catch {
          // Expected
        }
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error?.status).toBe(404)
    })

    it('should call onSuccess callback', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const onSuccess = vi.fn()
      const wrapper = createWrapper()

      const { result } = renderHook(
        () => useRequest<{ id: number }>('/users/1', { manual: true, onSuccess }),
        { wrapper }
      )

      await act(async () => {
        await result.current.execute()
      })

      expect(onSuccess).toHaveBeenCalledWith({ id: 1 })
    })

    it('should reset state', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useRequest<{ id: number }>('/users/1', { manual: true }),
        { wrapper }
      )

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.data).toEqual({ id: 1 })

      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeNull()
    })
  })

  describe('useQuery', () => {
    it('should fetch data on mount', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ name: 'Test' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery<{ name: string }>('/users/1'),
        { wrapper }
      )

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual({ name: 'Test' })
    })

    it('should not fetch when disabled', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery('/users/1', { enabled: false }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should refetch data', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ count: 1 }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ count: 2 }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery<{ count: number }>('/counter'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toEqual({ count: 1 })
      })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.data).toEqual({ count: 2 })
    })

    it('should handle URL function', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery(() => '/users/1'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual({ id: 1 })
    })

    it('should not fetch when URL function returns null', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery(() => null),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('useMutation', () => {
    it('should execute mutation', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1, name: 'New User' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createTestClient()
      const wrapper = createWrapper(client)

      const { result } = renderHook(
        () => useMutation<{ id: number; name: string }, { name: string }>(
          (data) => client.post('/users', data)
        ),
        { wrapper }
      )

      expect(result.current.loading).toBe(false)

      await act(async () => {
        await result.current.mutateAsync({ name: 'New User' })
      })

      expect(result.current.data).toEqual({ id: 1, name: 'New User' })
    })

    it('should call onSuccess callback', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const onSuccess = vi.fn()
      const client = createTestClient()
      const wrapper = createWrapper(client)

      const { result } = renderHook(
        () => useMutation<{ id: number }, { name: string }>(
          (data) => client.post('/users', data),
          { onSuccess }
        ),
        { wrapper }
      )

      await act(async () => {
        await result.current.mutateAsync({ name: 'Test' })
      })

      expect(onSuccess).toHaveBeenCalledWith({ id: 1 }, { name: 'Test' })
    })

    it('should call onError callback', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Error', { status: 500 })
      )

      const onError = vi.fn()
      const client = createTestClient()
      const wrapper = createWrapper(client)

      const { result } = renderHook(
        () => useMutation<{ id: number }, { name: string }>(
          (data) => client.post('/users', data),
          { onError }
        ),
        { wrapper }
      )

      await act(async () => {
        try {
          await result.current.mutateAsync({ name: 'Test' })
        } catch {
          // Expected
        }
      })

      expect(onError).toHaveBeenCalled()
    })

    it('should call onSettled callback', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const onSettled = vi.fn()
      const client = createTestClient()
      const wrapper = createWrapper(client)

      const { result } = renderHook(
        () => useMutation<{ id: number }, { name: string }>(
          (data) => client.post('/users', data),
          { onSettled }
        ),
        { wrapper }
      )

      await act(async () => {
        await result.current.mutateAsync({ name: 'Test' })
      })

      expect(onSettled).toHaveBeenCalledWith({ id: 1 }, null, { name: 'Test' })
    })
  })

  describe('useInfiniteQuery', () => {
    it('should fetch initial page', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [1, 2, 3], nextCursor: 'abc' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useInfiniteQuery<{ items: number[]; nextCursor?: string }>(
          (cursor) => `/items?cursor=${cursor || ''}`,
          { getNextPageParam: (page) => page.nextCursor }
        ),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0]?.items).toEqual([1, 2, 3])
      expect(result.current.hasNextPage).toBe(true)
    })

    it('should fetch next page', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ items: [1, 2], nextCursor: 'page2' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ items: [3, 4], nextCursor: undefined }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useInfiniteQuery<{ items: number[]; nextCursor?: string }>(
          (cursor) => `/items?cursor=${cursor || ''}`,
          { getNextPageParam: (page) => page.nextCursor }
        ),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.hasNextPage).toBe(true)
      })

      await act(async () => {
        await result.current.fetchNextPage()
      })

      expect(result.current.data).toHaveLength(2)
      expect(result.current.hasNextPage).toBe(false)
    })

    it('should not fetch when disabled', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useInfiniteQuery<{ items: number[] }>(
          () => '/items',
          {
            enabled: false,
            getNextPageParam: () => undefined,
          }
        ),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
