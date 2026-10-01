import Button from '@/components/ui/Button'

const input =
  'w-full rounded-lg border border-line bg-sunken px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent/30'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 text-fg">
      <form className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-8 shadow-xl">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-accent-strong to-violet-500 font-bold text-white" aria-hidden="true">
          A
        </span>
        <h1 className="text-xl font-bold">Login</h1>
        <input type="email" placeholder="Email" aria-label="Email" className={input} />
        <input type="password" placeholder="Password" aria-label="Password" className={input} />
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    </div>
  )
}
