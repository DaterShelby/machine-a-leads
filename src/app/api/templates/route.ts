import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createTemplateSchema = z.object({
  vertical_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  subject_line: z.string().min(1),
  body: z.string().min(1),
  template_type: z.enum(['email', 'sms', 'letter']).default('email'),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Filters
    const verticalId = searchParams.get('vertical_id')
    const templateType = searchParams.get('template_type')

    let query = supabase
      .from('templates')
      .select('*, verticals(name)', { count: 'exact' })

    if (verticalId) {
      query = query.or(`vertical_id.eq.${verticalId},vertical_id.is.null`)
    }
    if (templateType) {
      query = query.eq('template_type', templateType)
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
    const validatedData = createTemplateSchema.parse(body)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('templates')
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
