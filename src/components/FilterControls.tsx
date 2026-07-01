import React from 'react';
import { Search, Sparkles, Database, Filter, Volume2, VolumeX, Music, HelpCircle, Layers, Info, Key } from 'lucide-react';
import { TableFilters, ElementCategory, ToneProperty, ShellsPlayOption } from '../types';
import { CATEGORY_COLORS } from '../data/elements';
import { Tooltip } from './Tooltip';
import { MUSICAL_KEYS } from './ChordBuilder';

interface FilterControlsProps {
  filters: TableFilters;
  onFilterChange: (newFilters: TableFilters) => void;
  onReset: () => void;
  toneDuration: number;
  onToneDurationChange: (duration: number) => void;
  soundEnabled: boolean;
  onSoundEnabledChange: (enabled: boolean) => void;
  toneProperty: ToneProperty;
  onTonePropertyChange: (property: ToneProperty) => void;
  shellsToPlay: ShellsPlayOption;
  onShellsToPlayChange: (option: ShellsPlayOption) => void;
  isChordMode: boolean;
  onChordModeToggle: (enabled: boolean) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange,
  onReset,
  toneDuration,
  onToneDurationChange,
  soundEnabled,
  onSoundEnabledChange,
  toneProperty,
  onTonePropertyChange,
  shellsToPlay,
  onShellsToPlayChange,
  isChordMode,
  onChordModeToggle,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, category: e.target.value as ElementCategory | 'all' });
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, note: e.target.value });
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, key: e.target.value });
  };

  return (
    <div className="flex flex-col gap-3">
      
      {/* Search & Filter inputs in a unified compact grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        
        {/* Search bar - spans 2 columns for visibility */}
        <div className="flex flex-col gap-1 xl:col-span-2">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 select-none">
            <Search size={11} /> Search Elements
          </label>
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="Symbol, name, number..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="w-full h-[32px] pl-8.5 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:bg-white dark:focus:bg-slate-950 text-slate-850 dark:text-slate-100 font-semibold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Note select */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 select-none">
            <Music size={11} /> Musical Note
          </label>
          <select
            value={filters.note}
            onChange={handleNoteChange}
            className="w-full h-[32px] py-1 px-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
          >
            <option value="all">All Notes</option>
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n) => (
              <option key={n} value={n}>
                Note {n}
              </option>
            ))}
          </select>
        </div>

        {/* Musical Key select */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 select-none">
            <Key size={11} /> Musical Key
          </label>
          <select
            value={filters.key || 'all'}
            onChange={handleKeyChange}
            className="w-full h-[32px] py-1 px-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
          >
            {MUSICAL_KEYS.map((k) => (
              <option key={k.name} value={k.name === 'All Keys' ? 'all' : k.name}>
                {k.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tone Base Property Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between select-none">
            <span className="flex items-center gap-1">
              <Music size={11} /> Tone Base
            </span>
            <Tooltip
              content={
                <div className="space-y-1.5">
                  <div className="font-bold border-b border-slate-700/50 pb-0.5 text-indigo-400">Acoustic Tone Mapping</div>
                  <div className="text-[10px]"><span className="font-bold text-slate-200">Atomic Mass:</span> Heavier nuclei vibrate slower, generating deep, rich low-mids.</div>
                  <div className="text-[10px]"><span className="font-bold text-slate-200">Atomic Number:</span> Proton count maps to pitch; higher numbers sound lower and darker.</div>
                  <div className="text-[10px]"><span className="font-bold text-slate-200">Electronegativity:</span> Highly reactive elements produce bright, high-frequency tones.</div>
                  <div className="text-[10px]"><span className="font-bold text-slate-200">Density:</span> High mass densities trigger extremely grounding physical resonant drones.</div>
                  <div className="text-[10px]"><span className="font-bold text-slate-200">Period:</span> Rows act as octaves; higher electron shells step down octaves automatically.</div>
                  <div className="text-[10px]"><span className="font-bold text-slate-200">Shell Harmonics:</span> Maps pitch based on both shell count (fundamental) and valence electrons (harmonic micro-tuning).</div>
                </div>
              }
              position="top"
            >
              <HelpCircle size={12} className="text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
            </Tooltip>
          </label>
          <select
            value={toneProperty}
            disabled={!soundEnabled}
            onChange={(e) => onTonePropertyChange(e.target.value as ToneProperty)}
            className="w-full h-[32px] py-1 px-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <option value="atomicMass">Atomic Mass (Deep)</option>
            <option value="atomicNumber">Atomic Number (Pitch)</option>
            <option value="electronegativity">Electronegativity (High)</option>
            <option value="density">Density (Ground Drone)</option>
            <option value="period">Period (Shell Octaves)</option>
            <option value="electronShells">Electron Shell Harmonics</option>
          </select>
        </div>

        {/* Electron Shells to Play */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between select-none">
            <span className="flex items-center gap-1">
              <Layers size={11} /> Electron Shells
            </span>
            <Tooltip
              content={
                <div className="space-y-1.5">
                  <div className="font-bold border-b border-slate-700/50 pb-0.5 text-indigo-400">Bohr Shell Layering</div>
                  <div className="text-[10px]"><span className="font-bold text-slate-200">Base Shell Only:</span> Play standard physical base tone.</div>
                  <div className="text-[10px]"><span className="font-bold text-slate-200">Up to N Shells:</span> Layers up to N electron energy levels simultaneously, creating a rich multi-frequency chord based on their specific electron counts.</div>
                  <div className="text-[10px]"><span className="font-bold text-slate-200">Valence Shell Only:</span> Plays only the outermost active shell, emphasizing the element's chemical reactivity.</div>
                </div>
              }
              position="top"
            >
              <HelpCircle size={12} className="text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
            </Tooltip>
          </label>
          <select
            value={shellsToPlay}
            disabled={!soundEnabled}
            onChange={(e) => onShellsToPlayChange(e.target.value as ShellsPlayOption)}
            className="w-full h-[32px] py-1 px-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <option value="1">Base Shell Only</option>
            <option value="2">Up to 2 Shells</option>
            <option value="3">Up to 3 Shells</option>
            <option value="4">Up to 4 Shells</option>
            <option value="all">All Shell Layers</option>
            <option value="outer">Outer Valence Only</option>
          </select>
        </div>

        {/* Tone Duration slider */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between select-none">
            <span className="flex items-center gap-1">
              <Volume2 size={11} /> Duration
            </span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 lowercase font-bold">
              {soundEnabled ? `${toneDuration.toFixed(1)}s` : 'muted'}
            </span>
          </label>
          <div className="flex items-center gap-2 h-[32px] px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              onClick={() => onSoundEnabledChange(!soundEnabled)}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40' 
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <input
              type="range"
              min="0.1"
              max="10.0"
              step="0.1"
              disabled={!soundEnabled}
              value={toneDuration}
              onChange={(e) => onToneDurationChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 dark:accent-indigo-400 cursor-pointer h-1 rounded-lg appearance-none bg-slate-200 dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

      </div>

      {/* Category Legends for easy reading */}
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-900/60 justify-start items-center">
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1.5 select-none">
          Legend:
        </span>
        {Object.entries(CATEGORY_COLORS).map(([key, value]) => {
          const isFilterActive = filters.category === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange({ ...filters, category: isFilterActive ? 'all' : (key as ElementCategory) })}
              className={`
                px-2 py-0.5 rounded-full text-[9px] font-semibold border transition-all cursor-pointer select-none
                ${value.bg} ${value.border} ${value.text}
                ${isFilterActive ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-1 dark:ring-offset-slate-950 font-black scale-102 shadow-xs' : 'opacity-85 hover:opacity-100'}
              `}
            >
              {value.label}
            </button>
          );
        })}

        {/* Spacer to push Chord and Reset buttons to the right */}
        <div className="grow" />

        {/* Action Buttons group */}
        <div className="flex items-center gap-1.5">
          {/* Chord Button styled like legend buttons */}
          <button
            onClick={() => onChordModeToggle(!isChordMode)}
            className={`
              px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer select-none flex items-center gap-1
              ${isChordMode
                ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-650 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
              }
            `}
            title="Enable or disable Chemical Chord Synthesizer mode"
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isChordMode ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
            {isChordMode ? 'Chord Active' : 'Enable Chord'}
          </button>

          {/* Reset Button styled like legend buttons */}
          <button
            onClick={onReset}
            className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-750 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all cursor-pointer select-none"
          >
            Reset Filters
          </button>
        </div>
      </div>

    </div>
  );
};
