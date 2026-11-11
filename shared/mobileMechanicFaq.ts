export type MobileMechanicFaq = {
  question: string;
  answer: string;
};

export type MobileMechanicFaqCategory = {
  title: string;
  description: string;
  faqs: MobileMechanicFaq[];
};

export const MOBILE_MECHANIC_FAQ_CATEGORIES: MobileMechanicFaqCategory[] = [
  {
    title: "How mobile service works",
    description: "What to expect when the mechanic comes to your location.",
    faqs: [
      {
        question: "What is a mobile mechanic?",
        answer: "A mobile mechanic travels to your location to perform eligible auto repairs, maintenance, diagnostics, and inspections. Instead of taking your vehicle to a shop, you can request service where the vehicle is safely parked and accessible.",
      },
      {
        question: "Where can a mobile mechanic work on my vehicle?",
        answer: "Mobile service may be possible at a home, workplace, driveway, parking area, or another safely accessible location. Let the team know where the vehicle is parked and whether there are access, parking, property, or building rules to consider before scheduling.",
      },
      {
        question: "What areas do you serve?",
        answer: "__BUSINESS_NAME__ serves __CITY__ and __REGION__, including Winter Park, Maitland, Altamonte Springs, Casselberry, Sanford, Oviedo, Kissimmee, and surrounding communities. Share your exact location so the team can confirm mobile-service availability.",
      },
      {
        question: "Can every repair be completed at my location?",
        answer: "Not every repair is a fit for mobile service. Work that requires a lift, extensive disassembly, specialized shop equipment, or an unsafe work area may need a shop-based solution. The team will discuss the appropriate next step after reviewing the vehicle concern and location.",
      },
      {
        question: "What should I do if my vehicle is in an unsafe location?",
        answer: "Put personal safety first. If the vehicle is in traffic, has smoke or fire, is leaking fuel, or creates an immediate hazard, move to safety and contact emergency services or roadside assistance as appropriate. Do not attempt to inspect an unsafe vehicle on your own.",
      },
    ],
  },
  {
    title: "Services and vehicle concerns",
    description: "Common repairs, maintenance needs, and inspection questions.",
    faqs: [
      {
        question: "What services can a mobile mechanic perform?",
        answer: "Available mobile services include diagnostics, brake service, battery and electrical work, oil changes, tune-ups and maintenance, cooling-system repair, belt and hose replacement, AC diagnosis, and pre-purchase inspections. Share the symptom or service you need so the team can confirm the right next step.",
      },
      {
        question: "Can you diagnose a check engine light?",
        answer: "Yes. Provide the vehicle year, make, model, and any symptoms you noticed along with the warning light. On-site diagnosis can help identify a starting point, but the required repair depends on the diagnostic findings and the vehicle condition.",
      },
      {
        question: "Can you help if my car will not start?",
        answer: "If the vehicle is safely parked, describe what happens when you try to start it, such as clicking, cranking without starting, dim lights, or no response. Include the vehicle details and location so the team can discuss whether mobile diagnosis is appropriate.",
      },
      {
        question: "Can you inspect brakes, batteries, or electrical problems?",
        answer: "Brake concerns, battery issues, starter and alternator symptoms, and many electrical concerns can be reviewed as part of mobile service. Describe the warning signs, dashboard lights, noises, or changes in how the vehicle drives so the team has useful context before service.",
      },
      {
        question: "Do you perform pre-purchase inspections?",
        answer: "Yes. A pre-purchase inspection can help you understand a used vehicle's visible condition before you buy. Share the vehicle information, seller location, and timing needs so the team can discuss availability and the appropriate inspection scope.",
      },
    ],
  },
  {
    title: "Scheduling and preparing for service",
    description: "How to request a visit and make the appointment go smoothly.",
    faqs: [
      {
        question: "How do I schedule mobile mechanic service?",
        answer: "Call __BUSINESS_PHONE__, send a text, or submit the guided service request online. Include your vehicle details, the concern, and the service location. The team will contact you to discuss availability and scheduling.",
      },
      {
        question: "What information should I include in my service request?",
        answer: "The most helpful details are your name and contact method, vehicle year, make, model, VIN if available, current location, symptoms, dashboard warnings, and preferred timing. A brief note about the issue can also help you describe the concern clearly when the team follows up.",
      },
      {
        question: "How should I prepare my vehicle for a mobile appointment?",
        answer: "Park the vehicle where it can be safely accessed, keep the keys available, and remove personal items that may obstruct the work area. If you live or work in a managed property, confirm any access, parking, or repair rules before the appointment.",
      },
      {
        question: "What if I need to reschedule?",
        answer: "Contact __BUSINESS_NAME__ as soon as your timing changes. The team can discuss the next available option and any location or vehicle details that may affect the rescheduled visit.",
      },
      {
        question: "Do I need to be present while the mechanic works?",
        answer: "The team can explain what is needed for access, keys, communication, and any authorization when scheduling. Let them know early if another person will meet the mechanic or if the vehicle is at a workplace, residence, or managed property.",
      },
    ],
  },
  {
    title: "Pricing, parts, and repair decisions",
    description: "Clear expectations before authorizing service.",
    faqs: [
      {
        question: "How is mobile mechanic pricing discussed?",
        answer: "Pricing depends on the vehicle, condition, diagnosis, required parts, and scope of service. Share the details first so the team can discuss the appropriate next step and explain the information needed before a repair decision is made.",
      },
      {
        question: "Can you give an exact repair price before seeing the vehicle?",
        answer: "Some services can be discussed from the information you provide, but an exact repair price may depend on inspection or diagnosis. The team will explain what can be confirmed from the initial request and what may need to be evaluated in person.",
      },
      {
        question: "What if the diagnosis finds a different problem?",
        answer: "Vehicle symptoms can have more than one possible cause. If diagnosis identifies a different or additional concern, the team can explain the findings and discuss the next step before further work is considered.",
      },
      {
        question: "Can you help with maintenance as well as repairs?",
        answer: "Yes. Mobile service can include routine maintenance such as oil changes, tune-ups, filters, belts, hoses, battery service, and other eligible maintenance tasks. Include the maintenance need and vehicle information in your request.",
      },
    ],
  },
  {
    title: "Requesting help",
    description: "Simple next steps when you are ready to talk with the team.",
    faqs: [
      {
        question: "What are your service hours?",
        answer: "__BUSINESS_NAME__ is available Monday through Friday from 9:00 AM to 5:00 PM and Saturday from 9:00 AM to 3:00 PM. The business is closed on Sundays. Contact the team to discuss availability for your request.",
      },
      {
        question: "What if I am not sure which service I need?",
        answer: "That is completely fine. Start with the symptom, warning light, noise, or change in how the vehicle is driving. The team can review the information and discuss the most appropriate next step.",
      },
      {
        question: "Can I call or text instead of completing the online form?",
        answer: "Yes. You can call __BUSINESS_PHONE__ or send a text if you would rather describe the vehicle concern directly. The online form is simply another way to provide the details needed for follow-up.",
      },
      {
        question: "How can I request mobile mechanic service now?",
        answer: "Use the online service request form, call __BUSINESS_PHONE__, or send a text. Include the vehicle concern, location, and best way to reach you so __BUSINESS_NAME__ can discuss the next step.",
      },
    ],
  },
];

export const MOBILE_MECHANIC_FAQS = MOBILE_MECHANIC_FAQ_CATEGORIES.flatMap((category) => category.faqs);

export const HOME_FAQ_ITEMS = MOBILE_MECHANIC_FAQS.slice(0, 8).map((faq) => ({
  title: faq.question,
  description: faq.answer,
}));
