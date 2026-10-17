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
  "setgel-salon": {
    name: "Setgel Salon",
    area: "3rd and 4th Microdistricts",
    services: ["Women's haircut", "Perm", "Children's haircut"],
  },
  "nomad-barber": {
    name: "Nomad Barber",
    area: "Seoul Street",
    services: ["Men's haircut", "Hot towel beard trim"],
  },
  "tsetseg-nail": {
    name: "Tsetseg Nail Studio",
    area: "Yarmag",
    services: ["Gel polish", "Nail extensions", "Manicure"],
  },
  "nar-spa": {
    name: "Nar Spa",
    area: "Nükhtiin Am",
    services: ["Hot stone massage", "Back and neck massage"],
  },
  "sod-beauty": {
    name: "Sod Beauty",
    area: "Near Narantuul Market",
    services: ["Eyebrow tattoo", "Eyebrow shaping", "Lash lift"],
  },
  "erdene-hair": {
    name: "Erdene Hairdresser",
    area: "Ulaankhuaran",
    services: ["Men's haircut", "Women's haircut"],
  },
  "khurel-barber": {
    name: "Khurel Barber",
    area: "Tolgoit",
    services: ["Men's haircut", "Beard trim"],
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
  "tsagaan-shud-dental": {
    name: "Tsagaan Shud Dental",
    area: "Yarmag",
    services: ["Dental check-up", "Teeth whitening"],
  },
  "khurdan-auto": {
    name: "Khurdan Auto Repair",
    area: "Airport Roundabout",
    services: ["Oil and filter change", "Computer diagnostics", "Tyre change and balancing"],
  },
  "bat-motor": {
    name: "Bat Motor Service",
    area: "West 4th Crossroads",
    services: ["Oil and filter change", "Brake pad replacement", "Suspension check"],
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
