import PublicLayout from "@/components/PublicLayout";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { BUSINESS_CONFIG } from "@shared/config";
import { Phone, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { GoogleReviewsStrip } from "@/components/GoogleReviewsStrip";
import { SEOHead } from "@/components/SEOHead";
import { ServiceJsonLd } from "@/components/JsonLd";
import { trackConversion } from "@/lib/conversionTracking";
import { loadGoogleMaps } from "@/components/Map";
import { parseManualAddress } from "@/lib/addressLocation";
import { canAdvanceRequestStep, getServiceLocationGuidance, hasUsableServiceLocation } from "@shared/serviceRequestValidation";
import { getCurrentLocationErrorMessage, getRequestAddressFields } from "@/lib/locationAddress";
import { getLeadAttributionForSubmission } from "@/lib/leadAttribution";
import { LocateFixed, Loader2 } from "lucide-react";

const steps = ["Contact", "Location", "Vehicle", "Problem", "Schedule", "Review"];
const vehicleYears = Array.from({ length: new Date().getFullYear() - 1980 + 2 }, (_, index) => String(new Date().getFullYear() + 1 - index));

export function ServiceRequestForm({ embedded = false }: { embedded?: boolean }) {
  const [step, setStep] = useState(0);
  const [, navigate] = useLocation();
  const submitMutation = trpc.leads.create.useMutation();

  // Form state
  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", preferredContact: "call" as "call"|"text"|"email",
    streetAddress: "", unit: "", city: "", zipCode: "", locationType: "home" as string, locationNotes: "",
    vehicleYear: "", vehicleMake: "", vehicleModel: "", vehicleTrim: "", vin: "", mileage: "", fuelType: "", transmission: "",
    requestedService: "", mainSymptom: "", problemDescription: "", vehicleStarts: true, vehicleSafe: true,
    preferredDate: "", preferredTime: "", isAsap: false, customerNotes: "", adsDataConsent: false,
    honeypot: "", // anti-spam
  });
  const [decodedVin, setDecodedVin] = useState("");
  const hasTrackedStart = useRef(false);
  const streetAddressInputRef = useRef<HTMLInputElement>(null);
  const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const locationGuidance = getServiceLocationGuidance(form);

  const trackRequestStart = () => {
    if (hasTrackedStart.current) return;
    hasTrackedStart.current = true;
    trackConversion("request_start", { embedded });
  };

  const updateForm = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const makeLookup = trpc.vehicles.makes.useQuery({ query: form.vehicleMake }, { enabled: step === 2 && form.vehicleMake.trim().length >= 2, staleTime: 24 * 60 * 60 * 1000 });
  const modelLookup = trpc.vehicles.models.useQuery({ year: form.vehicleYear, make: form.vehicleMake }, { enabled: step === 2 && /^\d{4}$/.test(form.vehicleYear) && form.vehicleMake.trim().length >= 1, staleTime: 24 * 60 * 60 * 1000 });
  const vinLookup = trpc.vehicles.decodeVin.useQuery({ vin: form.vin }, { enabled: step === 2 && /^[A-HJ-NPR-Z0-9]{17}$/.test(form.vin), retry: false, staleTime: 24 * 60 * 60 * 1000 });
  const chooseYear = (year: string) => setForm(prev => ({ ...prev, vehicleYear: year, vehicleModel: "" }));
  const chooseMake = (make: string) => setForm(prev => ({ ...prev, vehicleMake: make, vehicleModel: "" }));
  const updateVin = (value: string) => { const vin = value.toUpperCase().replace(/\s/g, ""); setDecodedVin(""); updateForm("vin", vin); };

  useEffect(() => {
    if (step !== 1 || !streetAddressInputRef.current) return;

    let active = true;
    let listener: google.maps.MapsEventListener | undefined;

    const connectAutocomplete = async () => {
      try {
        await loadGoogleMaps();
        if (!active || !streetAddressInputRef.current || !window.google?.maps?.places) return;

        const autocomplete = new window.google.maps.places.Autocomplete(streetAddressInputRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        });
        addressAutocompleteRef.current = autocomplete;
        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const address = getRequestAddressFields(place);
          if (!address.streetAddress && !address.city && !address.zipCode) {
            setLocationStatus("Choose an address from the suggestions or enter it manually.");
            return;
          }
          setForm(previous => ({ ...previous, ...address }));
          setLocationStatus("Address details added. You can review or adjust them below.");
        });
      } catch {
        if (active) setLocationStatus("Address suggestions are temporarily unavailable. You can enter your address manually.");
      }
    };

    void connectAutocomplete();
    return () => {
      active = false;
      listener?.remove();
      addressAutocompleteRef.current = null;
    };
  }, [step]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Your browser does not support location access. Please enter an address manually.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          await loadGoogleMaps();
          const geocoder = new window.google.maps.Geocoder();
          const response = await geocoder.geocode({ location: { lat: position.coords.latitude, lng: position.coords.longitude } });
          const address = getRequestAddressFields(response.results[0] ?? {});
          if (!address.streetAddress && !address.city && !address.zipCode) {
            setLocationStatus("We could not find an address for that location. Please enter it manually.");
            return;
          }
          setForm(previous => ({ ...previous, ...address }));
          setLocationStatus("Your location was added. Please review the address before continuing.");
        } catch {
          setLocationStatus("We could not look up that location. Please enter your address manually.");
        } finally {
          setIsLocating(false);
        }
      },
      error => {
        setIsLocating(false);
        setLocationStatus(getCurrentLocationErrorMessage(error.code));
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  };

  useEffect(() => {
    const decoded = vinLookup.data;
    if (!decoded || decoded.vin !== form.vin || decodedVin === decoded.vin) return;
    setForm(prev => ({ ...prev, vehicleYear: decoded.year, vehicleMake: decoded.make, vehicleModel: decoded.model, vehicleTrim: decoded.trim ?? prev.vehicleTrim }));
    setDecodedVin(decoded.vin);
  }, [vinLookup.data?.vin, form.vin, decodedVin]);

  const handleSubmit = async () => {
    if (form.honeypot) return; // spam bot
    try {
      await submitMutation.mutateAsync({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
        preferredContact: form.preferredContact,
        streetAddress: form.streetAddress,
        unit: form.unit || undefined,
        city: form.city,
        zipCode: form.zipCode,
        locationType: form.locationType as any,
        locationNotes: form.locationNotes || undefined,
        vehicleYear: form.vehicleYear || undefined,
        vehicleMake: form.vehicleMake || undefined,
        vehicleModel: form.vehicleModel || undefined,
        vehicleTrim: form.vehicleTrim || undefined,
        vin: form.vin || undefined,
        mileage: form.mileage || undefined,
        requestedService: form.requestedService || undefined,
        mainSymptom: form.mainSymptom || undefined,
        problemDescription: form.problemDescription || undefined,
        vehicleStarts: form.vehicleStarts,
        vehicleSafe: form.vehicleSafe,
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        isAsap: form.isAsap,
        customerNotes: form.customerNotes || undefined,
        adsDataConsent: form.adsDataConsent,
        website: form.honeypot,
        attribution: getLeadAttributionForSubmission(form.adsDataConsent),
      });
      trackConversion("request_submit", { preferred_contact: form.preferredContact, requested_service: form.requestedService || "unspecified" });
      navigate("/request-confirmation");
    } catch (e) {
      toast.error("Failed to submit request. Please try again or call us directly.");
    }
  };

  const canProceed = () => {
    return canAdvanceRequestStep(step, form);
  };

  const advanceStep = () => {
    if (step === 1 && !form.city.trim()) {
      const parsed = parseManualAddress(form.streetAddress);
      if (parsed) setForm(previous => ({ ...previous, streetAddress: parsed.streetAddress, city: parsed.city, zipCode: previous.zipCode || parsed.zipCode }));
    }
    setStep(current => current + 1);
  };

  return (
      <section className={`${embedded ? "py-0" : "py-10 md:py-14"} service-request-form`} onFocusCapture={trackRequestStart}>
        <div className={embedded ? "w-full max-w-none" : "container max-w-3xl"}>
          {embedded ? <h2 className="text-2xl font-black tracking-tight md:text-3xl">Request Mobile Service</h2> : <h1 className="text-3xl font-black tracking-tight md:text-4xl">Request Mobile Service</h1>}
          <p className="mb-6 mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
            Tell us about your vehicle and the issue. This is a request — not a confirmed appointment.
            We'll contact you to discuss and schedule.
          </p>
          <p className="mb-5 inline-flex items-center rounded-full border border-primary/20 bg-primary/[.06] px-3 py-1.5 text-sm font-semibold text-foreground">
            Tap any white field below to enter your details. Fields marked <span className="ml-1 text-primary">*</span> are required.
          </p>

          {/* ========================================================================
              PROGRESS INDICATOR: Zeigarnik Effect + Visual Hierarchy
              - Shows completed steps with checkmarks
              - Current step highlighted in orange
              - Pending steps in gray
              - Creates engagement through incomplete task visualization
              ======================================================================== */}
          <div className="request-progress mb-6 rounded-2xl border border-primary/15 bg-primary/[.04] p-3 sm:p-4">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <button
                    onClick={() => i < step && setStep(i)}
                    aria-label={`Go to ${s}`}
                    aria-current={i === step ? "step" : undefined}
                    className={`progress-step ${i === step ? 'active' : i < step ? 'completed' : 'pending'} flex h-9 w-9 flex-shrink-0 items-center justify-center sm:h-10 sm:w-10`}
                  >
                    {i < step ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="step-number">{i + 1}</span>
                    )}
                  </button>
                  
                  {/* Connecting Line */}
                  {i < steps.length - 1 && (
                    <div className={`step-line mx-1 flex-1 sm:mx-2 ${i < step ? 'completed' : i === step ? 'active' : 'pending'}`}></div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Step Labels */}
            <div className="request-progress__labels mt-2 grid grid-cols-6 gap-1 text-center text-[10px] font-bold sm:text-xs">
              {steps.map((s, i) => (
                <span key={s} className={`request-progress__label ${i === step ? 'is-active' : i < step ? 'is-completed' : 'is-pending'}`}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="request-progress-summary mb-7 rounded-xl border border-primary/20 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="request-progress-summary__label text-sm font-medium text-foreground">Progress</span>
              <span className="request-progress-summary__percentage text-sm font-bold text-primary">{Math.round(((step + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Honeypot */}
          <div className="hidden" aria-hidden="true">
            <input tabIndex={-1} value={form.honeypot} onChange={e => updateForm("honeypot", e.target.value)} />
          </div>

          {/* Step 0: Contact */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-2"><Label className="text-sm font-bold">Full Name *</Label><Input value={form.fullName} onChange={e => updateForm("fullName", e.target.value)} placeholder="Your full name" className="min-h-12 bg-[var(--color-card-bg)] text-base shadow-sm" /></div>
              <div className="space-y-2"><Label className="text-sm font-bold">Mobile Phone *</Label><Input type="tel" inputMode="tel" value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="(407) 555-0000" className="min-h-12 bg-[var(--color-card-bg)] text-base shadow-sm" /></div>
              <div className="space-y-2"><Label className="text-sm font-bold">Email</Label><Input type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="your@email.com" className="min-h-12 bg-[var(--color-card-bg)] text-base shadow-sm" /></div>
              <div>
                <Label className="text-sm font-bold">Preferred Contact Method</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["call", "text", "email"] as const).map(m => (
                    <label key={m} className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 text-sm font-bold capitalize transition ${form.preferredContact === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:border-primary/40"}`}>
                      <input type="radio" name="contact" checked={form.preferredContact === m} onChange={() => updateForm("preferredContact", m)} className="accent-primary" />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service Address</Label>
                <Input ref={streetAddressInputRef} value={form.streetAddress} onChange={e => { updateForm("streetAddress", e.target.value); setLocationStatus(null); }} placeholder="Start typing your address" autoComplete="street-address" />
                <p className="text-xs text-muted-foreground">Choose an address suggestion, use your current location, or enter a street address, city, or ZIP manually.</p>
              </div>
              <Button type="button" variant="outline" onClick={handleUseCurrentLocation} disabled={isLocating} className="min-h-11 w-full gap-2 sm:w-auto">
                {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                {isLocating ? "Finding your location…" : "Use my current location"}
              </Button>
              <div><Label>Apt / Unit / Parking Lot</Label><Input value={form.unit} onChange={e => updateForm("unit", e.target.value)} placeholder="Optional" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>City</Label><Input value={form.city} onChange={e => updateForm("city", e.target.value)} placeholder="__CITY__" className="min-h-12 bg-[var(--color-card-bg)] text-base shadow-sm" /></div>
                <div><Label>ZIP Code</Label><Input value={form.zipCode} onChange={e => updateForm("zipCode", e.target.value)} placeholder="32801" /></div>
              </div>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {locationStatus ?? locationGuidance ?? "Location received. You can continue."}
              </p>
              <div>
                <Label>Location Type</Label>
                <select value={form.locationType} onChange={e => updateForm("locationType", e.target.value)} className="w-full border border-input rounded-md px-3 py-2 text-sm mt-1">
                  <option value="home">Home</option>
                  <option value="workplace">Workplace</option>
                  <option value="roadside">Roadside</option>
                  <option value="parking_lot">Parking Lot</option>
                  <option value="dealership">Dealership</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div><Label>Location Notes</Label><Input value={form.locationNotes} onChange={e => updateForm("locationNotes", e.target.value)} placeholder="e.g., Vehicle is in the driveway" /></div>
            </div>
          )}

          {/* Step 2: Vehicle */}
          {step === 2 && (
            <div className="space-y-4">
              <div><Label>VIN (optional — auto-fills vehicle info)</Label><Input value={form.vin} onChange={e => updateVin(e.target.value)} placeholder="Enter 17-character VIN" maxLength={17} className="font-mono" autoComplete="off" />{vinLookup.isFetching && <p className="mt-2 text-xs font-medium text-primary">Looking up vehicle details…</p>}{decodedVin === form.vin && vinLookup.data && <p className="mt-2 text-xs font-bold text-[var(--color-success)]">Vehicle details added from VIN. You can adjust them if needed.</p>}{vinLookup.isError && <p className="mt-2 text-xs font-medium text-[var(--color-warning)]">We could not decode that VIN. You can enter vehicle details manually.</p>}</div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><Label>Year</Label><select value={form.vehicleYear} onChange={e => chooseYear(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-input bg-[var(--color-card-bg)] px-3 text-sm"><option value="">Select year</option>{vehicleYears.map(year => <option key={year} value={year}>{year}</option>)}</select></div>
                <div><Label>Make</Label><Input list="vehicle-make-options" value={form.vehicleMake} onChange={e => chooseMake(e.target.value)} placeholder="Start typing Toyota" className="mt-1 min-h-11" autoComplete="off" /><datalist id="vehicle-make-options">{makeLookup.data?.map(make => <option key={make} value={make} />)}</datalist></div>
                <div><Label>Model</Label><Input list="vehicle-model-options" value={form.vehicleModel} onChange={e => updateForm("vehicleModel", e.target.value)} placeholder={form.vehicleYear && form.vehicleMake ? "Start typing Camry" : "Choose year and make"} className="mt-1 min-h-11" disabled={!form.vehicleYear || !form.vehicleMake} autoComplete="off" /><datalist id="vehicle-model-options">{modelLookup.data?.map(model => <option key={model} value={model} />)}</datalist></div>
              </div>
              <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-muted-foreground"><span className="font-bold text-primary">Vehicle suggestions:</span> select a year, then start typing the make and model. You can still enter a vehicle manually if it is not listed.</div>
              {(makeLookup.isError || modelLookup.isError) && <p className="text-xs font-medium text-[var(--color-warning)]">Vehicle suggestions are temporarily unavailable. You can enter the make and model manually.</p>}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Trim</Label><Input value={form.vehicleTrim} onChange={e => updateForm("vehicleTrim", e.target.value)} placeholder="SE, LE, etc." /></div>
                <div><Label>Mileage</Label><Input value={form.mileage} onChange={e => updateForm("mileage", e.target.value)} placeholder="e.g., 85000" /></div>
              </div>
            </div>
          )}

          {/* Step 3: Problem */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Requested Service</Label>
                <select value={form.requestedService} onChange={e => updateForm("requestedService", e.target.value)} className="w-full border border-input rounded-md px-3 py-2 text-sm mt-1">
                  <option value="">Select a service...</option>
                  <option value="diagnostics">Vehicle Diagnostics</option>
                  <option value="brake-service">Brake Service</option>
                  <option value="battery-electrical">Battery & Electrical</option>
                  <option value="oil-change">Oil Change</option>
                  <option value="tune-up">Tune-Up</option>
                  <option value="cooling-system">Cooling System / Radiator</option>
                  <option value="ac-repair">AC Repair</option>
                  <option value="belt-hose">Belt & Hose Replacement</option>
                  <option value="pre-purchase">Pre-Purchase Inspection</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div><Label>Main Symptom</Label><Input value={form.mainSymptom} onChange={e => updateForm("mainSymptom", e.target.value)} placeholder="e.g., Car won't start, check engine light" /></div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.vehicleStarts} onChange={e => updateForm("vehicleStarts", e.target.checked)} className="accent-primary" />
                  <span className="text-sm">Vehicle starts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.vehicleSafe} onChange={e => updateForm("vehicleSafe", e.target.checked)} className="accent-primary" />
                  <span className="text-sm">Vehicle is safe/accessible</span>
                </label>
              </div>
              <div><Label>Describe the Problem</Label><Textarea value={form.problemDescription} onChange={e => updateForm("problemDescription", e.target.value)} placeholder="Tell us what's happening with your vehicle..." rows={4} /></div>
            </div>
          )}

          {/* Step 4: Schedule */}
          {step === 4 && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-lg">
                <input type="checkbox" checked={form.isAsap} onChange={e => updateForm("isAsap", e.target.checked)} className="accent-primary" />
                <span className="font-medium">As soon as possible</span>
              </label>
              {!form.isAsap && (
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Preferred Date</Label><Input type="date" value={form.preferredDate} onChange={e => updateForm("preferredDate", e.target.value)} /></div>
                  <div>
                    <Label>Preferred Time</Label>
                    <select value={form.preferredTime} onChange={e => updateForm("preferredTime", e.target.value)} className="w-full border border-input rounded-md px-3 py-2 text-sm mt-1">
                      <option value="">Any time</option>
                      <option value="morning">Morning (9AM–12PM)</option>
                      <option value="afternoon">Afternoon (12PM–3PM)</option>
                      <option value="late-afternoon">Late Afternoon (3PM–5PM)</option>
                    </select>
                  </div>
                </div>
              )}
              <div><Label>Additional Notes</Label><Textarea value={form.customerNotes} onChange={e => updateForm("customerNotes", e.target.value)} placeholder="Anything else we should know..." rows={3} /></div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="trust-section">
                <h3 className="font-semibold text-base mb-4">Review Your Request</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{form.fullName}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{form.phone}</span></div>
                  <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{form.city} {form.zipCode}</span></div>
                  <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{form.vehicleYear} {form.vehicleMake} {form.vehicleModel}</span></div>
                  <div><span className="text-muted-foreground">Service:</span> <span className="font-medium">{form.requestedService || "Not specified"}</span></div>
                  <div><span className="text-muted-foreground">Timing:</span> <span className="font-medium">{form.isAsap ? "ASAP" : form.preferredDate || "Flexible"}</span></div>
                </div>
                {form.problemDescription && <div className="mt-3 pt-3 border-t border-secondary/30"><span className="text-muted-foreground">Problem:</span> <span className="font-medium">{form.problemDescription}</span></div>}
              </div>
              <p className="text-xs text-muted-foreground">
                By submitting, you agree to our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. 
                This is a service request, not a confirmed appointment. We will contact you to confirm availability and scheduling.
              </p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/25 p-3 text-sm text-muted-foreground">
                <input type="checkbox" checked={form.adsDataConsent} onChange={event => updateForm("adsDataConsent", event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
                <span><strong className="text-foreground">Optional advertising measurement.</strong> I agree that __BUSINESS_NAME__ may use my request details with Google advertising identifiers to measure whether ads produced qualified or completed service leads. This does not change service availability.</span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="min-h-11 gap-1 px-4">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={advanceStep} disabled={!canProceed()} className="btn-primary min-h-11 gap-1 px-5 text-base">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="btn-primary min-h-11 px-5 text-base">
                {submitMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Need immediate help? Call <a href={`tel:${BUSINESS_CONFIG.phoneRaw}`} className="text-primary font-medium hover:underline">{BUSINESS_CONFIG.phone}</a>
          </p>
        </div>
      </section>
  );
}

export default function RequestService() {
  return (
    <PublicLayout>
      <SEOHead title="Request Mobile Mechanic Service in __CITY__ | __BUSINESS_NAME__" description="Request mobile auto repair, diagnostics, brake service, battery help, maintenance, or an inspection at your __CITY__ or __REGION__ location." canonical="__BUSINESS_URL__/request-service" />
      <ServiceJsonLd name="Mobile mechanic service request" description="Request on-location automotive diagnostics, repair, maintenance, and inspections in __CITY__ and __REGION__." url="/request-service" />
      <GoogleReviewsStrip compact />
      <ServiceRequestForm />
    </PublicLayout>
  );
}
