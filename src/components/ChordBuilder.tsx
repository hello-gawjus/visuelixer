import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Play, Trash2, HelpCircle, Sparkles, Layers, RefreshCw, Layers2, Volume2, ArrowRight, Zap, Download } from 'lucide-react';
import { ChemicalElement, ToneProperty } from '../types';
import { CATEGORY_COLORS } from '../data/elements';
import { ELEMENTS } from '../data/elements';
import { downloadChemicalMidiFile } from '../utils/midi';
import { getNoteNameForElement } from '../utils/audio';
import { Tooltip } from './Tooltip';

interface ChordBuilderProps {
  isChordMode: boolean;
  onChordModeToggle: (enabled: boolean) => void;
  chordElements: ChemicalElement[];
  onRemoveElement: (element: ChemicalElement) => void;
  onClearChord: () => void;
  onPlayChord: () => void;
  playMode: 'chord' | 'arpeggio';
  onPlayModeChange: (mode: 'chord' | 'arpeggio') => void;
  onLoadPreset: (presetKey: string) => void;
  toneDuration?: number;
  toneProperty?: ToneProperty;
}

export const PRESETS = [
  { key: 'water', name: 'Water (H₂O)', symbols: ['H', 'O'], desc: 'Light, crisp nonmetal resonance' },
  { key: 'salt', name: 'Salt (NaCl)', symbols: ['Na', 'Cl'], desc: 'High-contrast ionic combination' },
  { key: 'life', name: 'Life Core (CHON)', symbols: ['C', 'H', 'O', 'N'], desc: 'Warm organic multi-harmonic' },
  { key: 'quartz', name: 'Quartz (SiO₂)', symbols: ['Si', 'O'], desc: 'Crystalline semiconductor and oxygen bright resonance' },
  { key: 'rust', name: 'Rust (Fe₂O₃)', symbols: ['Fe', 'O'], desc: 'Earth-metal oxide with a gritty middle grit tone' },
  { key: 'caffeine', name: 'Caffeine (C₈H₁₀N₄O₂)', symbols: ['C', 'H', 'N', 'O'], desc: 'Jittery, high-energy organic combination' },
  { key: 'baking_soda', name: 'Baking Soda (NaHCO₃)', symbols: ['Na', 'H', 'C', 'O'], desc: 'Effervescent, rich 4-element alkaline chord' },
  { key: 'fool_gold', name: 'Fool\'s Gold (FeS₂)', symbols: ['Fe', 'S'], desc: 'Brassy transition metal and bright sulfur mix' },
  { key: 'noble', name: 'Noble Drone', symbols: ['He', 'Ne', 'Ar'], desc: 'Ethereal, perfect sine wave harmony' },
  { key: 'heavy', name: 'Precious Metals', symbols: ['Cu', 'Ag', 'Au'], desc: 'Metallic shimmer with warm low-mids' },
  { key: 'radioactive', name: 'Cosmic Nucleus', symbols: ['U', 'Th', 'Pu'], desc: 'Dense, rich, dark radioactive rumble' },
];

interface MusicalKey {
  name: string;
  notes: string[];
}

export const MUSICAL_KEYS: MusicalKey[] = [
  { name: 'All Keys', notes: [] },
  { name: 'C Major', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  { name: 'C# Major', notes: ['C#', 'D#', 'F', 'F#', 'G#', 'A#', 'C'] },
  { name: 'D Major', notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'] },
  { name: 'Eb Major', notes: ['D#', 'F', 'G', 'G#', 'A#', 'C', 'D'] },
  { name: 'E Major', notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'] },
  { name: 'F Major', notes: ['F', 'G', 'A', 'A#', 'C', 'D', 'E'] },
  { name: 'F# Major', notes: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'F'] },
  { name: 'G Major', notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
  { name: 'Ab Major', notes: ['G#', 'A#', 'C', 'C#', 'D#', 'F', 'G'] },
  { name: 'A Major', notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'] },
  { name: 'Bb Major', notes: ['A#', 'C', 'D', 'D#', 'F', 'G', 'A'] },
  { name: 'B Major', notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'] },
  { name: 'A Minor', notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  { name: 'E Minor', notes: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'] },
  { name: 'D Minor', notes: ['D', 'E', 'F', 'G', 'A', 'A#', 'C'] },
  { name: 'G Minor', notes: ['G', 'A', 'A#', 'C', 'D', 'D#', 'F'] },
];

export const normalizeNote = (note: string): string => {
  const map: Record<string, string> = {
    'A#': 'A#', 'Bb': 'A#',
    'C#': 'C#', 'Db': 'C#',
    'D#': 'D#', 'Eb': 'D#',
    'F#': 'F#', 'Gb': 'F#',
    'G#': 'G#', 'Ab': 'G#',
  };
  return map[note] || note;
};

export const ChordBuilder: React.FC<ChordBuilderProps> = ({
  isChordMode,
  onChordModeToggle,
  chordElements,
  onRemoveElement,
  onClearChord,
  onPlayChord,
  playMode,
  onPlayModeChange,
  onLoadPreset,
  toneDuration = 0.6,
  toneProperty = 'atomicMass' as ToneProperty,
}) => {
  const [selectedKeyName, setSelectedKeyName] = useState<string>('All Keys');
  const [onlyShowMatching, setOnlyShowMatching] = useState<boolean>(false);

  // Compute metrics
  const totalMass = chordElements.reduce((sum, el) => sum + el.atomicMass, 0);
  
  const validEN = chordElements.filter((el) => el.electronegativity !== null);
  const avgEN = validEN.length > 0 
    ? validEN.reduce((sum, el) => sum + (el.electronegativity || 0), 0) / validEN.length 
    : null;

  // Generate a dynamic filename for MIDI export based on presets or elements
  const getExportFileName = () => {
    if (chordElements.length === 0) return 'chemical_melody.mid';
    
    // Check if matching preset
    const currentSymbols = [...chordElements].map((el) => el.symbol).sort().join('_');
    const matchedPreset = PRESETS.find((p) => {
      const pSyms = [...p.symbols].sort().join('_');
      return pSyms === currentSymbols;
    });

    if (matchedPreset) {
      return `${matchedPreset.name.toLowerCase().replace(/[^a-z0-9_]+/g, '_')}_melody.mid`;
    }

    const symbolsStr = chordElements.map((el) => el.symbol).join('_');
    return `chemical_chord_${symbolsStr}.mid`;
  };

  const handleExportMidi = () => {
    if (chordElements.length === 0) return;
    const fileName = getExportFileName();
    downloadChemicalMidiFile(chordElements, playMode, toneDuration, fileName, toneProperty);
  };

  // Generate a dynamic soundscape profile description based on selected elements
  const getSoundscapeProfile = () => {
    if (chordElements.length === 0) return { title: 'Quiet Space', desc: 'No elements selected' };
    if (chordElements.length === 1) {
      return { 
        title: 'Monophonic Pulse', 
        desc: `A pure standalone tone of ${chordElements[0].name} vibrating at a base frequency.` 
      };
    }

    const categories = chordElements.map(el => el.category);
    const hasRadioactive = chordElements.some(el => el.category === 'actinide' || el.atomicNumber > 82);
    const hasNoble = chordElements.some(el => el.category === 'noble-gas');
    const hasMetal = chordElements.some(el => el.category.includes('metal') || el.category.includes('lanthanide') || el.category.includes('actinide'));
    const hasNonmetal = chordElements.some(el => el.category === 'reactive-nonmetal');

    if (hasRadioactive) {
      return {
        title: 'Sub-atomic Rumble 🌌',
        desc: 'Unstable heavy elements synthesizing a mysterious, dense and pulsing low-frequency drone.'
      };
    }
    if (hasNoble && !hasMetal) {
      return {
        title: 'Celestial Sine Wave 🎐',
        desc: 'Inert gas chemistry producing a ultra-pure, crystalline and peaceful atmospheric harmony.'
      };
    }
    if (hasMetal && !hasNonmetal) {
      return {
        title: 'Industrial Resonance 🪮',
        desc: 'Metallic lattices reflecting solid vibrational harmonics. Brash, ringing metallic overtones.'
      };
    }
    if (hasMetal && hasNonmetal) {
      return {
        title: 'Ionic Ionic Fusion ⚡',
        desc: 'Highly active charge transfer. Crisp, wide-spectrum resonance with sharp transients.'
      };
    }
    if (!hasMetal && hasNonmetal) {
      return {
        title: 'Organic Covalent Wave 🌿',
        desc: 'Warm, soft covalent frequencies blending tightly together into a lush natural acoustic fabric.'
      };
    }

    return {
      title: 'Polychromatic Fusion 🧪',
      desc: 'A rich mixture of distinct chemical families creating a unique, complex harmonic fingerprint.'
    };
  };

  const profile = getSoundscapeProfile();

  const selectedKey = MUSICAL_KEYS.find((k) => k.name === selectedKeyName);

  const presetsWithMatchInfo = PRESETS.map((preset) => {
    const presetElements = preset.symbols
      .map((sym) => ELEMENTS.find((el) => el.symbol === sym))
      .filter((el): el is ChemicalElement => !!el);
    const notes = presetElements.map((el) => getNoteNameForElement(el, toneProperty));
    
    let matchCount = 0;
    let isMatch = true;
    
    if (selectedKeyName !== 'All Keys' && selectedKey) {
      const normalizedKeyNotes = selectedKey.notes.map(normalizeNote);
      const matches = notes.map((n) => normalizedKeyNotes.includes(normalizeNote(n)));
      matchCount = matches.filter(Boolean).length;
      isMatch = matches.every(Boolean);
    }
    
    return {
      ...preset,
      matchCount,
      totalCount: notes.length,
      isMatch,
    };
  });

  const filteredPresets = presetsWithMatchInfo.filter((preset) => {
    if (selectedKeyName === 'All Keys') return true;
    if (onlyShowMatching) return preset.isMatch;
    return true;
  });

  // Analyze current chordElements keys
  const getCompoundKeyMatches = () => {
    if (chordElements.length === 0) return null;
    
    const activeNotes = chordElements.map((el) => getNoteNameForElement(el, toneProperty));
    const uniqueActiveNotes: string[] = Array.from(new Set(activeNotes.map((n) => normalizeNote(n))));
    
    // Find keys that contain all active notes
    const perfectMatches = MUSICAL_KEYS.filter((k) => {
      if (k.name === 'All Keys') return false;
      const normalizedKeyNotes = k.notes.map(normalizeNote);
      return uniqueActiveNotes.every((note) => normalizedKeyNotes.includes(note));
    });
    
    if (perfectMatches.length > 0) {
      return {
        type: 'perfect',
        keys: perfectMatches.map((k) => k.name),
      };
    }
    
    // If no perfect match, find best matches (keys with maximum matching notes)
    const keyScores = MUSICAL_KEYS.filter((k) => k.name !== 'All Keys').map((k) => {
      const normalizedKeyNotes = k.notes.map(normalizeNote);
      const matches = uniqueActiveNotes.filter((note) => normalizedKeyNotes.includes(note));
      return {
        name: k.name,
        matchCount: matches.length,
        totalCount: uniqueActiveNotes.length,
      };
    });
    
    // Sort descending by matchCount
    keyScores.sort((a, b) => b.matchCount - a.matchCount);
    
    const maxMatches = keyScores[0]?.matchCount || 0;
    if (maxMatches > 0) {
      const bestMatches = keyScores.filter((ks) => ks.matchCount === maxMatches);
      return {
        type: 'partial',
        keys: bestMatches.map((bm) => bm.name),
        matchCount: maxMatches,
        totalCount: uniqueActiveNotes.length,
      };
    }
    
    return {
      type: 'none',
      keys: [],
    };
  };

  const keyMatches = getCompoundKeyMatches();

  return (
    <div className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Panel */}
      <div className="p-4 md:p-5 border-b border-slate-150 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Music size={20} className={isChordMode && chordElements.length > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-150 flex items-center gap-2">
              Chemical Chord Synthesizer
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full">
                New Feature
              </span>
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
              Combine elements to play their atomic weights as synchronous chords or sequential arpeggios.
            </p>
          </div>
        </div>

        {/* Status Badge for Chord Mode */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
          isChordMode
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400'
            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-450'
        }`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isChordMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          {isChordMode ? 'Synthesizer Active' : 'Synthesizer Standby'}
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="p-4 md:p-5 flex flex-col gap-5">
        {/* Active Elements Deck */}
        <div id="selected-elements-section" className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Layers size={11} /> Selected Elements ({chordElements.length} / 6)
              </span>
              {keyMatches && (
                <div className="flex flex-wrap items-center gap-1.5 pl-2 sm:border-l border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Compound Key:
                  </span>
                  {keyMatches.type === 'perfect' ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <Sparkles size={9} className="animate-pulse" />
                      {keyMatches.keys.slice(0, 2).join(', ')}
                      {keyMatches.keys.length > 2 && ` (+${keyMatches.keys.length - 2})`}
                    </span>
                  ) : keyMatches.type === 'partial' ? (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-1.5 py-0.5 rounded-md" title={`Only ${keyMatches.matchCount}/${keyMatches.totalCount} notes in key`}>
                      {keyMatches.keys.slice(0, 1).join(', ')} ({keyMatches.matchCount}/{keyMatches.totalCount} notes)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
                      Atonal / None
                    </span>
                  )}
                </div>
              )}
            </div>
            {chordElements.length > 0 && (
              <button
                onClick={onClearChord}
                className="text-[10px] font-bold text-red-500 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={10} /> Clear List
              </button>
            )}
          </div>
 
          {/* Display list of elements */}
          <div className="min-h-[100px] flex flex-wrap gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl items-center justify-center relative">
            <AnimatePresence mode="popLayout">
              {chordElements.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-4 px-2"
                >
                  {isChordMode ? (
                    <div className="flex flex-col items-center gap-1">
                      <Zap size={18} className="text-emerald-500 animate-pulse" />
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Click elements on the Periodic Table below to load them here
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <HelpCircle size={18} className="text-slate-350 dark:text-slate-600" />
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Activate <strong className="text-indigo-500">Chord Mode</strong> above to select multiple elements
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                chordElements.map((el, index) => {
                  const colors = CATEGORY_COLORS[el.category] || CATEGORY_COLORS.unknown;
                  const note = getNoteNameForElement(el, toneProperty);
                  return (
                    <motion.div
                      key={`${el.atomicNumber}-${index}`}
                      layout
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0, y: -10 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className={`flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-xl border ${colors.bg} ${colors.border} shadow-2xs group relative`}
                    >
                      <div className="flex flex-col">
                        <span className="font-sans font-black text-sm text-slate-850 dark:text-slate-100 leading-none">
                          {el.symbol}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono leading-none mt-0.5">
                          #{el.atomicNumber}
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-start pr-1">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70px] hidden sm:block leading-none">
                          {el.name}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-white/60 dark:bg-slate-950/60 px-1 py-0.2 rounded mt-1.5 leading-none">
                          {note}
                        </span>
                      </div>

                      <button
                        onClick={() => onRemoveElement(el)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white/80 dark:hover:bg-slate-950/60 transition-colors cursor-pointer self-center"
                        title={`Remove ${el.name}`}
                      >
                        <Trash2 size={11} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Row / Play controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-150 dark:border-slate-900 mt-1">
          {/* Chord Metrics / Description */}
          <div className="flex-1">
            {chordElements.length > 0 ? (
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-sans">
                    {profile.title}
                  </span>
                  <Tooltip content="The combined atomic mass of all elements in the chemical chord, representing the total physical weight of the compound." position="top">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 cursor-help border-b border-dashed border-slate-200 dark:border-slate-800 pb-0.5">
                      Total Mass: <strong className="text-slate-700 dark:text-slate-300">{totalMass.toFixed(2)} u</strong>
                    </span>
                  </Tooltip>
                  {avgEN !== null && (
                    <Tooltip content="The average electronegativity (electron attraction strength) of the elements in this chord." position="top">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 cursor-help border-b border-dashed border-slate-200 dark:border-slate-800 pb-0.5">
                        Avg EN: <strong className="text-slate-700 dark:text-slate-300">{avgEN.toFixed(2)}</strong>
                      </span>
                    </Tooltip>
                  )}
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {profile.desc}
                </p>
              </div>
            ) : (
              <p className="text-[10px] italic text-slate-400 dark:text-slate-500">
                Select elements or load a preset below to configure the synthesizers.
              </p>
            )}
          </div>

          {/* Play controls */}
          <div className="flex flex-wrap items-center gap-3.5 shrink-0 self-end sm:self-center">
            {/* Key Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Key:
              </span>
              <select
                value={selectedKeyName}
                onChange={(e) => setSelectedKeyName(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold py-1.5 px-2.5 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {MUSICAL_KEYS.map((key) => (
                  <option key={key.name} value={key.name} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                    {key.name} {key.notes.length > 0 ? `(${key.notes.join(', ')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Only show matching switch */}
            {selectedKeyName !== 'All Keys' && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyShowMatching}
                  onChange={(e) => setOnlyShowMatching(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Match Only
                </span>
              </label>
            )}

            {/* Play Mode toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onPlayModeChange('chord')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  playMode === 'chord'
                    ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
                title="Play all notes simultaneously as a chord"
              >
                Chord
              </button>
              <button
                type="button"
                onClick={() => onPlayModeChange('arpeggio')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  playMode === 'arpeggio'
                    ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
                title="Play notes sequentially like an arpeggio"
              >
                Arpeggio
              </button>
            </div>

            {/* Big Play Button */}
            <button
              disabled={chordElements.length === 0}
              onClick={onPlayChord}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-350 dark:disabled:text-slate-750 text-white shadow-md shadow-indigo-600/10 cursor-pointer disabled:cursor-not-allowed transition-all hover:scale-103 active:scale-97"
            >
              <Play size={13} className="fill-current" />
              {playMode === 'chord' ? 'Play Chord' : 'Play Arpeggio'}
            </button>

            {/* Export MIDI Button */}
            <button
              disabled={chordElements.length === 0}
              onClick={handleExportMidi}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-350 dark:disabled:text-slate-750 text-white shadow-md shadow-emerald-600/10 cursor-pointer disabled:cursor-not-allowed transition-all hover:scale-103 active:scale-97"
              title="Export the currently built chord or arpeggio as a standard MIDI file (.mid)"
            >
              <Download size={13} />
              Export MIDI
            </button>
          </div>
        </div>

        {/* Preset Chords Selection (Bottom full width) */}
        <div className="pt-5 border-t border-slate-150 dark:border-slate-900 flex flex-col gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
              Preset Compounds {selectedKeyName !== 'All Keys' && `— ${selectedKeyName}`}
            </span>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
              Instantly load preset chemical compositions into the synthesizer. Elements are labeled with their active key notes.
            </p>
          </div>

          {filteredPresets.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Sparkles size={20} className="text-indigo-400 mx-auto mb-2 animate-pulse" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No completely matching compounds found for {selectedKeyName}
              </p>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
                Try unchecking <strong>Show Matching Only</strong> to see partial matches or change the active <strong>Acoustic Tone Mapping Property</strong> above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => onLoadPreset(preset.key)}
                  className="p-3.5 rounded-xl text-left bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-950 transition-all group text-xs cursor-pointer flex flex-col justify-between min-h-[105px]"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-slate-850 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {preset.name}
                      </span>
                      {selectedKeyName !== 'All Keys' && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 ${
                          preset.isMatch
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'
                            : preset.matchCount > 0
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                            : 'bg-rose-50 dark:bg-rose-950/10 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20'
                        }`}>
                          {preset.isMatch 
                            ? 'In Key' 
                            : `${preset.matchCount}/${preset.totalCount} In Key`}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                      {preset.desc}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {preset.symbols.map((sym) => {
                      const el = ELEMENTS.find(e => e.symbol === sym);
                      const note = el ? getNoteNameForElement(el, toneProperty) : '?';
                      const inKey = selectedKeyName === 'All Keys' || 
                        (selectedKey && selectedKey.notes.map(normalizeNote).includes(normalizeNote(note)));
                      return (
                        <span
                          key={sym}
                          className={`px-1.5 py-0.5 rounded-md font-mono text-[9px] font-bold flex items-center gap-1 transition-all ${
                            inKey 
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/25'
                              : 'bg-slate-200/55 dark:bg-slate-800/80 text-slate-500 dark:text-slate-500 border border-transparent'
                          }`}
                          title={`Element ${sym} maps to Note ${note}`}
                        >
                          <span>{sym}</span>
                          <span className="opacity-70 text-[8px] font-sans font-black bg-white/50 dark:bg-slate-900/50 px-1 py-0.2 rounded">
                            {note}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
