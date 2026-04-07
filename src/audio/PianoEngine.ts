export interface NoteInfo {
  note: string
  frequency: number
  isBlack: boolean
  keyBinding: string
  octave: number
}

export class PianoEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private convolver: ConvolverNode | null = null
  private reverbGain: GainNode | null = null
  private dryGain: GainNode | null = null
  private activeNotes = new Map<string, { oscillators: OscillatorNode[]; gainNode: GainNode; filterNode: BiquadFilterNode }>()
  private sustain = false
  private sustainedNotes = new Set<string>()

  async init() {
    this.ctx = new AudioContext()
    
    this.compressor = this.ctx.createDynamicsCompressor()
    this.compressor.threshold.value = -20
    this.compressor.knee.value = 20
    this.compressor.ratio.value = 8
    this.compressor.attack.value = 0.002
    this.compressor.release.value = 0.15
    this.compressor.connect(this.ctx.destination)

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.5

    this.dryGain = this.ctx.createGain()
    this.dryGain.gain.value = 0.75

    this.reverbGain = this.ctx.createGain()
    this.reverbGain.gain.value = 0.15

    this.convolver = this.ctx.createConvolver()
    this.convolver.buffer = this.createReverbImpulse()

    this.masterGain.connect(this.dryGain)
    this.masterGain.connect(this.convolver)
    this.convolver.connect(this.reverbGain)
    this.dryGain.connect(this.compressor)
    this.reverbGain.connect(this.compressor)
  }

  private createReverbImpulse(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized')
    const length = this.ctx.sampleRate * 2
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate)
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3)
      }
    }
    return impulse
  }

  private createPianoSound(frequency: number): { oscillators: OscillatorNode[]; gainNode: GainNode; filterNode: BiquadFilterNode } {
    if (!this.ctx || !this.masterGain) throw new Error('AudioContext not initialized')

    const now = this.ctx.currentTime
    const gainNode = this.ctx.createGain()
    gainNode.gain.setValueAtTime(0, now)

    const filterNode = this.ctx.createBiquadFilter()
    filterNode.type = 'lowpass'
    filterNode.frequency.setValueAtTime(Math.min(frequency * 8, 12000), now)
    filterNode.frequency.exponentialRampToValueAtTime(Math.min(frequency * 4, 8000), now + 0.5)
    filterNode.Q.value = 0.5

    const oscillators: OscillatorNode[] = []

    const harmonics = [
      { ratio: 1, gain: 1.0 },
      { ratio: 2, gain: 0.45 },
      { ratio: 3, gain: 0.2 },
      { ratio: 4, gain: 0.1 },
      { ratio: 5, gain: 0.05 },
      { ratio: 6, gain: 0.025 },
      { ratio: 7, gain: 0.012 },
      { ratio: 8, gain: 0.006 },
      { ratio: 9, gain: 0.003 },
      { ratio: 10, gain: 0.0015 },
    ]

    const baseDecay = Math.max(2, 10 - Math.log2(frequency / 55) * 1.5)

    harmonics.forEach((h) => {
      const osc = this.ctx!.createOscillator()
      const harmonicGain = this.ctx!.createGain()
      const freq = frequency * h.ratio

      const inharmonicity = 1 + 0.0002 * h.ratio * h.ratio
      osc.frequency.value = freq * inharmonicity
      osc.type = 'sine'

      harmonicGain.gain.setValueAtTime(h.gain, now)
      harmonicGain.gain.exponentialRampToValueAtTime(h.gain * 0.5, now + baseDecay * 0.3)
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + baseDecay)

      osc.connect(harmonicGain)
      harmonicGain.connect(filterNode)

      osc.start(now)
      oscillators.push(osc)
    })

    const noiseBuffer = this.ctx!.createBuffer(1, this.ctx!.sampleRate * 0.08, this.ctx!.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.15
    }
    const noiseSource = this.ctx!.createBufferSource()
    noiseSource.buffer = noiseBuffer
    const noiseGain = this.ctx!.createGain()
    noiseGain.gain.setValueAtTime(0.08, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    const noiseFilter = this.ctx!.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = frequency * 3
    noiseFilter.Q.value = 2
    noiseSource.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(gainNode)
    noiseSource.start(now)
    noiseSource.stop(now + 0.08)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.003)
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + baseDecay)

    filterNode.connect(gainNode)
    gainNode.connect(this.masterGain)

    return { oscillators, gainNode, filterNode }
  }

  playNote(noteId: string, frequency: number) {
    if (this.activeNotes.has(noteId)) return
    const sound = this.createPianoSound(frequency)
    this.activeNotes.set(noteId, sound)
  }

  stopNote(noteId: string) {
    const note = this.activeNotes.get(noteId)
    if (!note || !this.ctx) return

    if (this.sustain) {
      this.sustainedNotes.add(noteId)
      return
    }

    const now = this.ctx.currentTime
    note.gainNode.gain.cancelScheduledValues(now)
    note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now)
    note.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    setTimeout(() => {
      note.oscillators.forEach((osc) => {
        try {
          osc.stop()
        } catch {}
      })
    }, 500)

    this.activeNotes.delete(noteId)
  }

  setSustain(active: boolean) {
    this.sustain = active
    if (!active && this.sustainedNotes.size > 0) {
      this.sustainedNotes.forEach((noteId) => {
        this.stopNote(noteId)
      })
      this.sustainedNotes.clear()
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume()
    }
  }
}
