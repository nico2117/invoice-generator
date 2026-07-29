import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createSession, getPassword } from '@/lib/auth/session'

// Simple in-memory rate limiter — resets on cold start, blunts casual brute force
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_ATTEMPTS
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Zu viele Versuche' }, { status: 429 })
  }

  const formData = await req.formData()
  const password = formData.get('password') as string | null

  const expected = getPassword()
  const isValid =
    password !== null &&
    password.length === expected.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expected))

  if (!isValid) {
    return NextResponse.redirect(new URL('/login?error=wrong', req.url))
  }

  const token = await createSession()
  const response = NextResponse.redirect(new URL('/', req.url))
  response.cookies.set('bsk_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
  return response
}
