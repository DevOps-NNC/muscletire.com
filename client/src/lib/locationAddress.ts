export type GoogleAddressComponentLike = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GooglePlaceLike = {
  address_components?: GoogleAddressComponentLike[];
  formatted_address?: string;
};

export type RequestAddressFields = {
  streetAddress: string;
  city: string;
  zipCode: string;
};

function getAddressPart(components: GoogleAddressComponentLike[], type: string, format: "long" | "short" = "long"): string {
  const component = components.find(item => item.types.includes(type));
  return component ? (format === "short" ? component.short_name : component.long_name) : "";
}

/** Extracts only the form fields needed by a mobile-service request from a Google result. */
export function getRequestAddressFields(place: GooglePlaceLike): RequestAddressFields {
  const components = place.address_components ?? [];
  const streetNumber = getAddressPart(components, "street_number");
  const route = getAddressPart(components, "route");
  const streetAddress = [streetNumber, route].filter(Boolean).join(" ") || place.formatted_address?.split(",")[0]?.trim() || "";

  return {
    streetAddress,
    city: getAddressPart(components, "locality") || getAddressPart(components, "postal_town") || getAddressPart(components, "administrative_area_level_3"),
    zipCode: getAddressPart(components, "postal_code"),
  };
}

export function getCurrentLocationErrorMessage(errorCode: number): string {
  return errorCode === 1
    ? "Location permission was not granted. Please enter your address manually."
    : "We could not get your location. Please enter your address manually.";
}
