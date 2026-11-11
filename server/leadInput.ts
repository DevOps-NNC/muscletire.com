import { z } from "zod";

export const leadCreateInput = z.object({
  fullName: z.string().trim().min(1).max(200), phone: z.string().trim().min(7).max(30), email: z.string().trim().email().max(320).optional(), website: z.string().max(200).optional(), preferredContact: z.enum(["call", "text", "email"]).optional(),
  streetAddress: z.string().max(500).optional(), unit: z.string().optional(), city: z.string().optional(), zipCode: z.string().optional(), locationType: z.enum(["home", "workplace", "roadside", "parking_lot", "dealership", "other"]).optional(), locationNotes: z.string().optional(),
  vehicleYear: z.string().optional(), vehicleMake: z.string().optional(), vehicleModel: z.string().optional(), vehicleTrim: z.string().optional(), vin: z.string().optional(), mileage: z.string().optional(),
  requestedService: z.string().optional(), mainSymptom: z.string().optional(), problemDescription: z.string().max(4000).optional(), vehicleStarts: z.boolean().optional(), vehicleSafe: z.boolean().optional(), preferredDate: z.string().optional(), preferredTime: z.string().optional(), isAsap: z.boolean().optional(), customerNotes: z.string().max(4000).optional(),
  adsDataConsent: z.boolean().optional(),
  attribution: z.object({
    gclid: z.string().max(2048).optional(), gbraid: z.string().max(2048).optional(), wbraid: z.string().max(2048).optional(), dclid: z.string().max(2048).optional(), gclsrc: z.string().max(200).optional(),
    utmSource: z.string().max(300).optional(), utmMedium: z.string().max(300).optional(), utmCampaign: z.string().max(500).optional(), utmTerm: z.string().max(500).optional(), utmContent: z.string().max(500).optional(),
    gadSource: z.string().max(300).optional(), gadCampaignId: z.string().max(300).optional(), googleAnalyticsClientId: z.string().max(160).optional(), googleAnalyticsSessionId: z.string().max(160).optional(),
    landingUrl: z.string().max(4000).optional(), referrer: z.string().max(4000).optional(),
  }).optional(),
});

export type LeadCreateInput = z.infer<typeof leadCreateInput>;
