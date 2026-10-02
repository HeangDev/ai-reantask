export interface ScoreRow {
  /** The student's name; it identifies the row. */
  id: string
  student: string
  /** Classes this student has assignments in. */
  classes: string[]
  assigned: number
  submitted: number
  graded: number
  /** Points earned and points possible, across the graded work. */
  earned: number
  possible: number
  /** Earned as a percentage of possible, or null when nothing is graded yet. */
  percent: number | null
}
