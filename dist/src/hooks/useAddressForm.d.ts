import { AddressData } from '../lib/types';
export declare function useAddressForm(initial?: Partial<AddressData>): {
    address: AddressData;
    setField: (field: keyof AddressData, value: string) => void;
    setAddressFromData: (data: Partial<AddressData>) => void;
    reset: () => void;
};
