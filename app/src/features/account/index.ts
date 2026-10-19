// Public API of the account feature. Other features and the app import only from here.
// The Account page itself is loaded lazily by the router.
export { validatePassword, passwordStrength } from '@/features/account/lib/validation'
