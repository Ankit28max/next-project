// Every tunable number of the analysis pipeline lives here, so there is exactly one
// place to look when someone asks "why 0.6?" or "why 60?".

export const DUPLICATE = {
  /** Only complaints within this distance are compared at all. */
  RADIUS_M: 500,
  /** Only complaints from the last N days are compared. */
  WINDOW_DAYS: 60,
  /** How much each signal counts. They add up to 1. */
  WEIGHTS: { text: 0.35, distance: 0.35, category: 0.15, image: 0.15 },
  /** A combined score at or above this is reported as a possible duplicate. */
  THRESHOLD: 0.6,
  /** dHash values that differ in at most this many of 64 bits count as the same photo. */
  SAME_PHOTO_MAX_HAMMING: 10,
  MAX_CANDIDATES: 200,
  MAX_MATCHES: 5,
} as const;

export const FRAUD = {
  /** Score thresholds (0-100). Used everywhere a level is derived from a score. */
  MEDIUM_AT: 30,
  HIGH_AT: 60,
  /** Points added by each signal. */
  POINTS: {
    photoReusedByOtherCitizen: 45,
    photoReusedBySameCitizen: 15,
    exifGpsFarFromPin: 25,
    exifTimeInconsistent: 15,
    exifMissing: 5,
    editingSoftware: 10,
    imageTextMismatch: 25,
    stockOrScreenshot: 25,
    spamText: 30,
    velocity: 20,
    selfDuplicate: 10,
  },
  EXIF_GPS_MAX_KM: 2,
  EXIF_MAX_AGE_DAYS: 30,
  VELOCITY_WINDOW_MINUTES: 10,
  VELOCITY_MAX_SUBMISSIONS: 3,
} as const;

export const GEMINI = {
  TIMEOUT_MS: 10_000,
  DEFAULT_MODEL: 'gemini-3.5-flash-lite',
} as const;

/** Statuses that count as "open work" for an officer's workload. */
export const OPEN_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_CITIZEN_RESPONSE',
  'REOPENED',
] as const;
