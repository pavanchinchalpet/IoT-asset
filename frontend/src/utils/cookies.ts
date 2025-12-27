import Cookies from 'js-cookie'

export const cookieConfig = {
  expires: 1, // 1 day
  secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
  sameSite: 'strict' as const, // CSRF protection
  path: '/', // Available across the entire site
  // httpOnly: false, // We need JS access for client-side operations
}

export const tokenCookie = {
  get: () => {
    try {
      return Cookies.get('token')
    } catch (error) {
      console.error('Error reading token cookie:', error)
      return undefined
    }
  },
  
  set: (token: string) => {
    try {
      Cookies.set('token', token, cookieConfig)
      console.log('🍪 Token stored in cookie')
    } catch (error) {
      console.error('Error setting token cookie:', error)
    }
  },
  
  remove: () => {
    try {
      Cookies.remove('token', { path: '/' })
      console.log('🍪 Token removed from cookie')
    } catch (error) {
      console.error('Error removing token cookie:', error)
    }
  }
}

export const clearAllAuthCookies = () => {
  tokenCookie.remove()
  // Add other auth-related cookies here if needed
  console.log('🍪 All auth cookies cleared')
}

// Debug utility for development
export const debugCookies = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🍪 Cookie Debug Info:')
    console.log('- Token exists:', !!tokenCookie.get())
    console.log('- All cookies:', document.cookie)
    console.log('- Cookie config:', cookieConfig)
  }
}