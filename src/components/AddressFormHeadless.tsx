'use client'
import { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react'
import type { AddressData, AddressFormCallbacks, AddressFormHandle, AddressFormHeadlessState, Coordinates, Suggestion } from '../lib/types'
import type { AddressProvider } from '../lib/providers'

const isMapLibreAvailable = typeof window !== 'undefined' && 'maplibregl' in window

export interface AddressFormHeadlessProps extends AddressFormCallbacks {
  addressProvider: AddressProvider
  initialAddress?: Partial<AddressData>
  initialCoordinates?: Coordinates
  language?: string
  countryRestriction?: string[]
  showMap?: boolean
  children: (state: AddressFormHeadlessState) => React.ReactNode
}

export const AddressFormHeadless = forwardRef<AddressFormHandle, AddressFormHeadlessProps>(
  function AddressFormHeadless(props, ref) {
    const {
      addressProvider,
      initialAddress = {},
      initialCoordinates,
      language = 'es',
      countryRestriction,
      showMap,
      children,
      onSuggestionSelect,
      onLocationFound,
      onLocationError,
      onAddressChange,
      onAddressSubmit,
      onError,
    } = props

    const hasMapLibre = showMap !== false && typeof window !== 'undefined' && 'maplibregl' in window

    const [fields, setFields] = useState<Partial<AddressData>>({ ...initialAddress })
    const [coordinates, setCoordinates] = useState<Coordinates | null>(
      initialCoordinates ?? null
    )
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const setField = useCallback((field: keyof AddressData, value: string) => {
      setFields((prev) => {
        const next = { ...prev, [field]: value }
        onAddressChange?.(next)
        return next
      })
    }, [onAddressChange])

    const handleSetQuery = useCallback((q: string) => {
      setQuery(q)
    }, [])

    const selectSuggestion = useCallback((suggestion: Suggestion) => {
      const next = {
        ...fields,
        address_1: suggestion.mainText,
        city: suggestion.secondaryText.split(',')[0]?.trim() ?? '',
        coordinates: suggestion.coordinates,
        source: 'autocomplete' as const,
        verified: true,
      }
      setFields(next)
      setCoordinates(suggestion.coordinates)
      setSuggestions([])
      onSuggestionSelect?.(suggestion)
      onAddressChange?.(next)
    }, [fields, onSuggestionSelect, onAddressChange])

    const getLocation = useCallback(() => {
      // usar useGeolocation hook - placeholder
    }, [])

    const reset = useCallback(() => {
      setFields({ ...initialAddress })
      setCoordinates(initialCoordinates ?? null)
      setQuery('')
      setSuggestions([])
      setError(null)
    }, [initialAddress, initialCoordinates])

    useImperativeHandle(ref, () => ({
      reset,
      getValues: () => ({ ...fields, coordinates: coordinates ?? undefined }),
      setValues: (values) => {
        setFields((prev) => ({ ...prev, ...values }))
        if (values.coordinates) setCoordinates(values.coordinates)
      },
      validate: () => ({ valid: true, errors: {} }),
      focus: () => {},
    }), [reset, fields, coordinates])

    const state: AddressFormHeadlessState = {
      fields,
      coordinates,
      query,
      suggestions,
      loading,
      error,
      geoLoading: false,
      geoError: null,
      setField,
      setQuery: handleSetQuery,
      selectSuggestion,
      getLocation,
      reset,
    }

    return <>{children(state)}</>
  }
)