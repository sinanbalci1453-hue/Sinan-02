/**
 * Web Audio API synthesizer for cinematic background music and ambient sound design
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: { stop: () => void }[] = [];
  private isPlaying = false;
  private currentMusicType: string | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getContext(): AudioContext {
    return this.initContext();
  }

  public stopAllMusic() {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // ignore
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentMusicType = null;
  }

  public playAmbientMusic(type: string, volume: number = 0.3) {
    this.stopAllMusic();
    if (type === 'sessiz') return;

    const ctx = this.initContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;
    this.isPlaying = true;
    this.currentMusicType = type;

    if (type === 'sinematik') {
      // Cinematic warm minor chord drone with lush low-pass filter
      const freqs = [130.81, 155.56, 196.0, 261.63]; // C minor 9 drone
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450 + idx * 80, now);

        // subtle LFO for cinematic breathing
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.2 + idx * 0.05, now);
        lfoGain.gain.setValueAtTime(150, now);
        lfo.connect(filter.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start();
        this.activeNodes.push({
          stop: () => {
            gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            setTimeout(() => {
              osc.stop();
              lfo.stop();
            }, 600);
          },
        });
      });
    } else if (type === 'futuristik') {
      // Cyberpunk pulsating synth bass & arpeggio
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65.41, now); // C2

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);

      const pulseLfo = ctx.createOscillator();
      const pulseGain = ctx.createGain();
      pulseLfo.type = 'square';
      pulseLfo.frequency.setValueAtTime(4, now); // 120 bpm 16th notes
      pulseGain.gain.setValueAtTime(0.08, now);

      pulseLfo.connect(gain.gain);
      gain.gain.setValueAtTime(0.15, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start();
      pulseLfo.start();

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
            pulseLfo.stop();
          } catch {}
        },
      });
    } else if (type === 'doga_sakin') {
      // Gentle ocean waves & organic pink noise
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.11;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.15, now); // slow wave surge
      lfoGain.gain.setValueAtTime(300, now);
      lfo.connect(filter.frequency);
      lfo.start();

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      whiteNoise.start();

      this.activeNodes.push({
        stop: () => {
          try {
            whiteNoise.stop();
            lfo.stop();
          } catch {}
        },
      });
    } else {
      // Felsefi derin drone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      gain.gain.setValueAtTime(0.18, now);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {}
        },
      });
    }
  }

  public speakVoiceover(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    voiceStyle: 'kadin' | 'erkek' | 'spiker' = 'kadin'
  ) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';

    if (voiceStyle === 'erkek') {
      utterance.pitch = 0.85;
      utterance.rate = 0.95;
    } else if (voiceStyle === 'spiker') {
      utterance.pitch = 1.05;
      utterance.rate = 1.1;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    const voices = window.speechSynthesis.getVoices();
    const trVoices = voices.filter((v) => v.lang.startsWith('tr'));
    if (trVoices.length > 0) {
      if (voiceStyle === 'erkek' && trVoices.length > 1) {
        utterance.voice = trVoices[1];
      } else {
        utterance.voice = trVoices[0];
      }
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  public stopVoiceover() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public playPopSound(freq: number = 600) {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.07);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  public playSuccessChime() {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {}
  }

  public triggerHaptic(duration: number = 20) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(duration);
      }
    } catch {}
  }
}

export const audioEngine = new AudioEngine();
