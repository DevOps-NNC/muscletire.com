export function parseManualAddress(value: string) {
  const match = value.trim().match(/^(.+?),\s*([^,]+),\s*[A-Z]{2}\s*(\d{5}(?:-\d{4})?)?$/i);
  if (!match) return null;
  return { streetAddress: match[1].trim(), city: match[2].trim(), zipCode: match[3] ?? "" };
}
