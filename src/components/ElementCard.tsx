import React from 'react';
import { motion } from 'motion/react';
import { ChemicalElement, ToneProperty } from '../types';
import { CATEGORY_COLORS, STATE_ICONS } from '../data/elements';
import { getNoteNameForElement } from '../utils/audio';

interface ElementCardProps {
  element: ChemicalElement;
  onClick: (element: ChemicalElement) => void;
  isHighlighted: boolean;
  isInChord?: boolean;
  isDimmed: boolean;
  propertyToDisplay: ToneProperty;
  toneProperty?: ToneProperty;
}

export const ElementCard: React.FC<ElementCardProps> = ({
  element,
  onClick,
  isHighlighted,
  isInChord = false,
  isDimmed,
  propertyToDisplay,
  toneProperty = 'atomicMass' as ToneProperty,
}) => {
  const colors = CATEGORY_COLORS[element.category] || CATEGORY_COLORS.unknown;

  const getPropertyValue = () => {
    switch (propertyToDisplay) {
      case 'electronegativity':
        return element.electronegativity !== null ? `χ: ${element.electronegativity}` : 'χ: N/A';
      case 'atomicMass':
        return `${element.atomicMass.toFixed(2)}`;
      case 'atomicNumber':
        return `No. ${element.atomicNumber}`;
      case 'density':
        return element.density !== null ? `${element.density} g/cm³` : 'N/A';
      case 'period':
        return `Period ${element.period}`;
      default:
        return `${element.atomicMass.toFixed(2)}`;
    }
  };

  // Determine standard grid classes for absolute positioning inside the CSS grid
  // Col spans: we can map the col to style gridColumnStart or use inline styles for flexibility
  const cardStyle: React.CSSProperties = {
    gridColumnStart: element.gridCol,
    gridRowStart: element.gridRow,
  };

  return (
    <motion.button
      id={`element-card-${element.atomicNumber}`}
      onClick={() => onClick(element)}
      style={cardStyle}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: isDimmed ? 0.35 : 1,
        transition: { duration: 0.2 }
      }}
      whileHover={isDimmed ? {} : { 
        scale: 1.05, 
        zIndex: 10,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative flex flex-col justify-between p-1.5 md:p-2 rounded-lg border text-left
        transition-all cursor-pointer h-[72px] md:h-20 lg:h-[88px] min-w-0 select-none
        ${colors.bg} ${colors.border}
        ${isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-indigo-400 dark:ring-offset-slate-950 z-10' : ''}
        ${isInChord ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] z-10 scale-[1.02]' : ''}
      `}
    >
      {/* Top row: atomic number & state icon */}
      <div className="flex justify-between items-start w-full">
        <span className="text-[10px] md:text-xs font-mono font-bold text-slate-500 dark:text-slate-400 leading-none">
          {element.atomicNumber}
        </span>
        <div className="flex items-center gap-1">
          {isInChord && (
            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold animate-pulse" title="In Active Chord">
              ♫
            </span>
          )}
          <span className="text-[10px] md:text-xs" title={element.state}>
            {STATE_ICONS[element.state]}
          </span>
        </div>
      </div>

      {/* Center: Symbol */}
      <div className="flex flex-col items-center justify-center -mt-1">
        <span className="text-sm md:text-base lg:text-lg font-black tracking-tight text-slate-800 dark:text-slate-100 font-sans leading-none">
          {element.symbol}
        </span>
      </div>

      {/* Note Name */}
      <div className="text-center leading-none -mt-0.5 mb-0.5">
        <span className="text-[8px] md:text-[9px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
          {getNoteNameForElement(element, toneProperty)}
        </span>
      </div>

      {/* Bottom: Name & mass/property */}
      <div className="flex flex-col items-center w-full mt-auto">
        <span className="text-[8px] md:text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate w-full text-center leading-none">
          {element.name}
        </span>
        <span className="text-[7px] md:text-[8px] font-mono text-slate-400 dark:text-slate-500 truncate w-full text-center mt-0.5 leading-none">
          {getPropertyValue()}
        </span>
      </div>

      {/* Decorative colored category bar */}
      <div className={`absolute bottom-0 left-1 right-1 h-0.5 rounded-full ${colors.accent}`} />
    </motion.button>
  );
};
