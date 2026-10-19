import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { ErrorState } from '@/shared/components/ErrorState'
import { PageSkeleton } from '@/shared/components/PageSkeleton'
import { TextField } from '@/shared/components/TextField'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('shared components', () => {
  it('a11y: ErrorState says what happened, offers a retry and has no violations', async () => {
    const onRetry = jest.fn()
    const user = userEvent.setup()
    const { container } = renderWithProviders(
      <ErrorState descriptionKey="errors.network" requestId="req-42" onRetry={onRetry} />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t load this')
    expect(screen.getByText('Reference: req-42')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('a11y: PageSkeleton is announced as busy', async () => {
    const { container } = renderWithProviders(<PageSkeleton />)
    expect(screen.getByLabelText('Loading…')).toHaveAttribute('aria-busy', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('a11y: TextField ties its label, hint and error to the input', async () => {
    function Field() {
      const [value, setValue] = useState('')
      return <TextField label="Email" value={value} onChange={setValue} error="stu.errEmail" />
    }
    const { container } = renderWithProviders(<Field />)

    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a valid email address.')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('a destructive confirmation is a labelled dialog that focuses Cancel first', async () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()
    const user = userEvent.setup()
    const { container } = renderWithProviders(
      <ConfirmDialog
        open
        icon={<span />}
        title="Delete class?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Delete class?', hidden: true })
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
    expect(screen.getByRole('button', { name: 'Cancel', hidden: true })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Delete', hidden: true }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
    expect(await axe(container)).toHaveNoViolations()
  })
})
