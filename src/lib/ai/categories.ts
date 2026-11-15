// The fixed list of complaint categories. The same codes are stored in the database
// (see prisma/seed-shared.ts) and are the only values the vision model may answer with.
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CategoryRule {
  code: string;
  name: string;
  description: string;
  departmentCode: string;
  defaultSeverity: Severity;
  /** keyword or phrase -> weight (3 = very specific, 2 = typical, 1 = weak hint). English and Hinglish. */
  keywords: Record<string, number>;
}

// ORDER MATTERS: when two categories get the same score, the one listed first wins.
export const CATEGORIES: CategoryRule[] = [
  {
    code: 'ROADS',
    name: 'Roads & Potholes',
    description: 'Potholes, broken roads, damaged footpaths and speed breakers.',
    departmentCode: 'PWD',
    defaultSeverity: 'HIGH',
    keywords: {
      pothole: 3, potholes: 3, gaddha: 3, gadda: 3, gaddhe: 3, gadde: 3,
      sadak: 2, sarak: 2, asphalt: 2, tarmac: 2, tar: 1, footpath: 2, pavement: 2,
      'speed breaker': 2, divider: 2, flyover: 1, road: 1, roads: 1, street: 1, crater: 2,
    },
  },
  {
    code: 'WATER_SUPPLY',
    name: 'Water Supply',
    description: 'No water, low pressure, leaking or burst supply pipes, dirty tap water.',
    departmentCode: 'WATER',
    defaultSeverity: 'HIGH',
    keywords: {
      'water supply': 3, 'no water': 3, 'pani nahi': 3, 'pipe burst': 3, 'burst pipe': 3, 'pipe leak': 3,
      'dirty water': 3, 'ganda pani': 3, 'drinking water': 3, 'water pressure': 3,
      pipeline: 2, leakage: 2, tap: 2, nal: 2, tanker: 2, leak: 1, leaking: 1, pani: 1, water: 1,
    },
  },
  {
    code: 'DRAINAGE',
    name: 'Drainage & Sewage',
    description: 'Blocked drains, overflowing sewers, open manholes and waterlogging.',
    departmentCode: 'WATER',
    defaultSeverity: 'HIGH',
    keywords: {
      drain: 3, drains: 3, drainage: 3, nali: 3, naali: 3, nala: 3, sewer: 3, sewage: 3, manhole: 3, gutter: 3,
      waterlogging: 3, waterlogged: 3, 'water logging': 3, 'jal bharav': 3,
      clogged: 2, choked: 2, blocked: 1, overflowing: 1, overflow: 1,
    },
  },
  {
    code: 'SANITATION',
    name: 'Garbage & Sanitation',
    description: 'Uncollected garbage, overflowing bins, dead animals, unclean public areas.',
    departmentCode: 'SANITATION',
    defaultSeverity: 'MEDIUM',
    keywords: {
      garbage: 3, kachra: 3, kachre: 3, kooda: 3, kuda: 2, trash: 3, dustbin: 3, 'dead animal': 3,
      waste: 2, dump: 2, dumping: 2, litter: 2, safai: 2, sweeping: 2, mosquitoes: 2, machhar: 2,
      smell: 1, stink: 1, badbu: 1, dirty: 1, gandagi: 2,
    },
  },
  {
    code: 'LIGHTING',
    name: 'Streetlights & Electricity',
    description: 'Streetlights not working, dangerous wires, damaged poles and transformers.',
    departmentCode: 'ELEC',
    defaultSeverity: 'MEDIUM',
    keywords: {
      streetlight: 3, streetlights: 3, 'street light': 3, 'street lights': 3, 'electric pole': 3,
      transformer: 3, 'power cut': 3, 'live wire': 3,
      bijli: 2, wire: 2, wires: 2, taar: 2, khamba: 2, bulb: 2, sparking: 2, andhera: 2, electricity: 2,
      light: 1, lights: 1, dark: 1, pole: 1,
    },
  },
  {
    code: 'PUBLIC_PROPERTY',
    name: 'Public Property Damage',
    description: 'Damaged parks, benches, bus stops, public toilets and signboards.',
    departmentCode: 'PWD',
    defaultSeverity: 'MEDIUM',
    keywords: {
      vandalism: 3, 'bus stop': 3, 'bus shelter': 3, signboard: 3, 'public toilet': 3, playground: 3,
      bench: 2, benches: 2, park: 2, railing: 2, fence: 2, swing: 2, swings: 2, wall: 1,
    },
  },
];

export const OTHER_CATEGORY = {
  code: 'OTHER',
  name: 'Other Civic Issue',
  description: 'Anything that does not fit the categories above.',
  departmentCode: 'PWD',
  defaultSeverity: 'MEDIUM' as Severity,
};

export const CATEGORY_CODES = [...CATEGORIES.map((c) => c.code), OTHER_CATEGORY.code];

export const URGENT_PHRASES = [
  'urgent', 'emergency', 'danger', 'dangerous', 'accident', 'accidents', 'live wire', 'sparking',
  'electrocution', 'current', 'open manhole', 'khatra', 'khatarnak', 'fire', 'collapsed', 'injured',
];
