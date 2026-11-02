import type {
  LocationCoordinates,
  GeocodedAddress,
  SearchResultItem,
} from "./types";

// Configuration for OpenStreetMap Nominatim geocoding
const NOMINATIM_BASE_URL =
  process.env.NEXT_PUBLIC_NOMINATIM_URL || "https://nominatim.openstreetmap.org";

// Client-side cache to avoid redundant requests and stay within fair-use limits
const searchCache = new Map<string, SearchResultItem[]>();
const reverseCache = new Map<string, GeocodedAddress>();

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  street?: string;
  house_number?: string;
  building?: string;
  residential?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

interface NominatimPlace {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
  address?: NominatimAddress;
}

function parseNominatimAddress(place: NominatimPlace): GeocodedAddress {
  const addr = place.address || {};
  const lat = parseFloat(place.lat);
  const lng = parseFloat(place.lon);

  // Street identification
  const road = addr.road || addr.pedestrian || addr.street || addr.residential || "";
  const houseNumber = addr.house_number || addr.building || "";
  let street = road;
  if (road && houseNumber) {
    street = `${houseNumber}, ${road}`;
  } else if (!street && houseNumber) {
    street = houseNumber;
  }

  // Locality / Suburb
  const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";

  // City identification
  const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";

  // State
  const state = addr.state || "";

  // Postal / PIN code
  const postalCode = addr.postcode || "";

  // Country
  const country = addr.country || "India";

  // Build fallback street if road was empty
  if (!street && place.display_name) {
    const parts = place.display_name.split(",").map((s) => s.trim());
    street = parts[0] || "Selected Location";
  }

  return {
    displayName: place.display_name,
    street: street || "Selected Location",
    unit: houseNumber || undefined,
    suburb: suburb || undefined,
    city: city || "City",
    state: state || "State",
    postalCode: postalCode || "",
    country,
    lat,
    lng,
  };
}

/**
 * Search addresses and places via OpenStreetMap Nominatim
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  const cacheKey = trimmed.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    addressdetails: "1",
    limit: "7",
  });

  const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 429) {
      throw new Error("Nominatim geocoding rate limit reached. Please pick your location manually on the map.");
    }

    if (!res.ok) {
      throw new Error(`Location search failed with status ${res.status}`);
    }

    const places: NominatimPlace[] = await res.json();

    const results: SearchResultItem[] = places.map((place) => {
      const parsed = parseNominatimAddress(place);
      const parts = place.display_name.split(",").map((s) => s.trim());
      const title = parts[0] || parsed.street;
      const subtitle = parts.slice(1, 4).join(", ") || `${parsed.city}, ${parsed.state}`;

      return {
        placeId: String(place.place_id),
        lat: parsed.lat,
        lng: parsed.lng,
        title,
        subtitle,
        type: place.type,
        address: parsed,
      };
    });

    searchCache.set(cacheKey, results);
    return results;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return [];
    }
    throw err;
  }
}

/**
 * Reverse geocode coordinates to structured address
 */
export async function reverseGeocode(coords: LocationCoordinates, signal?: AbortSignal): Promise<GeocodedAddress> {
  const roundedLat = coords.lat.toFixed(5);
  const roundedLng = coords.lng.toFixed(5);
  const cacheKey = `${roundedLat},${roundedLng}`;

  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey)!;
  }

  const params = new URLSearchParams({
    lat: coords.lat.toString(),
    lon: coords.lng.toString(),
    format: "json",
    addressdetails: "1",
    zoom: "18",
  });

  const url = `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`;

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 429) {
      throw new Error("Geocoding service limit reached. You can confirm the pin location and type your address details.");
    }

    if (!res.ok) {
      throw new Error(`Reverse geocoding failed with status ${res.status}`);
    }

    const place: NominatimPlace = await res.json();
    if (!place || !place.lat) {
      throw new Error("No address found for these coordinates.");
    }

    const parsed = parseNominatimAddress(place);
    reverseCache.set(cacheKey, parsed);
    return parsed;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    // Return a structured fallback using coordinates so customer is never blocked
    return {
      displayName: `Pin at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
      street: "Selected Map Location",
      city: "Selected Area",
      state: "",
      postalCode: "",
      country: "India",
      lat: coords.lat,
      lng: coords.lng,
    };
  }
}

export const searchAddress = searchPlaces;
