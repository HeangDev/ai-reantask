# Forms & Validation

Stack: **React Hook Form (RHF)** + **Zod** via `@hookform/resolvers/zod`.

## 1. Principles

1. **One Zod schema per form**, colocated in `features/<x>/schemas/`.
2. Types come from the schema: `type FormValues = z.infer<typeof schema>`. No hand-written duplicates.
3. Validation messages are **i18n keys**, not strings.
4. Client validation is UX; the server re-validates. Map server field errors back with `setError`.
5. Use `mode: 'onTouched'` (validate on blur, then on change). Use `onSubmit` for long forms if UX requires.
6. Never store form values in Zustand. Draft persistence is a mutation, not global state.

## 2. Standard form setup

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues,
  mode: 'onTouched',
});
```

Rules:
- Always provide **complete `defaultValues`** (no `undefined` inputs → avoids controlled/uncontrolled warnings).
- Use `FormProvider` + `useFormContext` only for forms with nested field components; otherwise pass `control`.
- Use `Controller` / `useController` for custom components (selects, date pickers, rich editor). Use `register` for native inputs.

## 3. Shared field components

Located in `shared/components/form/`:

| Component                    | Notes                                                          |
|------------------------------|----------------------------------------------------------------|
| `FormField`                  | Label, description, error, `aria-describedby`, required marker |
| `TextField`, `TextAreaField` | Wrap native input                                              |
| `SelectField`                | Accessible listbox                                             |
| `DatePickerField`            | Stores ISO string                                              |
| `FileDropzoneField`          | Validates type/size, shows list                                |
| `NumberField`                | Handles empty vs 0 correctly                                   |
| `SubmitButton`               | Disabled + spinner on `isSubmitting`                           |

Every field must: associate `<label htmlFor>`, set `aria-invalid`, render error with `role="alert"` (or `aria-live="polite"`).

## 4. Error message i18n

Schema messages use keys:

```ts
z.string().min(3, { message: 'validation.min' }) // params via error map
```

Global Zod error map (`shared/lib/zodErrorMap.ts`) translates key + params with i18next:

```ts
// en: "validation.min": "Must be at least {{min}} characters"
```

Display via `t(error.message, params)`; fall back to `validation.invalid`.

## 5. Common reusable schemas (`shared/lib/validators.ts`)

```ts
export const emailSchema = z.string().trim().min(1, 'validation.required').email('validation.email');
export const passwordSchema = z.string().min(8, 'validation.password.min')
  .regex(/[A-Z]/, 'validation.password.upper')
  .regex(/[0-9]/, 'validation.password.digit');
export const isoDateSchema = z.string().datetime({ offset: true });
export const idSchema = z.string().uuid();
```

## 6. Form specs

### 6.1 Login
| Field    | Rule                                  |
|----------|---------------------------------------|
| email    | required, valid email                 |
| password | required (no strength check on login) |

### 6.2 Assignment (teacher)
| Field              | Rule                                                 | Business rule   |
|--------------------|------------------------------------------------------|-----------------|
| title              | trim, 3–120                                          | R-A1            |
| description        | 1–5000                                               | R-A1            |
| courseId           | uuid                                                 |                 |
| deadline           | ISO, **future** on create                            | R-A2            |
| maxAttempts        | int 1–5                                              | R-A3            |
| latePolicy         | enum                                                 | R-A4            |
| latePenaltyPercent | 1–100, **required only if** `latePolicy = 'penalty'` | R-A4            |
| rubricId           | uuid                                                 | R-A5            |
| allowedFileTypes   | array, ≥1 if files allowed                           |                 |

```ts
export const assignmentSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(5000),
  courseId: idSchema,
  deadline: isoDateSchema,
  maxAttempts: z.coerce.number().int().min(1).max(5),
  latePolicy: z.enum(['allow_late', 'block_late', 'penalty']),
  latePenaltyPercent: z.coerce.number().min(1).max(100).optional(),
  rubricId: idSchema,
}).superRefine((v, ctx) => {
  if (v.latePolicy === 'penalty' && v.latePenaltyPercent == null) {
    ctx.addIssue({ code: 'custom', path: ['latePenaltyPercent'], message: 'validation.required' });
  }
});
```

### 6.3 Submission (student)
| Field             | Rule                                          |
|-------------------|-----------------------------------------------|
| text              | optional, ≤ 50 000 chars                      |
| files             | ≤ 5, each ≤ 20 MB, allowed MIME               |
| *(form-level)*    | text non-empty **or** ≥ 1 file (R-S2)         |
| confirmAuthorship | must be `true` on final submit (not on draft) |

Two schemas: `submissionDraftSchema` (lenient) and `submissionFinalSchema` (strict). Use the strict one only in the submit handler via `schema.safeParse` / resolver switching.

### 6.4 Teacher review
| Field                             | Rule                                                |
|-----------------------------------|-----------------------------------------------------|
| criterionScores[i].score          | 0 ≤ score ≤ maxPoints, step 0.5 (R-G2)              |
| criterionScores[i].overrideReason | required, ≥ 10 chars **if** score ≠ AI score (R-G3) |
| overallOverride                   | optional number; reason required if set (R-G4)      |
| comments[i].text                  | 1–2000                                              |
| finalFeedback                     | optional, ≤ 5000                                    |

Use `useFieldArray` for criteria and comments. Keys must use `field.id`, never index.

### 6.5 Rubric
- 1–20 criteria; each: name 2–80, maxPoints > 0 (step 0.5), weight 0–100.
- Sum of weights **must equal 100** (form-level refine, error path `root`).

### 6.6 User (admin)
- email, fullName 2–100, role enum, courseIds array.

## 7. Server errors

```ts
onError: (err) => {
  if (isApiValidationError(err)) {
    Object.entries(err.fieldErrors).forEach(([name, msg]) =>
      form.setError(name as Path<FormValues>, { type: 'server', message: msg }));
  } else {
    toast.error(t(err.messageKey));
  }
}
```

## 8. UX rules

- Disable submit while `isSubmitting`; keep enabled while invalid (show errors on click) — **do not** disable for invalid state.
- Focus first invalid field on submit (`shouldFocusError: true`).
- Warn on leaving with unsaved changes (`useBlocker` + `formState.isDirty`).
- After successful save, `form.reset(savedValues)`.
- Long forms: show a summary of errors at top with anchor links.
- Autosave (submission draft): debounce 2 s after change **and** every 30 s; show "Saved 10:42" indicator; never block typing.

## 9. Testing forms

See [testing.md](./testing.md) §6. Always test: required errors, cross-field refine, server error mapping, submit payload shape.