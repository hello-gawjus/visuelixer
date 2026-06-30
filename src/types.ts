export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth-metal'
  | 'transition-metal'
  | 'lanthanide'
  | 'actinide'
  | 'post-transition-metal'
  | 'metalloid'
  | 'reactive-nonmetal'
  | 'noble-gas'
  | 'unknown';

export type PhysicalState = 'solid' | 'liquid' | 'gas' | 'synthetic';

export type ToneProperty = 'atomicMass' | 'atomicNumber' | 'electronegativity' | 'density' | 'period';

export type ShellsPlayOption = '1' | '2' | '3' | '4' | 'all' | 'outer';

export interface ChemicalElement {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: ElementCategory;
  state: PhysicalState;
  electronConfiguration: string;
  electronegativity: number | null; // Pauling scale
  meltingPoint: number | null; // in Kelvin
  boilingPoint: number | null; // in Kelvin
  density: number | null; // g/cm³ or g/L for gases
  discoveredBy: string;
  discoveryYear: string | number; // "Ancient" or year
  group: number | null; // 1 to 18
  period: number; // 1 to 7
  gridCol: number; // 1 to 18
  gridRow: number; // 1 to 10 (8 is a spacer, 9 lanthanides, 10 actinides)
  summary: string;
}

export interface TableFilters {
  searchQuery: string;
  category: ElementCategory | 'all';
  note: string | 'all';
  key: string | 'all';
  viewMode: 'grid' | 'list' | 'groups';
  highlightedProperty: 'none' | 'electronegativity' | 'atomicMass' | 'meltingPoint' | 'boilingPoint';
}

export interface SequenceNote {
  element: ChemicalElement;
  timestamp: number; // relative time in ms from sequence start
  toneProperty: ToneProperty;
  shellsToPlay: ShellsPlayOption;
}

export interface SavedSequence {
  id: string;
  name: string;
  notes: SequenceNote[];
  createdAt: number;
}
