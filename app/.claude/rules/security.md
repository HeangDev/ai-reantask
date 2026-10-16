# Security

## 1. Authentication & sessions (ASSUMPTION)

- Preferred: **httpOnly, Secure, SameSite cookies** for session/refresh token; access token (if any) in **memory only**.
- Never store tokens in `localStorage`/`sessionStorage`.
- On logout: call API, clear Zustand, `queryClient.clear()`, redirect.
- CSRF: if cookie auth, send CSRF header on mutating requests.

## 2. Authorization

- Frontend checks (`can()`, `RequireRole`) are UX only. Never rely on hidden buttons for security.
- Don't expose other users' data in cached queries: query keys include user/class scope where relevant; cache cleared on logout/user switch.

## 3. XSS

- React escapes by default; **never** use `dangerouslySetInnerHTML` unless sanitized with DOMPurify (allow-list) — requires review.
- Student submission text and AI comments are **untrusted**: render as plain text or sanitized Markdown only.
- Avoid `eval`, `new Function`, inline event strings; set a strict CSP (no `unsafe-inline` scripts).
- Validate/encode URLs before using in `href` (allow `http(s)`, `mailto` only).

## 4. File handling & GitHub

- Student uploads one **ZIP**; check extension, MIME and size client-side (UX); server is authoritative (magic-number sniffing, AV scan, secret scan).
- Zip contents are untrusted: client inspector reads **entry names/sizes only**, caps entries inspected, never extracts into the DOM.
- **GitHub credentials never reach the browser.** Pushes are done by the backend via a GitHub App; frontend only receives `repoUrl`, `branch`, `commitSha`.
- Repos are private; show links with `rel="noopener noreferrer"`; don't assume the student has access.
- Warn students not to include secrets (`.env`, keys); backend blocks detected secrets.
- Never render uploaded HTML/SVG inline; use signed, expiring URLs for downloads.
- Sanitize file/team/class names before display.

## 4.1 Class code & team code

- Treat codes as secrets: don't log them, don't put them in analytics, don't persist in storage; `?code=` in URL is prefilled only, never auto-submitted, and removed from history after use (`replace: true`).
- Backend rate-limits joins; frontend shows countdown on `429`. Generic error for invalid/disabled/expired codes.
- Students only ever receive data for classes they joined; non-member requests return 403/404 without confirming existence.

## 5. Privacy / PII

- Student work and grades are sensitive (FERPA/GDPR-like; confirm jurisdiction).
- Don't log submission content, names, emails to console, analytics or error reports.
- Don't put PII in URLs (use opaque IDs) or query keys beyond IDs.
- Clearly tell students AI processes their work (consent text, link to policy).
- No third-party scripts without review; self-host fonts.

## 6. Prompt-injection awareness (AI)

Student text may contain instructions aimed at the AI. Frontend must:
- Display AI output as untrusted text.
- Show teachers the **"possible manipulation" flag** if backend provides one.
- Never auto-execute actions based on AI output.

## 7. Dependencies & build

- Lockfile committed; `npm audit` / Dependabot in CI; pin major versions.
- No secrets in the bundle: only public `VITE_*` values.
- Source maps uploaded to monitoring, not served publicly.

## 8. Headers (set at hosting)

CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`.