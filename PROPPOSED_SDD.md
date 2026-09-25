## 1. Resumen ejecutivo

Propuesta de mejora para react-address-kit v1.3.0 que agrega capacidades de i18n, modo headless/render-prop, API por ref y callbacks de analytics, manteniendo total compatibilidad hacia atrás y sin agregar nuevas dependencias de runtime. Todas las cambios son aditivos y respetan la API pública existente.

## 2. Alcance

**Qué entra en esta fase (Fase 1):**
- Internacionalización de textos hardcodeados en español en AddressForm y componentes asociados.
- Modo headless: extracción de la lógica de AddressForm para que pueda consumirse vía render props o API por ref, sin imponer layout propio.
- API por ref: métodos `reset`, `getValues`, `setValues`, `validate` y `focus` expuestos en AddressForm y AddressPicker.
-Callbacks de analytics: `onSuggestionSelect`, `onLocationFound`, `onLocationError`, `onAddressChange`, `onAddressSubmit`, `onError` en los componentes correspondientes.

**Qué se deja fuera (Fase 1):**
- Cualquier cambio en providers.ts, hooks existentes, validators.ts o normalizers.ts.
- Nuevas dependencias de runtime (TanStack Query, MSW, etc.).
- Integración con Medusa o Next.js data fetching.
- Refactorización de la lógica existente.

## 3. Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/lib/types.ts` | Nuevas tipos para i18n, headless mode, ref API y callbacks de analytics. |
| `src/components/AddressForm.tsx` | Integración de i18n, modo headless/render-prop, API por ref (`reset`, `getValues`, `setValues`, `validate`, `focus`) y callbacks de analytics. |
| `src/components/AddressPicker.tsx` |Callbacks de analytics (`onSuggestionSelect`, `onLocationFound`, `onLocationError`). |
| `src/lib/types.ts` (expansión) | Nuevos tipos `AddressFormI18nMessages`, `AddressFormHeadlessMode`, `AddressFormRef`, `AddressFormAnalyticsCallbacks`. |
| `src/index.ts` | Exportaciones opcionales de tipos y helpers nuevos (sin romper exports existentes). |

## 4. Cambios en la API pública

### 4.1 Nuevos tipos en `src/lib/types.ts`

```typescript
// Mensajes i18n para AddressForm
export type AddressFormI18nMessages = {
  addressLabel?: string;
  addressPlaceholder?: string;
  cityPlaceholder?: string;
  locationButton?: string;
  locationLoading?: string;
  submit?: string;
  required?: string;
};

// Modo headless/render-prop
export type AddressFormHeadlessMode = {
  render?: (props: {
    address: AddressData;
    coordinates: Coordinates | null;
    error: string | null;
    success: boolean;
    loading: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    onFocus: () => void;
    onBlur: () => void;
    reset: () => void;
    getValues: () => AddressData;
    setValues: (values: Partial<AddressData>) => void;
    validate: () => AddressValidationResult;
    focus: () => void;
  }) => React.ReactNode;
};

// Callbacks de analytics
export type AddressFormAnalyticsCallbacks = {
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  onLocationFound?: (coordinates: Coordinates) => void;
  onLocationError?: (error: { code: string; message: string }) => void;
  onAddressChange?: (address: AddressData) => void;
  onAddressSubmit?: (address: AddressData) => void;
  onError?: (error: { code: string; message: string }) => void;
};

// Ref API público
export type AddressFormRef = {
  reset: () => void;
  getValues: () => AddressData;
  setValues: (values: Partial<AddressData>) => void;
  validate: () => AddressValidationResult;
  focus: () => void;
};
```

### 4.2 Firmas actualizadas de componentes

**AddressForm.tsx** — props adicionales (todos opcionales, aditivos):

```typescript
export interface AddressFormProps {
  onSubmit: (address: AddressData) => void | Promise<void>;
  addressProvider?: AddressProvider;
  initialAddress?: Partial<AddressData>;
  initialCoordinates?: Coordinates;
  initialCoords?: Coords;
  language?: string;
  countryRestriction?: string[];
  showMap?: boolean;
  showLocationButton?: boolean;
  className?: string;
  // NUEVO: i18n messages (opcional, por defecto en español)
  i18nMessages?: AddressFormI18nMessages;
  // NUEVO: modo headless/render-prop (opcional, legacy = layout impuesto)
  headless?: AddressFormHeadlessMode;
  // NUEVO: callbacks de analytics
  onAnalytics?: AddressFormAnalyticsCallbacks;
  // NUEVO: ref público (forwarded ref)
  ref?: React.Ref<AddressFormRef>;
}
```

**AddressPicker.tsx** — props adicionales:

```typescript
export interface AddressPickerProps {
  provider?: AddressProvider;
  onSelect?: (suggestion: Suggestion) => void;
  onPlaceSelect?: (place: any) => void;
  language?: string;
  countryRestriction?: string[];
  // NUEVO: callbacks de analytics
  onAnalytics?: AddressFormAnalyticsCallbacks;
}
```

### 4.3 Nuevas exportaciones de tipos desde `src/index.ts`

- `AddressFormI18nMessages`
- `AddressFormHeadlessMode`
- `AddressFormAnalyticsCallbacks`
- `AddressFormRef`
- (Los tipos ya existentes se mantienen sin cambios)

## 5. Compatibilidad

- **Ningún cambio breaking**: Todas las nuevas props son opcionales y tienen valores por defecto consistentes con el comportamiento actual (español hardcodeado).
- **API pública v1.3.0 inalterada**: Los tipos y exports existentes permanecen exactamente iguales.
- **Headless mode es opt-in**: Si se provee `headless` a AddressForm, el componente renderiza `null` y cede el render al proveedor. Si no se provee, el layout actual de shadcn-ui se mantiene.
- **Ref forwarding**: Se usa `React.forwardRef` en AddressForm para exponer el ref `AddressFormRef` sin afectar el uso como componente sin ref.
- **No se modifican providers, hooks, validators ni normalizers**: El cambio es exclusivamente en la capa de componentes y tipos.

## 6. Criterios de aceptación

- [ ] **i18n**: Cuando `i18nMessages` se provee en AddressForm, todos los textos de label, placeholder, button y mensajes de error usan esas traducciones; si no se provee, se usa el español hardcodeado actual.
- [ ] **Modo headless**: Cuando `headless` se provee, AddressForm renderiza `null` y invoca `render(props)` con todas las funciones de control (reset, getValues, setValues, validate, focus). El layout lo provee el consumidor.
- [ ] **API por ref**: El ref de AddressForm expone `reset()`, `getValues()`, `setValues(values)`, `validate()` y `focus()`. Cada uno se comporta según su documentación (semántica existente, sin cambios).
- [ ] **Callbacks de analytics**:
  - `onSuggestionSelect` se dispara en AddressPicker al seleccionar una sugerencia.
  - `onLocationFound` se dispara en AddressForm/LocationButton cuando se obtiene la geolocalización.
  - `onLocationError` se dispara cuando falla la geolocalización o el provider.
  - `onAddressChange` se dispara cuando la dirección cambia (en AddressForm o AddressPicker).
  - `onAddressSubmit` se dispara después de un submit exitoso en AddressForm.
  - `onError` se dispara ante cualquier error capturado en los componentes.
- [ ] **Sin nuevas dependencias**: El código resultante no importa nada fuera de las dependencias actuales (react, tailwind, shadcn-ui, lib own).
- [ ] **Tests existentes pasan**: `pnpm test` (o el comando equivalente) debe mantener todos los tests verdes. No se modifica lógica de tests.

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Riesgo**: Agregar props nuevas podría romper consumidores que hagan destructuring y pasen props desconocidos a un wrapper. | Todas las nuevas props son opcionales y vienen con definición de tipo estricta. No se quitan props existentes. |
| **Riesgo**: El modo headless podría no renderizar nada si el consumidor no provee un `render` válido. | Se documenta claramente que `headless` sin `render` resulta en un componente que renderiza `null`. Se sugiere un `render` por defecto que muestra el layout actual. |
| **Riesgo**: Los callbacks de analytics podrían no ser llamados en ciertos flujos edge-case. | Se añade llamada a `onError` en todos los `catch` blocks ya existentes. Se verifica cobertura con tests existentes. |
| **Riesgo**: El ref forwarding podría colisionar con refs de los consumidores. | Se usa `React.forwardRef` y el tipo `AddressFormRef` es opcional (`ref?`). Los consumidores que no necesiten el ref pueden omitirlo con seguridad. |
| **Riesgo**: Tipos nuevos en `types.ts` podrían causar colisiones o confusión. | Los tipos nuevos llevan prefijo `AddressForm` y están encapsulados en el mismo módulo. No se redefinen tipos existentes. |

---

**Próximo paso recomendado:** `sdd-spec` — escribir los delta specs detallados para cada uno de los 4 requerimientos (i18n, headless, API por ref, analytics callbacks), aprovechando la estructura de la Fase 1 aprobada.

---