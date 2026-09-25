import { AddressProvider, RoutingProvider, AddressProviderOptions } from './types';
export declare function createLocationIQProvider(options?: AddressProviderOptions): AddressProvider;
export declare function createBigDataCloudProvider(options?: AddressProviderOptions): AddressProvider;
export declare function createGraphHopperProvider(options?: AddressProviderOptions): RoutingProvider;
/** Híbrido por defecto: forward con LocationIQ + reverse con BigDataCloud. */
export declare function createDefaultAddressProvider(options?: AddressProviderOptions & {
    locationIqApiKey?: string;
}): AddressProvider;
/** @deprecated Usa createLocationIQProvider + createBigDataCloudProvider. */
export declare function createPhotonProvider(options?: AddressProviderOptions): AddressProvider;
export type { AddressProvider, RoutingProvider } from './types';
/** @deprecated Usa createGraphHopperProvider o OSRM autoalojado. */
export declare function createOSRMProvider(options?: AddressProviderOptions): RoutingProvider;
