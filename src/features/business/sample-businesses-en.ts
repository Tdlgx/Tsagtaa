/**
 * English text for the sample businesses, keyed by slug. Services are listed
 * in the same order as in `sample-businesses.ts`. Names keep their Mongolian
 * sound (they are brand names); kinds of place and services are translated.
 */
export const SAMPLE_BUSINESSES_EN: Record<
  string,
  { name: string; area: string; services: readonly string[] }
> = {
  "ongo-salon": {
    name: "Ongo Salon",
    area: "Near Sükhbaatar Square",
    services: ["Women's haircut", "Hair colouring", "Hair treatment"],
  },
  "khaan-barber": {
    name: "Khaan Barber",
    area: "Zaisan",
    services: ["Men's haircut", "Beard trim", "Haircut and beard"],
  },
  "gerelt-manicure": {
    name: "Gerelt Manicure",
    area: "13th Microdistrict",
    services: ["Gel polish", "Manicure", "Pedicure"],
  },
  "amar-massage": {
    name: "Amar Massage",
    area: "Behind the State Department Store",
    services: ["Back and neck massage", "Full body massage", "Foot massage"],
  },
  "tod-beauty": {
    name: "Tod Beauty",
    area: "West 4th Crossroads",
    services: ["Eyelash extensions", "Eyebrow shaping", "Facial"],
  },
  "enkh-amgalan-clinic": {
    name: "Enkh-Amgalan Clinic",
    area: "13th Microdistrict",
    services: ["Internal medicine check-up", "Complete blood count", "Abdominal ultrasound"],
  },
  "inee-dental": {
    name: "Inee Dental Clinic",
    area: "Near Shangri-La",
    services: ["Dental check-up", "Scale and polish", "Filling"],
  },
  "khurdan-auto": {
    name: "Khurdan Auto Repair",
    area: "Airport Roundabout",
    services: ["Oil and filter change", "Computer diagnostics", "Tyre change and balancing"],
  },
  "tunglag-car-wash": {
    name: "Tunglag Car Wash",
    area: "Bömbögör",
    services: ["Exterior wash", "Exterior and interior wash", "Seat deep cleaning"],
  },
  "nokhor-vet": {
    name: "Nokhor Vet Clinic",
    area: "Zaisan",
    services: ["Dog and cat check-up", "Vaccination", "Grooming and bath"],
  },
};
