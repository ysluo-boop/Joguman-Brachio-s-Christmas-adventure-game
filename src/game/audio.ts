import type { AudioSettings } from './types';

// Festive light chiptune melody (MIDI note numbers, 0 = rest)
const MELODY_NOTES: Array<[number, number]> = [
  [76, 1], [76, 1], [76, 2],
  [76, 1], [76, 1], [76, 2],
  [76, 1], [79, 1], [72, 1.5], [74, 0.5],
  [76, 4],
  [77, 1], [77, 1], [77, 1.5], [77, 0.5],
  [77, 1], [76, 1], [76, 1], [76, 0.5], [76, 0.5],
  [76, 1], [74, 1], [74, 1], [76, 1],
  [74, 2], [79, 2],
];

const BASS_NOTES: Array<[number, number]> = [
  [48, 2], [55, 2],
  [48, 2], [55, 2],
  [48, 2], [55, 2],
  [48, 2], [52, 2],
  [53, 2], [48, 2],
  [48, 2], [52, 2],
  [50, 2], [55, 2],
  [55, 2], [43, 2],
];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class SoundController {
  private ctx: AudioContext | null = null;
  private bgmTimer: number | null = null;
  private melodyStep = 0;
  private bassStep = 0;
  private stepWait = 0;
  private bassWait = 0;
  private settings: AudioSettings = {
    sfxEnabled: true,
    bgmEnabled: true,
    ttsEnabled: true,
    ttsEngine: 'gemini',
  };

  private activeHtmlAudio: HTMLAudioElement | null = null;
  private ttsAbortController: AbortController | null = null;

  public updateSettings(next: AudioSettings): void {
    const bgmChanged = next.bgmEnabled !== this.settings.bgmEnabled;
    const ttsChanged = next.ttsEnabled !== this.settings.ttsEnabled;
    this.settings = { ...next };

    if (bgmChanged) {
      if (this.settings.bgmEnabled) {
        this.startBgm();
      } else {
        this.stopBgm();
      }
    }
    if (ttsChanged && !this.settings.ttsEnabled) {
      this.stopSpeech();
    }
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (this.settings.bgmEnabled && this.bgmTimer === null) {
      this.startBgm();
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
    slideToFreq?: number
  ): void {
    if (!this.ctx || !this.settings.sfxEnabled) return;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playFootstep(): void {
    this.playTone(170 + Math.random() * 35, 0.055, 'triangle', 0.045, 0, 110);
  }

  public playJump(): void {
    this.playTone(310, 0.17, 'sine', 0.14, 0, 620);
    this.playTone(460, 0.12, 'triangle', 0.06, 0.04, 720);
  }

  public playStar(): void {
    this.playTone(784, 0.1, 'sine', 0.12, 0);
    this.playTone(1046.5, 0.16, 'sine', 0.12, 0.065);
  }

  public playGift(): void {
    this.playTone(587.3, 0.11, 'triangle', 0.13, 0);
    this.playTone(740, 0.11, 'triangle', 0.13, 0.07);
    this.playTone(880, 0.14, 'sine', 0.14, 0.14);
    this.playTone(1174.6, 0.22, 'sine', 0.12, 0.21);
  }

  public playSnowflake(): void {
    this.playTone(987.8, 0.11, 'sine', 0.11, 0);
    this.playTone(1318.5, 0.14, 'sine', 0.11, 0.06);
  }

  public playFrostBurst(): void {
    this.playTone(880, 0.24, 'sine', 0.12, 0, 1480);
    this.playTone(1174, 0.22, 'triangle', 0.09, 0.05, 1760);
  }

  public playBump(): void {
    this.playTone(210, 0.18, 'sawtooth', 0.11, 0, 95);
    this.playTone(150, 0.2, 'square', 0.07, 0.05, 80);
  }

  public playLevelUp(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.18, 'triangle', 0.13, idx * 0.075);
    });
  }

  public playStageComplete(): void {
    const jingle = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 0.11 },
      { f: 783.99, d: 0.12, t: 0.22 },
      { f: 1046.5, d: 0.26, t: 0.34 },
      { f: 880, d: 0.14, t: 0.56 },
      { f: 1046.5, d: 0.38, t: 0.7 },
    ];
    jingle.forEach((note) => {
      this.playTone(note.f, note.d, 'triangle', 0.14, note.t);
      this.playTone(note.f * 1.5, note.d * 0.8, 'sine', 0.05, note.t);
    });
  }

  public startBgm(): void {
    if (!this.settings.bgmEnabled || this.bgmTimer !== null || !this.ctx) return;

    const tickMs = 210;
    this.bgmTimer = window.setInterval(() => {
      if (!this.ctx || !this.settings.bgmEnabled || this.ctx.state !== 'running') return;

      if (this.stepWait <= 0) {
        const [midi, beats] = MELODY_NOTES[this.melodyStep % MELODY_NOTES.length];
        this.melodyStep = (this.melodyStep + 1) % MELODY_NOTES.length;
        this.stepWait = beats * 2;
        if (midi > 0) {
          this.playBgmNote(midiToFreq(midi), (beats * tickMs * 1.7) / 1000, 'triangle', 0.032);
        }
      }
      this.stepWait -= 1;

      if (this.bassWait <= 0) {
        const [midi, beats] = BASS_NOTES[this.bassStep % BASS_NOTES.length];
        this.bassStep = (this.bassStep + 1) % BASS_NOTES.length;
        this.bassWait = beats * 2;
        if (midi > 0) {
          this.playBgmNote(midiToFreq(midi), (beats * tickMs * 1.6) / 1000, 'sine', 0.025);
        }
      }
      this.bassWait -= 1;
    }, tickMs / 2);
  }

  private playBgmNote(freq: number, duration: number, type: OscillatorType, volume: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public stopBgm(): void {
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public stopSpeech(): void {
    if (this.ttsAbortController) {
      this.ttsAbortController.abort();
      this.ttsAbortController = null;
    }
    if (this.activeHtmlAudio) {
      this.activeHtmlAudio.pause();
      this.activeHtmlAudio.src = '';
      this.activeHtmlAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public async speakStory(
    text: string,
    speaker: string,
    onStateChange?: (isSpeaking: boolean) => void
  ): Promise<void> {
    this.stopSpeech();
    if (!this.settings.ttsEnabled || !text.trim()) {
      onStateChange?.(false);
      return;
    }

    onStateChange?.(true);

    if (this.settings.ttsEngine === 'gemini') {
      const controller = new AbortController();
      this.ttsAbortController = controller;
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, speaker }),
          signal: controller.signal,
        });

        if (response.ok) {
          const data = (await response.json()) as { audioBase64?: string; mimeType?: string };
          if (data.audioBase64 && !controller.signal.aborted) {
            const mime = data.mimeType || 'audio/wav';
            const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
            this.activeHtmlAudio = audio;
            audio.onended = () => {
              this.activeHtmlAudio = null;
              onStateChange?.(false);
            };
            audio.onerror = () => {
              this.activeHtmlAudio = null;
              this.speakWithBrowser(text, onStateChange);
            };
            await audio.play();
            return;
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          onStateChange?.(false);
          return;
        }
        // Gracefully fall back to browser Web Speech API
      }
    }

    this.speakWithBrowser(text, onStateChange);
  }

  private speakWithBrowser(
    text: string,
    onStateChange?: (isSpeaking: boolean) => void
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onStateChange?.(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98;
      utterance.pitch = 1.12;
      utterance.volume = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const friendly =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            /natural|aria|jenny|samantha|google/i.test(v.name)
        ) || voices.find((v) => v.lang.startsWith('en'));
      if (friendly) {
        utterance.voice = friendly;
      }
      utterance.onend = () => onStateChange?.(false);
      utterance.onerror = () => onStateChange?.(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      onStateChange?.(false);
    }
  }
}

export const soundController = new SoundController();
