import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { identifier, checkUsername } = body

    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error || !data?.users) {
      return NextResponse.json(
        { error: error?.message || 'Failed to query users' },
        { status: 500 }
      )
    }

    // 1. Check if a username is available (Sign Up check)
    if (checkUsername) {
      const clean = checkUsername.trim().toLowerCase().replace(/^@/, '')
      const exists = data.users.some(
        (u) => (u.user_metadata?.username as string)?.toLowerCase() === clean
      )
      return NextResponse.json({
        available: !exists,
        username: clean,
      })
    }

    // 2. Lookup email for a username (Sign In resolution)
    if (identifier) {
      const raw = identifier.trim().toLowerCase()
      // If already an email, return directly
      if (raw.includes('@') && raw.includes('.')) {
        return NextResponse.json({ email: raw })
      }

      const clean = raw.replace(/^@/, '')
      const matched = data.users.find(
        (u) =>
          (u.user_metadata?.username as string)?.toLowerCase() === clean ||
          u.email?.split('@')[0]?.toLowerCase() === clean
      )

      if (matched?.email) {
        return NextResponse.json({ email: matched.email })
      }

      return NextResponse.json(
        { error: `No account found with username "@${clean}"` },
        { status: 404 }
      )
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lookup failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
