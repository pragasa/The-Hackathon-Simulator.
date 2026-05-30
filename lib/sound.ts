/**
 * @fileoverview Synthesized Web Audio API Sound System for The Hackathon Simulator.
 * Creates premium, muted tactile retro-futuristic audio ticks, chimes, and chords
 * without requiring local or external MP3 assets.
 *
 * @module lib/sound
 */

import { useGameStore } from "@/store/gameStore";

let audioCtx: AudioContext | null = null;

/** Lazily initialize browser AudioContext on demand */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/** Check if global sound setting is active in Zustand */
function isSoundEnabled(): boolean {
  try {
    return useGameStore.getState().soundEnabled;
  } catch {
    return true; // safe fallback
  }
}

/** Play a premium, extremely short tactile click/tap (Arc style button click) */
export function playMutedClick() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended by browser autoplay policy
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

/** Play an extremely quiet, high-pitched tick on hover (Linear/Framer micro-interaction) */
export function playSubtleHover() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1400, ctx.currentTime);

  gain.gain.setValueAtTime(0.015, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.015);
}

/** Play a double click/snap for successful drag-and-drop actions */
export function playSnapSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const playTick = (delay: number, freq: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + delay + 0.03);

    gain.gain.setValueAtTime(0.04, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.03);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.035);
  };

  playTick(0, 400);
  playTick(0.05, 600);
}

/** Play a soft, muted warning tick (alarm beep) during the final minute warning */
export function playWarningTick() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(380, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.03, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.13);
}

/** Play a quick mechanical tick for the judge wheel spin */
export function playWheelSpinClick() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1000, ctx.currentTime);

  gain.gain.setValueAtTime(0.015, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.01);
}

/** Play a warm, rich major-7th chord representing final editorial scores */
export function playScoreChord() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const frequencies = [261.63, 329.63, 392.00, 493.88]; // C4, E4, G4, B4 (C major 7th)
  
  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.15 + index * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.8);
  });
}

/** Play an ascending minor/major arpeggio for achievement unlocking (highly satisfying fanfare) */
export function playUnlockArpeggio() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const notes = [261.63, 329.63, 392.00, 523.25]; // C4 -> E4 -> G4 -> C5
  
  notes.forEach((freq, index) => {
    const delay = index * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

    gain.gain.setValueAtTime(0.03, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.26);
  });
}
