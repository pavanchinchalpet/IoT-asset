import axios from 'axios'
import { tokenCookie } from './cookies'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// Request interceptor to add token from cookies
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenCookie.get()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      tokenCookie.remove()
      
      // Only redirect if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient