// The small part of Google Identity Services (https://accounts.google.com/gsi/client) this app uses.
interface GoogleCredentialResponse {
  /** The signed Google ID token the API verifies. */
  credential: string
}

interface GoogleIdConfiguration {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
}

interface GoogleButtonOptions {
  type?: 'standard'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with'
  shape?: 'rectangular' | 'pill'
  width?: number
  locale?: string
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfiguration) => void
        renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void
      }
    }
  }
}
