import crypto from 'crypto'
import path from 'path'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

// Nodemailer SMTP (Gmail Dedicated Account: ticketflow.portal@gmail.com)
const smtpUser = process.env.SMTP_USER || ''
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '')

const mailer = (smtpUser && smtpPass)
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null

// Resend Fallback
const resendApiKey = process.env.RESEND_API_KEY || ''
const resend = resendApiKey ? new Resend(resendApiKey) : null

interface OtpRecord {
  email: string
  username: string
  otpHash: string
  expiresAt: number
  attempts: number
  lastSentAt: number
  devCode?: string // Kept for dev logging/fallback if email provider hits quota
}

// Global in-memory storage for OTP records across hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __ticketFlowOtpStore: Map<string, OtpRecord> | undefined
}

const otpStore: Map<string, OtpRecord> =
  global.__ticketFlowOtpStore || new Map<string, OtpRecord>()

if (process.env.NODE_ENV !== 'production') {
  global.__ticketFlowOtpStore = otpStore
}

const OTP_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'ticketflow-otp-secret-salt-2026'
const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000 // 60 seconds
const MAX_ATTEMPTS = 5

function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(OTP_SECRET).digest()
}

export function encryptOtpSession(data: OtpRecord): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    let enc = cipher.update(JSON.stringify(data), 'utf8', 'hex')
    enc += cipher.final('hex')
    const tag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`
  } catch (err) {
    console.error('Failed to encrypt OTP session:', err)
    return ''
  }
}

export function decryptOtpSession(token: string): OtpRecord | null {
  try {
    if (!token || !token.includes(':')) return null
    const parts = token.split(':')
    if (parts.length !== 3) return null
    const [ivHex, tagHex, enc] = parts
    const key = getEncryptionKey()
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    let dec = decipher.update(enc, 'hex', 'utf8')
    dec += decipher.final('utf8')
    return JSON.parse(dec) as OtpRecord
  } catch {
    return null
  }
}

function hashOtp(email: string, code: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${email.trim().toLowerCase()}:::${code.trim()}`)
    .digest('hex')
}

export async function sendSignupOtp(
  email: string,
  username: string
): Promise<{
  success: boolean
  error?: string
  cooldownSeconds?: number
  devHint?: string
  devCode?: string
  sessionToken?: string
}> {
  const cleanEmail = email.trim().toLowerCase()
  const cleanUsername = username.trim().toLowerCase().replace(/^@/, '')

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'A valid email address is required.' }
  }
  if (!cleanUsername) {
    return { success: false, error: 'Username is required.' }
  }

  // 1. Check if username or email is already taken in Supabase Auth
  try {
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (!listError && usersData?.users) {
      const emailExists = usersData.users.some(
        (u) => u.email?.toLowerCase() === cleanEmail
      )
      if (emailExists) {
        return {
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.',
        }
      }

      const usernameExists = usersData.users.some(
        (u) => (u.user_metadata?.username as string)?.toLowerCase() === cleanUsername
      )
      if (usernameExists) {
        return {
          success: false,
          error: `Username "@${cleanUsername}" is already taken. Please choose another.`,
        }
      }
    }
  } catch (err) {
    console.error('Error checking user uniqueness:', err)
  }

  // 2. Check Resend Cooldown
  const existing = otpStore.get(cleanEmail)
  const now = Date.now()
  if (existing) {
    const timeSinceLastSent = now - existing.lastSentAt
    if (timeSinceLastSent < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastSent) / 1000)
      return {
        success: false,
        error: `Please wait ${remainingSeconds}s before requesting a new code.`,
        cooldownSeconds: remainingSeconds,
      }
    }
  }

  // 3. Generate 6-digit numeric OTP
  const rawCode = Math.floor(100000 + Math.random() * 900000).toString()
  const otpHash = hashOtp(cleanEmail, rawCode)

  // 4. Build Professional Email HTML Template (Apple & Linear design system)
  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TicketFlow Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Helvetica, Arial, sans-serif; color: #1d1d1f; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e5ea; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 32px 20px 32px; text-align: center;">
              <img src="cid:ticketflow-logo" width="48" height="48" alt="TicketFlow" style="display: block; margin: 0 auto 14px auto; border-radius: 12px; width: 48px; height: 48px;" />
              <h1 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.4px; color: #1d1d1f;">
                TicketFlow
              </h1>
              <p style="margin: 0; font-size: 13px; color: #86868b; font-weight: 500;">
                Account verification
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #f2f2f7;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 32px 24px 32px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 15px; color: #1d1d1f; font-weight: 600;">
                Hello @${cleanUsername},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #515154;">
                Here is your verification code to complete your TicketFlow account registration.
              </p>

              <!-- Code Box -->
              <div style="background-color: #f5f5f7; border: 1px solid #e5e5ea; border-radius: 16px; padding: 20px 16px; margin: 0 auto 24px auto; max-width: 300px; text-align: center;">
                <span style="font-family: 'SF Mono', ui-monospace, Menlo, Consolas, Monaco, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #0071e3; display: inline-block; padding-left: 10px;">
                  ${rawCode}
                </span>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 12px; color: #86868b;">
                This code will expire in 10 minutes.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1a6; line-height: 1.4;">
                If you did not make this request, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 24px 32px; background-color: #fafafc; border-top: 1px solid #f2f2f7; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #86868b;">
                TicketFlow
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  let emailSentSuccessfully = false
  let emailErrorMessage = ''
  let devHint = ''

  const ticketIconPath = path.join(process.cwd(), 'public/ticket-icon.png')

  // 5. Primary Delivery: Gmail SMTP (Dedicated ticketflow.portal@gmail.com)
  if (mailer && smtpUser) {
    try {
      const info = await mailer.sendMail({
        from: `"TicketFlow" <${smtpUser}>`,
        to: cleanEmail,
        subject: `Your TicketFlow Verification Code: ${rawCode}`,
        html: emailHtml,
        attachments: [
          {
            filename: 'ticket-icon.png',
            path: ticketIconPath,
            cid: 'ticketflow-logo',
          },
        ],
      })
      if (info?.messageId) {
        emailSentSuccessfully = true
        console.log(`[Gmail SMTP] OTP email sent successfully to ${cleanEmail}. Message ID: ${info.messageId}`)
      }
    } catch (smtpErr: unknown) {
      const msg = smtpErr instanceof Error ? smtpErr.message : 'SMTP failed'
      console.error('[Gmail SMTP] Failed to send email:', msg)
      emailErrorMessage = msg
    }
  }

  // 6. Secondary Delivery Fallback: Resend (if SMTP was not configured or failed)
  if (!emailSentSuccessfully && resend) {
    try {
      const resendHtml = emailHtml.replace(
        'cid:ticketflow-logo',
        'https://ticketflow-hub.vercel.app/ticket-icon.png'
      )
      const { data, error } = await resend.emails.send({
        from: 'TicketFlow <onboarding@resend.dev>',
        to: cleanEmail,
        subject: `Your TicketFlow Verification Code: ${rawCode}`,
        html: resendHtml,
      })

      if (error) {
        console.error('Resend error:', error)
        emailErrorMessage = error.message

        // If Resend free tier testing restricted to account email (e.g. jamnithil@gmail.com):
        const match = error.message.match(/your own email address \(([^)]+)\)/i)
        const verifiedOwnerEmail = match ? match[1].trim() : 'jamnithil@gmail.com'

        if (verifiedOwnerEmail && verifiedOwnerEmail.toLowerCase() !== cleanEmail) {
          console.log(`[Resend Test Mode] Forwarding OTP to verified Resend owner: ${verifiedOwnerEmail}`)
          try {
            const fallbackRes = await resend.emails.send({
              from: 'TicketFlow <onboarding@resend.dev>',
              to: verifiedOwnerEmail,
              subject: `[OTP for ${cleanEmail}] Your TicketFlow Verification Code: ${rawCode}`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e5ea; border-radius: 12px;">
                  <h2>TicketFlow Verification Code</h2>
                  <p>A verification code was requested for: <strong>${cleanEmail}</strong> (@${cleanUsername})</p>
                  <div style="background: #f5f5f7; padding: 15px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0071e3; font-family: monospace;">
                    ${rawCode}
                  </div>
                  <p style="color: #86868b; font-size: 12px; margin-top: 15px;">
                    Note: Resend testing mode delivers emails for any recipient address to your verified Resend email (${verifiedOwnerEmail}).
                  </p>
                </div>
              `,
            })
            if (!fallbackRes.error && fallbackRes.data?.id) {
              emailSentSuccessfully = true
              devHint = `Resend free tier sent your code to your registered email: ${verifiedOwnerEmail}`
              console.log(`[Resend] Successfully delivered OTP for ${cleanEmail} to ${verifiedOwnerEmail}`)
            }
          } catch (fErr) {
            console.error('Fallback send exception:', fErr)
          }
        }
      } else if (data?.id) {
        emailSentSuccessfully = true
        console.log(`[Resend] OTP email sent successfully to ${cleanEmail}. Email ID: ${data.id}`)
      }
    } catch (sendErr: unknown) {
      const msg = sendErr instanceof Error ? sendErr.message : 'Failed to send email via Resend'
      console.error('Resend exception:', msg)
      emailErrorMessage = msg
    }
  }

  // 7. Store record in memory (hash, expiry, attempt counter) and generate stateless session token
  const record: OtpRecord = {
    email: cleanEmail,
    username: cleanUsername,
    otpHash,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    lastSentAt: now,
    devCode: rawCode,
  }
  otpStore.set(cleanEmail, record)
  const sessionToken = encryptOtpSession(record)

  // In development, log the OTP to the console for convenient debugging
  console.log(`\n======================================================`)
  console.log(`🎟️ [TicketFlow OTP] Generated code for ${cleanEmail}: ${rawCode}`)
  console.log(`⏱️ Expires in: 10 minutes | Max attempts: ${MAX_ATTEMPTS}`)
  if (devHint) {
    console.log(`📬 Delivery Note: ${devHint}`)
  } else if (!emailSentSuccessfully && emailErrorMessage) {
    console.log(`⚠️ Resend notice: ${emailErrorMessage}`)
  }
  console.log(`======================================================\n`)

  return {
    success: true,
    sessionToken,
    devHint: devHint || undefined,
    devCode: process.env.NODE_ENV !== 'production' ? rawCode : undefined,
  }
}

export async function verifySignupOtp(
  email: string,
  code: string,
  password: string,
  username: string,
  sessionToken?: string
): Promise<{ success: boolean; error?: string; remainingAttempts?: number; sessionToken?: string }> {
  const cleanEmail = email.trim().toLowerCase()
  const cleanCode = code.trim().replace(/\s+/g, '')
  const cleanUsername = username.trim().toLowerCase().replace(/^@/, '')

  if (!cleanEmail || !cleanCode) {
    return { success: false, error: 'Email and verification code are required.' }
  }

  let record = otpStore.get(cleanEmail)
  if (!record && sessionToken) {
    const decrypted = decryptOtpSession(sessionToken)
    if (decrypted && decrypted.email === cleanEmail) {
      record = decrypted
    }
  }

  if (!record) {
    return {
      success: false,
      error: 'No active verification code found for this email. Please request a new one.',
    }
  }

  const now = Date.now()

  // 1. Check expiration
  if (now > record.expiresAt) {
    otpStore.delete(cleanEmail)
    return {
      success: false,
      error: 'Verification code has expired. Please request a new one.',
    }
  }

  // 2. Check maximum wrong attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(cleanEmail)
    return {
      success: false,
      error: 'Too many incorrect attempts. For security, please request a new verification code.',
    }
  }

  // 3. Verify OTP Hash
  const expectedHash = hashOtp(cleanEmail, cleanCode)
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(record.otpHash),
    Buffer.from(expectedHash)
  )

  if (!isMatch) {
    record.attempts += 1
    otpStore.set(cleanEmail, record)
    const updatedToken = encryptOtpSession(record)
    const remaining = MAX_ATTEMPTS - record.attempts

    if (remaining <= 0) {
      otpStore.delete(cleanEmail)
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a new verification code.',
        remainingAttempts: 0,
      }
    }

    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      remainingAttempts: remaining,
      sessionToken: updatedToken,
    }
  }

  // 4. OTP is VALID! Account is created ONLY now after verification.
  otpStore.delete(cleanEmail)

  try {
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername || record.username,
        name: `@${cleanUsername || record.username}`,
      },
    })

    if (createError) {
      console.error('Supabase admin createUser error:', createError)
      return {
        success: false,
        error: createError.message || 'Failed to create account.',
      }
    }

    if (!newUser?.user) {
      return {
        success: false,
        error: 'Failed to create user account.',
      }
    }

    return {
      success: true,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Account creation failed'
    console.error('Account creation exception:', msg)
    return { success: false, error: msg }
  }
}
