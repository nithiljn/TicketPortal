'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface LoginScreenProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export function LoginScreen({ theme, onToggleTheme }: LoginScreenProps) {
  const { login, signup, loginWithOAuth } = useAuth()
  const isDark = theme === 'dark'

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!email.trim() || !password) {
      setErrorMsg('Please enter email and password')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const res = await login(email.trim(), password)
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to sign in. Check your credentials.')
        }
      } else {
        if (!name.trim()) {
          setErrorMsg('Please choose a username')
          setLoading(false)
          return
        }

        const res = await signup(email.trim(), password, name.trim())
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google') => {
    setErrorMsg('')
    setOauthLoading(provider)
    try {
      const res = await loginWithOAuth(provider)
      if (!res.success) {
        setErrorMsg(res.error || `Failed to sign in with ${provider}`)
      }
    } finally {
      setOauthLoading(null)
    }
  }

  const containerBg = isDark ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
  const cardBg = isDark
    ? 'bg-[#121215] border-white/[0.08] shadow-2xl shadow-black/60'
    : 'bg-white border-zinc-200 shadow-xl'
  const inputBg = isDark
    ? 'bg-zinc-900/80 border-white/[0.08] text-white placeholder-zinc-500 focus:border-zinc-400 focus:bg-zinc-900'
    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:bg-white'
  const oauthBtnBg = isDark
    ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-zinc-200'
    : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800 shadow-xs'

  return (
    <div
      className={`min-h-screen w-screen flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-150 relative ${
        isDark ? 'selection:bg-sky-500/30 selection:text-white' : 'selection:bg-zinc-900 selection:text-white'
      } ${containerBg}`}
    >
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
        <button
          onClick={onToggleTheme}
          type="button"
          className={`p-2.5 rounded-xl border text-xs font-mono transition cursor-pointer flex items-center gap-2 ${
            isDark
              ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-zinc-300'
              : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-700 shadow-xs'
          }`}
          title="Toggle theme"
        >
          {isDark ? (
            <>
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl border shadow-sm mx-auto ${
            isDark ? 'bg-zinc-900 border-white/[0.1] text-zinc-100' : 'bg-zinc-900 border-zinc-800 text-zinc-100'
          }`}>
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2a2 2 0 0 0 0 4v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-2a2 2 0 0 0 0-4V9z" />
              <line x1="9" y1="9" x2="9" y2="15" strokeDasharray="2 2" />
            </svg>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}>
            TicketFlow
          </h1>
          <p className={`text-xs font-medium tracking-normal ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}>
            Maintain your tasks effortlessly & boost daily productivity
          </p>
        </div>

        {/* Auth Card */}
        <div className={`rounded-2xl border p-6 sm:p-7 space-y-5 transition-all ${cardBg}`}>
          {/* OAuth Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={oauthLoading !== null || loading}
              onClick={() => handleOAuth('google')}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-medium flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-50 ${oauthBtnBg}`}
            >
              {oauthLoading === 'google' ? (
                <svg className="w-4 h-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className={`w-full border-t ${isDark ? 'border-white/[0.08]' : 'border-zinc-200'}`} />
            <span className={`px-2 text-[10px] font-mono uppercase tracking-wider absolute ${
              isDark ? 'bg-[#121215] text-zinc-500' : 'bg-white text-zinc-500 font-medium'
            }`}>
              or continue with email
            </span>
          </div>

          {/* Sign In / Sign Up Mode Tabs */}
          <div className={`grid grid-cols-2 p-1 rounded-xl border ${
            isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setErrorMsg('')
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'signin'
                  ? isDark
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'bg-white text-zinc-900 shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setErrorMsg('')
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'signup'
                  ? isDark
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'bg-white text-zinc-900 shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div
              role="alert"
              className={`p-3 rounded-xl text-xs flex items-center gap-2.5 border transition-all animate-in fade-in duration-150 ${
                isDark
                  ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
              }`}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <span className="font-medium flex-1 text-[12px] leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block text-[11px] font-mono font-medium mb-1 uppercase ${
                      isDark ? 'text-zinc-400' : 'text-zinc-600'
                    }`}>
                      Unique Username
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">
                      e.g. @nithil
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 select-none">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="username"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      }
                      className={`w-full pl-8 pr-3.5 py-2.5 text-xs rounded-xl border outline-none font-mono transition ${inputBg}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-mono font-medium mb-1 uppercase ${
                    isDark ? 'text-zinc-400' : 'text-zinc-600'
                  }`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition ${inputBg}`}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className={`block text-[11px] font-mono font-medium mb-1 uppercase ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  Username or Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="nithil or name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition ${inputBg}`}
                />
              </div>
            )}

            <div>
              <label className={`block text-[11px] font-mono font-medium mb-1 uppercase ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition ${inputBg}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading || oauthLoading !== null}
              className={`w-full h-10.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.99] ${
                isDark
                  ? 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-white/5'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-900/10'
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : mode === 'signin' ? (
                <div className="flex items-center gap-1.5">
                  <span>Sign In</span>
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Create Account</span>
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className={`text-center text-[11px] font-mono tracking-wide ${
          isDark ? 'text-zinc-500' : 'text-zinc-500'
        }`}>
          TicketFlow • Designed for focused task momentum & daily execution
        </p>
      </div>
    </div>
  )
}
