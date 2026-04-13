import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface DVFProperty {
  prix_mutations?: number;
  surface_terrain?: number;
  nom_commune?: string;
}

interface StatsParams {
  code_postal?: string;
  nature_mutation?: string;
  type_local?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const code_postal = searchParams.get('code_postal');
    const nature_mutation = searchParams.get('nature_mutation') || 'Vente';
    const type_local = searchParams.get('type_local') || 'Maison';

    if (!code_postal) {
      return NextResponse.json(
        { error: 'code_postal parameter is required' },
        { status: 400 }
      );
    }

    // Appel à l'API DVF
    const dvfUrl = new URL('https://api.cquest.org/dvf');
    dvfUrl.searchParams.set('code_postal', code_postal);
    dvfUrl.searchParams.set('nature_mutation', nature_mutation);
    dvfUrl.searchParams.set('type_local', type_local);

    const response = await fetch(dvfUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DVF API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    // Calculer les stats
    const prices = results
      .filter((p: DVFProperty) => p.prix_mutations && p.prix_mutations > 0)
      .map((p: DVFProperty) => p.prix_mutations as number);

    const stats = {
      total_properties: results.length,
      properties_with_price: prices.length,
      average_price: prices.length > 0 ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0,
      median_price: prices.length > 0 ? prices.sort((a: number, b: number) => a - b)[Math.floor(prices.length / 2)] : 0,
      min_price: prices.length > 0 ? Math.min(...prices) : 0,
      max_price: prices.length > 0 ? Math.max(...prices) : 0,
      price_per_m2: 0,
      surface_terrain_avg: 0,
      top_cities: [] as Array<{ city: string; count: number; avg_price: number }>,
    };

    // Calculer surface moyenne et prix/m²
    const surfaces = results
      .filter((p: DVFProperty) => p.surface_terrain && p.surface_terrain > 0)
      .map((p: DVFProperty) => p.surface_terrain as number);

    if (surfaces.length > 0) {
      stats.surface_terrain_avg = Math.round(surfaces.reduce((a: number, b: number) => a + b, 0) / surfaces.length);
    }

    if (surfaces.length > 0 && prices.length > 0) {
      const totalSurface = surfaces.reduce((a: number, b: number) => a + b, 0);
      const totalPrice = prices.reduce((a: number, b: number) => a + b, 0);
      stats.price_per_m2 = Math.round(totalPrice / totalSurface);
    }

    // Top cities
    const cityStats: Record<string, { count: number; prices: number[] }> = {};

    results.forEach((property: DVFProperty) => {
      const city = property.nom_commune || 'Unknown';
      if (!cityStats[city]) {
        cityStats[city] = { count: 0, prices: [] };
      }
      cityStats[city].count++;
      if (property.prix_mutations) {
        cityStats[city].prices.push(property.prix_mutations);
      }
    });

    stats.top_cities = Object.entries(cityStats)
      .map(([city, data]) => ({
        city,
        count: data.count,
        avg_price: data.prices.length > 0 ? Math.round(data.prices.reduce((a: number, b: number) => a + b, 0) / data.prices.length) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      filters: {
        code_postal,
        nature_mutation,
        type_local,
      },
      stats,
    });
  } catch (error) {
    console.error('DVF Stats Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
