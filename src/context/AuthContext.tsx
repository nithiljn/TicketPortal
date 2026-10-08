'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ success: boolean; error?: string }>
  loginWithOAuth: (provider: 'google') => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper to extract user profile cleanly
  const extractUser = (sbUser: {
    id: string
    email?: string
    user_metadata?: Record<string, unknown>
  }): AuthUser => {
    const meta = sbUser.user_metadata || {}
    const rawUsername =
      (meta.username as string) ||
      (meta.user_name as string) ||
      sbUser.email?.split('@')[0] ||
      'user'
    const cleanUsername = rawUsername.toLowerCase().replace(/^@/, '')
    const name = (meta.name as string) || `@${cleanUsername}`
    const avatarUrl =
      (meta.avatar_url as string) ||
      (meta.picture as string) ||
      undefined

    return {
      id: sbUser.id,
      email: sbUser.email || '',
      name,
      username: cleanUsername,
      avatarUrl,
    }
  }

  useEffect(() => {
    // 1. Get initial session / handle OAuth callback code
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const code = urlParams.get('code')
          const oauthError = urlParams.get('error_description') || urlParams.get('error')

          if (oauthError) {
            console.warn('OAuth redirect notice:', oauthError)
            setError(oauthError)
          } else if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error && data.session?.user) {
              setUser(extractUser(data.session.user))
              window.history.replaceState({}, document.title, window.location.pathname)
              setIsLoading(false)
              return
            } else if (error) {
              console.warn('exchangeCodeForSession error:', error.message)
            }
          }
        }

        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('Supabase auth session error:', error.message)
        } else if (data.session?.user) {
          setUser(extractUser(data.session.user))
        }
      } catch (err) {
        console.warn('Auth initialization exception:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // 2. Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(extractUser(session.user))
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const login = async (identifier: string, password: string) => {
    setError(null)
    try {
      let targetEmail = identifier.trim()

      // If user provided a username instead of an email, resolve it
      if (!targetEmail.includes('@') || !targetEmail.includes('.')) {
        try {
          const res = await fetch('/api/auth/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: targetEmail }),
          })
          const lookupData = await res.json()
          if (!res.ok || !lookupData.email) {
            const err = lookupData.error || `Username "${targetEmail}" not found`
            setError(err)
            return { success: false, error: err }
          }
          targetEmail = lookupData.email
        } catch {
          const err = 'Failed to verify username'
          setError(err)
          return { success: false, error: err }
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      if (data.user) {
        setUser(extractUser(data.user))
      }
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  const signup = async (
    email: string,
    password: string,
    username: string
  ) => {
    setError(null)
    try {
      const cleanUser = username.trim().toLowerCase().replace(/^@/, '')
      if (cleanUser.length < 3) {
        setError('Username must be at least 3 characters')
        return { success: false, error: 'Username must be at least 3 characters' }
      }

      // Check username uniqueness
      try {
        const checkRes = await fetch('/api/auth/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkUsername: cleanUser }),
        })
        const checkData = await checkRes.json()
        if (checkData.available === false) {
          const err = `Username "@${cleanUser}" is already taken. Please choose another.`
          setError(err)
          return { success: false, error: err }
        }
      } catch {
        // Fallback if lookup fails
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: cleanUser,
            name: `@${cleanUser}`,
          },
        },
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      if (data.user) {
        setUser(extractUser(data.user))
      }
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  const loginWithOAuth = async (provider: 'google') => {
    setError(null)
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OAuth sign in failed'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Sign out notice:', err)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        signup,
        loginWithOAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
