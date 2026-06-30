import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Circle, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Save, 
  Clock, 
  Music, 
  HelpCircle, 
  Plus, 
  Bookmark, 
  FolderHeart, 
  ChevronRight, 
  RefreshCw,
  Zap,
  Check
} from 'lucide-react';
import { ChemicalElement, SequenceNote, SavedSequence, ToneProperty, ShellsPlayOption } from '../types';
import { CATEGORY_COLORS, ELEMENTS } from '../data/elements';
import { getNoteNameForElement } from '../utils/audio';
import { Tooltip } from './Tooltip';

interface SequenceRecorderProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onStopPlayback: () => void;
  currentNotes: SequenceNote[];
  onClearCurrent: () => void;
  savedSequences: SavedSequence[];
  onSaveSequence: (name: string) => void;
  onLoadSequence: (sequence: SavedSequence) => void;
  onDeleteSequence: (id: string) => void;
  currentTimeMs: number;
  onSeek: (timeMs: number) => void;
  showTrackLibrary?: boolean;
  onCloseTrackLibrary?: () => void;
}

interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  notes: {
    atomicNumber: number;
    timestamp: number;
    toneProperty: ToneProperty;
    shellsToPlay: ShellsPlayOption;
  }[];
}

const PRESET_DEFS: PresetDefinition[] = [
  {
    id: 'preset-organic',
    name: '🧬 Organic Life (CHONPS)',
    description: 'The organic building blocks of life, forming the chemical skeleton of biochemistry.',
    createdAt: 1719600000000,
    notes: [
      { atomicNumber: 6, timestamp: 0, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 1, timestamp: 350, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 8, timestamp: 700, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 7, timestamp: 1050, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 15, timestamp: 1400, toneProperty: 'atomicMass', shellsToPlay: 'all' },
      { atomicNumber: 16, timestamp: 1750, toneProperty: 'atomicMass', shellsToPlay: 'all' },
    ]
  },
  {
    id: 'preset-alkali',
    name: '⚡ Alkali Metal Cascade',
    description: 'Highly reactive Group 1 elements, cascading down into heavy resonance.',
    createdAt: 1719601000000,
    notes: [
      { atomicNumber: 3, timestamp: 0, toneProperty: 'period', shellsToPlay: 'all' },
      { atomicNumber: 11, timestamp: 250, toneProperty: 'period', shellsToPlay: 'all' },
      { atomicNumber: 19, timestamp: 500, toneProperty: 'period', shellsToPlay: 'all' },
      { atomicNumber: 37, timestamp: 750, toneProperty: 'period', shellsToPlay: 'all' },
      { atomicNumber: 55, timestamp: 1000, toneProperty: 'period', shellsToPlay: 'all' },
    ]
  },
  {
    id: 'preset-nobles',
    name: '🎈 Noble Gas Ambient Sweep',
    createdAt: 1719602000000,
    description: 'Completely stable elements flowing in high-frequency, glass-like textures.',
    notes: [
      { atomicNumber: 2, timestamp: 0, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 10, timestamp: 0, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 18, timestamp: 400, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 36, timestamp: 400, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 54, timestamp: 800, toneProperty: 'atomicMass', shellsToPlay: '1' },
    ]
  },
  {
    id: 'preset-halogens',
    name: '🧪 Halogen Symphony',
    description: 'Highly electronegative nonmetals forming intense, colorful, and sharp acoustic intervals.',
    createdAt: 1719603000000,
    notes: [
      { atomicNumber: 9, timestamp: 0, toneProperty: 'electronegativity', shellsToPlay: '1' },
      { atomicNumber: 17, timestamp: 300, toneProperty: 'electronegativity', shellsToPlay: '1' },
      { atomicNumber: 35, timestamp: 600, toneProperty: 'electronegativity', shellsToPlay: '1' },
      { atomicNumber: 53, timestamp: 900, toneProperty: 'electronegativity', shellsToPlay: 'all' },
      { atomicNumber: 85, timestamp: 1200, toneProperty: 'electronegativity', shellsToPlay: 'all' },
    ]
  },
  {
    id: 'preset-precious',
    name: '✨ Noble Metal Resonance',
    description: 'Precious, lustrous catalysts (Ag, Au, Pt, Pd, Rh) that produce deep, pure metallic timbres.',
    createdAt: 1719604000000,
    notes: [
      { atomicNumber: 47, timestamp: 0, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 46, timestamp: 200, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 45, timestamp: 400, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 79, timestamp: 800, toneProperty: 'atomicMass', shellsToPlay: 'all' },
      { atomicNumber: 78, timestamp: 1000, toneProperty: 'atomicMass', shellsToPlay: 'all' },
    ]
  },
  {
    id: 'preset-semiconductor',
    name: '💻 Semiconductor Dopant Matrix',
    description: 'Silicon substrates with p-type and n-type dopants mapping out electric lattice waves.',
    createdAt: 1719605000000,
    notes: [
      { atomicNumber: 14, timestamp: 0, toneProperty: 'period', shellsToPlay: '1' },
      { atomicNumber: 32, timestamp: 200, toneProperty: 'period', shellsToPlay: '1' },
      { atomicNumber: 5, timestamp: 500, toneProperty: 'period', shellsToPlay: 'all' },
      { atomicNumber: 15, timestamp: 700, toneProperty: 'period', shellsToPlay: 'all' },
      { atomicNumber: 33, timestamp: 900, toneProperty: 'period', shellsToPlay: 'all' },
    ]
  },
  {
    id: 'preset-stellar',
    name: '🌌 Stellar Nucleosynthesis',
    description: 'The cosmic timeline of star fusion from H/He up to the supernova core barrier (Fe).',
    createdAt: 1719606000000,
    notes: [
      { atomicNumber: 1, timestamp: 0, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 2, timestamp: 300, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 6, timestamp: 600, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 8, timestamp: 900, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 10, timestamp: 1200, toneProperty: 'atomicMass', shellsToPlay: '1' },
      { atomicNumber: 12, timestamp: 1500, toneProperty: 'atomicMass', shellsToPlay: 'all' },
      { atomicNumber: 14, timestamp: 1800, toneProperty: 'atomicMass', shellsToPlay: 'all' },
      { atomicNumber: 26, timestamp: 2100, toneProperty: 'atomicMass', shellsToPlay: 'all' },
    ]
  },
  {
    id: 'preset-superconductor',
    name: '⚡ Cuprate Superconductors',
    description: 'The high-temperature superconducting oxide lattice (Yttrium, Barium, Copper, Oxygen).',
    createdAt: 1719607000000,
    notes: [
      { atomicNumber: 39, timestamp: 0, toneProperty: 'electronegativity', shellsToPlay: 'all' },
      { atomicNumber: 56, timestamp: 300, toneProperty: 'electronegativity', shellsToPlay: 'all' },
      { atomicNumber: 29, timestamp: 600, toneProperty: 'electronegativity', shellsToPlay: 'all' },
      { atomicNumber: 8, timestamp: 900, toneProperty: 'electronegativity', shellsToPlay: 'all' },
    ]
  }
];

export interface SciencePreset extends SavedSequence {
  description: string;
}

export const PRESET_SEQUENCES: SciencePreset[] = PRESET_DEFS.map(def => {
  const notes: SequenceNote[] = def.notes.map(noteDef => {
    const el = ELEMENTS.find(e => e.atomicNumber === noteDef.atomicNumber);
    if (!el) {
      throw new Error(`Element ${noteDef.atomicNumber} not found for preset ${def.name}`);
    }
    return {
      element: el,
      timestamp: noteDef.timestamp,
      toneProperty: noteDef.toneProperty,
      shellsToPlay: noteDef.shellsToPlay
    };
  });
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    createdAt: def.createdAt,
    notes
  };
});

export const SequenceRecorder: React.FC<SequenceRecorderProps> = ({
  isRecording,
  onToggleRecording,
  isPlaying,
  onTogglePlayback,
  onStopPlayback,
  currentNotes,
  onClearCurrent,
  savedSequences,
  onSaveSequence,
  onLoadSequence,
  onDeleteSequence,
  currentTimeMs,
  onSeek,
  showTrackLibrary = false,
  onCloseTrackLibrary,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [newSeqName, setNewSeqName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'presets' | 'saved'>('presets');
  const [elapsedRecordTime, setElapsedRecordTime] = useState(0);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate the total duration of the current sequence (min 4 seconds, padded)
  const maxNoteTime = currentNotes.length > 0 
    ? Math.max(...currentNotes.map(n => n.timestamp)) 
    : 0;
  const totalDuration = Math.max(4000, maxNoteTime + 1000);

  // Handle stopwatch relative to active recording
  useEffect(() => {
    if (isRecording) {
      const start = Date.now();
      setElapsedRecordTime(0);
      recordIntervalRef.current = setInterval(() => {
        setElapsedRecordTime(Date.now() - start);
      }, 100);
    } else {
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = null;
      }
    }
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isRecording]);

  // Format time (e.g. 00:04.2)
  const formatTime = (ms: number) => {
    const totalSecs = ms / 1000;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  // Convert timeline click to ms offset for seeking
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || currentNotes.length === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percent * totalDuration);
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeqName.trim()) return;
    onSaveSequence(newSeqName.trim());
    setNewSeqName('');
    setIsSaving(false);
  };

  const playheadPercent = (currentTimeMs / totalDuration) * 100;

  return (
    <div id="sequence-recorder-panel" className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs mt-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-900 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
              <Music size={18} />
            </span>
            <h2 className="font-sans font-bold tracking-tight text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
              Sequence Recorder & Looper
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-normal">
            Capture, arrange, and play back your elements in continuous layers. Interact with the periodic table to record a custom acoustic pattern, or try a chemistry track preset below!
          </p>
        </div>

        {/* Stopwatch Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <Clock size={13} className="text-slate-400" />
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
            {isRecording ? formatTime(elapsedRecordTime) : formatTime(currentTimeMs)}
          </span>
          {isRecording && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </div>
      </div>

      {/* Grid Timeline Canvas */}
      <div className="relative">
        {/* Helper guide */}
        {currentNotes.length === 0 && !isRecording && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/70 dark:bg-slate-950/80 z-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 pointer-events-none p-4 text-center">
            <Zap size={22} className="text-indigo-400 animate-pulse mb-1.5" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Timeline Empty</p>
            <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">Click "Start Recording" in the header, then click chemical elements above to build your layer.</p>
          </div>
        )}

        <div 
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="relative w-full h-32 bg-slate-950 rounded-2xl border border-slate-900 overflow-hidden cursor-pointer select-none group"
        >
          {/* Seconds Grid Lines */}
          {Array.from({ length: Math.ceil(totalDuration / 1000) }).map((_, s) => {
            const pct = ((s * 1000) / totalDuration) * 100;
            return (
              <div 
                key={s} 
                className="absolute top-0 bottom-0 border-l border-slate-900/60 flex flex-col justify-between pointer-events-none" 
                style={{ left: `${pct}%` }}
              >
                <span className="text-[9px] font-mono font-bold text-slate-700 pl-1 pt-1">{s}s</span>
                <span className="text-[8px] font-mono text-slate-800 pl-1 pb-1">{(s * 1000) / 1000}</span>
              </div>
            );
          })}

          {/* Scrolling Note Nodes */}
          <div className="absolute inset-y-0 left-0 right-0 p-3 relative h-full">
            {currentNotes.map((note, index) => {
              const notePct = (note.timestamp / totalDuration) * 100;
              const colorTheme = CATEGORY_COLORS[note.element.category] || { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-500' };
              const noteName = getNoteNameForElement(note.element, note.toneProperty);
              
              // Distribute notes vertically based on frequency/period so they don't overlap completely
              const rowPercent = 10 + ((note.element.period - 1) * 12); 

              return (
                <motion.div
                  key={`${note.element.symbol}-${note.timestamp}-${index}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`absolute -translate-x-1/2 flex flex-col items-center justify-center p-0.5 cursor-pointer`}
                  style={{ left: `${notePct}%`, top: `${rowPercent}%` }}
                  whileHover={{ scale: 1.15, zIndex: 30 }}
                >
                  <Tooltip
                    content={
                      <div className="p-1">
                        <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${colorTheme.bg}`} />
                          {note.element.name} ({note.element.symbol})
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1">
                          Note: <span className="text-emerald-400 font-mono">{noteName}</span>
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Time: <span className="text-indigo-400 font-mono">{(note.timestamp / 1000).toFixed(2)}s</span>
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Shells: <span className="text-indigo-400 font-mono">{note.shellsToPlay}</span>
                        </div>
                      </div>
                    }
                    position="top"
                  >
                    <div className={`w-7 h-7 rounded-full flex flex-col items-center justify-center text-[10px] font-black border ${colorTheme.bg} ${colorTheme.text} ${colorTheme.border} shadow-lg shadow-black/45`}>
                      {note.element.symbol}
                      <span className="text-[6px] font-semibold -mt-0.5 opacity-80">{noteName}</span>
                    </div>
                  </Tooltip>
                </motion.div>
              );
            })}
          </div>

          {/* Visual Scrolling Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1] z-20 pointer-events-none transition-all duration-75"
            style={{ left: `${playheadPercent}%` }}
          />
        </div>
      </div>

      {/* Control Station Panel */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-900 rounded-2xl">
        
        {/* Record / Sync Actions */}
        <div className="flex items-center gap-3">
          {currentNotes.length > 0 && (
            <button
              onClick={onClearCurrent}
              disabled={isRecording}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40 cursor-pointer"
              title="Clear scratchpad"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>

        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlayback}
            disabled={isRecording || currentNotes.length === 0}
            className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/15'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 shadow-md shadow-indigo-500/15'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} className="ml-0.5" fill="currentColor" />}
          </button>

          <button
            onClick={onStopPlayback}
            disabled={isRecording || currentNotes.length === 0}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
            title="Stop & Reset Playhead"
          >
            <Square size={15} fill="currentColor" />
          </button>
        </div>

        {/* Save / Track Details Info */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            {currentNotes.length} notes • {((totalDuration - 1000) / 1000).toFixed(1)}s
          </span>

          {currentNotes.length > 0 && !isRecording && (
            <AnimatePresence mode="wait">
              {!isSaving ? (
                <button
                  onClick={() => setIsSaving(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                >
                  <Save size={13} />
                  Save Track
                </button>
              ) : (
                <motion.form 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSaveClick}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newSeqName}
                    onChange={(e) => setNewSeqName(e.target.value)}
                    placeholder="Enter track name..."
                    autoFocus
                    required
                    className="py-1.5 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSaving(false)}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <XButtonIcon />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Track Library Popup Modal */}
      <AnimatePresence>
        {showTrackLibrary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseTrackLibrary}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 text-left"
            >
              {/* Decorative radial lighting */}
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button top-right */}
              <button
                onClick={onCloseTrackLibrary}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-800"
              >
                <XButtonIcon />
              </button>

              {/* Header with Navigation Tabs */}
              <div className="p-6 md:p-8 border-b border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-indigo-950/50 text-indigo-400 border border-indigo-900/60">
                      <FolderHeart size={20} className="text-indigo-400" />
                    </span>
                    <div>
                      <h3 className="font-sans font-extrabold text-white text-xl tracking-tight">
                        Track Library
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Explore curated science harmonics or manage your recorded tracks.
                      </p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex bg-slate-950/80 border border-slate-850 p-1 rounded-xl shrink-0">
                    <button
                      onClick={() => setLibraryTab('presets')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        libraryTab === 'presets'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FolderHeart size={12} />
                      Presets ({PRESET_SEQUENCES.length})
                    </button>
                    <button
                      onClick={() => setLibraryTab('saved')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        libraryTab === 'saved'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Bookmark size={12} />
                      My Saved ({savedSequences.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 max-h-[55vh] scrollbar-thin scrollbar-thumb-slate-800">
                {libraryTab === 'presets' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PRESET_SEQUENCES.map((preset) => {
                      const isActive = currentNotes.length > 0 && currentNotes[0].element.symbol === preset.notes[0].element.symbol && currentNotes.length === preset.notes.length;
                      const elementsInPreset = Array.from(new Set(preset.notes.map(n => n.element)));

                      return (
                        <div
                          key={preset.id}
                          className={`group relative p-5 rounded-2xl border transition-all flex flex-col justify-between text-left h-[180px] overflow-hidden ${
                            isActive
                              ? 'bg-gradient-to-b from-indigo-950/40 to-slate-950/30 border-indigo-500/50 shadow-lg shadow-indigo-950/30'
                              : 'bg-slate-950/40 hover:bg-slate-950/80 border-slate-800/80 hover:border-slate-700/80'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                              Active Track
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 pr-12">
                              {preset.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1.5 leading-normal pr-1 max-w-md line-clamp-2">
                              {preset.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-850/40 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1 overflow-hidden max-w-[65%]">
                              {elementsInPreset.map((el) => {
                                const colorTheme = CATEGORY_COLORS[el.category] || { bg: 'bg-slate-400', text: 'text-white' };
                                return (
                                  <span
                                    key={el.symbol}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold border border-slate-900 ${colorTheme.bg} ${colorTheme.text}`}
                                    title={`${el.name} (Atomic ${el.atomicNumber})`}
                                  >
                                    {el.symbol}
                                  </span>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => {
                                onLoadSequence(preset);
                                if (onCloseTrackLibrary) onCloseTrackLibrary();
                              }}
                              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                              }`}
                            >
                              <Play size={10} fill="currentColor" />
                              {isActive ? 'Reload' : 'Load Preset'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    {savedSequences.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800 text-center">
                        <Bookmark size={24} className="text-slate-600 mb-2.5" />
                        <p className="text-xs font-semibold text-slate-350">No saved tracks yet</p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm leading-normal">
                          Record element notes from the periodic table, click "Save Track", and they will appear in your custom list!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedSequences.map((seq) => {
                          const isActive = currentNotes.length > 0 && currentNotes.length === seq.notes.length && currentNotes[0].timestamp === seq.notes[0].timestamp && currentNotes[0].element.symbol === seq.notes[0].element.symbol;
                          const elementsInSeq = Array.from(new Set(seq.notes.map(n => n.element))) as ChemicalElement[];

                          return (
                            <div
                              key={seq.id}
                              className={`group relative p-5 rounded-2xl border transition-all flex flex-col justify-between text-left h-[180px] overflow-hidden ${
                                isActive
                                  ? 'bg-gradient-to-b from-indigo-950/40 to-slate-950/30 border-indigo-500/50 shadow-lg shadow-indigo-950/30'
                                  : 'bg-slate-950/40 hover:bg-slate-950/80 border-slate-800/80 hover:border-slate-700/80'
                              }`}
                            >
                              {isActive && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                                  Active Track
                                </div>
                              )}

                              <div>
                                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 pr-12">
                                  📁 {seq.name}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                                  {seq.notes.length} notes • Created {new Date(seq.createdAt).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-850/40 flex items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1 overflow-hidden max-w-[55%]">
                                  {elementsInSeq.map((el) => {
                                    const colorTheme = CATEGORY_COLORS[el.category] || { bg: 'bg-slate-400', text: 'text-white' };
                                    return (
                                      <span
                                        key={el.symbol}
                                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold border border-slate-900 ${colorTheme.bg} ${colorTheme.text}`}
                                        title={`${el.name} (Atomic ${el.atomicNumber})`}
                                      >
                                        {el.symbol}
                                      </span>
                                    );
                                  })}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      onDeleteSequence(seq.id);
                                    }}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/30 text-slate-400 hover:text-red-400 border border-slate-750 hover:border-red-900/40 transition-all cursor-pointer"
                                    title="Delete track"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      onLoadSequence(seq);
                                      if (onCloseTrackLibrary) onCloseTrackLibrary();
                                    }}
                                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                                      isActive
                                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                    }`}
                                  >
                                    <Play size={10} fill="currentColor" />
                                    {isActive ? 'Reload' : 'Load'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 md:px-8 md:py-5 bg-slate-950/80 border-t border-slate-850 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {libraryTab === 'presets'
                    ? 'All audio calculated dynamically using pure Sine wave synthesis.'
                    : 'Your custom tracks are stored locally in your browser.'}
                </span>
                <button
                  onClick={onCloseTrackLibrary}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple visual Close/Cancel cross helper component to satisfy rules without custom icons
const XButtonIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
