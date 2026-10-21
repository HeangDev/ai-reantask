import type { Assignment } from '@/features/assignments'
import { assignmentsOfClass, buildRoster, summarizeClass } from '@/features/classes/lib/classRoster'
import type { JoinRequest } from '@/features/classes/store/joinRequestsStore'

const iso = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const assignment = (over: Partial<Assignment>): Assignment => ({
  id: 'a',
  title: 'A',
  className: 'Web Development',
  description: '',
  deadline: iso(3),
  status: 'pending',
  maxScore: 100,
  allowedFileTypes: ['PDF'],
  ...over,
})

const member = (id: string, student: string): JoinRequest => ({
  id: `r-${id}`,
  classId: '4',
  studentId: id,
  student,
  status: 'approved',
  createdAt: 0,
})

describe('class roster', () => {
  it('lists only the assignments of the given class', () => {
    const all = [assignment({ id: '1' }), assignment({ id: '2', className: 'Chemistry' })]
    expect(assignmentsOfClass(all, 'Web Development').map((a) => a.id)).toEqual(['1'])
  })

  it('counts what was assigned to and handed in by each student', () => {
    const work = [
      assignment({
        id: '1',
        assignees: ['Sokha Chan', 'Dara Kim'],
        submissions: [{ student: 'Sokha Chan', fileName: 'a.zip', submittedAt: iso(-1) }],
      }),
      assignment({ id: '2', assignees: ['Sokha Chan'] }),
    ]
    const rows = buildRoster(
      [member('1', 'Sokha Chan'), member('2', 'Dara Kim'), member('3', 'Vanna Pich')],
      work,
      new Map([['1', 'sokha@example.com']]),
    )
    expect(rows).toEqual([
      { id: '1', name: 'Sokha Chan', email: 'sokha@example.com', assigned: 2, submitted: 1 },
      { id: '2', name: 'Dara Kim', email: '', assigned: 1, submitted: 0 },
      { id: '3', name: 'Vanna Pich', email: '', assigned: 0, submitted: 0 },
    ])
  })

  it('summarizes due soon and work waiting for review', () => {
    const summary = summarizeClass([
      assignment({ id: '1', deadline: iso(3) }),
      assignment({ id: '2', deadline: iso(20) }),
      assignment({ id: '3', deadline: iso(-2) }),
      assignment({ id: '4', deadline: iso(2), phase: 'completed' }),
      assignment({
        id: '5',
        deadline: iso(30),
        submissions: [
          { student: 'A', fileName: 'a', submittedAt: iso(-1) },
          { student: 'B', fileName: 'b', submittedAt: iso(-1), verifiedAt: iso(0) },
        ],
      }),
    ])
    expect(summary).toEqual({ assignments: 5, dueSoon: 1, toReview: 1 })
  })
})
