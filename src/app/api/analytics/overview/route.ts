import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get('campaign_id')

    // Get campaign count
    let campaignQuery = supabase.from('campaigns').select('id', { count: 'exact' })
    if (campaignId) {
      campaignQuery = campaignQuery.eq('id', campaignId)
    }
    const { count: totalCampaigns } = await campaignQuery

    // Get total leads
    let leadQuery = supabase.from('leads').select('id', { count: 'exact' })
    if (campaignId) {
      leadQuery = leadQuery.eq('campaign_id', campaignId)
    }
    const { count: totalLeads } = await leadQuery

    // Get leads by status
    const { data: leadsByStatus } = await supabase
      .from('leads')
      .select('status', { count: 'exact' })

    const statusCounts = {
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      failed: 0,
    }

    if (leadsByStatus) {
      leadsByStatus.forEach((lead: any) => {
        if (lead.status in statusCounts) {
          statusCounts[lead.status as keyof typeof statusCounts]++
        }
      })
    }

    // Get active campaigns
    const { count: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' })
      .eq('status', 'active')

    // Get total verticals
    const { count: totalVerticals } = await supabase
      .from('verticals')
      .select('id', { count: 'exact' })

    return NextResponse.json({
      data: {
        totalCampaigns: totalCampaigns || 0,
        activeCampaigns: activeCampaigns || 0,
        totalLeads: totalLeads || 0,
        totalVerticals: totalVerticals || 0,
        leads_by_status: statusCounts,
        conversion_rate:
          totalLeads && totalLeads > 0
            ? ((statusCounts.converted / totalLeads) * 100).toFixed(2)
            : '0.00',
        pipeline_efficiency: totalLeads && totalLeads > 0 ? ((statusCounts.qualified / totalLeads) * 100).toFixed(2) : '0.00',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
