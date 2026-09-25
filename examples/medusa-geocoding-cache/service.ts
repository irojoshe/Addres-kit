// Ejemplo de referencia para BACKEND Medusa (no es parte del core de la librería).
// El core no importa nada de Medusa. Copia este patrón en tu proyecto Medusa.
//
// 1) Activa caché Redis en medusa-config.ts con @medusajs/caching + @medusajs/caching-redis.
// 2) Usa GeocodingCacheService para guardar forward/reverse 24h.
// 3) Serializa llamadas a GraphHopper con RateLimitedQueue (1/seg).
// 4) Expón GET /api/v1/geocode/forward?q=... y GET /api/v1/geocode/reverse?lat=..&lng=..

export class GeocodingCacheService {
  protected cachingModuleService_: any
  protected logger_: any

  constructor({ cachingModuleService, logger }: any) {
    this.cachingModuleService_ = cachingModuleService
    this.logger_ = logger
  }

  async getCachedReverse(lat: number, lng: number) {
    const key = `geo:reverse:${lat.toFixed(4)}:${lng.toFixed(4)}`
    return await this.cachingModuleService_.get(key)
  }

  async setCachedReverse(lat: number, lng: number, data: any) {
    const key = `geo:reverse:${lat.toFixed(4)}:${lng.toFixed(4)}`
    await this.cachingModuleService_.set(key, data, { ttl: 86400 })
  }

  async getCachedForward(query: string) {
    const key = `geo:forward:${query.toLowerCase().trim()}`
    return await this.cachingModuleService_.get(key)
  }

  async setCachedForward(query: string, data: any) {
    const key = `geo:forward:${query.toLowerCase().trim()}`
    await this.cachingModuleService_.set(key, data, { ttl: 86400 })
  }
}

export class RateLimitedQueue {
  private queue: Array<{ fn: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void }> = []
  private processing = false
  private readonly minInterval = 1000

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      void this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return
    this.processing = true
    while (this.queue.length > 0) {
      const item = this.queue.shift()!
      try {
        item.resolve(await item.fn())
      } catch (error) {
        item.reject(error)
      }
      await new Promise((r) => setTimeout(r, this.minInterval))
    }
    this.processing = false
  }
}

// Ejemplo de endpoint Medusa (reverse con caché + BigDataCloud):
// export async function GET(req: any, res: any) {
//   const { lat, lng } = req.query
//   const cache = req.scope.resolve('geocodingCacheService') as GeocodingCacheService
//   const cached = await cache.getCachedReverse(parseFloat(lat), parseFloat(lng))
//   if (cached) return res.json(cached)
//   const data = await fetch(
//     `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`
//   ).then((r) => r.json())
//   await cache.setCachedReverse(parseFloat(lat), parseFloat(lng), data)
//   return res.json(data)
// }
