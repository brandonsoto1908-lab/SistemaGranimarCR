import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const token = cookies().get('sg_token')?.value
  const DEFAULT_PASSWORD = '4315'
  const authenticated = !!token && token === DEFAULT_PASSWORD
  return NextResponse.json({ authenticated })
}
