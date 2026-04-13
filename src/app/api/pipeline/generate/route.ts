import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const triggerGenerateSchema = z.object({
  campaign_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = triggerGenerateSchema.parse(body)

    const supabase = await createClient()

    // Verify campaign exists
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', validatedData.campaign_id)
      .single()

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Create pipeline job for AI generation
    const { data, error } = await supabase
      .from('pipeline_jobs')
      .insert([
        {
          campaign_id: validatedData.campaign_id,
          job_type: 'generate',
          status: 'pending',
          progress: 0,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: data?.[0],
        message: 'AI generation job triggered',
      },
      { status: 202 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
