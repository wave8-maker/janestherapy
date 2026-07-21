import type { ConsentItem } from "./consents";

export interface PainMarker {
  x: number;
  y: number;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
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
  emergencyContact: EmergencyContact;
  /** Checked boxes from HEALTH_CONDITIONS — the heart of the disclosure record. */
  conditions: string[];
  conditionsOther: string;
  /** Required: the client affirms they reviewed the condition list honestly. */
  healthAttested: boolean;
  hasInjuries: boolean | null;
  injuryDetails: string;
  hasSurgeries: boolean | null;
  surgeryDetails: string;
  medicalConditions: string;
  isPregnant: boolean | null;
  pregnancyDetails: string;
  goals: string[];
  goalsOther: string;
  pressure: string;
  painLevel: number | null;
  areasToAvoid: string;
  enhancements: string[];
  sessionPreference: string;
  painMarkersFront: PainMarker[];
  painMarkersBack: PainMarker[];
  /** Consent key → ISO timestamp of the moment the client ticked that box. */
  consents: Record<string, string>;
  /** PNG data URL of the handwritten signature. */
  signatureDataUrl: string;
  printedName: string;
}

/**
 * Questions earlier versions of the form asked. The wizard no longer collects
 * them, but records signed before they were dropped still carry the answers, so
 * admin and the printout keep showing them when present.
 */
export interface LegacyIntakeFields {
  medications?: string;
  allergies?: string;
  physician?: string;
  service?: string;
  serviceDuration?: string;
  bodyworkPreference?: string;
  musicPreference?: string;
  roomTemperature?: string;
}

export interface IntakeSubmission extends IntakeFormData, LegacyIntakeFields {
  id: string;
  /** Stamped by the server — the tablet's clock is not trusted. */
  submittedAt: string;
  /** Version of content/consents.json that was displayed. */
  consentVersion: string;
  /** Verbatim copy of the clauses shown, frozen at signing time. */
  consentSnapshot: ConsentItem[];
  meta: {
    ip: string;
    userAgent: string;
  };
}

/**
 * Named conditions the client ticks off one by one. Asking by name — rather than
 * with an open "any medical conditions?" box — is what turns a later omission into
 * a specific, provable misstatement.
 */
export const HEALTH_CONDITIONS = [
  "High Blood Pressure",
  "Low Blood Pressure",
  "Diabetes",
  "Heart Disease",
  "Pacemaker or Implanted Device",
  "Stroke",
  "Cancer",
  "Pregnancy",
  "Recent Surgery",
  "Recent Injury",
  "Blood Thinners / Anticoagulants",
  "Osteoporosis",
  "Neuropathy",
  "Skin Infection or Open Wound",
  "Varicose Veins",
  "Blood Clots",
  "Autoimmune Disease",
  "Other",
] as const;

/** Conditions that raise a flag in the admin list so Jane sees them before the session. */
export const ALERT_CONDITIONS: readonly string[] = [
  "High Blood Pressure",
  "Diabetes",
  "Heart Disease",
  "Pacemaker or Implanted Device",
  "Stroke",
  "Cancer",
  "Pregnancy",
  "Recent Surgery",
  "Blood Thinners / Anticoagulants",
  "Blood Clots",
];

export const VISIT_GOALS = [
  "Pain Relief",
  "Relaxation",
  "Stress Relief",
  "Sports Recovery",
  "Mobility",
  "Other",
] as const;

export const PRESSURE_LEVELS = ["Light", "Medium", "Firm", "Deep"] as const;

export const HEAR_ABOUT_OPTIONS = [
  "Yelp",
  "Google",
  "Meta",
  "Youtube",
  "Reddit",
  "Quora",
] as const;

export const SESSION_PREFERENCES = [
  "Very minimal talking so I can relax my mind",
  "Some feedback along the way is preferred",
  "Feedback, once I'm clothed, after the session only",
  "No extra feedback/chatter, just quiet relaxation",
] as const;

export const ENHANCEMENT_OPTIONS = [
  "Foot Exfoliating",
  "Aromatherapy Essential Oils",
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
    emergencyContact: { name: "", relationship: "", phone: "" },
    conditions: [],
    conditionsOther: "",
    healthAttested: false,
    hasInjuries: null,
    injuryDetails: "",
    hasSurgeries: null,
    surgeryDetails: "",
    medicalConditions: "",
    isPregnant: null,
    pregnancyDetails: "",
    goals: [],
    goalsOther: "",
    pressure: "",
    painLevel: null,
    areasToAvoid: "",
    enhancements: [],
    sessionPreference: "",
    painMarkersFront: [],
    painMarkersBack: [],
    consents: {},
    signatureDataUrl: "",
    printedName: "",
  };
}

/**
 * Fills in fields added after a record was written, so submissions saved by
 * earlier versions of the form still render in admin without optional-chaining
 * every field at every call site.
 */
export function normalizeSubmission(raw: Partial<IntakeSubmission>): IntakeSubmission {
  return {
    ...emptyIntakeForm(),
    ...raw,
    id: raw.id ?? "",
    submittedAt: raw.submittedAt ?? "",
    date: raw.date ?? "",
    emergencyContact: raw.emergencyContact ?? { name: "", relationship: "", phone: "" },
    conditions: raw.conditions ?? [],
    hearAboutUs: raw.hearAboutUs ?? [],
    enhancements: raw.enhancements ?? [],
    goals: raw.goals ?? [],
    painMarkersFront: raw.painMarkersFront ?? [],
    painMarkersBack: raw.painMarkersBack ?? [],
    consents: raw.consents ?? {},
    consentVersion: raw.consentVersion ?? "",
    consentSnapshot: raw.consentSnapshot ?? [],
    meta: raw.meta ?? { ip: "", userAgent: "" },
  };
}
