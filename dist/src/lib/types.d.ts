import { default as React } from 'react';
export type Coordinates = {
    latitude: number;
    longitude: number;
    accuracy?: number;
};
export type Coords = {
    lat: number;
    lng: number;
    accuracy?: number;
};
export type AddressSource = 'autocomplete' | 'manual' | 'geolocation';
export type AddressData = {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address_1: string;
    address_2?: string;
    city: string;
    province?: string;
    postal_code?: string;
    country_code: string;
    coordinates?: Coordinates;
    source?: AddressSource;
    verified?: boolean;
    metadata?: Record<string, unknown>;
};
export type Suggestion = {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
    coordinates: Coordinates;
};
export type PlaceResult = AddressData & {
    id: string;
    label: string;
    coords: Coords;
};
export type RouteResult = {
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
    distance: number;
    duration: number;
};
export type DistanceMatrix = {
    distances: number[][];
    durations: number[][];
    sources: Coordinates[];
    destinations: Coordinates[];
};
export type GeolocationErrorCode = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'HTTPS_REQUIRED' | 'UNKNOWN';
export type GeolocationError = {
    code: GeolocationErrorCode;
    message: string;
};
export type LocationBias = {
    latitude: number;
    longitude: number;
    radius?: number;
};
export type AddressProviderOptions = {
    endpoint?: string;
    apiKey?: string;
    fetcher?: typeof fetch;
    headers?: HeadersInit;
    retries?: number;
    retryDelayMs?: number;
};
export type ForwardOptions = {
    limit?: number;
    countryRestriction?: string[];
    language?: string;
    region?: string;
    location?: LocationBias;
    signal?: AbortSignal;
};
export type ReverseOptions = {
    language?: string;
    signal?: AbortSignal;
};
export type AddressProvider = {
    forward: (query: string, options?: ForwardOptions) => Promise<Suggestion[]>;
    reverse: (coords: Coordinates, options?: ReverseOptions) => Promise<Partial<AddressData>>;
};
export type RoutingProvider = {
    route: (from: Coordinates, to: Coordinates) => Promise<RouteResult>;
    matrix: (points: Coordinates[]) => Promise<DistanceMatrix>;
};
export type GeolocationOptions = {
    timeout?: number;
    enableHighAccuracy?: boolean;
    maximumAge?: number;
};
export type AutocompleteOptions = {
    provider: AddressProvider;
    countryRestriction?: string[];
    language?: string;
    region?: string;
    locationBias?: LocationBias;
    limit?: number;
    debounceMs?: number;
    minLength?: number;
    retryCount?: number;
};
export type MapViewProps = {
    coordinates: Coordinates | null;
    coords?: Coords | null;
    height?: number | string;
    zoom?: number;
    mapStyle?: string;
    onMarkerDrag?: (coordinates: Coordinates) => void;
    attribution?: boolean;
};
export type LocationButtonProps = {
    onLocation: (coordinates: Coordinates) => void;
    onError?: (error: GeolocationError) => void;
    options?: GeolocationOptions;
    children?: React.ReactNode;
};
export type ManualLocationPickerProps = {
    coordinates: Coordinates | null;
    onChange: (coordinates: Coordinates) => void;
    height?: number | string;
};
export type AddressValidationResult = {
    success: true;
    data: AddressData;
} | {
    success: false;
    error: string;
};
export type UseRoutingResult = {
    route: RouteResult | null;
    loading: boolean;
    error: string | null;
    recalculate: () => Promise<void>;
};
export type UseDistanceMatrixResult = {
    matrix: DistanceMatrix | null;
    loading: boolean;
    error: string | null;
    calculate: (points: Coordinates[]) => Promise<void>;
};
export declare const toCoordinates: (coords: Coords | Coordinates) => Coordinates;
export declare const toCoords: (coords: Coordinates) => Coords;
export declare const isValidCoordinates: (c: Coordinates) => boolean;
export declare const toLegacyAddress: (address: AddressData) => {
    metadata: {
        latitude?: number | undefined;
        longitude?: number | undefined;
        accuracy?: number | undefined;
    };
    first_name?: string;
    last_name?: string;
    phone?: string;
    address_1: string;
    address_2?: string;
    city: string;
    province?: string;
    postal_code?: string;
    country_code: string;
    coordinates?: Coordinates;
    source?: AddressSource;
    verified?: boolean;
};
export declare const ADDRESS_KIT_VERSION: "1.4.0";
export declare function createRetryFetcher(fetcher: typeof fetch, retries?: number, delayMs?: number): typeof fetch;
export type AddressFormHandle = {
    reset: () => void;
    getValues: () => Partial<AddressData>;
    setValues: (values: Partial<AddressData>) => void;
    validate: () => {
        valid: boolean;
        errors: Record<string, string>;
    };
    focus: () => void;
};
export interface AddressFormCallbacks {
    onSuggestionSelect?: (suggestion: Suggestion) => void;
    onLocationFound?: (coordinates: Coordinates) => void;
    onLocationError?: (error: GeolocationError) => void;
    onAddressChange?: (address: Partial<AddressData>) => void;
    onAddressSubmit?: (address: AddressData) => void;
    onError?: (error: {
        code: string;
        message: string;
    }) => void;
}
export interface AddressFormHeadlessState {
    fields: Partial<AddressData>;
    coordinates: Coordinates | null;
    query: string;
    suggestions: Suggestion[];
    loading: boolean;
    error: string | null;
    geoLoading: boolean;
    geoError: GeolocationError | null;
    setField: (field: keyof AddressData, value: string) => void;
    setQuery: (query: string) => void;
    selectSuggestion: (suggestion: Suggestion) => void;
    getLocation: () => void;
    reset: () => void;
}
