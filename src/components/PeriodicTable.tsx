import React from 'react';
import { motion } from 'motion/react';
import { ChemicalElement, TableFilters, ToneProperty } from '../types';
import { ElementCard } from './ElementCard';
import { CATEGORY_COLORS } from '../data/elements';
import { getNoteNameForElement } from '../utils/audio';
import { MUSICAL_KEYS, normalizeNote } from './ChordBuilder';

interface PeriodicTableProps {
  elements: ChemicalElement[];
  filters: TableFilters;
  onElementClick: (element: ChemicalElement) => void;
  selectedElement: ChemicalElement | null;
  chordElements?: ChemicalElement[];
  toneProperty?: ToneProperty;
}

export const PeriodicTable: React.FC<PeriodicTableProps> = ({
  elements,
  filters,
  onElementClick,
  selectedElement,
  chordElements = [],
  toneProperty = 'atomicMass',
}) => {
  const { searchQuery, category, note, key } = filters;

  // Helper function to check if an element matches filters
  const matchesFilters = (element: ChemicalElement): boolean => {
    // Search match
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      element.name.toLowerCase().includes(query) ||
      element.symbol.toLowerCase().includes(query) ||
      element.atomicNumber.toString() === query;

    // Category match
    const matchesCategory = category === 'all' || element.category === category;

    // Note match
    const elementNote = getNoteNameForElement(element, toneProperty as ToneProperty);
    const matchesNote = note === 'all' || elementNote === note;

    // Key match
    let matchesKey = true;
    if (key !== 'all') {
      const selectedKeyObj = MUSICAL_KEYS.find((k) => k.name === key);
      if (selectedKeyObj && selectedKeyObj.notes.length > 0) {
        const normalizedKeyNotes = selectedKeyObj.notes.map(normalizeNote);
        matchesKey = normalizedKeyNotes.includes(normalizeNote(elementNote));
      }
    }

    return matchesSearch && matchesCategory && matchesNote && matchesKey;
  };

  // Grid View layout
  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Scrollable Container for Wider Grid Layouts */}
      <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-[1024px] grid grid-cols-18 gap-1.5 md:gap-2">
          
          {/* Render standard and active elements */}
          {elements.map((el) => {
            const active = matchesFilters(el);
            const isSel = selectedElement?.atomicNumber === el.atomicNumber;
            const isInChord = chordElements.some((item) => item.atomicNumber === el.atomicNumber);
            
            return (
              <ElementCard
                key={el.atomicNumber}
                element={el}
                onClick={onElementClick}
                isHighlighted={isSel}
                isInChord={isInChord}
                isDimmed={!active}
                propertyToDisplay={toneProperty}
                toneProperty={toneProperty}
              />
            );
          })}

          {/* Spacer cards for Lanthanides/Actinides reference boxes (the f-block branch anchors in rows 6 and 7, col 3) */}
          <motion.div
            style={{ gridColumnStart: 3, gridRowStart: 6 }}
            className="border-2 border-dashed border-purple-200 dark:border-purple-900/40 bg-purple-50/10 rounded-lg flex flex-col items-center justify-center p-1.5 text-center text-purple-700 dark:text-purple-400 select-none h-[72px] md:h-20 lg:h-[88px]"
          >
            <span className="text-[10px] md:text-xs font-bold leading-none">57-71</span>
            <span className="text-[8px] md:text-[10px] font-semibold uppercase tracking-wider mt-1 opacity-70">La-Lu</span>
          </motion.div>

          <motion.div
            style={{ gridColumnStart: 3, gridRowStart: 7 }}
            className="border-2 border-dashed border-pink-200 dark:border-pink-900/40 bg-pink-50/10 rounded-lg flex flex-col items-center justify-center p-1.5 text-center text-pink-700 dark:text-pink-400 select-none h-[72px] md:h-20 lg:h-[88px]"
          >
            <span className="text-[10px] md:text-xs font-bold leading-none">89-103</span>
            <span className="text-[8px] md:text-[10px] font-semibold uppercase tracking-wider mt-1 opacity-70">Ac-Lr</span>
          </motion.div>

          {/* Group header indicator texts above the columns (columns 1 to 18) on row 1 */}
          {/* Note: In our grid mapping, Row 1 has elements at Col 1 (H) and Col 18 (He). 
              Let's render small column group numbers (1-18) beautifully. */}
          {Array.from({ length: 18 }).map((_, idx) => {
            const groupNum = idx + 1;
            // Place indicators on custom visual grids. Let's make it look pristine.
            return (
              <div
                key={`group-indicator-${groupNum}`}
                style={{ gridColumnStart: groupNum, gridRowStart: 1, height: '18px' }}
                className="text-center font-mono text-[9px] font-black text-slate-350 dark:text-slate-600 self-end pointer-events-none mb-1 hidden md:block"
              >
                {groupNum}
              </div>
            );
          })}

          {/* Spacer row between row 7 and f-block (row 9, so row 8 is an empty placeholder) */}
          <div className="col-span-18 h-4" style={{ gridColumnStart: 1, gridRowStart: 8 }} />

        </div>
      </div>
      
      {/* Element Counts Indicator */}
      <div className="flex justify-between items-center text-xs text-slate-450 dark:text-slate-500 font-medium px-1">
        <span>Showing {elements.filter(matchesFilters).length} of {elements.length} elements</span>
        <span>f-block elements displayed separately below</span>
      </div>

    </div>
  );
};
