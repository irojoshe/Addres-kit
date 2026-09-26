import type { AddressProvider, Coordinates, DistanceMatrix, RoutingProvider, RouteResult, Suggestion, AddressData, AddressProviderOptions, ForwardOptions, ReverseOptions } from './types'
import { createRetryFetcher } from './types'

const json = async (res: Response) => { if (!res.ok) throw new Error(`Provider error: ${res.status}`); return res.json() }
const query = (params: Record<string, string | number | boolean | undefined>) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))

function getEnv(name: string): string | undefined {
  try {
    if (typeof process !== 'undefined' && (process as any)?.env?.[name]) return (process as any).env[name] as string
  } catch { /* ignore */ }
  try {
    if (typeof (globalThis as any)?.process?.env?.[name] === 'string') return (globalThis as any).process.env[name] as string
  } catch { /* ignore */ }
  return undefined
}

function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0
  while (index < encoded.length) {
    let b: number
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat
    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng
    coords.push([lng / 1e5, lat / 1e5])
  }
  return coords
}

// ---------------------------------------------------------------------------
// Nuevos proveedores (LocationIQ = forward, BigDataCloud = reverse, GraphHopper = routing)
// Docs: https://locationiq.com/docs , https://www.bigdatacloud.com/docs/api/free-api ,
// https://docs.graphhopper.com/#tag/Routing-API
// ---------------------------------------------------------------------------

import { createLocationIQProvider } from './providers/locationiq'
export { createLocationIQProvider }

export function createBigDataCloudProvider(options: AddressProviderOptions = {}): AddressProvider {
  const endpoint = options.endpoint ?? 'https://api.bigdatacloud.net/data'
  const fetcher = createRetryFetcher(options.fetcher ?? fetch, options.retries ?? 2, options.retryDelayMs ?? 350)
  return {
    async forward(_text: string, _opts: ForwardOptions = {}) {
      throw new Error('BigDataCloud no soporta forward geocoding. Usa LocationIQ para autocompletado (createLocationIQProvider).')
    },
    async reverse(coords: Coordinates, opts: ReverseOptions = {}) {
      const params = query({ latitude: coords.latitude, longitude: coords.longitude, localityLanguage: opts.language ?? 'es' })
      const data = await json(await fetcher(`${endpoint}/reverse-geocode-client?${params}`, { signal: opts.signal, headers: options.headers }))
      return {
        address_1: data.locality || data.city || '',
        city: data.city || data.locality || '',
        province: data.principalSubdivision || '',
        postal_code: data.postcode || '',
        country_code: (data.countryCode || '').toLowerCase(),
      } as Partial<AddressData>
    },
  }
}

export function createGraphHopperProvider(options: AddressProviderOptions = {}): RoutingProvider {
  const apiKey = options.apiKey ?? getEnv('NEXT_PUBLIC_GRAPHHOPPER_KEY') ?? ''
  const endpoint = options.endpoint ?? 'https://graphhopper.com/api/1'
  const fetcher = createRetryFetcher(options.fetcher ?? fetch, options.retries ?? 2, options.retryDelayMs ?? 350)
  if (!apiKey) {
    throw new Error('GraphHopper requiere una API key. Obtén una gratis en https://graphhopper.com/#directions-api y pásala como { apiKey } o NEXT_PUBLIC_GRAPHHOPPER_KEY')
  }
  return {
    async route(from: Coordinates, to: Coordinates): Promise<RouteResult> {
      const search = new URLSearchParams()
      search.append('point', `${from.latitude},${from.longitude}`)
      search.append('point', `${to.latitude},${to.longitude}`)
      search.set('profile', 'car')
      search.set('key', apiKey)
      search.set('instructions', 'true')
      search.set('calc_points', 'true')
      const data = await json(await fetcher(`${endpoint}/route?${search.toString()}`, { headers: options.headers }))
      const path = data.paths?.[0]
      if (!path) throw new Error('No se encontró una ruta')
      return {
        geometry: { type: 'LineString', coordinates: decodePolyline(path.points ?? '') },
        distance: path.distance,
        duration: (path.time ?? 0) / 1000,
      }
    },
    async matrix(_points: Coordinates[]): Promise<DistanceMatrix> {
      throw new Error('GraphHopper matrix no implementado en el plan gratuito. Usa OSRM autoalojado para matrices o consulta https://docs.graphhopper.com/.')
    },
  }
}

/** Por defecto: LocationIQ para forward y reverse (con calle, verificado en Cuba). */
export function createDefaultAddressProvider(options: AddressProviderOptions & { locationIqApiKey?: string } = {}): AddressProvider {
  const apiKey = options.locationIqApiKey ?? options.apiKey ?? getEnv('NEXT_PUBLIC_LOCATIONIQ_KEY') ?? ''
  const provider = createLocationIQProvider({ ...options, apiKey })
  return {
    forward: (text, opts) => provider.forward(text, opts),
    reverse: (coords, opts) => provider.reverse(coords, opts),
  }
}

// ---------------------------------------------------------------------------
// Proveedores antiguos: se mantienen como deprecated para no romper la API
// pública v1.3.x. Usa los nuevos en código nuevo.
// ---------------------------------------------------------------------------

/** @deprecated Usa createLocationIQProvider + createBigDataCloudProvider. */
export function createPhotonProvider(options: AddressProviderOptions = {}): AddressProvider {
  const endpoint = options.endpoint ?? 'https://photon.komoot.io'
  const fetcher = createRetryFetcher(options.fetcher ?? fetch, options.retries ?? 2, options.retryDelayMs ?? 350)
  return {
    async forward(text, opts: ForwardOptions = {}) {
      const params = query({ q: text, limit: opts.limit ?? 5, lang: opts.language ?? 'es', lat: opts.location?.latitude, lon: opts.location?.longitude })
      const data = await json(await fetcher(`${endpoint}/api/?${params}`, { signal: opts.signal, headers: options.headers }))
      return (data.features ?? []).filter((feature: any) => !opts.region || feature.properties?.countrycode?.toLowerCase() === opts.region.toLowerCase()).map((feature: any): Suggestion => ({ placeId: String(feature.properties?.osm_id ?? crypto.randomUUID()), description: [feature.properties?.name, feature.properties?.street, feature.properties?.city, feature.properties?.country].filter(Boolean).join(', '), mainText: feature.properties?.name || feature.properties?.street || '', secondaryText: [feature.properties?.city, feature.properties?.country].filter(Boolean).join(', '), coordinates: { latitude: feature.geometry.coordinates[1], longitude: feature.geometry.coordinates[0] } }))
    },
    async reverse(coords, opts: ReverseOptions = {}) {
      const params = query({ latitude: coords.latitude, longitude: coords.longitude, localityLanguage: opts.language ?? 'es' })
      const data = await json(await fetcher(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`, { signal: opts.signal, headers: options.headers }))
      return { address_1: data.locality || data.city || '', city: data.city || data.locality || '', province: data.principalSubdivision || '', postal_code: data.postcode || '', country_code: (data.countryCode || '').toLowerCase() } as Partial<AddressData>
    },
  }
}

export type { AddressProvider, RoutingProvider } from './types'

/** @deprecated Usa createGraphHopperProvider o OSRM autoalojado. */
export function createOSRMProvider(options: AddressProviderOptions = {}): RoutingProvider {
  const endpoint = options.endpoint ?? 'https://router.project-osrm.org'
  const fetcher = createRetryFetcher(options.fetcher ?? fetch, options.retries ?? 2, options.retryDelayMs ?? 350)
  return { async route(from, to): Promise<RouteResult> { const data = await json(await fetcher(`${endpoint}/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`, { headers: options.headers })); const route = data.routes?.[0]; if (!route) throw new Error('No se encontró una ruta'); return { geometry: route.geometry, distance: route.distance, duration: route.duration } }, async matrix(points): Promise<DistanceMatrix> { if (points.length < 2 || points.length > 100) throw new Error('La matriz requiere entre 2 y 100 puntos'); const coords = points.map(p => `${p.longitude},${p.latitude}`).join(';'); const data = await json(await fetcher(`${endpoint}/table/v1/driving/${coords}?annotations=distance,duration`, { headers: options.headers })); return { distances: data.distances, durations: data.durations, sources: points, destinations: points } } }
}
