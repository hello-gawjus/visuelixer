import { useState, useEffect, useRef } from 'react';
import { ELEMENTS } from './data/elements';
import { TableFilters, ChemicalElement, ToneProperty, ShellsPlayOption, SequenceNote, SavedSequence } from './types';
import { PeriodicTable } from './components/PeriodicTable';
import { FilterControls } from './components/FilterControls';
import { ElementDetailsModal } from './components/ElementDetailsModal';
import { ChordBuilder, PRESETS, MUSICAL_KEYS, normalizeNote } from './components/ChordBuilder';
import { SequenceRecorder, PRESET_SEQUENCES } from './components/SequenceRecorder';
import { Sun, Moon, Atom, Sparkles, AlertCircle, Volume2, VolumeX, Circle, Square, FolderHeart, Info } from 'lucide-react';
import { playElementTone, getNoteNameForElement } from './utils/audio';

const DEFAULT_FILTERS: TableFilters = {
  searchQuery: '',
  category: 'all',
  note: 'all',
  key: 'all',
  viewMode: 'grid',
  highlightedProperty: 'none',
};

export default function App() {
  const [filters, setFilters] = useState<TableFilters>(DEFAULT_FILTERS);

  // Helper to check if an element matches the active periodic table filter settings
  const elementMatchesFilters = (element: ChemicalElement): boolean => {
    const { searchQuery, category, note, key } = filters;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      element.name.toLowerCase().includes(query) ||
      element.symbol.toLowerCase().includes(query) ||
      element.atomicNumber.toString() === query;

    const matchesCategory = category === 'all' || element.category === category;
    const elementNote = getNoteNameForElement(element, toneProperty);
    const matchesNote = note === 'all' || elementNote === note;

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

  const shouldPlayNote = (note: SequenceNote): boolean => {
    const isPreset = PRESET_SEQUENCES.some(preset => 
      currentNotes.length > 0 && 
      currentNotes.length === preset.notes.length && 
      currentNotes[0].element.symbol === preset.notes[0].element.symbol
    );
    if (isPreset) {
      return elementMatchesFilters(note.element);
    }
    return true;
  };
  const [selectedElement, setSelectedElement] = useState<ChemicalElement | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('periodic-table-theme');
    return saved === 'dark';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('periodic-table-sound');
    return saved !== 'false';
  });
  const [toneDuration, setToneDuration] = useState<number>(() => {
    const saved = localStorage.getItem('periodic-table-tone-duration');
    return saved ? parseFloat(saved) : 0.6;
  });
  const [toneProperty, setToneProperty] = useState<ToneProperty>(() => {
    const saved = localStorage.getItem('periodic-table-tone-property');
    return (saved as ToneProperty) || 'atomicMass';
  });
  const [shellsToPlay, setShellsToPlay] = useState<ShellsPlayOption>(() => {
    const saved = localStorage.getItem('periodic-table-shells-to-play');
    return (saved as ShellsPlayOption) || '1';
  });
  const [isChordMode, setIsChordMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('periodic-table-chord-mode');
    return saved === 'true';
  });
  const [showPopups, setShowPopups] = useState<boolean>(() => {
    const saved = localStorage.getItem('periodic-table-show-popups');
    return saved !== 'false';
  });
  const [chordElements, setChordElements] = useState<ChemicalElement[]>([]);
  const [playMode, setPlayMode] = useState<'chord' | 'arpeggio'>('chord');

  // Sequence Recorder State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [currentNotes, setCurrentNotes] = useState<SequenceNote[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [showTrackLibrary, setShowTrackLibrary] = useState<boolean>(false);
  const [savedSequences, setSavedSequences] = useState<SavedSequence[]>(() => {
    const saved = localStorage.getItem('periodic-table-saved-sequences');
    return saved ? JSON.parse(saved) : [];
  });

  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);
  const playheadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Apply dark mode class to HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('periodic-table-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('periodic-table-theme', 'light');
    }
  }, [darkMode]);

  // Persist sound state to local storage
  useEffect(() => {
    localStorage.setItem('periodic-table-sound', soundEnabled ? 'true' : 'false');
  }, [soundEnabled]);

  // Persist tone duration state to local storage
  useEffect(() => {
    localStorage.setItem('periodic-table-tone-duration', toneDuration.toString());
  }, [toneDuration]);

  // Persist tone base property selection
  useEffect(() => {
    localStorage.setItem('periodic-table-tone-property', toneProperty);
  }, [toneProperty]);

  // Persist shells to play selection
  useEffect(() => {
    localStorage.setItem('periodic-table-shells-to-play', shellsToPlay);
  }, [shellsToPlay]);

  // Persist chord mode selection
  useEffect(() => {
    localStorage.setItem('periodic-table-chord-mode', isChordMode ? 'true' : 'false');
  }, [isChordMode]);

  // Persist show popups preference
  useEffect(() => {
    localStorage.setItem('periodic-table-show-popups', showPopups ? 'true' : 'false');
  }, [showPopups]);

  // Persist saved sequences
  useEffect(() => {
    localStorage.setItem('periodic-table-saved-sequences', JSON.stringify(savedSequences));
  }, [savedSequences]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach(clearTimeout);
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
    };
  }, []);

  // Dynamically restart scheduled timers if synthesizer filters change during playback
  useEffect(() => {
    if (isPlaying) {
      // Pause timers
      activeTimersRef.current.forEach(clearTimeout);
      
      // Reschedule starting from current playhead using active filters
      const remainingNotes = currentNotes.filter(note => note.timestamp >= currentTimeMs);
      startTimeRef.current = Date.now() - currentTimeMs;
      
      activeTimersRef.current = remainingNotes.map(note => {
        const delay = note.timestamp - currentTimeMs;
        return setTimeout(() => {
          if (soundEnabled && shouldPlayNote(note)) {
            playElementTone(note.element, toneDuration, 1.0, toneProperty, shellsToPlay);
          }
        }, delay);
      });
    }
  }, [toneProperty, shellsToPlay, toneDuration, soundEnabled, filters]);

  // Playback timer & progress update loop
  useEffect(() => {
    if (isPlaying) {
      const maxNoteTime = currentNotes.length > 0 
        ? Math.max(...currentNotes.map(n => n.timestamp)) 
        : 0;
      const totalDur = Math.max(4000, maxNoteTime + 1000);
      startTimeRef.current = Date.now() - currentTimeMs;

      playheadIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= totalDur) {
          setCurrentTimeMs(0);
          setIsPlaying(false);
          activeTimersRef.current.forEach(clearTimeout);
          activeTimersRef.current = [];
        } else {
          setCurrentTimeMs(elapsed);
        }
      }, 50);
    } else {
      if (playheadIntervalRef.current) {
        clearInterval(playheadIntervalRef.current);
        playheadIntervalRef.current = null;
      }
    }

    return () => {
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
    };
  }, [isPlaying, currentNotes]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Central audio play and recording interceptor
  const playAndRecordElement = (
    element: ChemicalElement, 
    volume: number, 
    prop: ToneProperty, 
    shells: ShellsPlayOption
  ) => {
    if (soundEnabled) {
      playElementTone(element, toneDuration, volume, prop, shells);
    }
    if (isRecording && recordingStartTime !== null) {
      const elapsed = Date.now() - recordingStartTime;
      setCurrentNotes((prev) => [
        ...prev,
        {
          element,
          timestamp: elapsed,
          toneProperty: prop,
          shellsToPlay: shells,
        },
      ]);
    }
  };

  // Sequencer controller callbacks
  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingStartTime(null);
    } else {
      // Arm recording: stop active playback first, clear current scratchpad
      setIsPlaying(false);
      activeTimersRef.current.forEach(clearTimeout);
      activeTimersRef.current = [];
      setCurrentTimeMs(0);

      setCurrentNotes([]);
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setShowPopups(false); // Force switch to play tone only
    }
  };

  const handleTogglePlayback = () => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      activeTimersRef.current.forEach(clearTimeout);
      activeTimersRef.current = [];
    } else {
      // Play / Resume
      if (currentNotes.length === 0) return;
      setIsRecording(false);
      setRecordingStartTime(null);
      setIsPlaying(true);

      const maxNoteTime = Math.max(...currentNotes.map(n => n.timestamp));
      const totalDur = Math.max(4000, maxNoteTime + 1000);
      
      let startFromMs = currentTimeMs;
      // If we are at the end, wrap back to 0
      if (currentTimeMs >= totalDur - 50) {
        startFromMs = 0;
        setCurrentTimeMs(0);
      }

      startTimeRef.current = Date.now() - startFromMs;

      // Schedule all remaining notes
      const remainingNotes = currentNotes.filter(note => note.timestamp >= startFromMs);
      
      activeTimersRef.current = remainingNotes.map(note => {
        const delay = note.timestamp - startFromMs;
        return setTimeout(() => {
          if (soundEnabled && shouldPlayNote(note)) {
            playElementTone(note.element, toneDuration, 1.0, toneProperty, shellsToPlay);
          }
        }, delay);
      });
    }
  };

  const handleStopPlayback = () => {
    setIsPlaying(false);
    activeTimersRef.current.forEach(clearTimeout);
    activeTimersRef.current = [];
    setCurrentTimeMs(0);
  };

  const handleClearCurrent = () => {
    setIsPlaying(false);
    setIsRecording(false);
    setRecordingStartTime(null);
    activeTimersRef.current.forEach(clearTimeout);
    activeTimersRef.current = [];
    setCurrentNotes([]);
    setCurrentTimeMs(0);
  };

  const handleSaveSequence = (name: string) => {
    const newSeq: SavedSequence = {
      id: `seq-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      notes: [...currentNotes],
      createdAt: Date.now()
    };
    setSavedSequences(prev => [newSeq, ...prev]);
  };

  const handleLoadSequence = (seq: SavedSequence) => {
    handleStopPlayback();
    setCurrentNotes([...seq.notes]);
    setCurrentTimeMs(0);
  };

  const handleDeleteSequence = (id: string) => {
    setSavedSequences(prev => prev.filter(s => s.id !== id));
  };

  const handleSeek = (timeMs: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      // Pause
      setIsPlaying(false);
      activeTimersRef.current.forEach(clearTimeout);
      activeTimersRef.current = [];
    }
    
    const maxNoteTime = currentNotes.length > 0 
      ? Math.max(...currentNotes.map(n => n.timestamp)) 
      : 0;
    const totalDur = Math.max(4000, maxNoteTime + 1000);
    const targetMs = Math.max(0, Math.min(totalDur, timeMs));
    
    setCurrentTimeMs(targetMs);

    if (wasPlaying) {
      // Resume playing from the new position
      setTimeout(() => {
        setIsPlaying(true);
        startTimeRef.current = Date.now() - targetMs;

        const remainingNotes = currentNotes.filter(note => note.timestamp >= targetMs);
        activeTimersRef.current = remainingNotes.map(note => {
          const delay = note.timestamp - targetMs;
          return setTimeout(() => {
            if (soundEnabled && shouldPlayNote(note)) {
              playElementTone(note.element, toneDuration, 1.0, toneProperty, shellsToPlay);
            }
          }, delay);
        });
      }, 50);
    }
  };

  const handleToggleChordElement = (element: ChemicalElement) => {
    setChordElements((prev) => {
      const exists = prev.some((item) => item.atomicNumber === element.atomicNumber);
      if (exists) {
        return prev.filter((item) => item.atomicNumber !== element.atomicNumber);
      } else {
        // Limit to 6 elements to prevent audio overload
        if (prev.length >= 6) return prev;
        return [...prev, element];
      }
    });
  };

  const handleRemoveChordElement = (element: ChemicalElement) => {
    setChordElements((prev) => prev.filter((item) => item.atomicNumber !== element.atomicNumber));
  };

  const handleClearChord = () => {
    setChordElements([]);
  };

  const handlePlayChord = () => {
    if (chordElements.length === 0) return;

    if (playMode === 'chord') {
      // Scale peak gain to prevent clipping when summing up to 6 wave channels
      const volumeMultiplier = 1 / Math.max(1, Math.sqrt(chordElements.length));
      chordElements.forEach((element) => {
        playAndRecordElement(element, volumeMultiplier, toneProperty, shellsToPlay);
      });
    } else {
      // Play arpeggio with slight sequential latency offsets
      chordElements.forEach((element, idx) => {
        setTimeout(() => {
          playAndRecordElement(element, 0.85, toneProperty, shellsToPlay);
        }, idx * 180);
      });
    }
  };

  const handleLoadPreset = (presetKey: string) => {
    const preset = PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;

    const matched = preset.symbols
      .map((sym) => ELEMENTS.find((el) => el.symbol === sym))
      .filter((el): el is ChemicalElement => !!el);

    setChordElements(matched);
    setIsChordMode(true);
  };

  const handleElementClick = (element: ChemicalElement) => {
    if (isChordMode) {
      handleToggleChordElement(element);
    } else {
      if (showPopups && !isRecording) {
        setSelectedElement(element);
      }
      playAndRecordElement(element, 1.0, toneProperty, shellsToPlay);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Header Banner */}
      <header className="border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
              <div className="p-1.5 bg-indigo-600 rounded-xl text-white">
                <Atom size={22} className="animate-spin-slow" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-widest text-indigo-600 dark:text-indigo-400 font-mono block">
                VisuElixer
              </span>
              <span className="font-sans font-bold text-xs text-slate-500 dark:text-slate-400 -mt-1 block">
                Interactive Chemistry Suite
              </span>
            </div>
          </div>

          {/* Controls: Sound toggle, Theme toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleRecording}
              className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 dark:bg-red-950/40 border-red-300 dark:border-red-900/60 text-white dark:text-red-400 animate-pulse' 
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              {isRecording ? <Square size={18} fill="currentColor" /> : <Circle size={18} fill="currentColor" />}
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 cursor-pointer transition-colors"
              title={soundEnabled ? 'Mute Audio Tones' : 'Unmute Audio Tones'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              onClick={() => !isRecording && setShowPopups(!showPopups)}
              disabled={isRecording}
              className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                isRecording 
                  ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-60' 
                  : showPopups
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 cursor-pointer'
              }`}
              title={isRecording ? 'Pop-ups disabled during recording' : showPopups ? 'Pop-ups: Show Details' : 'Pop-ups: Play Tone Only'}
            >
              <Info size={18} />
            </button>

            <button
              onClick={() => setShowTrackLibrary(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors flex items-center justify-center"
              title="Open Track Library"
            >
              <FolderHeart size={18} className="animate-pulse" />
            </button>
          </div>

        </div>

        {/* Compact Filters Section directly under title */}
        <div className="border-t border-slate-100 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-950/40 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <FilterControls
              filters={filters}
              onFilterChange={setFilters}
              onReset={handleResetFilters}
              toneDuration={toneDuration}
              onToneDurationChange={setToneDuration}
              soundEnabled={soundEnabled}
              onSoundEnabledChange={setSoundEnabled}
              toneProperty={toneProperty}
              onTonePropertyChange={setToneProperty}
              shellsToPlay={shellsToPlay}
              onShellsToPlayChange={setShellsToPlay}
              isChordMode={isChordMode}
              onChordModeToggle={setIsChordMode}
            />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">

        {/* Sequence Recorder Panel */}
        <SequenceRecorder
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          isPlaying={isPlaying}
          onTogglePlayback={handleTogglePlayback}
          onStopPlayback={handleStopPlayback}
          currentNotes={currentNotes}
          onClearCurrent={handleClearCurrent}
          savedSequences={savedSequences}
          onSaveSequence={handleSaveSequence}
          onLoadSequence={handleLoadSequence}
          onDeleteSequence={handleDeleteSequence}
          currentTimeMs={currentTimeMs}
          onSeek={handleSeek}
          showTrackLibrary={showTrackLibrary}
          onCloseTrackLibrary={() => setShowTrackLibrary(false)}
        />

        {/* Informative Tip Box on Mobile */}
        <div className="lg:hidden p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 rounded-xl flex items-start gap-2.5">
          <AlertCircle size={16} className="text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-indigo-700/85 dark:text-indigo-300 leading-normal">
            <strong>Tip:</strong> Scroll the table horizontally to view the full 18-column classic grid, or switch to the <strong>Table List</strong> view for mobile readability.
          </p>
        </div>

        {/* Periodic Table Grid or List */}
        <PeriodicTable
          elements={ELEMENTS}
          filters={filters}
          onElementClick={handleElementClick}
          selectedElement={selectedElement}
          chordElements={chordElements}
          toneProperty={toneProperty}
        />

        {/* Chemical Chord Builder Panel */}
        <ChordBuilder
          isChordMode={isChordMode}
          onChordModeToggle={setIsChordMode}
          chordElements={chordElements}
          onRemoveElement={handleRemoveChordElement}
          onClearChord={handleClearChord}
          onPlayChord={handlePlayChord}
          playMode={playMode}
          onPlayModeChange={setPlayMode}
          onLoadPreset={handleLoadPreset}
          toneDuration={toneDuration}
          toneProperty={toneProperty}
        />

        {/* Details Modal */}
        <ElementDetailsModal
          element={selectedElement}
          onClose={() => setSelectedElement(null)}
          toneDuration={toneDuration}
          toneProperty={toneProperty}
          shellsToPlay={shellsToPlay}
          onToggleChord={handleToggleChordElement}
          onPlayTone={(element) => playAndRecordElement(element, 1.0, toneProperty, shellsToPlay)}
          isInChord={selectedElement ? chordElements.some(item => item.atomicNumber === selectedElement.atomicNumber) : false}
        />

      </main>

      {/* Footer copyright */}
      <footer className="mt-12 py-8 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-500" />
            <span>Interactive Periodic Table of Chemical Elements</span>
          </div>
          <span>Built with React, Tailwind CSS, & Motion</span>
        </div>
      </footer>

    </div>
  );
}
