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

    it('should handle refetch', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ items: [1] }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ items: [2] }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useInfiniteQuery<{ items: number[] }>(
          () => '/items',
          { getNextPageParam: () => undefined }
        ),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data?.[0]?.items).toEqual([1])
      })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.data?.[0]?.items).toEqual([2])
    })

    it('should handle errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Error', { status: 500 })
      )

      const onError = vi.fn()
      const wrapper = createWrapper()

      const { result } = renderHook(
        () => useInfiniteQuery<{ items: number[] }>(
          () => '/items',
          {
            getNextPageParam: () => undefined,
            onError,
          }
        ),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      expect(onError).toHaveBeenCalled()
    })

    it('should call onSuccess callback', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [1, 2] }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const onSuccess = vi.fn()
      const wrapper = createWrapper()

      renderHook(
        () => useInfiniteQuery<{ items: number[] }>(
          () => '/items',
          {
            getNextPageParam: () => undefined,
            onSuccess,
          }
        ),
        { wrapper }
      )

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should not fetch next page when already fetching', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [1], nextCursor: 'abc' }), {
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

      // Mock slow response for next page
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      // Start fetching
      act(() => {
        result.current.fetchNextPage()
      })

      // Try to fetch again - should be blocked
      await act(async () => {
        await result.current.fetchNextPage()
      })

      // Should only have made 2 fetch calls (initial + one next page attempt)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should fetch previous page', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ items: [2], previousCursor: 'prev' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ items: [1] }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useInfiniteQuery<{ items: number[]; previousCursor?: string }>(
          (cursor) => `/items?cursor=${cursor || ''}`,
          {
            getNextPageParam: () => undefined,
            getPreviousPageParam: (page) => page.previousCursor,
          }
        ),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.hasPreviousPage).toBe(true)
      })

      await act(async () => {
        await result.current.fetchPreviousPage()
      })

      expect(result.current.data?.length).toBe(2)
    })

    it('should not fetch previous page when already fetching', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [1], previousCursor: 'prev' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useInfiniteQuery<{ items: number[]; previousCursor?: string }>(
          (cursor) => `/items?cursor=${cursor || ''}`,
          {
            getNextPageParam: () => undefined,
            getPreviousPageParam: (page) => page.previousCursor,
          }
        ),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.hasPreviousPage).toBe(true)
      })

      // Mock slow response for previous page
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      // Start fetching
      act(() => {
        result.current.fetchPreviousPage()
      })

      // Try to fetch again - should be blocked
      await act(async () => {
        await result.current.fetchPreviousPage()
      })

      // Should only have made 2 fetch calls (initial + one previous page attempt)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('useQuery extended', () => {
    it('should handle retry on error', async () => {
      mockFetch
        .mockResolvedValueOnce(new Response('Error', { status: 500 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: 'success' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery<{ data: string }>('/test', { retry: 1 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: 'success' })
      }, { timeout: 5000 })
    })

    it('should call onError callback', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Error', { status: 500 })
      )

      const onError = vi.fn()
      const wrapper = createWrapper()

      const { result } = renderHook(
        () => useQuery('/test', { onError }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      expect(onError).toHaveBeenCalled()
    })

    it('should call onSuccess callback', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const onSuccess = vi.fn()
      const wrapper = createWrapper()

      renderHook(
        () => useQuery<{ id: number }>('/test', { onSuccess }),
        { wrapper }
      )

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({ id: 1 })
      })
    })

    it('should track isStale state', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery('/test', { staleTime: 1000 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Data should not be stale immediately
      expect(result.current.isStale).toBe(false)
    })

    it('should track isFetching state during refetch', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 1 }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 2 }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery<{ id: number }>('/test'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 1 })
      })

      // Trigger refetch and check isFetching
      act(() => {
        result.current.refetch()
      })

      expect(result.current.isFetching).toBe(true)

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 2 })
      })
    })

    it('should refetch on window focus when stale', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 1 }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 2 }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery<{ id: number }>('/test', {
          refetchOnWindowFocus: true,
          staleTime: 0, // immediately stale
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 1 })
      })

      // Trigger window focus event
      act(() => {
        window.dispatchEvent(new Event('focus'))
      })

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 2 })
      })
    })

    it('should refetch on reconnect when stale', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 1 }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 2 }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery<{ id: number }>('/test', {
          refetchOnReconnect: true,
          staleTime: 0,
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 1 })
      })

      // Trigger online event
      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 2 })
      })
    })

    it('should poll at interval', async () => {
      let fetchCount = 0
      mockFetch.mockImplementation(() => {
        fetchCount++
        return Promise.resolve(
          new Response(JSON.stringify({ count: fetchCount }), {
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery<{ count: number }>('/test', {
          refetchInterval: 100,
        }),
        { wrapper }
      )

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data).toEqual({ count: 1 })

      // Wait for polling to trigger at least once more
      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThan(1)
      }, { timeout: 500 })
    })

    it('should not refetch on focus when not stale', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery<{ id: number }>('/test', {
          refetchOnWindowFocus: true,
          staleTime: 60000, // Not stale for 60 seconds
        }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 1 })
      })

      const callCountBefore = mockFetch.mock.calls.length

      // Trigger window focus - should NOT refetch because data is not stale
      act(() => {
        window.dispatchEvent(new Event('focus'))
      })

      // Wait a bit to ensure no additional fetch happens
      await new Promise((r) => setTimeout(r, 50))

      // Should not have made additional calls
      expect(mockFetch.mock.calls.length).toBe(callCountBefore)
    })
  })

  describe('useMutation extended', () => {
    it('should reset mutation state', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createTestClient()
      const wrapper = createWrapper(client)

      const { result } = renderHook(
        () => useMutation<{ id: number }, { name: string }>(
          (data) => client.post('/users', data)
        ),
        { wrapper }
      )

      await act(async () => {
        await result.current.mutateAsync({ name: 'Test' })
      })

      expect(result.current.data).toEqual({ id: 1 })

      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeNull()
    })

    it('should handle mutate with callback', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )

      const client = createTestClient()
      const wrapper = createWrapper(client)
      const onSuccess = vi.fn()

      const { result } = renderHook(
        () => useMutation<{ id: number }, { name: string }>(
          (data) => client.post('/users', data),
          { onSuccess }
        ),
        { wrapper }
      )

      act(() => {
        result.current.mutate({ name: 'Test' })
      })

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 1 })
      })

      expect(onSuccess).toHaveBeenCalledWith({ id: 1 }, { name: 'Test' })
    })
  })

  describe('useRequest extended', () => {
    it('should call onError callback', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Error', { status: 500 })
      )

      const onError = vi.fn()
      const wrapper = createWrapper()

      const { result } = renderHook(
        () => useRequest('/test', { manual: true, onError }),
        { wrapper }
      )

      await act(async () => {
        try {
          await result.current.execute()
        } catch {
          // Expected
        }
      })

      expect(onError).toHaveBeenCalled()
    })

    it('should abort request on unmount', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      const wrapper = createWrapper()
      const { unmount } = renderHook(
        () => useRequest('/test'),
        { wrapper }
      )

      // Unmount while request is pending
      unmount()

      // No assertions needed - just verify no errors
    })
  })

  describe('useQuery edge cases', () => {
    it('should not fetch with empty URL', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery(''),
        { wrapper }
      )

      // Should not be loading with empty URL
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not fetch when enabled is false', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery('/test', { enabled: false }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle refetch with empty URL gracefully', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(
        () => useQuery(''),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Try to refetch with empty URL - should not throw
      await act(async () => {
        await result.current.refetch()
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle cancel errors gracefully', async () => {
      // Make fetch hang indefinitely
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      const wrapper = createWrapper()
      const { result, unmount } = renderHook(
        () => useQuery('/test'),
        { wrapper }
      )

      // Wait for loading state
      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      // Unmount triggers abort which causes cancel error
      unmount()

      // The cancel should be handled without error
    })
  })
})
