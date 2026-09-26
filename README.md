# react-address-kit

Librería React/TypeScript reutilizable para capturar direcciones sin depender de Google Maps.

## Inicio rápido

Instala la librería y usa `AddressForm` con un mínimo de configuración:

```bash
npm install react-address-kit
```

```tsx
'use client';
import { AddressForm } from 'react-address-kit';

export default function CheckoutAddress() {
  return (
    <AddressForm
      onSubmit={async (address) => {
        console.log(address);
        // Guarda la dirección donde quieras
      }}
    />
  );
}
```

El formulario funciona con autocompletado, geolocalización y (opcionalmente) mapa. Sin API keys usa Photon + BigDataCloud (sin llave, solo municipio). Con `NEXT_PUBLIC_LOCATIONIQ_KEY` usa LocationIQ para autocompletado, directa y reversa (con calle, verificado en Cuba); con `NEXT_PUBLIC_GRAPHHOPPER_KEY` usa GraphHopper para rutas. Nunca pongas llaves reales en el repo: usa variables de entorno.

```bash
NEXT_PUBLIC_LOCATIONIQ_KEY=tu_clave_aqui
NEXT_PUBLIC_GRAPHHOPPER_KEY=tu_clave_aqui
```

## Límites de los servicios

| Servicio | Proveedor | Límite gratuito | API key | Uso comercial |
| :--- | :--- | :--- | :--- | :--- |
| Autocompletado | LocationIQ | 5.000/día, 2/seg | Sí (gratis) | Sí |
| Geocodificación inversa | LocationIQ | 5.000/día, 2/seg | Sí (gratis) | Sí |
| Geocodificación directa | LocationIQ | 5.000/día, 2/seg | Sí (gratis) | Sí |
| Enrutamiento | GraphHopper | 500 créditos/día | Sí (gratis) | No (plan gratis no comercial) |
| Mapa | MapLibre + OpenFreeMap | Sin límites | No | Sí |
| Cascada provincias | cuba-geodata | Sin límites | No | Sí |

Dos usuarios en el mismo segundo caben en LocationIQ (2 req/seg); BigDataCloud (fallback sin llave) no tiene cuello de botella client-side; GraphHopper limita por día, no por segundo. Para producción usa caché Redis de 24h y cola de 1 req/seg en tu backend (ver `examples/medusa-geocoding-cache/`). El plan gratuito de GraphHopper es no comercial: Basic ~69€/mes o autoaloja OSRM (~20-40€/mes). Muestra atribución © OpenStreetMap.

### Cobertura por país

- **Cobertura completa** (calle + número): Europa, EE.UU., Canadá, Australia, Japón.
- **Cobertura parcial**: Cuba y gran parte de Latinoamérica devuelven calle en ciudades principales vía LocationIQ (verificado: Bayamo devuelve calle, reparto y postal); BigDataCloud solo da municipio.
- **Sin cobertura**: formulario en cascada + edición manual + GPS en metadata. La librería funciona sin API key (fallback Photon + BigDataCloud, solo municipio).

## Instalación

```bash
npm install react-address-kit
```

Instala MapLibre solo si usarás `MapView`:

```bash
npm add maplibre-gl
```

En una app Next.js importa el CSS de MapLibre una sola vez:

```tsx
import 'maplibre-gl/dist/maplibre-gl.css'
```

## Uso rápido

```tsx
'use client'

import { AddressForm } from 'react-address-kit'

export function CheckoutAddress() {
  return (
    <AddressForm
      language="es"
      region="es"
      countryRestriction={["es", "mx"]}
      locationBias={{ latitude: 40.4168, longitude: -3.7038, radius: 30 }}
      showMap
      showLocationButton
      onSubmit={async (address) => {
        await fetch('/api/address', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(address),
        })
      }}
    />
  )
}
```

El resultado contiene `coordinates`, `source` (`autocomplete`, `manual` o `geolocation`) y `verified`.

## Providers y bias

Los defaults usan Photon para búsqueda, Nominatim para reverse geocoding y OSRM para rutas. Son servicios públicos sujetos a límites; para producción comercial configura endpoints propios o inyecta un provider compatible:

```tsx
const provider = createPhotonProvider({
  endpoint: process.env.NEXT_PUBLIC_GEOCODER_URL,
  retries: 3,
  retryDelayMs: 500,
})

<AddressForm addressProvider={provider} region="mx" onSubmit={save} />
```

Un `AddressProvider` implementa `forward(query, options)` y `reverse(coordinates, options)`. `forward` recibe `region`, `countryRestriction` y `location`, lo que permite priorizar resultados de una zona sin bloquear el fallback global.

## API pública

```tsx
import {
  AddressForm, AddressPicker, MapView, LocationButton,
  ManualLocationPicker, useGeolocation, useAutocomplete,
  useRouting, useDistanceMatrix, createPhotonProvider,
  createOSRMProvider, validateAddress, AddressDataSchema,
} from 'react-address-kit'
```

`useAutocomplete` expone `suggestions`, `loading`, `error`, `search` y `clear`. Gestiona debounce, AbortController, caché y evita resultados obsoletos cuando el usuario escribe rápido.

## Publicación

```bash
pnpm build:library
pnpm publish --access public
```

Antes de publicar cambia `name`, `repository`, `license` y `version` en `package.json`. La librería requiere React 18+ y funciona con Next.js, Vite, Remix y otras apps React. No incluye autenticación, tracking, offline delivery ni lógica de pedidos: esos flujos pertenecen a la aplicación consumidora.

## Internacionalización

Los textos pueden personalizarse pasando un objeto `messages` parcial al componente `AddressForm`:

```tsx
import { mergeMessages, defaultMessages } from 'react-address-kit'

const customMessages = mergeMessages({
  addressPlaceholder: 'Calle y número',
  cityPlaceholder: 'Ciudad',
  save: 'Guardar dirección',
})

<AddressForm
  language="es"
  messages={customMessages}
  onSubmit={async (address) => { await save(address) }}
/>
```

El objeto `Messages` incluye todas las claves posibles (placeholders, botones, estados, errores). Usa `defaultMessages` como base y sobreescribe solo las claves que necesites.

## Modo headless

El componente `AddressFormHeadless` provee el estado de la dirección sin renderizar ningún UI. Úsalo cuando quieras controlar totalmente el renderizado:

```tsx
import { AddressFormHeadless } from 'react-address-kit'

function CheckoutAddress() {
  return (
    <AddressFormHeadless
      language="es"
      onSuggestionSelect={(suggestion) => {
      // Lógica personalizada al seleccionar sugerencia
    }}
    onAddressSubmit={(address) => {
      // Enviar dirección
    }}
  />
  {/* Renderiza tu propio UI con los datos */}
}
```

El hook `useAddressFormHeadlessState` expone:
- `fields` — Los valores actuales de los campos
- `coordinates` — Las coordenadas actuales (null si no hay)
- `query` — El texto actual de la búsqueda
- `suggestions` — Las sugerencias actuales
- `loading` — Si hay solicitudes en curso
- `error` — El error actual (si existe)
- `geoLoading` — Si la geolocalización está en curso
- `geoError` — El error de geolocalización (si existe)
- `setField(field, value)` — Establecer un campo individual
- `setQuery(query)` — Establecer el texto de búsqueda
- `selectSuggestion(suggestion)` — Seleccionar una sugerencia
- `getLocation()` — Obtener geolocalización del navegador
- `reset()` — Restablecer todo al estado inicial

## Control por ref

El componente `AddressForm` usa `React.forwardRef` y expone un `AddressFormHandle` mediante `useImperativeHandle`. El handle provee:

- `reset()` — Restablecer el formulario al estado inicial
- `getValues()` — Obtener los valores actuales como `Partial<AddressData>`
- `setValues(values)` — Establecer valores parciales
- `validate()` — Validar la dirección actual, retorna `{ valid, errors }`
- `focus()` — Poner foco en el campo de dirección principal

```tsx
const ref = useRef<AddressFormHandle>(null)

<AddressForm
  ref={ref}
  onSubmit={async (address) => { await save(address) }}
/

// Usar después, por ejemplo, al hacer clic en un botón
const handleReset = () => {
  ref.current?.reset()
  const values = ref.current?.getValues()
}
```

## Analytics

Los callbacks de analytics se disparan en los siguientes momentos:

- **onSuggestionSelect** — Al hacer clic en una sugerencia del autocomplete
- **onLocationFound** — Al obtener exitosamente la geolocalización del navegador
- **onLocationError** — Al fallar la geolocalización (permiso denegado, timeout, etc.)
- **onAddressChange** — Cada vez que cambia un campo del formulario
- **onAddressSubmit** — Después de un submit exitoso (`onSubmit`)
- **onError** — En validación fallida o error durante submit

Ejemplo de uso:

```tsx
<AddressForm
  language="es"
  onSuggestionSelect={(suggestion) => {
    analytics.log('suggestion_selected', { suggestion })
  }}
  onLocationFound={(coordinates) => {
    analytics.log('location_found', { coordinates })
  }}
  onLocationError={(error) => {
    analytics.log('location_error', { error })
  }}
  onAddressChange={(address) => {
    analytics.log('address_changed', { address })
  }}
  onAddressSubmit={(address) => {
    analytics.log('address_submitted', { address })
  }}
  onError={(error) => {
    analytics.log('form_error', { error })
  }}
  onSubmit={async (address) => {
    await sendToServer(address)
  }}
/>
```