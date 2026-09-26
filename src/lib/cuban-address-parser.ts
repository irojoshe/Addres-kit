// Parser de direcciones cubanas.
// Formato típico: "Calle X #123 entre Y y Z, Municipio, Provincia"
// Todo es opcional salvo la calle: los campos ausentes quedan en ''.

export interface CubanAddressParts {
  street: string
  number: string
  between1: string
  between2: string
  municipality: string
  province: string
}

const EMPTY_PARTS: CubanAddressParts = {
  street: '',
  number: '',
  between1: '',
  between2: '',
  municipality: '',
  province: '',
}

export function parseCubanAddress(text: string): CubanAddressParts {
  const result: CubanAddressParts = { ...EMPTY_PARTS }
  if (!text || !text.trim()) return result

  // 1. Con 3+ segmentos: municipio = penúltimo, provincia = último.
  //    Con 2: calle + provincia (sin municipio).
  //    Con 1: solo calle.
  const segments = text.split(',').map((s) => s.trim()).filter(Boolean)
  if (segments.length >= 3) {
    result.province = segments[segments.length - 1]
    result.municipality = segments[segments.length - 2]
  } else if (segments.length === 2) {
    result.province = segments[1]
  }
  let rest = segments.length > 0 ? segments[0] : text.trim()

  // 2. "entre Y y Z" (case-insensitive) al final de la parte de calle.
  const between = rest.match(/entre\s+(.+?)\s+y\s+(.+?)\s*$/i)
  if (between) {
    result.between1 = between[1].trim()
    result.between2 = between[2].trim()
    rest = rest.slice(0, between.index).trim()
  }

  // 3. Número: "#123" / "No. 123" primero; si no, dígitos puros al final
  //    ("Avenida 26 #4508" → 4508; "Calle 9na" → sin número, 9na es la calle).
  const hash = rest.match(/#\s*(\d+[A-Za-z-]*)/)
  if (hash) {
    result.number = hash[1]
    rest = rest.replace(hash[0], '').trim()
  } else {
    const no = rest.match(/\bNo\.?\s*(\d+[A-Za-z-]*)/i)
    if (no) {
      result.number = no[1]
      rest = rest.replace(no[0], '').trim()
    } else {
      const trailing = rest.match(/(\d+)\s*$/)
      if (trailing) {
        result.number = trailing[1]
        rest = rest.slice(0, trailing.index).trim()
      }
    }
  }

  result.street = rest.replace(/\s+/g, ' ').trim()
  return result
}

/** Reconstruye una query para forward geocoding desde las partes. */
export function buildForwardQuery(parts: Partial<CubanAddressParts>): string {
  const street = [parts.street, parts.number ? `#${parts.number}` : '']
    .filter(Boolean)
    .join(' ')
  return [street, parts.municipality, parts.province, 'Cuba'].filter(Boolean).join(', ')
}
