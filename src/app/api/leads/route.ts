import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createLeadSchema = z.object({
  campaign_id: z.string().uuid(),
  vertical_id: z.string().uuid(),
  property_address: z.string(),
  owner_name: z.string(),
  owner_email: z.string().email().optional(),
  owner_phone: z.string().optional(),
  estimated_value: z.number().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'failed']).default('new'),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Filters
    const campaignId = searchParams.get('campaign_id')
    const verticalId = searchParams.get('vertical_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('leads')
      .select('*, campaigns(name), verticals(name, industry)', { count: 'exact' })

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }
    if (verticalId) {
      query = query.eq('vertical_id', verticalId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createLeadSchema.parse(body)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leads')
      .insert([validatedData])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data?.[0] }, { status: 201 })
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
