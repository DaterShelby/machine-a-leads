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

    // Update campaign status to paused
    const { data, error } = await supabase
      .from('campaigns')
      .update({ status: 'paused', paused_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update any active pipeline jobs to paused
    const { error: jobError } = await supabase
      .from('pipeline_jobs')
      .update({ status: 'paused' })
      .eq('campaign_id', id)
      .in('status', ['pending', 'running'])

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data?.[0],
      message: 'Campaign paused successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
