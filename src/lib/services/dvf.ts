/**
 * DVF (Demandes de Valeurs Foncieres) Data Collection Service
 *
 * Fetches French property transaction data from the public API.
 * API: https://api.cquest.org/dvf
 * Supports filtering by commune, postal code, and price ranges.
 */

import { DVFProperty, DVFSearchParams, VerticalConfig } from '@/types';

const DVF_API_URL = 'https://api.cquest.org/dvf';

/**
 * Logs messages with service context
 */
function log(message: string, data?: any) {
  console.log(`[DVF] ${message}`, data || '');
}

function logError(message: string, error?: any) {
  console.error(`[DVF] ERROR: ${message}`, error || '');
}

/**
 * Searches for properties in the DVF database
 *
 * @param params - Search parameters (communes, postal code, price range, etc.)
 * @returns Array of DVF properties matching the search criteria
 * @throws Error if the API request fails
 */
export async function searchProperties(
  params: DVFSearchParams
): Promise<DVFProperty[]> {
  try {
    log('Searching properties with params', params);

    const searchParams = new URLSearchParams();

    if (params.communes && params.communes.length > 0) {
      searchParams.append('commune', params.communes[0]);
    }

    if (params.codePostal) {
      searchParams.append('code_postal', params.codePostal);
    }

    if (params.minPrice) {
      searchParams.append('prix_min', params.minPrice.toString());
    }

    if (params.maxPrice) {
      searchParams.append('prix_max', params.maxPrice.toString());
    }

    if (params.limit) {
      searchParams.append('limit', Math.min(params.limit, 100).toString());
    } else {
      searchParams.append('limit', '50');
    }

    if (params.offset) {
      searchParams.append('offset', params.offset.toString());
    }

    const url = `${DVF_API_URL}?${searchParams.toString()}`;
    log(`Fetching from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DVF API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const features = data.features || [];

    log(`Found ${features.length} properties`);

    return features.map((feature: any) => parseProperty(feature));
  } catch (error) {
    logError('Failed to search properties', error);
    throw error;
  }
}

/**
 * Parses a DVF API feature into a DVFProperty object
 */
function parseProperty(feature: any): DVFProperty {
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [null, null];

  return {
    id: `dvf_${props.id_mutation || Date.now()}`,
    address: [props.adresse_numero, props.adresse_suffixe, props.adresse_nom_voie]
      .filter(Boolean)
      .join(' '),
    commune: props.nom_commune || '',
    codePostal: props.code_postal || '',
    departement: props.code_departement || '',
    latitude: coords[1],
    longitude: coords[0],
    price: parseFloat(props.valeur_fonciere || 0),
    surface: parseFloat(props.lot_surface_carrez || props.surface_reelle_bati || 0),
    typeLocal: props.type_local || '',
    typeTransaction: props.type_mutation || '',
    dateTransaction: props.date_mutation || '',
    rawData: props,
  };
}

/**
 * Enriches a property with geocoding coordinates if missing
 *
 * @param property - DVF property to enrich
 * @returns Enriched property with coordinates
 * @throws Error if geocoding fails
 */
export async function enrichWithCoordinates(
  property: DVFProperty
): Promise<DVFProperty> {
  // If coordinates already exist, return as-is
  if (property.latitude && property.longitude) {
    return property;
  }

  try {
    log(`Geocoding property: ${property.address}`);

    const geocodingUrl = new URL('https://nominatim.openstreetmap.org/search');
    geocodingUrl.searchParams.append('q', `${property.address}, ${property.codePostal}`);
    geocodingUrl.searchParams.append('format', 'json');
    geocodingUrl.searchParams.append('limit', '1');

    const response = await fetch(geocodingUrl.toString(), {
      headers: {
        'User-Agent': 'MachineALeads/1.0',
      },
    });

    if (!response.ok) {
      logError(`Geocoding failed for ${property.address}`);
      return property;
    }

    const results = await response.json();
    if (results && results.length > 0) {
      property.latitude = parseFloat(results[0].lat);
      property.longitude = parseFloat(results[0].lon);
      log(`Geocoded: ${property.address} -> ${property.latitude}, ${property.longitude}`);
    }

    return property;
  } catch (error) {
    logError(`Error geocoding property: ${property.address}`, error);
    return property;
  }
}

/**
 * Filters properties based on vertical-specific eligibility criteria
 *
 * @param properties - Properties to filter
 * @param vertical - Vertical configuration with filtering rules
 * @returns Filtered properties matching the vertical criteria
 */
export async function filterEligibleProperties(
  properties: DVFProperty[],
  vertical: VerticalConfig
): Promise<DVFProperty[]> {
  try {
    log(`Filtering ${properties.length} properties for vertical: ${vertical.name}`);

    let filtered = properties;

    // Remove properties without essential data
    filtered = filtered.filter((p) => {
      return p.latitude && p.longitude && p.price > 0 && p.surface > 0;
    });

    // Apply vertical-specific filters
    if (vertical.priorityFilters) {
      if (vertical.priorityFilters.minPrice) {
        filtered = filtered.filter((p) => p.price >= vertical.priorityFilters.minPrice);
      }

      if (vertical.priorityFilters.maxPrice) {
        filtered = filtered.filter((p) => p.price <= vertical.priorityFilters.maxPrice);
      }

      if (vertical.priorityFilters.minSurface) {
        filtered = filtered.filter((p) => p.surface >= vertical.priorityFilters.minSurface);
      }

      if (vertical.priorityFilters.maxSurface) {
        filtered = filtered.filter((p) => p.surface <= vertical.priorityFilters.maxSurface);
      }

      if (vertical.priorityFilters.typeLocal) {
        const types = vertical.priorityFilters.typeLocal;
        filtered = filtered.filter((p) =>
          types.includes(p.typeLocal)
        );
      }
    }

    log(`Filtered to ${filtered.length} eligible properties`);
    return filtered;
  } catch (error) {
    logError('Error filtering properties', error);
    return properties;
  }
}

/**
 * Calculates property statistics for reporting
 */
export function calculatePropertyStats(properties: DVFProperty[]): {
  count: number;
  avgPrice: number;
  avgSurface: number;
  priceRange: [number, number];
  surfaceRange: [number, number];
} {
  if (properties.length === 0) {
    return {
      count: 0,
      avgPrice: 0,
      avgSurface: 0,
      priceRange: [0, 0],
      surfaceRange: [0, 0],
    };
  }

  const prices = properties.map((p) => p.price).sort((a, b) => a - b);
  const surfaces = properties.map((p) => p.surface).sort((a, b) => a - b);

  return {
    count: properties.length,
    avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
    avgSurface: surfaces.reduce((a, b) => a + b, 0) / surfaces.length,
    priceRange: [prices[0], prices[prices.length - 1]],
    surfaceRange: [surfaces[0], surfaces[surfaces.length - 1]],
  };
}

export type { DVFProperty, DVFSearchParams };
