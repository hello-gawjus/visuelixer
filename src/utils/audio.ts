import { ChemicalElement, ToneProperty, ShellsPlayOption } from '../types';

let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

export function getAudioAnalyser(): AnalyserNode | null {
  if (typeof window === 'undefined') return null;
  try {
    const ctx = getAudioContext();
    if (!analyserNode) {
      analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256; // optimal for waveform visuals
      analyserNode.connect(ctx.destination);
    }
    return analyserNode;
  } catch (e) {
    return null;
  }
}

/**
 * Calculates the Bohr model electron shell distribution for an element.
 */
export function getShellDistribution(atomicNumber: number): number[] {
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

  if (shells[atomicNumber]) {
    return shells[atomicNumber];
  }

  // Approximate distribution for other elements
  const dist: number[] = [];
  let remaining = atomicNumber;
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
  return dist;
}

/**
 * Calculates a unique frequency for a chemical element based on the selected physical property.
 * Maps values to a pleasant musical range: ~140Hz (D3) to ~784Hz (G5).
 */
export function getFrequencyForElement(element: ChemicalElement, property: ToneProperty = 'atomicMass'): number {
  const minFreq = 140; // Low note (D3)
  const maxFreq = 784; // High note (G5)

  let ratio = 0.5; // default mid-frequency ratio

  switch (property) {
    case 'atomicNumber': {
      // Range: 1 to 118
      const minNum = 1;
      const maxNum = 118;
      const clamped = Math.min(maxNum, Math.max(minNum, element.atomicNumber));
      // Invert so heavier elements have lower frequencies
      ratio = 1 - (clamped - minNum) / (maxNum - minNum);
      break;
    }
    case 'atomicMass': {
      // Range: ~1.008 to ~294
      const minMass = 1;
      const maxMass = 300;
      const clamped = Math.min(maxMass, Math.max(minMass, element.atomicMass));
      // Invert so heavier elements have lower frequencies
      ratio = 1 - (clamped - minMass) / (maxMass - minMass);
      break;
    }
    case 'electronegativity': {
      // Range: 0.79 (Cs) to 3.98 (F). If null (like noble gases), default to 2.2 (H)
      const minEn = 0.7;
      const maxEn = 4.0;
      const val = element.electronegativity ?? 2.2;
      const clamped = Math.min(maxEn, Math.max(minEn, val));
      // Higher electronegativity (active nonmetals) = higher/brighter frequency
      ratio = (clamped - minEn) / (maxEn - minEn);
      break;
    }
    case 'density': {
      // Range: extremely light gases (e.g. Hydrogen 0.000089) to Osmium (22.59)
      // We clamp between 0.0001 and 23.0
      const minDen = 0.0001;
      const maxDen = 23.0;
      const val = element.density ?? 1.0;
      const clamped = Math.min(maxDen, Math.max(minDen, val));
      // Denser metals = deeper drone frequency
      ratio = 1 - (clamped - minDen) / (maxDen - minDen);
      break;
    }
    case 'period': {
      // Range: 1 to 7
      const minPeriod = 1;
      const maxPeriod = 7;
      const clamped = Math.min(maxPeriod, Math.max(minPeriod, element.period));
      // Higher periods (shells) = deeper pitch
      ratio = 1 - (clamped - minPeriod) / (maxPeriod - minPeriod);
      break;
    }
    case 'electronShells': {
      // Harmonic series based on the electron shell structure.
      // Larger shell count (higher periods) = deeper resonance.
      // Within each shell, more valence (outermost) electrons = higher harmonic resonance.
      const shells = getShellDistribution(element.atomicNumber);
      const shellCount = shells.length; // 1 to 7
      const valenceElectrons = shells[shells.length - 1] || 1; // 1 to 8 (typically)
      
      const shellRatio = (shellCount - 1) / 6; // 0 to 1
      const maxValence = Math.max(...shells, 8);
      const valenceRatio = (valenceElectrons - 1) / (maxValence - 1 || 1); // 0 to 1
      
      // Let shell count be the main driver (lower pitch for heavier/larger shells)
      // and valence electrons be the micro-tuning (higher pitch for more electrons)
      ratio = 1 - (shellRatio * 0.8 + (1 - valenceRatio) * 0.2);
      break;
    }
    default:
      ratio = 0.5;
  }

  // Ensure ratio is clamped strictly between 0 and 1
  ratio = Math.min(1, Math.max(0, ratio));

  return minFreq + ratio * (maxFreq - minFreq);
}

/**
 * Returns the musical note name (e.g., "A", "A#", "B") for a given element and tone property.
 */
export function getNoteNameForElement(element: ChemicalElement, property: ToneProperty = 'atomicMass'): string {
  const frequency = getFrequencyForElement(element, property);
  const midiNote = Math.max(0, Math.min(127, Math.round(12 * Math.log2(frequency / 440) + 69)));
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return noteNames[midiNote % 12];
}

/**
 * Plays a unique audio tone based on the element's chosen physical property and chemical group.
 * Allows playing multiple electron shells simultaneously as a layered physical soundscape.
 */
export function playElementTone(
  element: ChemicalElement,
  duration?: number,
  volumeMultiplier: number = 1.0,
  toneProperty: ToneProperty = 'atomicMass',
  shellsToPlay: ShellsPlayOption = '1'
) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const frequency = getFrequencyForElement(element, toneProperty);

    // Filter to keep the sound warm
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 3.0, ctx.currentTime);

    // Customize audio features per category
    let osc1Type: OscillatorType = 'sine';
    let osc2Type: OscillatorType = 'sine';
    let osc2Detune = 0;
    let osc2FreqMultiplier = 2; // Default to octave
    let decayTime = duration ?? 0.5; // Seconds
    let brightness = 0.12; // Base volume multiplier to prevent clipping

    switch (element.category) {
      case 'alkali-metal':
      case 'alkaline-earth-metal':
        // Reactive metals: energetic, snappy plucks
        osc1Type = 'triangle';
        osc2Type = 'sine';
        osc2FreqMultiplier = 3; // Perfect fifth in the next octave
        decayTime = duration ?? 0.45;
        brightness = 0.10;
        break;

      case 'transition-metal':
      case 'post-transition-metal':
        // Dense metallic elements: resonant and slightly bright metallic bell
        osc1Type = 'sine';
        osc2Type = 'triangle';
        osc2FreqMultiplier = 2; // Regular octave harmonic
        decayTime = duration ?? 0.7; // Longer metallic ringing
        brightness = 0.12;
        filter.Q.setValueAtTime(4, ctx.currentTime); // Slight bell resonance
        break;

      case 'lanthanide':
      case 'actinide':
        // Rare earth & heavy radioactive elements: eerie, glowing vibraphone sound with detuning
        osc1Type = 'triangle';
        osc2Type = 'triangle';
        osc2Detune = 14; // Detuned cents for shimmering chorus effect
        osc2FreqMultiplier = 1; // Unison detune
        decayTime = duration ?? 1.0; // Long glowing fade
        brightness = 0.08;
        break;

      case 'noble-gas':
        // Ethereal, pure, crystalline chime
        osc1Type = 'sine';
        osc2Type = 'sine';
        osc2FreqMultiplier = 4; // Double octave chime
        decayTime = duration ?? 0.8;
        brightness = 0.14;
        break;

      case 'reactive-nonmetal':
      case 'metalloid':
        // Warm, earthy acoustic sound
        osc1Type = 'sine';
        osc2Type = 'sine';
        osc2FreqMultiplier = 1.5; // Perfect fifth interval
        decayTime = duration ?? 0.5;
        brightness = 0.15;
        break;

      default:
        // Default clean synth chime
        osc1Type = 'sine';
        osc2Type = 'sine';
        osc2FreqMultiplier = 2;
        decayTime = duration ?? 0.6;
        brightness = 0.12;
    }

    brightness = brightness * volumeMultiplier;

    // Get Bohr electron shell distribution
    const allShells = getShellDistribution(element.atomicNumber);
    let activeShells: { idx: number; electrons: number }[] = [];

    if (shellsToPlay === 'outer') {
      if (allShells.length > 0) {
        activeShells.push({
          idx: allShells.length - 1,
          electrons: allShells[allShells.length - 1]
        });
      }
    } else {
      const limit = shellsToPlay === 'all' ? allShells.length : parseInt(shellsToPlay || '1', 10);
      for (let i = 0; i < Math.min(limit, allShells.length); i++) {
        activeShells.push({
          idx: i,
          electrons: allShells[i]
        });
      }
    }

    if (activeShells.length === 0) {
      activeShells.push({ idx: 0, electrons: allShells[0] || 1 });
    }

    const now = ctx.currentTime;
    const numActive = activeShells.length;

    activeShells.forEach((shell) => {
      const { idx, electrons } = shell;

      // Calculate shell frequency: harmonic step + modulation by electron count
      const f_shell = frequency * (1 + idx * 0.3) * (1 + electrons * 0.008);

      const osc = ctx.createOscillator();
      osc.type = osc1Type;
      osc.frequency.setValueAtTime(f_shell, now);

      if (element.category === 'lanthanide' || element.category === 'actinide') {
        osc.detune.setValueAtTime(osc2Detune * (idx + 1), now);
      }

      const shellGainNode = ctx.createGain();
      // Scale shell volume relative to total active shells
      const shellVolume = (brightness / Math.sqrt(numActive)) * (idx === allShells.length - 1 ? 1.0 : 0.75);

      shellGainNode.gain.setValueAtTime(0, now);
      shellGainNode.gain.linearRampToValueAtTime(shellVolume, now + 0.015);

      const shellDecay = decayTime * (0.7 + (idx / allShells.length) * 0.3);
      shellGainNode.gain.exponentialRampToValueAtTime(0.0001, now + shellDecay);

      osc.connect(shellGainNode);
      shellGainNode.connect(filter);

      osc.start(now);
      osc.stop(now + shellDecay);

      // If playing 1-shell mode, or for the main shell, add a secondary harmonic for maximum resonance
      if (numActive === 1 || idx === 0) {
        const osc2 = ctx.createOscillator();
        osc2.type = osc2Type;
        osc2.frequency.setValueAtTime(f_shell * osc2FreqMultiplier, now);
        osc2.detune.setValueAtTime(osc2Detune, now);

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(shellVolume * 0.4, now);
        osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + shellDecay * 0.8);

        osc2.connect(osc2Gain);
        osc2Gain.connect(filter);

        osc2.start(now);
        osc2.stop(now + shellDecay);
      }
    });

    // Route through filter and out to speakers (via analyser)
    const analyser = getAudioAnalyser();
    if (analyser) {
      filter.connect(analyser);
    } else {
      filter.connect(ctx.destination);
    }
  } catch (err) {
    console.warn('Unable to play element audio tone:', err);
  }
}
