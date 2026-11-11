// Business configuration - single source of truth
// Items marked PLACEHOLDER need confirmation from the business owner

import clientConfig from "../client.config.json";

export const BUSINESS_CONFIG = {
  name: "__BUSINESS_LEGAL_NAME__",
  shortName: "__BUSINESS_NAME__",
  owner: "__OWNER_NAME__",
  phone: "__BUSINESS_PHONE__",
  phoneRaw: "__BUSINESS_PHONE_RAW__",
  phoneSecondary: "__BUSINESS_PHONE__",
  phoneSecondaryRaw: "__BUSINESS_PHONE_RAW__",
  email: "__BUSINESS_EMAIL__",
  address: "__BUSINESS_ADDRESS__",
  city: "__CITY__",
  state: "__STATE_CODE__",
  zip: "__BUSINESS_ZIP__",
  yearsExperience: 0,
  yearsInBusiness: 0,
  website: "__BUSINESS_URL__",
  social: {
    facebook: "__FACEBOOK_URL__",
    instagram: "__INSTAGRAM_URL__",
    tiktok: "__TIKTOK_URL__",
  },
  hours: {
    monday: "Call to confirm",
    tuesday: "Call to confirm",
    wednesday: "Call to confirm",
    thursday: "Call to confirm",
    friday: "Call to confirm",
    saturday: "Call to confirm",
    sunday: "Call to confirm",
  },
  serviceArea: {
    primary: "__CITY__",
    region: "__REGION__",
    description: "__CITY__ and approved nearby communities",
  },
  // PLACEHOLDER: These need confirmation
  googleBusinessProfile: "__GOOGLE_BUSINESS_PROFILE_URL__",
  certifications: [], // ASE certs to be confirmed
  insuranceStatus: "", // To be confirmed
  warrantyTerms: "", // To be confirmed
  paymentMethods: [], // To be confirmed
  diagnosticFee: "", // Whether to display pricing - to be confirmed
} as const;

export const SERVICE_AREA_ZIPS = Array.from(new Set<string>(clientConfig.serviceAreas.flatMap(area => area.zipCodes as string[])));
