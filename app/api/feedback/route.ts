import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message: string = (body.message || '').toString().trim()
    const category: string = (body.category || 'General').toString().trim()
    const fromEmail: string = (body.email || '').toString().trim()
    const fromName: string = (body.name || '').toString().trim()

    if (!message || message.length < 5) {
      return NextResponse.json(
        { error: 'Please provide a suggestion with at least 5 characters.' },
        { status: 400 }
      )
    }

    const toEmail = process.env.FEEDBACK_TO_EMAIL || process.env.RESEND_FROM_EMAIL
    if (!toEmail) {
      return NextResponse.json(
        { error: 'Feedback destination email is not configured on the server.' },
        { status: 500 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key is not configured on the server.' },
        { status: 500 }
      )
    }

    const resend = getResend()

    const subject = `New user suggestion: ${category}`

    const html = `
      <h2>New User Suggestion</h2>
      <p><strong>Category:</strong> ${category}</p>
      ${fromName || fromEmail ? `<p><strong>From:</strong> ${fromName || 'Anonymous'}${fromEmail ? ` &lt;${fromEmail}&gt;` : ''}</p>` : '<p><strong>From:</strong> Anonymous</p>'}
      <hr />
      <p style="white-space: pre-wrap;">${message}</p>
    `

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LevelUp <noreply@example.com>',
      to: toEmail,
      subject,
      html,
      reply_to: fromEmail || undefined,
    } as any)

    if (error) {
      console.error('Error sending feedback email:', error)
      return NextResponse.json(
        { error: 'Failed to send feedback email.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in /api/feedback:', error)
    return NextResponse.json(
      { error: 'Something went wrong while submitting feedback.' },
      { status: 500 }
    )
  }
}


