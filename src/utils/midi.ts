import { ChemicalElement, ToneProperty } from '../types';
import { getFrequencyForElement } from './audio';

/**
 * Encodes a number as a Variable-Length Quantity (VLQ) for MIDI.
 */
function encodeVLQ(value: number): number[] {
  const bytes: number[] = [];
  let buffer = Math.floor(value);
  bytes.unshift(buffer & 0x7F);
  while (buffer > 0x7F) {
    buffer >>= 7;
    bytes.unshift((buffer & 0x7F) | 0x80);
  }
  return bytes;
}

/**
 * Converts a 32-bit integer to an array of 4 bytes (big-endian).
 */
function write32Bit(val: number): number[] {
  return [
    (val >> 24) & 0xFF,
    (val >> 16) & 0xFF,
    (val >> 8) & 0xFF,
    val & 0xFF
  ];
}

/**
 * Converts a 16-bit integer to an array of 2 bytes (big-endian).
 */
function write16Bit(val: number): number[] {
  return [
    (val >> 8) & 0xFF,
    val & 0xFF
  ];
}

interface RawMidiEvent {
  tick: number;
  status: number;
  data1: number;
  data2: number;
}

/**
 * Generates MIDI file byte array representation of the selected chemical elements.
 */
export function generateMidiBytes(
  chordElements: ChemicalElement[],
  playMode: 'chord' | 'arpeggio',
  duration: number,
  toneProperty: ToneProperty = 'atomicMass'
): Uint8Array {
  const events: RawMidiEvent[] = [];
  
  // Base duration in seconds
  const elementDuration = duration > 0 ? duration : 0.6;

  chordElements.forEach((element, idx) => {
    // 1. Calculate matching frequency using the same shared calculation helper
    const frequency = getFrequencyForElement(element, toneProperty);
    
    // 2. Map frequency to MIDI note
    const midiNote = Math.max(0, Math.min(127, Math.round(12 * Math.log2(frequency / 440) + 69)));

    // 3. Set timing offsets based on play mode (chord vs arpeggio)
    // 240 ticks per second (assuming 120 BPM, so 1 quarter note beat = 0.5 seconds, which is 120 ticks)
    let startTime = 0;
    if (playMode === 'arpeggio') {
      startTime = idx * 0.18; // Staggered arpeggio onset of 180ms
    }
    const endTime = startTime + elementDuration;

    const startTick = Math.round(startTime * 240);
    const endTick = Math.round(endTime * 240);

    // Note On (Channel 0, velocity 80)
    events.push({
      tick: startTick,
      status: 0x90,
      data1: midiNote,
      data2: 80
    });

    // Note Off (Channel 0, velocity 0)
    events.push({
      tick: endTick,
      status: 0x80,
      data1: midiNote,
      data2: 0
    });
  });

  // Sort events chronologically.
  // If absolute ticks are identical, process Note Offs before Note Ons to avoid canceling overlapping notes of the same pitch.
  events.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    return a.status - b.status;
  });

  // Build the track byte stream
  const trackBytes: number[] = [];
  let lastTick = 0;

  for (const ev of events) {
    const delta = ev.tick - lastTick;
    lastTick = ev.tick;

    const deltaVLQ = encodeVLQ(delta);
    trackBytes.push(...deltaVLQ);
    trackBytes.push(ev.status, ev.data1, ev.data2);
  }

  // End of Track Meta Event: delta-time = 0, status = 0xFF, type = 0x2F, length = 0x00
  trackBytes.push(0x00, 0xFF, 0x2F, 0x00);

  // Construct MIDI File Layout
  const headerChunk = [
    0x4D, 0x54, 0x68, 0x64,     // "MThd" Chunk Identifier
    ...write32Bit(6),            // length of header data is always 6 bytes
    ...write16Bit(0),            // Format type: 0 (single track)
    ...write16Bit(1),            // Number of tracks: 1
    ...write16Bit(120),          // Time Division: 120 ticks per quarter note
  ];

  const trackHeader = [
    0x4D, 0x54, 0x72, 0x6B,     // "MTrk" Chunk Identifier
    ...write32Bit(trackBytes.length) // Track byte-length
  ];

  return new Uint8Array([
    ...headerChunk,
    ...trackHeader,
    ...trackBytes
  ]);
}

/**
 * Triggers a web-native file download of the compiled chemical MIDI melody.
 */
export function downloadChemicalMidiFile(
  chordElements: ChemicalElement[],
  playMode: 'chord' | 'arpeggio',
  duration: number,
  fileName: string,
  toneProperty: ToneProperty = 'atomicMass'
) {
  try {
    const bytes = generateMidiBytes(chordElements, playMode, duration, toneProperty);
    const blob = new Blob([bytes], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.mid') ? fileName : `${fileName}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export MIDI file:', error);
  }
}
