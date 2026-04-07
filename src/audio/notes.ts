export interface PianoKey {
  note: string
  frequency: number
  isBlack: boolean
  keyBinding: string
  octave: number
  noteNumber: number
}

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

const KEY_BINDINGS_ROW1 = ['1', '2', '3', '4', '5', '6', '7']
const KEY_BINDINGS_ROW2 = ['q', 'w', 'e', 'r', 't', 'y', 'u']
const KEY_BINDINGS_ROW3 = ['a', 's', 'd', 'f', 'g', 'h', 'j']
const KEY_BINDINGS_ROW4 = ['z', 'x', 'c', 'v', 'b', 'n', 'm']

function getFrequency(note: string, octave: number): number {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const noteIndex = NOTE_NAMES.indexOf(note)
  const midiNumber = (octave + 1) * 12 + noteIndex
  return 440 * Math.pow(2, (midiNumber - 69) / 12)
}

export function generatePianoKeys(): PianoKey[] {
  const keys: PianoKey[] = []
  const rows = [KEY_BINDINGS_ROW1, KEY_BINDINGS_ROW2, KEY_BINDINGS_ROW3, KEY_BINDINGS_ROW4]

  rows.forEach((row, rowIdx) => {
    const octave = 3 + rowIdx
    row.forEach((binding, noteIdx) => {
      const noteName = WHITE_NOTES[noteIdx]
      keys.push({
        note: noteName,
        frequency: getFrequency(noteName, octave),
        isBlack: false,
        keyBinding: binding,
        octave,
        noteNumber: (octave + 1) * 12 + ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(noteName),
      })
    })
  })

  return keys
}

export const PIANO_KEYS = generatePianoKeys()

export const KEY_TO_NOTE = new Map<string, PianoKey>()
PIANO_KEYS.forEach((key) => {
  if (key.keyBinding) {
    KEY_TO_NOTE.set(key.keyBinding.toLowerCase(), key)
  }
})
