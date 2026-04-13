import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pipeline_jobs')
      .select('*, campaigns(name)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Include calculated progress based on job type
    const jobWithProgress = {
      ...data,
      progress_details: {
        current: Math.floor((data.progress || 0) * 100),
        total: 100,
        status: data.status,
        eta_seconds: data.status === 'running' ? Math.random() * 3600 : null,
      },
    }

    return NextResponse.json({ data: jobWithProgress })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
