import { useState, useCallback } from 'react'
import apiClient from '@/utils/axios'
import { AxiosRequestConfig } from 'axios'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T = any>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (config: AxiosRequestConfig) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await apiClient(config)
      setState({
        data: response.data,
        loading: false,
        error: null
      })
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred'
      setState({
        data: null,
        loading: false,
        error: errorMessage
      })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}

// Convenience hooks for common HTTP methods
export function useGet<T = any>(url: string, config?: AxiosRequestConfig) {
  const api = useApi<T>()
  
  const get = useCallback((params?: any) => {
    return api.execute({
      method: 'GET',
      url,
      params,
      ...config
    })
  }, [api, url, config])

  return { ...api, get }
}

export function usePost<T = any>(url: string, config?: AxiosRequestConfig) {
  const api = useApi<T>()
  
  const post = useCallback((data?: any) => {
    return api.execute({
      method: 'POST',
      url,
      data,
      ...config
    })
  }, [api, url, config])

  return { ...api, post }
}