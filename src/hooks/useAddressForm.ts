import { useState, useCallback } from 'react'
import type { AddressData } from '../lib/types'

const EMPTY_ADDRESS: AddressData = {
  address_1: '',
  address_2: '',
  city: '',
  province: '',
  postal_code: '',
  country_code: '',
}

export function useAddressForm(initial?: Partial<AddressData>) {
  // Sanitizar: convertir undefined a string vacío
  const sanitized: AddressData = {
    ...EMPTY_ADDRESS,
    ...(initial || {}),
  }

  // Eliminar undefined residual
  Object.keys(sanitized).forEach((key) => {
    if ((sanitized as any)[key] === undefined) {
      ;(sanitized as any)[key] = ''
    }
  })

  const [address, setAddress] = useState<AddressData>(sanitized)

  const setField = useCallback((field: keyof AddressData, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }, [])

  const setAddressFromData = useCallback((data: Partial<AddressData>) => {
    setAddress((prev) => {
      const next = { ...prev }
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Preservar el tipo original (no forzar String): los datos de
          // provider ya vienen como strings; forzar String() corrompería
          // coordinates (objeto) y verified (boolean).
          ;(next as any)[key] = value
        }
      })
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setAddress(sanitized)
  }, [sanitized])

  return { address, setField, setAddressFromData, reset }
}
