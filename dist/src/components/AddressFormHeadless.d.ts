import { AddressData, AddressFormCallbacks, AddressFormHandle, AddressFormHeadlessState, Coordinates } from '../lib/types';
import { AddressProvider } from '../lib/providers';
export interface AddressFormHeadlessProps extends AddressFormCallbacks {
    addressProvider: AddressProvider;
    initialAddress?: Partial<AddressData>;
    initialCoordinates?: Coordinates;
    language?: string;
    countryRestriction?: string[];
    showMap?: boolean;
    children: (state: AddressFormHeadlessState) => React.ReactNode;
}
export declare const AddressFormHeadless: import('react').ForwardRefExoticComponent<AddressFormHeadlessProps & import('react').RefAttributes<AddressFormHandle>>;
