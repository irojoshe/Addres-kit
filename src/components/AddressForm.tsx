'use client'
import { forwardRef, useEffect, useImperativeHandle, useState, useCallback } from 'react'
import { AddressPicker } from './AddressPicker'
import { LocationButton } from './LocationButton'
import { MapView } from './MapView'
import { createDefaultAddressProvider, createPhotonProvider } from '../lib/providers'
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
    const addressProvider: AddressProvider = addressProviderProp ?? (() => {
      try {
        return createDefaultAddressProvider({ locationIqApiKey })
      } catch {
        return createPhotonProvider()
      }
    })()

    const messages = mergeMessages(messagesOverride)
    const { address, setField, setAddressFromData, reset: resetAddress } = useAddressForm(initialAddress)
    const [coordinates, setCoordinates] = useState<Coordinates | null>(
      initialCoordinates ?? null
    )
    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState(false)
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)

    const reset = useCallback(() => {
      resetAddress()
      setCoordinates(initialCoordinates ?? null)
      setError('')
      setSuccess(false)
      setQuery('')
      setSuggestions([])
      setLoadingSuggestions(false)
    }, [resetAddress, initialCoordinates])

    const getValues = useCallback(() => ({
      ...address,
      coordinates: coordinates ?? undefined,
    }), [address, coordinates])

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
      onAddressChange?.(next)
    }

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
      await onSubmit(address as AddressData)
      setSuccess(true)
      onAddressSubmit?.(address as AddressData)
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
            onSuggestionSelect?.(suggestion)
          }}
          language={language}
          countryRestriction={countryRestriction}
        />
        <label>
          Dirección
          <input
            value={address.address_1}
            onChange={(e) => handleChange('address_1', e.target.value)}
            name="address_1"
            placeholder={messages?.address_1Placeholder || 'Calle, número'}
          />
        </label>
        <label>
          Ciudad
          <input
            value={address.city}
            onChange={(e) => handleChange('city', e.target.value)}
            name="city"
            placeholder={messages?.cityPlaceholder || 'Ciudad'}
          />
        </label>
        <label>
          Provincia
          <input
            value={address.province ?? ''}
            onChange={(e) => handleChange('province', e.target.value)}
            name="province"
            placeholder={messages?.provincePlaceholder || 'Provincia o estado'}
          />
        </label>
        <label>
          Código postal
          <input
            value={address.postal_code ?? ''}
            onChange={(e) => handleChange('postal_code', e.target.value)}
            name="postal_code"
            placeholder={messages?.postalCodePlaceholder || 'Código postal'}
          />
        </label>
        <label>
          País
          <input
            value={address.country_code}
            onChange={(e) => handleChange('country_code', e.target.value)}
            name="country_code"
            placeholder={messages?.countryPlaceholder || 'País'}
          />
        </label>
        {showMap && isMapLibreAvailable && <MapView coordinates={coordinates} />}
        {showLocationButton && (
          <LocationButton
            onLocation={async (coords: Coordinates) => {
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
                onLocationFound?.(coords)
              } catch (err) {
                console.error('[geo] reverse ERROR:', err)
                onLocationError?.(err as GeolocationError)
              }
            }}
          />
        )}
        <button type="submit" disabled={loadingSuggestions}>
          {messages?.save || 'Guardar'}
        </button>
      </form>
    )
  }
)