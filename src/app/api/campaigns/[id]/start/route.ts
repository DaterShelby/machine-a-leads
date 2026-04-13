import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify campaign exists
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Update campaign status to active
    const { data, error } = await supabase
      .from('campaigns')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create pipeline job record
    const { data: job, error: jobError } = await supabase
      .from('pipeline_jobs')
      .insert([
        {
          campaign_id: id,
          job_type: 'full_pipeline',
          status: 'pending',
          progress: 0,
        },
      ])
      .select()

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data?.[0],
      job: job?.[0],
      message: 'Campaign started successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
