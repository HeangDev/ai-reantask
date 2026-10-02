import type { Subject } from '@/features/subjects/types'

// Placeholder data until a subjects API is documented in docs/api.md.
// The first five are the subjects the sample teachers and classes already use.
export const sampleSubjects: Subject[] = [
  { id: '1', name: 'Mathematics', description: 'Numbers, algebra, geometry and problem solving.', status: 'active' },
  { id: '2', name: 'World History', description: 'Major civilisations, events and their impact on today.', status: 'active' },
  { id: '3', name: 'Chemistry', description: 'Matter, reactions and laboratory practice.', status: 'active' },
  { id: '4', name: 'Web Development', description: 'Building websites and apps with HTML, CSS, JavaScript and React.', status: 'active' },
  { id: '5', name: 'Literature', description: 'Reading, analysing and writing about poetry and prose.', status: 'active' },
  { id: '6', name: 'Physics', description: 'Motion, energy, forces and the laws of nature.', status: 'active' },
  { id: '7', name: 'Biology', description: 'Living things, from cells to ecosystems.', status: 'inactive' },
  { id: '8', name: 'English', description: 'Grammar, speaking, listening and academic writing.', status: 'active' },
]
