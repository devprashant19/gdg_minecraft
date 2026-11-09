import { useGame } from './store';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function initAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = useGame.getState().soundOn ? 0.25 : 0.0;
    masterGain.connect(audioCtx.destination);

    // Page visibility listener: auto-suspend when tab is inactive to conserve battery
    document.addEventListener('visibilitychange', () => {
      if (!audioCtx) return;
      if (document.hidden) {
        audioCtx.suspend();
      } else if (useGame.getState().soundOn) {
        audioCtx.resume();
      }
    });

    // Subscribe to sound toggle state
    useGame.subscribe(
      (s) => s.soundOn,
      (soundOn) => {
        if (!masterGain || !audioCtx) return;
        if (soundOn && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        masterGain.gain.setValueAtTime(soundOn ? 0.25 : 0.0, audioCtx.currentTime);
      }
    );
  }

  if (audioCtx.state === 'suspended' && useGame.getState().soundOn) {
    audioCtx.resume();
  }

  return audioCtx;
}

export function playClick() {
  const ctx = initAudioContext();
  if (!ctx || !masterGain || !useGame.getState().soundOn) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(820, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start();
  osc.stop(ctx.currentTime + 0.04);
}

export function playPanelOpen() {
  const ctx = initAudioContext();
  if (!ctx || !masterGain || !useGame.getState().soundOn) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(260, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

export function playPanelClose() {
  const ctx = initAudioContext();
  if (!ctx || !masterGain || !useGame.getState().soundOn) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

export function playFootstep(surface: 'grass' | 'sand' | 'wood' | 'stone' = 'grass') {
  const ctx = initAudioContext();
  if (!ctx || !masterGain || !useGame.getState().soundOn) return;

  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';

  switch (surface) {
    case 'sand':
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      break;
    case 'wood':
      filter.frequency.setValueAtTime(850, ctx.currentTime);
      break;
    case 'stone':
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      break;
    case 'grass':
    default:
      filter.frequency.setValueAtTime(650, ctx.currentTime);
      break;
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noise.start();
  noise.stop(ctx.currentTime + 0.05);
}

export function playSuccess() {
  const ctx = initAudioContext();
  if (!ctx || !masterGain || !useGame.getState().soundOn) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const startTime = ctx.currentTime + idx * 0.1;
    const duration = 0.28;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(masterGain!);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

export function playAdvancement() {
  const ctx = initAudioContext();
  if (!ctx || !masterGain || !useGame.getState().soundOn) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}
