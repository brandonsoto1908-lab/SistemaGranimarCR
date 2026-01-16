import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
      const body = await req.json()
      const password = body?.password

      // Default hardcoded password as requested
      const DEFAULT_PASSWORD = '4315'

      if (!password || password !== DEFAULT_PASSWORD) {
        return NextResponse.json({ ok: false, message: 'Contraseña incorrecta' }, { status: 401 })
      }

      const res = NextResponse.json({ ok: true })
      res.cookies.set({
        name: 'sg_token',
        value: DEFAULT_PASSWORD,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })

      return res
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
