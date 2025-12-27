# Cookie-Based Authentication

This project now uses secure HTTP cookies for authentication instead of localStorage.

## Benefits

- **Security**: Cookies can be configured with security flags (httpOnly, secure, sameSite)
- **SSR Compatible**: Works with server-side rendering
- **Automatic Expiration**: Built-in expiration handling
- **CSRF Protection**: SameSite=strict prevents CSRF attacks

## Files

- `cookies.ts` - Cookie management utilities
- `axios.ts` - Axios client with automatic token attachment
- `useApi.ts` - React hooks for API calls
- `middleware.ts` - Next.js middleware for route protection

## Usage

### Login
```typescript
const { login } = useAuth()
await login(email, password) // Token automatically stored in cookie
```

### API Calls
```typescript
import apiClient from '@/utils/axios'

// Token automatically attached from cookie
const response = await apiClient.get('/api/devices')
```

### Using Hooks
```typescript
const { data, loading, error, get } = useGet('/api/devices')

useEffect(() => {
  get()
}, [])
```

## Security Features

- Secure flag in production (HTTPS only)
- SameSite=strict (CSRF protection)
- Automatic token cleanup on expiration
- Route-level protection via middleware