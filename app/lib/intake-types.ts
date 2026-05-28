export interface PainMarker {
  x: number;
  y: number;
}

export interface IntakeFormData {
  date: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  birthday: string;
  occupation: string;
  referredBy: string;
  hearAboutUs: string[];
  hearAboutUsOther: string;
  hasInjuries: boolean | null;
  injuryDetails: string;
  hasSurgeries: boolean | null;
  surgeryDetails: string;
  medicalConditions: string;
  isPregnant: boolean | null;
  pregnancyDetails: string;
  allergies: string;
  bodyworkPreference: string;
  areasToAvoid: string;
  service: string;
  serviceDuration: string;
  enhancements: string[];
  sessionPreference: string;
  painMarkersFront: PainMarker[];
  painMarkersBack: PainMarker[];
}

export interface IntakeSubmission extends IntakeFormData {
  id: string;
  submittedAt: string;
}

export const HEAR_ABOUT_OPTIONS = [
  "Yelp",
  "Google",
  "Meta",
  "Youtube",
  "Reddit",
  "Quora",
] as const;

export const BODYWORK_PREFERENCES = [
  "Really focused body work on specific trouble areas only",
  "Focused work on trouble areas and light work elsewhere",
  "A well balanced full body massage w/ no real specific areas",
] as const;

export const SESSION_PREFERENCES = [
  "Very minimal talking so I can relax my mind",
  "Some feedback along the way is preferred",
  "Feedback, once I'm clothed, after the session only",
  "No extra feedback/chatter, just quiet relaxation",
] as const;

export const INTAKE_SERVICES = [
  { name: "Glow from Head to Toe", durations: ["90", "120"] },
  { name: "Clinical Deep Tissue", durations: ["30", "45", "60", "75", "90", "120"] },
  { name: "Swedish Massage", durations: ["60", "75", "90", "120"] },
  { name: "Prenatal Massage", durations: ["60", "75", "90", "120"] },
  { name: "Reflexology", durations: ["60", "75", "90", "120"] },
  { name: "Lymphatic Drainage", durations: ["60", "75", "90", "120"] },
  { name: "Sports Massage", durations: ["60", "75", "90", "120"] },
  { name: "Body Shaping", durations: ["60", "75", "90", "120"] },
  { name: "Facial Care", durations: ["60", "75", "90", "120"] },
] as const;

export const ENHANCEMENT_OPTIONS = [
  "Repair Sunburnt/Extremely Dry/Itching/Chapped Skin",
  "Foot Exfoliating",
  "Aromatherapy Essential Oils",
  "Himalayan Salt Stones",
  "CBD",
  "Quick Jaw and Scalp Massage (15 min extra)",
] as const;

export function emptyIntakeForm(): IntakeFormData {
  const today = new Date();
  const date = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;
  return {
    date,
    name: "",
    address: "",
    email: "",
    phone: "",
    birthday: "",
    occupation: "",
    referredBy: "",
    hearAboutUs: [],
    hearAboutUsOther: "",
    hasInjuries: null,
    injuryDetails: "",
    hasSurgeries: null,
    surgeryDetails: "",
    medicalConditions: "",
    isPregnant: null,
    pregnancyDetails: "",
    allergies: "",
    bodyworkPreference: "",
    areasToAvoid: "",
    service: "",
    serviceDuration: "",
    enhancements: [],
    sessionPreference: "",
    painMarkersFront: [],
    painMarkersBack: [],
  };
}
