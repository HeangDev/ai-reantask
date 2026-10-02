// ISO dates are parsed as local midnight so the shown day never shifts with the time zone.
const parse = (iso: string) => new Date(`${iso}T00:00:00`)

export const formatDate = (iso: string, locale: string) =>
  parse(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })

/** Whole years between the date of birth and today. */
export function ageFrom(dateOfBirth: string, today = new Date()) {
  const dob = parse(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const birthdayPassed =
    today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
  if (!birthdayPassed) age -= 1
  return age
}

export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
