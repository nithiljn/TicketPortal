'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface LoginScreenProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export function LoginScreen({ theme, onToggleTheme }: LoginScreenProps) {
  const { login, signup, loginWithOAuth } = useAuth()
  const isDark = theme === 'dark'

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // OTP Verification state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpSessionToken, setOtpSessionToken] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null)
  const [errorMsg, setErrorMsgState] = useState('')
  const [shakeError, setShakeError] = useState(false)

  const setErrorMsg = (msg: string) => {
    setErrorMsgState(msg)
    if (msg) {
      setShakeError(false)
      setTimeout(() => {
        setShakeError(true)
        setTimeout(() => setShakeError(false), 400)
      }, 10)
    }
  }

  // Cooldown countdown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const passwordHasMinLen = password.length >= 8
  const passwordHasNumber = /\d/.test(password)
  const passwordHasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password)
  const isPasswordStrong = passwordHasMinLen && passwordHasNumber && passwordHasSpecial
  const passwordStrengthScore = [passwordHasMinLen, passwordHasNumber, passwordHasSpecial].filter(Boolean).length
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

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
        // Step 1 validation in Create Account mode
        if (!name.trim()) {
          setErrorMsg('Please choose a username')
          setLoading(false)
          return
        }

        if (!passwordHasMinLen) {
          setErrorMsg('Password must be at least 8 characters long')
          setLoading(false)
          return
        }

        if (!passwordHasNumber) {
          setErrorMsg('Password must contain at least one number (0-9)')
          setLoading(false)
          return
        }

        if (!passwordHasSpecial) {
          setErrorMsg('Password must contain at least one special character (!@#$%...)')
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match. Please verify your confirm password.')
          setLoading(false)
          return
        }

        // Send OTP to email before creating account
        const res = await fetch('/api/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), username: name.trim() }),
        })
        const data = await res.json()

        if (!res.ok) {
          setErrorMsg(data.error || 'Failed to send verification code')
          if (data.cooldownSeconds) setResendCooldown(data.cooldownSeconds)
          return
        }

        // Successfully sent OTP: Transition to Step 2 (OTP verification)
        setSignupStep('otp')
        if (data.sessionToken) setOtpSessionToken(data.sessionToken)
        setResendCooldown(60)
        setOtpDigits(['', '', '', '', '', ''])
        setErrorMsg('')
        if (data.devHint) {
          setSuccessMsg(data.devHint)
        } else {
          setSuccessMsg(`We sent a 6-digit verification code to ${email.trim()}`)
        }
        setTimeout(() => otpInputsRef.current[0]?.focus(), 120)
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpDigits.join('').trim()
    if (code.length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.')
      return
    }

    setOtpLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code,
          password,
          username: name.trim(),
          sessionToken: otpSessionToken,
        }),
      })

      const data = await res.json()
      if (data.sessionToken) setOtpSessionToken(data.sessionToken)

      if (!res.ok) {
        setErrorMsg(data.error || 'Verification failed')
        return
      }

      setSuccessMsg('Account created! Signing you in...')

      // Automatically sign in the freshly verified account
      const loginRes = await login(email.trim(), password)
      if (!loginRes.success) {
        setSuccessMsg('Account verified successfully! Please sign in.')
        setMode('signin')
        setSignupStep('form')
      }
    } catch {
      setErrorMsg('Failed to verify code. Please check your connection and try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), username: name.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to resend verification code')
        if (data.cooldownSeconds) setResendCooldown(data.cooldownSeconds)
        return
      }

      if (data.sessionToken) setOtpSessionToken(data.sessionToken)
      setResendCooldown(60)
      setOtpDigits(['', '', '', '', '', ''])
      if (data.devHint) {
        setSuccessMsg(data.devHint)
      } else {
        setSuccessMsg('A new verification code has been sent to your email.')
      }
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100)
    } catch {
      setErrorMsg('Network error. Failed to resend verification code.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = digit
    setOtpDigits(newDigits)
    setErrorMsg('')

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits]
        newDigits[index - 1] = ''
        setOtpDigits(newDigits)
        otpInputsRef.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const newDigits = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || ''
    }
    setOtpDigits(newDigits)
    setErrorMsg('')

    const focusIndex = Math.min(pasted.length, 5)
    otpInputsRef.current[focusIndex]?.focus()
  }

  const handleOAuth = async (provider: 'google') => {
    setErrorMsg('')
    setSuccessMsg('')
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

  const containerBg = isDark ? 'bg-[#000000] text-[#f5f5f7]' : 'bg-[#f5f5f7] text-[#1d1d1f]'
  const cardBg = isDark
    ? 'bg-[#1c1c1e] border-white/[0.08] shadow-2xl'
    : 'bg-white border-[#e5e5ea] shadow-sm'
  const inputBg = isDark
    ? 'bg-white/[0.04] border-white/[0.08] text-[#f5f5f7] placeholder-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/20'
    : 'bg-white border-[#e5e5ea] text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 shadow-2xs'
  const oauthBtnBg = isDark
    ? 'border-white/[0.08] hover:border-white/[0.18] bg-white/[0.04] hover:bg-white/[0.08] text-[#f5f5f7]'
    : 'border-[#e5e5ea] hover:border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] shadow-2xs'
  const labelColor = isDark ? 'text-[#a1a1a6]' : 'text-[#86868b]'

  return (
    <div
      className={`min-h-screen w-screen flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-150 relative ${
        isDark ? 'selection:bg-white/20 selection:text-white' : 'selection:bg-zinc-900 selection:text-white'
      } ${containerBg}`}
    >
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
        <button
          onClick={onToggleTheme}
          type="button"
          className="w-9 h-9 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.06] backdrop-blur-md text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg className="w-4 h-4 text-[#ebebf5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          ) : (
            <svg className="w-4 h-4 text-[#1d1d1f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm mx-auto">
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
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            TicketFlow
          </h1>
          <p className="text-xs text-[#86868b] font-normal tracking-normal max-w-xs mx-auto">
            Task and engineering portal for your daily work
          </p>
        </div>

        {/* Auth Card */}
        <div className={`rounded-[24px] border p-6 sm:p-8 space-y-5 transition-all ${cardBg}`}>
          {mode === 'signup' && signupStep === 'otp' ? (
            /* OTP Verification Flow */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* Top Navigation */}
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setSignupStep('form')
                    setErrorMsg('')
                    setSuccessMsg('')
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition cursor-pointer select-none"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back to Edit Email</span>
                </button>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08]">
                  Step 2 of 2
                </span>
              </div>

              {/* Title & Email Info */}
              <div className="text-center space-y-2 pt-1">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Verify Your Email
                </h2>
                <p className="text-xs text-[#86868b] max-w-xs mx-auto leading-relaxed">
                  We sent a 6-digit verification code to
                  <br />
                  <strong className="text-[#1d1d1f] dark:text-white font-mono break-all">{email}</strong>
                </p>
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div
                  role="alert"
                  className={`px-3.5 py-2.5 rounded-[14px] text-xs flex items-center justify-between gap-3 border transition-all duration-200 border-black/[0.08] dark:border-white/[0.08] bg-[#f5f5f7] dark:bg-[#242426] shadow-2xs ${
                    shakeError ? 'animate-otp-shake' : 'animate-in fade-in duration-150'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center bg-[#ff3b30]/10 dark:bg-[#ff453a]/15 text-[#ff3b30] dark:text-[#ff453a]">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <span className="text-[12px] leading-snug font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                      {errorMsg}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="w-5 h-5 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Dismiss error"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Success Notice */}
              {successMsg && (
                <div className="px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.05] text-[#1d1d1f] dark:text-[#f5f5f7]">
                  <svg className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-[12px] font-medium leading-snug text-[#1d1d1f] dark:text-[#f5f5f7]">{successMsg}</span>
                </div>
              )}

              {/* 6 Digit Numeric Inputs */}
              <div className={`space-y-2 pt-1 transition-transform ${shakeError ? 'animate-otp-shake' : ''}`}>
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border text-center text-xl font-bold font-mono outline-none transition-all duration-150 ${
                        errorMsg
                          ? 'border-[#ff3b30]/50 dark:border-[#ff453a]/50 focus:border-[#ff3b30]'
                          : digit
                          ? 'border-[#1d1d1f] dark:border-white ring-1 ring-black/10 dark:ring-white/20'
                          : ''
                      } ${inputBg}`}
                    />
                  ))}
                </div>
                <p className="text-center text-[11px] text-[#86868b]">
                  Code expires in <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">10 minutes</span> (maximum 5 attempts)
                </p>
              </div>

              {/* Resend OTP Bar */}
              <div className="text-center text-xs pt-1">
                {resendCooldown > 0 ? (
                  <span className="text-[#86868b] text-[11px]">
                    Resend code in <strong className="font-mono text-[#1d1d1f] dark:text-[#f5f5f7]">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={resendLoading}
                    onClick={handleResendOtp}
                    className="font-medium text-[11px] text-[#1d1d1f] dark:text-[#f5f5f7] hover:underline cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {resendLoading ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" />
                        </svg>
                        <span>Sending new code...</span>
                      </>
                    ) : (
                      <span>Didn&apos;t receive code? Resend OTP</span>
                    )}
                  </button>
                )}
              </div>

              {/* Verify & Create Account Submit Button */}
              <button
                type="submit"
                disabled={otpLoading || otpDigits.join('').trim().length < 6}
                className={`w-full h-11 rounded-full text-xs font-semibold tracking-normal transition-all duration-150 flex items-center justify-center gap-2 active:scale-95 ${
                  otpDigits.join('').trim().length < 6 || otpLoading
                    ? isDark
                      ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
                      : 'bg-black/[0.06] text-black/35 cursor-not-allowed border border-black/5'
                    : isDark
                    ? 'bg-white hover:bg-zinc-100 text-zinc-950 shadow-sm cursor-pointer'
                    : 'bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white shadow-sm cursor-pointer'
                }`}
              >
                {otpLoading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin text-inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span>Verifying & Creating Account...</span>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span>Verify & Create Account</span>
                    <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            </form>
          ) : (
            <>
              {/* OAuth Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={oauthLoading !== null || loading}
                  onClick={() => handleOAuth('google')}
                  className={`w-full h-11 px-4 rounded-full border text-xs font-medium flex items-center justify-center gap-2.5 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 ${oauthBtnBg}`}
                >
                  {oauthLoading === 'google' ? (
                    <svg className="w-4 h-4 animate-spin text-[#86868b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <div className={`w-full border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.06]'}`} />
                <span className={`px-3 text-[10px] font-medium uppercase tracking-wider absolute text-[#86868b] ${
                  isDark ? 'bg-[#1c1c1e]' : 'bg-white'
                }`}>
                  or continue with email
                </span>
              </div>

              {/* Sign In / Sign Up Mode Tabs — Apple Segmented Control */}
              <div className={`p-1 rounded-full border grid grid-cols-2 gap-1 ${
                isDark ? 'bg-white/[0.06] border-white/[0.08]' : 'bg-[#f5f5f7] border-black/[0.06]'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setSignupStep('form')
                    setErrorMsg('')
                    setSuccessMsg('')
                    setConfirmPassword('')
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-full transition-all duration-150 cursor-pointer active:scale-95 ${
                    mode === 'signin'
                      ? isDark
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'bg-white text-[#1d1d1f] shadow-xs'
                      : isDark
                      ? 'text-[#86868b] hover:text-white'
                      : 'text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setSignupStep('form')
                    setErrorMsg('')
                    setSuccessMsg('')
                    setConfirmPassword('')
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-full transition-all duration-150 cursor-pointer active:scale-95 ${
                    mode === 'signup'
                      ? isDark
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'bg-white text-[#1d1d1f] shadow-xs'
                      : isDark
                      ? 'text-[#86868b] hover:text-white'
                      : 'text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div
                  role="alert"
                  className={`px-3.5 py-2.5 rounded-[14px] text-xs flex items-center justify-between gap-3 border transition-all duration-200 border-black/[0.08] dark:border-white/[0.08] bg-[#f5f5f7] dark:bg-[#242426] shadow-2xs ${
                    shakeError ? 'animate-otp-shake' : 'animate-in fade-in duration-150'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center bg-[#ff3b30]/10 dark:bg-[#ff453a]/15 text-[#ff3b30] dark:text-[#ff453a]">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <span className="text-[12px] leading-snug font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                      {errorMsg}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="w-5 h-5 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Dismiss error"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
                      Unique Username
                    </label>
                    <span className="text-[11px] text-[#86868b]">
                      e.g. @nithil
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#86868b] select-none">
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
                      className={`w-full h-11 pl-8 pr-3.5 text-xs rounded-[12px] border outline-none font-mono transition-all duration-150 ${inputBg}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full h-11 px-3.5 text-xs rounded-[12px] border outline-none transition-all duration-150 ${inputBg}`}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                  Username or Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="nithil or name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full h-11 px-3.5 text-xs rounded-[12px] border outline-none transition-all duration-150 ${inputBg}`}
                />
              </div>
            )}

            <div>
              <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full h-11 pl-3.5 pr-10 text-xs rounded-[12px] border outline-none transition-all duration-150 ${inputBg}`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength and requirements */}
              {mode === 'signup' && (
                <div className="space-y-2.5 pt-2.5">
                  {password.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#86868b]">
                          Password strength
                        </span>
                        <span className={`font-semibold ${
                          isPasswordStrong
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : passwordStrengthScore === 2
                            ? 'text-[#0071e3] dark:text-[#2997ff]'
                            : 'text-[#86868b]'
                        }`}>
                          {isPasswordStrong ? 'Strong' : passwordStrengthScore === 2 ? 'Medium' : 'Weak'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 h-1">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            passwordStrengthScore >= 1
                              ? isPasswordStrong ? 'bg-emerald-500' : 'bg-[#0071e3] dark:bg-[#2997ff]'
                              : isDark ? 'bg-white/[0.08]' : 'bg-black/[0.06]'
                          }`}
                        />
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            passwordStrengthScore >= 2
                              ? isPasswordStrong ? 'bg-emerald-500' : 'bg-[#0071e3] dark:bg-[#2997ff]'
                              : isDark ? 'bg-white/[0.08]' : 'bg-black/[0.06]'
                          }`}
                        />
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            passwordStrengthScore >= 3
                              ? 'bg-emerald-500'
                              : isDark ? 'bg-white/[0.08]' : 'bg-black/[0.06]'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 pt-0.5">
                    <div className={`flex items-center gap-2 text-[11px] transition ${
                      passwordHasMinLen
                        ? 'text-emerald-500 dark:text-emerald-400 font-medium'
                        : 'text-[#86868b]'
                    }`}>
                      {passwordHasMinLen ? (
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className={`w-1.5 h-1.5 ml-1 mr-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
                      )}
                      <span>At least 8 characters</span>
                    </div>

                    <div className={`flex items-center gap-2 text-[11px] transition ${
                      passwordHasNumber
                        ? 'text-emerald-500 dark:text-emerald-400 font-medium'
                        : 'text-[#86868b]'
                    }`}>
                      {passwordHasNumber ? (
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className={`w-1.5 h-1.5 ml-1 mr-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
                      )}
                      <span>At least 1 number (0-9)</span>
                    </div>

                    <div className={`flex items-center gap-2 text-[11px] transition ${
                      passwordHasSpecial
                        ? 'text-emerald-500 dark:text-emerald-400 font-medium'
                        : 'text-[#86868b]'
                    }`}>
                      {passwordHasSpecial ? (
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className={`w-1.5 h-1.5 ml-1 mr-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
                      )}
                      <span>At least 1 special character (!@#$)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password in Create Account mode */}
            {mode === 'signup' && (
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full h-11 pl-3.5 pr-10 text-xs rounded-[12px] border outline-none transition-all duration-150 ${inputBg} ${
                      confirmPassword.length > 0 && passwordsMatch
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`mt-1.5 text-[11px] flex items-center gap-1.5 transition ${
                    passwordsMatch
                      ? 'text-emerald-500 dark:text-emerald-400 font-medium'
                      : 'text-[#86868b]'
                  }`}>
                    {passwordsMatch ? (
                      <>
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <span>Passwords do not match yet</span>
                    )}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || oauthLoading !== null}
              className={`w-full h-11 rounded-full text-xs font-semibold tracking-normal transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
                isDark
                  ? 'bg-white hover:bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm'
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
                  <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Create Account</span>
                  <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              )}
            </button>
          </form>
        </>
      )}
    </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#86868b] tracking-normal">
          TicketFlow
        </p>
      </div>
    </div>
  )
}
