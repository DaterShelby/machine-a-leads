import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const brevoWebhookSchema = z.object({
  event: z.enum(['delivered', 'opened', 'clicked', 'bounce', 'complaint', 'unsubscribe']),
  email: z.string().email(),
  email_id: z.string().optional(),
  message_id: z.string().optional(),
  ts: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = brevoWebhookSchema.parse(body)

    const supabase = await createClient()

    // Log the webhook event to analytics/tracking table
    const { error: logError } = await supabase
      .from('email_events')
      .insert([
        {
          event_type: validatedData.event,
          recipient_email: validatedData.email,
          external_id: validatedData.email_id || validatedData.message_id,
          timestamp: validatedData.ts ? new Date(validatedData.ts * 1000).toISOString() : new Date().toISOString(),
          metadata: {
            event: validatedData.event,
            email_id: validatedData.email_id,
            message_id: validatedData.message_id,
          },
        },
      ])

    if (logError) {
      console.error('Failed to log email event:', logError)
      // Don't fail the webhook response, just log the error
    }

    return NextResponse.json(
      { success: true, message: 'Webhook processed' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Still return 200 to Brevo so they don't retry
      console.error('Invalid webhook payload:', error.errors)
      return NextResponse.json(
        { success: false, error: 'Invalid payload' },
        { status: 200 }
      )
    }

    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 200 }
    )
  }
}
