# Changelog

All notable changes to `react-address-kit` will be documented in this file.

## 1.4.0

### Added
- Internationalization (i18n) with `Messages` interface, `defaultMessages` in Spanish and `mergeMessages` function
- `AddressFormHeadless` component with children function API for headless usage
- Ref API on `AddressForm` with `AddressFormHandle` exposing `reset`, `getValues`, `setValues`, `validate`, and `focus`
- Analytics callbacks on `AddressForm`: `onSuggestionSelect`, `onLocationFound`, `onLocationError`, `onAddressChange`, `onAddressSubmit`, `onError`

### Changed
- nada (todas las adiciones son aditivas)

### Deprecated
- nada

### Removed
- nada

### Fixed
- nada

---

## 1.3.0

- Versión inicial de la librería con AddressForm, AddressPicker, MapView, LocationButton y ManualLocationPicker
- Autocomplete con Photon, geolocalización con Nominatim, mapa MapLibre, enrutamiento OSRM
- Validación con Zod y normalización para Medusa