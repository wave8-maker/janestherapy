import bundle from "@/content/consents.json";

export interface ConsentItem {
  key: string;
  title: string;
  summary: string;
  acknowledgement: string;
  body: string[];
}

export interface ConsentBundle {
  version: string;
  updated: string;
  items: ConsentItem[];
}

/**
 * The consent clauses the client sees and agrees to, one checkbox each.
 *
 * Every submission stores its own copy of this text (see `consentSnapshot` in
 * intake-types) so that editing `content/consents.json` later never changes
 * what an already-signed record says the client agreed to.
 */
export function getConsentBundle(): ConsentBundle {
  const { version, updated, items } = bundle;
  return { version, updated, items };
}

export const CONSENT_KEYS = bundle.items.map((i) => i.key);
