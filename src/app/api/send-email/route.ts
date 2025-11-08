import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json()

    // Configurar Resend API
    const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_123456789' // Debes configurar esto en .env.local

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Granimar CR <alertas@granimarkr.com>', // Debes usar un dominio verificado
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('Error in send-email API:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
