export type ServiceLocationFields = {
  streetAddress?: string;
  city?: string;
  zipCode?: string;
};

export type RequestStepFields = ServiceLocationFields & {
  fullName?: string;
  phone?: string;
};

/**
 * A customer may know the exact address, only the city, or only a ZIP code when
 * requesting a mobile visit. Any one of those details gives the team a usable
 * starting point and should allow the request to continue.
 */
export function hasUsableServiceLocation({ streetAddress, city, zipCode }: ServiceLocationFields): boolean {
  return [streetAddress, city, zipCode].some(value => value?.trim().length);
}

export function getServiceLocationGuidance(location: ServiceLocationFields): string | null {
  return hasUsableServiceLocation(location)
    ? null
    : "Enter a street address, city, or ZIP code to continue.";
}

export function canAdvanceRequestStep(step: number, fields: RequestStepFields): boolean {
  if (step === 0) return Boolean(fields.fullName?.trim() && fields.phone?.trim());
  if (step === 1) return hasUsableServiceLocation(fields);
  return true;
}
