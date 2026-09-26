import type { AddressProvider, AddressData, AddressProviderOptions, Coordinates, ForwardOptions, ReverseOptions, Suggestion } from '../types'
import { createRetryFetcher } from '../types'

// Docs: https://locationiq.com/docs
// Probado con Cuba (Bayamo 20.379,-76.643): devuelve road + house_number +
// neighbourhood + city + state + postcode + country_code.

const json = async (res: Response) => { if (!res.ok) throw new Error(`Provider error: ${res.status}`); return res.json() }
const query = (params: Record<string, string | number | boolean | undefined>) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))

function getEnv(name: string): string | undefined {
  try {
    if (typeof process !== 'undefined' && (process as any)?.env?.[name]) return (process as any).env[name] as string
  } catch { /* ignore */ }
  return undefined
}

function mapReverseToAddressData(a: any): Partial<AddressData> {
  const road = a?.road ?? ''
  const houseNumber = a?.house_number ?? ''
  return {
    address_1: [road, houseNumber].filter(Boolean).join(' '),
    address_2: a?.neighbourhood ?? a?.suburb ?? '',
    city: a?.city || a?.town || a?.village || '',
    province: a?.state ?? '',
    postal_code: a?.postcode ?? '',
    country_code: (a?.country_code || '').toLowerCase(),
  }
}

export function createLocationIQProvider(options: AddressProviderOptions = {}): AddressProvider {
  const apiKey = options.apiKey ?? getEnv('NEXT_PUBLIC_LOCATIONIQ_KEY') ?? ''
  const endpoint = options.endpoint ?? 'https://api.locationiq.com/v1'
  const fetcher = createRetryFetcher(options.fetcher ?? fetch, options.retries ?? 2, options.retryDelayMs ?? 350)
  if (!apiKey) {
    throw new Error('LocationIQ requiere una API key. Obtén una gratis en https://locationiq.com/register y pásala como { apiKey } o NEXT_PUBLIC_LOCATIONIQ_KEY')
  }
  return {
    async forward(text, opts: ForwardOptions = {}) {
      const params = query({
        key: apiKey,
        q: text,
        limit: opts.limit ?? 5,
        countrycodes: opts.countryRestriction?.join(','),
        'accept-language': opts.language ?? 'es',
        lat: opts.location?.latitude,
        lon: opts.location?.longitude,
      })
      const data = await json(await fetcher(`${endpoint}/autocomplete?${params}`, { signal: opts.signal, headers: options.headers }))
      const items = Array.isArray(data) ? data : []
      return items.map((item: any): Suggestion => ({
        placeId: String(item.place_id ?? item.osm_id ?? crypto.randomUUID()),
        description: item.display_name ?? '',
        mainText: item.address?.name || item.display_name?.split(',')[0]?.trim() || '',
        secondaryText: item.display_name?.split(',').slice(1).join(',').trim() || '',
        coordinates: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) },
      }))
    },
    async reverse(coords: Coordinates, opts: ReverseOptions = {}) {
      const params = query({
        key: apiKey,
        lat: coords.latitude,
        lon: coords.longitude,
        format: 'json',
        'accept-language': opts.language ?? 'es',
        zoom: 18,
      })
      const data = await json(await fetcher(`${endpoint}/reverse?${params}`, { signal: opts.signal, headers: options.headers }))
      return mapReverseToAddressData(data?.address)
    },
  }
}
