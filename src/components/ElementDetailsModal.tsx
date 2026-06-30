import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, Compass, Flame, Thermometer, Layers, RefreshCw, Volume2, Music, HelpCircle } from 'lucide-react';
import { ChemicalElement, ToneProperty, ShellsPlayOption } from '../types';
import { playElementTone, getFrequencyForElement, getNoteNameForElement } from '../utils/audio';
import { CATEGORY_COLORS, STATE_LABELS } from '../data/elements';
import { WaveformVisualizer } from './WaveformVisualizer';
import { Tooltip } from './Tooltip';

interface ElementDetailsModalProps {
  element: ChemicalElement | null;
  onClose: () => void;
  toneDuration?: number;
  toneProperty?: ToneProperty;
  shellsToPlay?: ShellsPlayOption;
  isInChord?: boolean;
  onToggleChord?: (element: ChemicalElement) => void;
  onPlayTone?: (element: ChemicalElement) => void;
}

export const ElementDetailsModal: React.FC<ElementDetailsModalProps> = ({ 
  element, 
  onClose, 
  toneDuration,
  toneProperty = 'atomicMass' as ToneProperty,
  shellsToPlay = '1' as ShellsPlayOption,
  isInChord = false,
  onToggleChord,
  onPlayTone,
}) => {
  if (!element) return null;

  const colors = CATEGORY_COLORS[element.category] || CATEGORY_COLORS.unknown;

  // Convert kelvin to celsius
  const toCelsius = (k: number | null) => {
    if (k === null) return 'N/A';
    return `${(k - 273.15).toFixed(1)} °C`;
  };

  const getToneExplanation = (prop: ToneProperty) => {
    switch (prop) {
      case 'atomicMass':
        return "Lighter elements produce high, bright notes, while heavier elements produce deep, low notes.";
      case 'atomicNumber':
        return "Elements with fewer protons produce high-pitched notes, while elements with more protons produce lower, deeper notes.";
      case 'electronegativity':
        return "Elements that strongly attract electrons produce high, energetic notes, while weak attractors produce soft, low notes.";
      case 'density':
        return "Low-density elements (like gases) produce high, airy notes, while high-density elements (like heavy metals) produce deep, solid drone-like notes.";
      case 'period':
        return "Elements in top rows of the table produce high notes, and each step down the table rows drops the pitch lower (acting like lower octaves).";
      default:
        return "Maps physical properties of the chemical element to an audio frequency range from 140 Hz to 784 Hz.";
    }
  };

  // Render electron shells representation
  const renderShells = () => {
    // Basic shell distribution calculator based on period & electron count
    // Real Bohr model shells for stable configurations:
    const shells: Record<number, number[]> = {
      1: [1], // H
      2: [2], // He
      3: [2, 1], // Li
      4: [2, 2], // Be
      5: [2, 3], // B
      6: [2, 4], // C
      7: [2, 5], // N
      8: [2, 6], // O
      9: [2, 7], // F
      10: [2, 8], // Ne
      11: [2, 8, 1], // Na
      12: [2, 8, 2], // Mg
      13: [2, 8, 3], // Al
      14: [2, 8, 4], // Si
      15: [2, 8, 5], // P
      16: [2, 8, 6], // S
      17: [2, 8, 7], // Cl
      18: [2, 8, 8], // Ar
      19: [2, 8, 8, 1], // K
      20: [2, 8, 8, 2], // Ca
    };

    const count = element.atomicNumber;
    let dist: number[] = [];

    if (shells[count]) {
      dist = shells[count];
    } else {
      // Approximate distribution for other elements
      // Max electrons per shell: 2, 8, 18, 32, 50, etc.
      let remaining = count;
      const limits = [2, 8, 18, 32, 32, 18, 8];
      for (const lim of limits) {
        if (remaining > lim) {
          dist.push(lim);
          remaining -= lim;
        } else {
          dist.push(remaining);
          break;
        }
      }
    }

    return (
      <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1">
          <Layers size={14} /> Electron Shell Distribution
        </span>
        
        {/* Visual Bohr model approximation */}
        <div className="relative w-36 h-36 flex items-center justify-center bg-white dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner">
          {/* Nucleus */}
          <div className="absolute w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
            +{element.atomicNumber}
          </div>
          
          {/* Shell orbits */}
          {dist.map((electrons, idx) => {
            const size = 38 + (idx + 1) * 16;
            return (
              <div
                key={idx}
                style={{ width: `${size}px`, height: `${size}px` }}
                className="absolute border border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-full"
              >
                {/* Visual electrons dotted on orbit */}
                {Array.from({ length: electrons }).map((_, eIdx) => {
                  const angle = (eIdx / electrons) * 360;
                  const radius = size / 2;
                  const x = radius + radius * Math.cos((angle * Math.PI) / 180) - 3;
                  const y = radius + radius * Math.sin((angle * Math.PI) / 180) - 3;
                  return (
                    <div
                      key={eIdx}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      className="absolute w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse"
                      title={`Shell ${idx + 1} electron`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        
        {/* Numeric distribution summary */}
        <div className="mt-4 flex gap-1.5 justify-center flex-wrap">
          {dist.map((electrons, idx) => (
            <div 
              key={idx} 
              className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold border border-indigo-100/60 dark:border-indigo-900/40"
              title={`Shell ${idx + 1}`}
            >
              K{idx + 1}: <span className="font-semibold">{electrons}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden z-10"
        >
          {/* Header Banner colored by Category */}
          <div className={`p-6 border-b ${colors.bg} ${colors.border} relative flex flex-col md:flex-row md:items-center justify-between gap-4`}>
            <div className="flex items-center gap-4">
              {/* Massive Symbol Box */}
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 flex flex-col justify-between p-1 md:p-2 bg-white dark:bg-slate-900 ${colors.border} shadow-sm shrink-0`}>
                <span className="text-xs font-mono font-bold text-slate-500 leading-none">{element.atomicNumber}</span>
                <span className="text-2xl md:text-3xl font-black text-center text-slate-850 dark:text-slate-50 leading-none">{element.symbol}</span>
                <span className="text-[9px] md:text-2xs font-mono text-slate-400 text-center leading-none truncate">{element.atomicMass.toFixed(3)}</span>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-xl md:text-2xl font-black text-slate-850 dark:text-slate-50">
                    {element.name}
                  </h2>
                  <button
                    onClick={() => onPlayTone ? onPlayTone(element) : playElementTone(element, toneDuration, 1.0, toneProperty, shellsToPlay)}
                    className="p-1.5 rounded-lg bg-white/75 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all hover:scale-110 active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center"
                    title="Play element frequency tone"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${colors.text} bg-white dark:bg-slate-900 border ${colors.border}`}>
                    {colors.label}
                  </span>
                  <span className="text-xs bg-slate-150/80 dark:bg-slate-800 text-slate-650 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                    {STATE_LABELS[element.state]}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions & Close Button */}
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              {onToggleChord && (
                <button
                  onClick={() => onToggleChord(element)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer ${
                    isInChord
                      ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  title={isInChord ? 'Remove from chemical chord' : 'Add to chemical chord'}
                >
                  <Music size={13} className={isInChord ? 'animate-bounce' : ''} />
                  {isInChord ? 'In Chord' : 'Add to Chord'}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-black/20 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
                title="Close details"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Properties / Stats */}
            <div className="md:col-span-7 flex flex-col gap-6">
              
              {/* Chemical Summary */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Description</h3>
                <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                  {element.summary}
                </p>
              </div>
               {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Physical State / Properties */}
                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-900/20">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Thermometer size={12} className="text-rose-500" /> Phase Points
                  </span>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-mono">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <Tooltip content="The temperature at which the element transitions from a solid state to a liquid state." position="top">
                        <span className="cursor-help border-b border-dashed border-slate-300 dark:border-slate-700">Melting:</span>
                      </Tooltip>
                      <span className="font-semibold">
                        {element.meltingPoint ? `${element.meltingPoint} K (${toCelsius(element.meltingPoint)})` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <Tooltip content="The temperature at which the element transitions from a liquid state to a gaseous state." position="top">
                        <span className="cursor-help border-b border-dashed border-slate-300 dark:border-slate-700">Boiling:</span>
                      </Tooltip>
                      <span className="font-semibold">
                        {element.boilingPoint ? `${element.boilingPoint} K (${toCelsius(element.boilingPoint)})` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Density & Electronegativity */}
                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-900/20">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Flame size={12} className="text-amber-500" /> Chemistry
                  </span>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-mono">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <Tooltip content="A measure of an atom's ability to attract shared electrons in a chemical bond." position="top">
                        <span className="cursor-help border-b border-dashed border-slate-300 dark:border-slate-700">Electroneg.:</span>
                      </Tooltip>
                      <span className="font-semibold">{element.electronegativity ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <Tooltip content="The mass of the element per unit volume (measured in grams per cubic centimeter)." position="top">
                        <span className="cursor-help border-b border-dashed border-slate-300 dark:border-slate-700">Density:</span>
                      </Tooltip>
                      <span className="font-semibold">{element.density ? `${element.density} g/cm³` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Period & Group info */}
                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-900/20">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Layers size={12} className="text-blue-500" /> Location
                  </span>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-mono">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <Tooltip content="The horizontal row in the periodic table, indicating the number of electron shells." position="top">
                        <span className="cursor-help border-b border-dashed border-slate-300 dark:border-slate-700">Period (Row):</span>
                      </Tooltip>
                      <span className="font-semibold">{element.period}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <Tooltip content="The vertical column in the table, grouping elements with similar chemical properties." position="top">
                        <span className="cursor-help border-b border-dashed border-slate-300 dark:border-slate-700">Group (Col):</span>
                      </Tooltip>
                      <span className="font-semibold">{element.group ?? 'F-Block'}</span>
                    </div>
                  </div>
                </div>

                {/* Discovery details */}
                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-900/20">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Compass size={12} className="text-emerald-500" /> History
                  </span>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-mono">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                      <Tooltip content="The scientist(s) or scientific team credited with discovering the element." position="top">
                        <span className="cursor-help border-b border-dashed border-slate-300 dark:border-slate-700">Discovered:</span>
                      </Tooltip>
                      <span className="font-semibold truncate max-w-[120px]" title={element.discoveredBy}>
                        {element.discoveredBy}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <Tooltip content="The year the element was first synthesized, isolated, or identified." position="top">
                        <span className="cursor-help border-b border-dashed border-slate-300 dark:border-slate-700">Year:</span>
                      </Tooltip>
                      <span className="font-semibold">{element.discoveryYear}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Electron config */}
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-900 flex justify-between items-center">
                <div>
                  <Tooltip content="The distribution of electrons in atomic orbitals, which defines chemical bonding properties." position="top" className="block mb-0.5">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-help border-b border-dashed border-slate-300 dark:border-slate-700">
                      Electron Configuration
                    </span>
                  </Tooltip>
                  <code className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {element.electronConfiguration}
                  </code>
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 rounded-lg">
                  <RefreshCw size={18} />
                </div>
              </div>

            </div>

            {/* Right Column: Shell Animation */}
            <div className="md:col-span-5 flex flex-col justify-center gap-4">
              
              {/* Acoustic / Musical Tone details */}
              <div className="p-3.5 rounded-xl border border-indigo-100/80 dark:border-indigo-950/60 bg-indigo-50/20 dark:bg-indigo-950/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                    <Music size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block leading-none mb-1">
                      Acoustic Signature ({toneProperty === 'atomicMass' ? 'Atomic Mass' : toneProperty === 'atomicNumber' ? 'Atomic Number' : toneProperty === 'electronegativity' ? 'Electronegativity' : toneProperty === 'density' ? 'Density' : 'Period'})
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                        Musical Note: {getNoteNameForElement(element, toneProperty)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        ({getFrequencyForElement(element, toneProperty).toFixed(2)} Hz)
                      </span>
                    </div>
                  </div>
                </div>

                <Tooltip
                  content={
                    <div className="space-y-1.5 text-left">
                      <div className="font-bold border-b border-slate-700/50 pb-0.5 text-indigo-400">
                        Acoustic Tone Mapping
                      </div>
                      <p className="text-[10px] text-slate-200 leading-relaxed">
                        {getToneExplanation(toneProperty)}
                      </p>
                      <div className="text-[9px] text-slate-400 border-t border-slate-700/30 pt-1 font-mono">
                        Frequency: {getFrequencyForElement(element, toneProperty).toFixed(2)} Hz
                      </div>
                    </div>
                  }
                  position="left"
                >
                  <HelpCircle size={16} className="text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
                </Tooltip>
              </div>

              {/* Real-time audio waveform visualizer */}
              <WaveformVisualizer />

              {renderShells()}
            </div>
          </div>

          {/* Footer Action buttons */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-150 dark:border-slate-900 flex justify-between gap-3 flex-wrap">
            <span className="text-2xs text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
              Atomic Number {element.atomicNumber} • Atomic weight {element.atomicMass}
            </span>
            <a
              href={`https://en.wikipedia.org/wiki/${element.name}`}
              target="_blank"
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium shadow-xs transition-colors flex items-center gap-1.5"
            >
              Learn on Wikipedia
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
