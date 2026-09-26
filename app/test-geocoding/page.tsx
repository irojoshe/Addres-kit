'use client'

import { useState } from 'react'

type ProviderResult = { name: string; ok: boolean; data?: unknown; error?: string }

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function TestGeocodingPage() {
  const [lat, setLat] = useState('20.379')
  const [lng, setLng] = useState('-76.643')
  const [apiKey, setApiKey] = useState('')
  const [address, setAddress] = useState('Calle Maceo, Bayamo, Granma')
  const [loading, setLoading] = useState(false)
  const [reverse, setReverse] = useState<ProviderResult[]>([])
  const [forward, setForward] = useState<ProviderResult[]>([])

  const testReverse = async () => {
    setLoading(true)
    setReverse([])
    const out: ProviderResult[] = []
    try {
      const data = await fetchJson(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`
      )
      out.push({ name: 'BigDataCloud (reverse)', ok: true, data })
    } catch (e) {
      out.push({ name: 'BigDataCloud (reverse)', ok: false, error: String(e) })
    }
    if (apiKey.trim()) {
      try {
        const data = await fetchJson(
          `https://us1.locationiq.com/v1/reverse?key=${apiKey.trim()}&lat=${lat}&lon=${lng}&format=json&accept-language=es&zoom=18`
        )
        out.push({ name: 'LocationIQ (reverse)', ok: true, data })
      } catch (e) {
        out.push({ name: 'LocationIQ (reverse)', ok: false, error: String(e) })
      }
    } else {
      out.push({ name: 'LocationIQ (reverse)', ok: false, error: 'Sin API key: pégala en el input de arriba' })
    }
    try {
      const data = await fetchJson(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`
      )
      out.push({ name: 'Nominatim (reverse)', ok: true, data })
    } catch (e) {
      out.push({ name: 'Nominatim (reverse)', ok: false, error: String(e) })
    }
    setReverse(out)
    setLoading(false)
  }

  const testForward = async () => {
    setLoading(true)
    setForward([])
    const out: ProviderResult[] = []
    if (apiKey.trim()) {
      try {
        const data = await fetchJson(
          `https://us1.locationiq.com/v1/search?key=${apiKey.trim()}&q=${encodeURIComponent(address)}&format=json&accept-language=es&limit=3&countrycodes=cu`
        )
        out.push({ name: 'LocationIQ (forward)', ok: true, data })
      } catch (e) {
        out.push({ name: 'LocationIQ (forward)', ok: false, error: String(e) })
      }
    } else {
      out.push({ name: 'LocationIQ (forward)', ok: false, error: 'Sin API key: pégala en el input de arriba' })
    }
    try {
      const data = await fetchJson(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=3&lang=en`
      )
      out.push({ name: 'Photon (forward)', ok: true, data })
    } catch (e) {
      out.push({ name: 'Photon (forward)', ok: false, error: String(e) })
    }
    setForward(out)
    setLoading(false)
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>Prueba comparativa de proveedores (Cuba)</h1>
      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <label>
          Latitud <input value={lat} onChange={(e) => setLat(e.target.value)} style={{ width: 100 }} />
        </label>
        <label>
          Longitud <input value={lng} onChange={(e) => setLng(e.target.value)} style={{ width: 100 }} />
        </label>
        <label>
          LocationIQ key <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="pk...." style={{ width: 220 }} />
        </label>
      </section>
      <section style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={testReverse} disabled={loading}>
          Probar reverse (todos)
        </button>
        <input value={address} onChange={(e) => setAddress(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <button onClick={testForward} disabled={loading}>
          Probar forward
        </button>
      </section>
      {reverse.map((r) => (
        <details key={r.name} open style={{ marginBottom: 8, border: '1px solid #ccc', padding: 8 }}>
          <summary>
            {r.ok ? '✅' : '❌'} {r.name}
          </summary>
          <pre style={{ overflow: 'auto', fontSize: 12 }}>{r.ok ? JSON.stringify(r.data, null, 2) : r.error}</pre>
        </details>
      ))}
      {forward.map((r) => (
        <details key={r.name} open style={{ marginBottom: 8, border: '1px solid #ccc', padding: 8 }}>
          <summary>
            {r.ok ? '✅' : '❌'} {r.name}
          </summary>
          <pre style={{ overflow: 'auto', fontSize: 12 }}>{r.ok ? JSON.stringify(r.data, null, 2) : r.error}</pre>
        </details>
      ))}
    </main>
  )
}
