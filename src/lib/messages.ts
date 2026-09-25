export interface Messages {
  // Placeholders de dirección
  addressPlaceholder?: string;
  address_1Placeholder?: string;
  address_2Placeholder?: string;
  cityPlaceholder?: string;
  provincePlaceholder?: string;
  postalCodePlaceholder?: string;
  countryPlaceholder?: string;
  firstNamePlaceholder?: string;
  lastNamePlaceholder?: string;
  phonePlaceholder?: string;

  // Botones y estados
  save?: string;
  saving?: string;
  locationButton?: string;
  locationLoading?: string;
  clear?: string;

  // Estados de suggestions
  loadingSuggestions?: string;
  noSuggestions?: string;

  // Errores de validación
  invalidAddress?: string;
  missingField?: string;
  invalidCountry?: string;
  invalidPostalCode?: string;
  invalidCity?: string;
  invalidProvince?: string;
  invalidPhone?: string;

  // Errores de geolocalización
  geolocationPermissionDenied?: string;
  geolocationPositionUnavailable?: string;
  geolocationTimeout?: string;
  geolocationHttpsRequired?: string;

  // Errores de red
  networkError?: string;
  unavailable?: string;

  // Labels de accesibilidad
  addressLabel?: string;
  suggestionsLabel?: string;
}

export const defaultMessages: Messages = {
  // Placeholders de dirección
  addressPlaceholder: 'Dirección',
  address_1Placeholder: 'Calle, número',
  address_2Placeholder: 'Apartamento, suite (opcional)',
  cityPlaceholder: 'Ciudad',
  provincePlaceholder: 'Provincia o estado',
  postalCodePlaceholder: 'Código postal',
  countryPlaceholder: 'País',
  firstNamePlaceholder: 'Nombre',
  lastNamePlaceholder: 'Apellido',
  phonePlaceholder: 'Teléfono',

  // Botones y estados
  save: 'Guardar',
  saving: 'Guardando…',
  locationButton: 'Ubicación',
  locationLoading: 'Obteniendo ubicación…',
  clear: 'Limpiar',

  // Estados de suggestions
  loadingSuggestions: 'Cargando sugerencias…',
  noSuggestions: 'No hay sugerencias',

  // Errores de validación
  invalidAddress: 'Dirección inválida',
  missingField: 'Campo obligatorio',
  invalidCountry: 'País inválido',
  invalidPostalCode: 'Código postal inválido',
  invalidCity: 'Ciudad inválida',
  invalidProvince: 'Provincia o estado inválido',
  invalidPhone: 'Teléfono inválido',

  // Errores de geolocalización
  geolocationPermissionDenied: 'No se concedió permiso de geolocalización',
  geolocationPositionUnavailable: 'La posición no está disponible',
  geolocationTimeout: 'La solicitud de geolocalización ha expirado',
  geolocationHttpsRequired: 'La geolocalización requiere HTTPS (excepto localhost)',

  // Errores de red
  networkError: 'Error de red',
  unavailable: 'No disponible',

  // Labels de accesibilidad
  addressLabel: 'Dirección',
  suggestionsLabel: 'Sugerencias',
}

export function mergeMessages(overrides?: Partial<Messages>): Messages {
  return { ...defaultMessages, ...overrides }
}