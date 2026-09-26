'use client'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, useCallback } from 'react'
import { AddressPicker } from './AddressPicker'
import { LocationButton } from './LocationButton'
import { MapView } from './MapView'
import { createDefaultAddressProvider, createPhotonProvider } from '../lib/providers'
import { parseCubanAddress } from '../lib/cuban-address-parser'
import { useAddressForm } from '../hooks/useAddressForm'
import type { AddressData, AddressFormCallbacks, AddressFormHandle, AddressProvider, Coordinates, Suggestion, GeolocationError } from '../lib/types'
import { mergeMessages, type Messages } from '../lib/messages'

const isMapLibreAvailable = typeof window !== 'undefined' && 'maplibregl' in window

export interface AddressFormProps extends AddressFormCallbacks {
  onSubmit: (address: AddressData) => void | Promise<void>
  addressProvider?: AddressProvider
  routingProvider?: import('../lib/providers').RoutingProvider
  locationIqApiKey?: string
  graphHopperApiKey?: string
  initialAddress?: Partial<AddressData>
  initialCoordinates?: Coordinates
  language?: string
  countryRestriction?: string[]
  showMap?: boolean
  showLocationButton?: boolean
  className?: string
  messages?: Partial<Messages>
}

export const AddressForm = forwardRef<AddressFormHandle, AddressFormProps>(
  function AddressForm(props, ref) {
    const {
      onSubmit,
      addressProvider: addressProviderProp,
      routingProvider: routingProviderProp,
      locationIqApiKey,
      graphHopperApiKey,
      initialAddress,
      initialCoordinates,
      language = 'es',
      countryRestriction,
      showMap = true,
      showLocationButton = true,
      className,
      messages: messagesOverride,
      onSuggestionSelect,
      onLocationFound,
      onLocationError,
      onAddressChange,
      onAddressSubmit,
      onError,
    } = props

    void routingProviderProp
    void graphHopperApiKey
    // Memoizado: identidad estable para no re-disparar efectos que dependen del provider
    const addressProvider: AddressProvider = useMemo(() => addressProviderProp ?? (() => {
      try {
        return createDefaultAddressProvider({ locationIqApiKey })
      } catch {
        return createPhotonProvider()
      }
    })(), [addressProviderProp, locationIqApiKey])

    const messages = mergeMessages(messagesOverride)
    const { address, setField, setAddressFromData, reset: resetAddress } = useAddressForm(initialAddress)
    const [coordinates, setCoordinates] = useState<Coordinates | null>(
      initialCoordinates ?? null
    )
    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState(false)
    const [verifyStatus, setVerifyStatus] = useState<string | null>(null)
    const [verified, setVerified] = useState<'idle' | 'ok' | 'fail'>('idle')
    const [verifying, setVerifying] = useState(false)
    const lastForwardQuery = useRef('')
    // cuba-geodata es peer opcional: solo selects si está instalado y país = cu
    const [cubaMod, setCubaMod] = useState<any>(null)
    const [cubaProvinces, setCubaProvinces] = useState<string[]>([])
    useEffect(() => {
      let cancelled = false
      ;(async () => {
        try {
          const mod: any = await import(
            /* webpackIgnore: true */ /* @vite-ignore */ 'cuba-geodata'
          )
          if (cancelled) return
          const api = mod?.default ?? mod
          const raw = api?.getProvinces?.() ?? []
          const names = Array.isArray(raw)
            ? raw.map((p: any) => (typeof p === 'string' ? p : p?.name ?? String(p)))
            : []
          setCubaMod(api)
          setCubaProvinces(names)
        } catch {
          // No instalado (o sin soporte SQLite en navegador): inputs de texto
        }
      })()
      return () => {
        cancelled = true
      }
    }, [])
    const useCubaSelects =
      cubaMod !== null &&
      cubaProvinces.length > 0 &&
      address.country_code.trim().toLowerCase() === 'cu'
    const cubaCities: string[] = useCubaSelects
      ? (() => {
          try {
            const one = cubaMod.getProvinces?.(address.province ?? '', 1) as any
            const list = Array.isArray(one?.cities) ? one.cities : []
            return list.map((c: any) => (typeof c === 'string' ? c : c?.name ?? String(c)))
          } catch {
            return []
          }
        })()
      : []
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    // Entre-calles cubanas: estado local (el provider no las devuelve).
    // En el submit se componen en address_2 como "Entre X y Y".
    const [entre1, setEntre1] = useState('')
    const [entre2, setEntre2] = useState('')

    const reset = useCallback(() => {
      resetAddress()
      setCoordinates(initialCoordinates ?? null)
      setError('')
      setSuccess(false)
      setQuery('')
      setSuggestions([])
      setLoadingSuggestions(false)
      setEntre1('')
      setEntre2('')
      setVerifyStatus(null)
      setVerified('idle')
    }, [resetAddress, initialCoordinates])

    // address_1 guarda "Calle [#número]"; se deriva para los inputs.
    const streetParts = parseCubanAddress(address.address_1 || '')

    // Payload final: compone "Entre X y Y" en address_2 si están ambas.
    const buildPayload = useCallback((): AddressData => {
      const entre =
        entre1.trim() && entre2.trim() ? `Entre ${entre1.trim()} y ${entre2.trim()}` : ''
      return {
        ...address,
        address_2: entre || address.address_2,
        coordinates: coordinates ?? undefined,
      } as AddressData
    }, [address, coordinates, entre1, entre2])

    const getValues = useCallback(() => buildPayload(), [buildPayload])

    const setValues = useCallback((values: Partial<AddressData>) => {
      const { coordinates: coords, ...rest } = values
      setAddressFromData(rest)
      if (coords) setCoordinates(coords)
    }, [setAddressFromData])

    const validate = useCallback(() => {
      // usar AddressDataSchema.safeParse
      return { valid: true, errors: {} }
    }, [address, coordinates])

    const focus = useCallback(() => {
      // enfocar el input principal via ref interno
      const input = document.querySelector<HTMLInputElement>('[name="address_1"]')
      if (input) {
        input.focus()
      }
    }, [])

    useImperativeHandle(ref, () => ({
      reset,
      getValues,
      setValues,
      validate,
      focus,
    }), [reset, getValues, setValues, validate, focus])

    const handleChange = (field: keyof AddressData, value: string) => {
      const next = { ...address, [field]: value }
      setField(field, value)
      setVerified('idle')
      onAddressChange?.(next)
    }

    const handleProvinceChange = (value: string) => {
      handleChange('province', value)
      handleChange('city', '')
    }

    const handleStreetChange = (value: string) => {
      const num = streetParts.number
      handleChange('address_1', num ? `${value} #${num}` : value)
    }

    const handleNumberChange = (value: string) => {
      const clean = value.replace(/#/g, '').trim()
      const street = streetParts.street
      handleChange('address_1', clean ? (street ? `${street} #${clean}` : `#${clean}`) : street)
    }

    // Estable (useCallback): LocationButton dispara onLocation en un useEffect
    // y un callback inline re-crearía el bucle de 300 requests.
    const handleLocationFound = useCallback(async (coords: Coordinates) => {
      console.log('[geo] onLocation received:', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: new Date().toISOString(),
      })
      if (typeof coords.accuracy === 'number' && coords.accuracy > 1000) {
        console.warn('[geo] accuracy >1000m — probablemente geolocalización por IP, no GPS')
      }
      setCoordinates(coords)
      try {
        const fields = await addressProvider.reverse(coords, { language })
        console.log('[geo] reverse OK:', fields)
        setAddressFromData({ ...fields, coordinates: coords, source: 'geolocation', verified: true })
        setEntre1('')
        setEntre2('')
        setVerified('idle')
        onLocationFound?.(coords)
      } catch (err) {
        console.error('[geo] reverse ERROR:', err)
        onLocationError?.(err as GeolocationError)
      }
    }, [addressProvider, language, setAddressFromData, onLocationFound, onLocationError])

    // Pin movido en el mapa → reverse + actualizar campos
    const handleMarkerDrag = useCallback(async (coords: Coordinates) => {
      setCoordinates(coords)
      try {
        const fields = await addressProvider.reverse(coords, { language })
        setAddressFromData({ ...fields, coordinates: coords, source: 'manual', verified: false })
        setEntre1('')
        setEntre2('')
        setVerified('idle')
      } catch {
        // Se conserva el pin aunque falle el reverse
      }
    }, [addressProvider, language, setAddressFromData])

    // Verificar en el mapa: dirección del formulario → forward → centrar pin
    // Estados: idle → verifying → ok (verde) | fail (amarillo)
    const verifyOnMap = useCallback(async () => {
      const q = [address.address_1, address.city, address.province, address.postal_code, address.country_code].filter(Boolean).join(', ')
      if (!q.trim()) {
        setVerified('fail')
        setVerifyStatus('Escribe una dirección primero')
        return
      }
      setVerifying(true)
      setVerified('idle')
      setVerifyStatus(null)
      try {
        const results = await addressProvider.forward(q, { language, countryRestriction, limit: 1 })
        const first = results[0]
        if (!first) {
          setVerified('fail')
          setVerifyStatus('No se pudo verificar, ajusta el pin manualmente')
          return
        }
        lastForwardQuery.current = q
        setCoordinates(first.coordinates)
        setVerified('ok')
        setVerifyStatus('Dirección verificada')
      } catch {
        setVerified('fail')
        setVerifyStatus('No se pudo verificar, ajusta el pin manualmente')
      } finally {
        setVerifying(false)
      }
    }, [address, addressProvider, language, countryRestriction])

    // Campos → pin (debounce 800ms). Solo mueve coordenadas, nunca la
    // dirección, así que no puede realimentarse en bucle.
    useEffect(() => {
      const q = [address.address_1, address.city, address.province, address.country_code].filter(Boolean).join(', ')
      if (!q.trim() || q === lastForwardQuery.current) return
      const t = setTimeout(async () => {
        try {
          const results = await addressProvider.forward(q, { language, countryRestriction, limit: 1 })
          const first = results[0]
          if (!first) return
          lastForwardQuery.current = q
          setCoordinates(first.coordinates)
        } catch {
          // Silencioso: el botón Verificar muestra el error si hace falta
        }
      }, 800)
      return () => clearTimeout(t)
    }, [address.address_1, address.city, address.province, address.country_code, addressProvider, language, countryRestriction])

    const submit = async (event: React.FormEvent) => {
      event.preventDefault()
      setError('')
      setSuccess(false)
      const result = { valid: true, error: '' }
      if (!result.valid) {
        setError(result.error)
        onError?.({ code: 'validation', message: result.error })
        return
      }
      const payload = buildPayload()
      await onSubmit(payload)
      setSuccess(true)
      onAddressSubmit?.(payload)
    }

    // Focus automático en address_1 al montar (no address_2 como antes)
    useEffect(() => {
      const input = document.querySelector<HTMLInputElement>('[name="address_1"]')
      if (input) {
        input.focus()
      }
    }, [])

    return (
      <form className={className} onSubmit={submit}>
        <AddressPicker
          provider={addressProvider}
          onSelect={(suggestion: Suggestion) => {
            setAddressFromData({
              address_1: suggestion.mainText,
              city: suggestion.secondaryText.split(',')[0]?.trim() ?? '',
              coordinates: suggestion.coordinates,
              source: 'autocomplete',
              verified: true,
            })
            setCoordinates(suggestion.coordinates)
            setSuggestions([])
            setEntre1('')
            setEntre2('')
            setVerified('idle')
            onSuggestionSelect?.(suggestion)
          }}
          language={language}
          countryRestriction={countryRestriction}
        />
        <fieldset>
          <legend>Dirección exacta</legend>
          <label>
            Calle
            {verified === 'ok' && (
              <span role="img" aria-label="dirección verificada" title="Dirección verificada" style={{ color: 'green' }}> ✓</span>
            )}
            {verified === 'fail' && (
              <span role="img" aria-label="dirección no verificada" title="No verificada" style={{ color: '#b58900' }}> ⚠</span>
            )}
            <input
              value={streetParts.street}
              onChange={(e) => handleStreetChange(e.target.value)}
              name="address_1"
              placeholder={messages?.address_1Placeholder || 'Calle Maceo'}
            />
          </label>
          <label>
            Número
            <input
              value={streetParts.number}
              onChange={(e) => handleNumberChange(e.target.value)}
              name="address_number"
              placeholder="123"
            />
          </label>
          <label>
            Entre calle 1
            <input
              value={entre1}
              onChange={(e) => { setEntre1(e.target.value); setVerified('idle') }}
              name="address_between1"
              placeholder="Figueredo"
            />
          </label>
          <label>
            Y calle 2
            <input
              value={entre2}
              onChange={(e) => { setEntre2(e.target.value); setVerified('idle') }}
              name="address_between2"
              placeholder="Lora"
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Ubicación administrativa</legend>
          <label>
            Municipio
            {useCubaSelects ? (
              <select value={address.city} onChange={(e) => handleChange('city', e.target.value)} name="city">
                <option value="">Selecciona municipio</option>
                {Array.from(new Set([address.city, ...cubaCities].filter(Boolean))).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                value={address.city}
                onChange={(e) => handleChange('city', e.target.value)}
                name="city"
                placeholder={messages?.cityPlaceholder || 'Bayamo'}
              />
            )}
          </label>
          <label>
            Provincia
            {useCubaSelects ? (
              <select value={address.province ?? ''} onChange={(e) => handleProvinceChange(e.target.value)} name="province">
                <option value="">Selecciona provincia</option>
                {Array.from(new Set([address.province ?? '', ...cubaProvinces].filter(Boolean))).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <input
                value={address.province ?? ''}
                onChange={(e) => handleChange('province', e.target.value)}
                name="province"
                placeholder={messages?.provincePlaceholder || 'Granma'}
              />
            )}
          </label>
          <label>
            País
            <input
              value={address.country_code}
              onChange={(e) => handleChange('country_code', e.target.value)}
              name="country_code"
              placeholder={messages?.countryPlaceholder || 'cu'}
            />
          </label>
        </fieldset>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          {showLocationButton && (
            <LocationButton onLocation={handleLocationFound} />
          )}
          <button
            type="button"
            onClick={verifyOnMap}
            disabled={verifying}
            style={
              verifying
                ? {}
                : verified === 'ok'
                  ? { backgroundColor: '#dcfce7', borderColor: '#16a34a', color: '#166534' }
                  : verified === 'fail'
                    ? { backgroundColor: '#fef9c3', borderColor: '#ca8a04', color: '#854d0e' }
                    : {}
            }
          >
            {verifying ? 'Verificando...' : verified === 'ok' ? '✓ Verificada' : verified === 'fail' ? '⚠ No verificada' : '✓ Verificar dirección'}
          </button>
          {verifyStatus && <small role="status">{verifyStatus}</small>}
        </div>
        {showMap && isMapLibreAvailable && (
          <div style={{ marginTop: 8 }}>
            <MapView coordinates={coordinates} onMarkerDrag={handleMarkerDrag} />
            <div style={{ marginTop: 4 }}>
              <div>📍 Ubicación seleccionada</div>
              <div>{[address.address_1, address.city].filter(Boolean).join(', ') || '—'}</div>
              <div>
                Precisión: {coordinates?.accuracy != null ? `${Math.round(coordinates.accuracy)}m` : 'desconocida'}{' '}
                {coordinates?.accuracy != null ? (coordinates.accuracy <= 100 ? '✓' : '⚠') : ''}
              </div>
              <small>Ajusta el pin si no es exacto</small>
            </div>
          </div>
        )}
        <button type="submit" disabled={loadingSuggestions}>
          {messages?.save || 'Guardar'}
        </button>
      </form>
    )
  }
)