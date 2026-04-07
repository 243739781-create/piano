<template>
  <div
    :class="['piano-key', { 'active': isActive }]"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
    @mouseenter="onMouseEnter"
  >
    <div class="key-top"></div>
    <div class="key-body">
      <span class="key-note">{{ keyData.keyBinding.toUpperCase() }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PianoKey } from '../audio/notes'

const props = defineProps<{
  keyData: PianoKey
  isActive: boolean
}>()

const emit = defineEmits<{
  'note-on': [key: PianoKey]
  'note-off': [key: PianoKey]
}>()

const isMouseDown = ref(false)

// const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

// const keyNumber = computed(() => {
//   const noteIndex = WHITE_NOTES.indexOf(props.keyData.note)
//   const num = noteIndex + 1
//   const octave = props.keyData.octave

//   const dotBelow = '\u0323'
//   const dotAbove = '\u0307'

//   if (octave < 4) {
//     return `${num}${dotBelow}${dotBelow}`
//   } else if (octave === 4) {
//     return `${num}${dotBelow}`
//   } else if (octave === 5) {
//     return `${num}`
//   } else if (octave === 6) {
//     return `${num}${dotAbove}`
//   } else {
//     return `${num}${dotAbove}${dotAbove}`
//   }
// })

function onMouseDown() {
  isMouseDown.value = true
  emit('note-on', props.keyData)
}

function onMouseUp() {
  isMouseDown.value = false
  emit('note-off', props.keyData)
}

function onMouseLeave() {
  if (isMouseDown.value) {
    emit('note-off', props.keyData)
  }
  isMouseDown.value = false
}

function onMouseEnter() {
  if (isMouseDown.value) {
    emit('note-on', props.keyData)
  }
}
</script>

<style scoped>
.piano-key {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  width: 54px;
  height: 240px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.06s ease, box-shadow 0.06s ease;
  margin: 0 1px;
}

.key-top {
  width: 100%;
  height: 18px;
  background: linear-gradient(to bottom, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 3px 3px 0 0;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
}

.key-body {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
  background: linear-gradient(to bottom, #fefefe 0%, #f5f5f5 60%, #e8e8e8 100%);
  border: 1px solid #c8c8c8;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.25),
    inset 0 -4px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.piano-key:hover .key-body {
  background: linear-gradient(to bottom, #fff 0%, #f8f8f8 60%, #ececec 100%);
}

.piano-key.active {
  transform: translateY(3px);
}

.piano-key.active .key-body {
  background: linear-gradient(to bottom, #f0f0f0 0%, #e8e8e8 60%, #ddd 100%);
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.2),
    inset 0 -2px 3px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.key-note {
  font-size: 14px;
  font-weight: 600;
  color: #4a90e2;
  opacity: 0.85;
  pointer-events: none;
}
</style>
