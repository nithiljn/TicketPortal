import { NextResponse } from 'next/server'
import { sendSignupOtp } from '@/lib/otpService'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, username } = body

    if (!email || !username) {
      return NextResponse.json(
        { error: 'Email and username are required.' },
        { status: 400 }
      )
    }

    const result = await sendSignupOtp(email, username)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to send verification code.',
          cooldownSeconds: result.cooldownSeconds,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${email}`,
      sessionToken: result.sessionToken,
      devHint: result.devHint,
      devCode: result.devCode,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
