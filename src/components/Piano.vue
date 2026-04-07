<template>
  <div class="piano-container">
    <div class="piano-header">
      <h1>🎹 Virtual Piano</h1>
      <div class="controls">
        <button :class="['sustain-btn', { active: sustain }]" @mousedown="sustainOn" @mouseup="sustainOff" @mouseleave="sustainOff">
          Sustain {{ sustain ? 'ON' : 'OFF' }} (Space)
        </button>
      </div>
    </div>
    <div class="piano-wrapper">
      <div class="piano-top">
        <div class="brand">Virtual Piano</div>
      </div>
      <div class="piano-body">
        <div class="fallboard"></div>
        <div class="keys-container">
          <div class="white-keys">
            <PianoKey
              v-for="key in keys"
              :key="key.note + key.octave"
              :key-data="key"
              :is-active="activeKeys.has(key.note + key.octave)"
              @note-on="handleNoteOn"
              @note-off="handleNoteOff"
            />
          </div>
          <div class="black-keys">
            <div
              v-for="(blackKey, index) in blackKeyPositions"
              :key="'black-' + index"
              class="black-key-decorative"
              :style="{ left: blackKey.left + 'px' }"
            ></div>
          </div>
        </div>
      </div>
      <div class="piano-bottom"></div>
    </div>
    <div class="instructions">
      <p>1~7 (C3-B3) | Q~U (C4-B4) | A~J (C5-B5) | Z~M (C6-B6)</p>
      <p>Hold Space for sustain pedal</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PIANO_KEYS, KEY_TO_NOTE, type PianoKey as PianoKeyType } from '../audio/notes'
import { PianoEngine } from '../audio/PianoEngine'
import PianoKey from './PianoKey.vue'

const keys = PIANO_KEYS
const engine = new PianoEngine()
const activeKeys = ref(new Set<string>())
const sustain = ref(false)

const WHITE_KEY_WIDTH = 54
const BLACK_KEY_WIDTH = 32

const blackKeyPositions = computed(() => {
  const positions: { left: number }[] = []
  const whiteKeyWidth = WHITE_KEY_WIDTH + 2

  const blackKeyPattern = [1, 2, 4, 5, 6]

  for (let octave = 0; octave < 4; octave++) {
    blackKeyPattern.forEach((offset) => {
      const whiteKeyIndex = octave * 7 + offset
      positions.push({
        left: (whiteKeyIndex + 1) * whiteKeyWidth - BLACK_KEY_WIDTH / 2 - 1,
      })
    })
  }

  return positions
})

function handleNoteOn(key: PianoKeyType) {
  engine.resume()
  const noteId = key.note + key.octave
  activeKeys.value.add(noteId)
  engine.playNote(noteId, key.frequency)
}

function handleNoteOff(key: PianoKeyType) {
  const noteId = key.note + key.octave
  activeKeys.value.delete(noteId)
  engine.stopNote(noteId)
}

function sustainOn() {
  sustain.value = true
  engine.setSustain(true)
}

function sustainOff() {
  sustain.value = false
  engine.setSustain(false)
}

const pressedKeys = new Set<string>()

function handleKeyDown(e: KeyboardEvent) {
  if (e.repeat) return

  if (e.code === 'Space') {
    e.preventDefault()
    if (!sustain.value) {
      sustainOn()
    }
    return
  }

  const key = e.key.toLowerCase()
  if (pressedKeys.has(key)) return

  const pianoKey = KEY_TO_NOTE.get(key)
  if (pianoKey) {
    e.preventDefault()
    pressedKeys.add(key)
    handleNoteOn(pianoKey)
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    if (sustain.value) {
      sustainOff()
    }
    return
  }

  const key = e.key.toLowerCase()
  pressedKeys.delete(key)

  const pianoKey = KEY_TO_NOTE.get(key)
  if (pianoKey) {
    e.preventDefault()
    handleNoteOff(pianoKey)
  }
}

onMounted(async () => {
  await engine.init()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.piano-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%);
  padding: 30px 20px;
}

.piano-header {
  text-align: center;
  margin-bottom: 25px;
}

.piano-header h1 {
  color: #ecf0f1;
  font-size: 2rem;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.sustain-btn {
  padding: 8px 18px;
  border: 2px solid #3498db;
  background: transparent;
  color: #3498db;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.sustain-btn:hover {
  background: rgba(52, 152, 219, 0.1);
}

.sustain-btn.active {
  background: #3498db;
  color: #fff;
}

.piano-wrapper {
  perspective: 1200px;
}

.piano-top {
  background: linear-gradient(to bottom, #1a1a1a 0%, #2d2d2d 100%);
  padding: 15px 30px;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
}

.brand {
  text-align: center;
  color: #c9a96e;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.piano-body {
  background: linear-gradient(to bottom, #2d2d2d 0%, #1a1a1a 100%);
  padding: 15px 20px 20px;
  border-left: 3px solid #333;
  border-right: 3px solid #333;
  box-shadow: 
    0 15px 40px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.fallboard {
  height: 8px;
  background: linear-gradient(to bottom, #222 0%, #111 100%);
  margin-bottom: 2px;
  border-radius: 2px;
}

.keys-container {
  position: relative;
  background: #0a0a0a;
  padding: 3px;
  border-radius: 3px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.8);
}

.white-keys {
  display: flex;
  gap: 2px;
}

.black-keys {
  position: absolute;
  top: 3px;
  left: 3px;
  height: 100px;
  pointer-events: none;
}

.black-key-decorative {
  position: absolute;
  width: 32px;
  height: 100px;
  background: linear-gradient(to bottom, #333 0%, #1a1a1a 60%, #111 100%);
  border-radius: 0 0 3px 3px;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.6),
    inset 0 -3px 5px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.piano-bottom {
  height: 12px;
  background: linear-gradient(to bottom, #1a1a1a 0%, #0d0d0d 100%);
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

.instructions {
  margin-top: 25px;
  text-align: center;
  color: rgba(236, 240, 241, 0.6);
  font-size: 13px;
}

.instructions p {
  margin: 4px 0;
}
</style>
