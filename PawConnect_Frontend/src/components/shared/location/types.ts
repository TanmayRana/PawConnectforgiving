export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface GeocodedAddress {
  displayName: string;
  street: string;
  unit?: string;
  suburb?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
}

export interface SearchResultItem {
  placeId: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  type?: string;
  address?: Partial<GeocodedAddress>;
}

export interface LocationPickerResult {
  coordinates: LocationCoordinates;
  address: GeocodedAddress;
  formattedAddress: string;
}

export type GeocodingProviderType = "nominatim" | "custom";
