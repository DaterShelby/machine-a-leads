import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Filters
    const campaignId = searchParams.get('campaign_id')
    const verticalId = searchParams.get('vertical_id')
    const status = searchParams.get('status')

    let query = supabase.from('leads').select('*')

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }
    if (verticalId) {
      query = query.eq('vertical_id', verticalId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert to CSV
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No leads to export' }, { status: 400 })
    }

    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = (row as Record<string, any>)[header]
            if (value === null || value === undefined) return ''
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(',')
      ),
    ].join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-export-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
