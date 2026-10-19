import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useClassesQuery, useCreateClass, useDeleteClasses } from '@/features/classes/api/useClasses'
import { API } from '@/test/handlers'
import { renderHookWithQuery } from '@/test/renderHookWithQuery'
import { server } from '@/test/server'

const apiClass = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  name: `Class ${id}`,
  code: `CODE${id}X`,
  description: null,
  status: 'ACTIVE',
  start_at: '2026-01-01',
  end_date: '2026-06-30',
  ...overrides,
})

describe('useClassesQuery', () => {
  it('loads every page and maps the API shape to the app shape', async () => {
    server.use(
      http.get(`${API}/classes`, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'))
        return HttpResponse.json({
          data: page === 1 ? [apiClass(1, { status: 'INACTIVE', description: 'Intro' })] : [apiClass(2)],
          meta: { last_page: 2 },
        })
      }),
    )
    const { result } = renderHookWithQuery(() => useClassesQuery())

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      {
        id: '1',
        name: 'Class 1',
        description: 'Intro',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        status: 'inactive',
        code: 'CODE1X',
      },
      expect.objectContaining({ id: '2', description: '', status: 'active' }),
    ])
  })

  it('a response that breaks the contract is an INVALID_RESPONSE error, not bad data', async () => {
    server.use(http.get(`${API}/classes`, () => HttpResponse.json({ data: [{ id: 'x' }], meta: { last_page: 1 } })))
    const { result } = renderHookWithQuery(() => useClassesQuery())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('a server failure is an error the page can show with a retry', async () => {
    server.use(http.get(`${API}/classes`, () => HttpResponse.json({ message: 'boom' }, { status: 500 })))
    const { result } = renderHookWithQuery(() => useClassesQuery())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({ status: 500, messageKey: 'errors.server' })
  })
})

describe('class mutations', () => {
  it('creating a class sends the API field names and refreshes the list', async () => {
    let listCalls = 0
    let body: unknown
    server.use(
      http.get(`${API}/classes`, () => {
        listCalls += 1
        return HttpResponse.json({ data: [], meta: { last_page: 1 } })
      }),
      http.post(`${API}/classes`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: apiClass(7) }, { status: 201 })
      }),
    )
    const { result } = renderHookWithQuery(() => ({ list: useClassesQuery(), create: useCreateClass() }))
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    await act(() =>
      result.current.create.mutateAsync({
        name: 'Math',
        description: 'Algebra',
        startDate: '2026-02-01',
        endDate: '2026-07-01',
        status: 'active',
      }),
    )

    expect(body).toEqual({
      name: 'Math',
      description: 'Algebra',
      start_at: '2026-02-01',
      end_date: '2026-07-01',
      status: 'ACTIVE',
    })
    await waitFor(() => expect(listCalls).toBe(2))
  })

  it('a 422 on create keeps the field errors for the form', async () => {
    server.use(
      http.post(`${API}/classes`, () =>
        HttpResponse.json({ message: 'The name has already been taken.', errors: { name: ['taken'] } }, { status: 422 }),
      ),
    )
    const { result } = renderHookWithQuery(() => useCreateClass())

    await act(async () => {
      await result.current
        .mutateAsync({ name: 'Math', description: '', startDate: '2026-02-01', endDate: '2026-07-01', status: 'active' })
        .catch(() => undefined)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({ status: 422, fieldErrors: { name: ['taken'] } })
  })

  it('deleting several classes still deletes the rest when one fails, then reports the failure', async () => {
    const deleted: string[] = []
    server.use(
      http.delete(`${API}/classes/:id`, ({ params }) => {
        if (params.id === '2') return HttpResponse.json({ message: 'no' }, { status: 403 })
        deleted.push(String(params.id))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { result } = renderHookWithQuery(() => useDeleteClasses())

    await act(async () => {
      await result.current.mutateAsync(['1', '2', '3']).catch(() => undefined)
    })

    expect(deleted.sort()).toEqual(['1', '3'])
    await waitFor(() => expect(result.current.error).toMatchObject({ status: 403 }))
  })
})
