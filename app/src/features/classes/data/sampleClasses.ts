import type { SchoolClass } from '@/features/classes/types'

// Placeholder classes for mock mode (VITE_USE_MOCKS=true). Ids and names line up with the sample teachers,
// the sample assignments and the seeded class members, so a teacher's class page has data to show.
const sampleClass = (id: string, name: string, description: string, code: string): SchoolClass => ({
  id,
  name,
  description,
  startDate: '2026-09-01',
  endDate: '2027-01-31',
  status: 'active',
  code,
})

export const sampleClasses: SchoolClass[] = [
  sampleClass('1', 'Mathematics 101', 'Algebra and problem solving', 'MATH10'),
  sampleClass('2', 'World History', 'From the Industrial Revolution to today', 'HIST20'),
  sampleClass('3', 'Chemistry', 'Reactions, labs and reports', 'CHEM30'),
  sampleClass('4', 'Web Development', 'Building apps with React', 'WEBD40'),
  sampleClass('5', 'Literature', 'Poetry and prose analysis', 'LITE50'),
  sampleClass('6', 'Mathematics 102', 'Geometry and trigonometry', 'MATH60'),
  sampleClass('7', 'Web Development II', 'Backend and APIs', 'WEBD70'),
  sampleClass('8', 'Chemistry Lab', 'Hands-on experiments', 'CHEM80'),
  sampleClass('9', 'European History', 'Medieval to modern Europe', 'HIST90'),
  { ...sampleClass('10', 'Creative Writing', 'Short stories and essays', 'WRIT10'), status: 'inactive' },
]
