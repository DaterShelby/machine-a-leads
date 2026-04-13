import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface DVFProperty {
  id_mutation: string;
  date_mutation: string;
  nature_mutation: string;
  nom_commune: string;
  code_postal: string;
  adresse_numero?: number;
  adresse_suffixe?: string;
  adresse_nom_voie: string;
  adresse_type_voie: string;
  code_type_local: string;
  type_local: string;
  surface_reelle_bati: number;
  nombre_pieces_principales: number;
  surface_terrain: number;
  prix_mutations: number;
  longitude: number;
  latitude: number;
  [key: string]: any;
}

interface SearchParams {
  code_postal?: string;
  prix_min?: string;
  prix_max?: string;
  surface_terrain_min?: string;
  limit?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const code_postal = searchParams.get('code_postal');
    const prix_min = parseInt(searchParams.get('prix_min') || '0');
    const prix_max = parseInt(searchParams.get('prix_max') || '10000000');
    const surface_terrain_min = parseInt(searchParams.get('surface_terrain_min') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!code_postal) {
      return NextResponse.json(
        { error: 'code_postal parameter is required' },
        { status: 400 }
      );
    }

    // Appel à l'API DVF
    const dvfUrl = new URL('https://api.cquest.org/dvf');
    dvfUrl.searchParams.set('code_postal', code_postal);
    dvfUrl.searchParams.set('nature_mutation', 'Vente');
    dvfUrl.searchParams.set('type_local', 'Maison');

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

    // Filtrer et enrichir les résultats
    const filtered = results
      .filter((property: DVFProperty) => {
        const price = property.prix_mutations || 0;
        const terrain = property.surface_terrain || 0;

        return (
          price >= prix_min &&
          price <= prix_max &&
          terrain >= surface_terrain_min
        );
      })
      .slice(0, limit)
      .map((property: DVFProperty, index: number) => ({
        id: property.id_mutation || `dvf_${index}`,
        adresse: `${property.adresse_numero || ''} ${property.adresse_type_voie || ''} ${property.adresse_nom_voie || ''}`.trim(),
        ville: property.nom_commune || '',
        code_postal: property.code_postal || '',
        prix: property.prix_mutations || 0,
        surface_terrain: property.surface_terrain || 0,
        surface_bati: property.surface_reelle_bati || 0,
        pieces: property.nombre_pieces_principales || 0,
        type_local: property.type_local || '',
        date_mutation: property.date_mutation || '',
        latitude: property.latitude || 0,
        longitude: property.longitude || 0,
      }));

    return NextResponse.json({
      success: true,
      count: filtered.length,
      total: results.length,
      filters: {
        code_postal,
        prix_min,
        prix_max,
        surface_terrain_min,
      },
      data: filtered,
    });
  } catch (error) {
    console.error('DVF Search Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
