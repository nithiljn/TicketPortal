import { NextResponse } from 'next/server'
import { verifySignupOtp } from '@/lib/otpService'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, code, password, username, sessionToken } = body

    if (!email || !code || !password || !username) {
      return NextResponse.json(
        { error: 'Email, code, password, and username are all required.' },
        { status: 400 }
      )
    }

    const result = await verifySignupOtp(email, code, password, username, sessionToken)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Invalid verification code.',
          remainingAttempts: result.remainingAttempts,
          sessionToken: result.sessionToken,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account successfully verified and created.',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
