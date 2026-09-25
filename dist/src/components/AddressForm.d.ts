import { AddressData, AddressFormCallbacks, AddressFormHandle, AddressProvider, Coordinates } from '../lib/types';
import { Messages } from '../lib/messages';
export interface AddressFormProps extends AddressFormCallbacks {
    onSubmit: (address: AddressData) => void | Promise<void>;
    addressProvider?: AddressProvider;
    routingProvider?: import('../lib/providers').RoutingProvider;
    locationIqApiKey?: string;
    graphHopperApiKey?: string;
    initialAddress?: Partial<AddressData>;
    initialCoordinates?: Coordinates;
    language?: string;
    countryRestriction?: string[];
    showMap?: boolean;
    showLocationButton?: boolean;
    className?: string;
    messages?: Partial<Messages>;
}
export declare const AddressForm: import('react').ForwardRefExoticComponent<AddressFormProps & import('react').RefAttributes<AddressFormHandle>>;
