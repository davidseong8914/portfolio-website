// ============================================================
// AUDIO MANAGER — synthesized sounds via Web Audio API
// All sounds generated programmatically; no audio files needed.
// AudioContext is lazy-initialized on first user interaction.
// ============================================================

class AudioManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._muted = false;
    this._volume = 0.5;
    this._initialized = false;
  }

  // Call on first user gesture (keydown/touchstart)
  init() {
    if (this._initialized) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = this._volume;
      this._masterGain.connect(this._ctx.destination);
      this._initialized = true;
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._masterGain) this._masterGain.gain.value = this._muted ? 0 : this._volume;
  }

  mute() {
    this._muted = true;
    if (this._masterGain) this._masterGain.gain.value = 0;
  }

  unmute() {
    this._muted = false;
    if (this._masterGain) this._masterGain.gain.value = this._volume;
  }

  play(eventType) {
    if (!this._initialized || !this._ctx || this._muted) return;
    if (this._ctx.state === 'suspended') this._ctx.resume();

    switch (eventType) {
      case 'piece_locked':    this._playLock(); break;
      case 'rotate':          this._playRotate(); break;
      case 'move':            this._playMove(); break;
      case 'single':          this._playLineClear(1); break;
      case 'double':          this._playLineClear(2); break;
      case 'triple':          this._playLineClear(3); break;
      case 'yc_blocks':       this._playTetris(); break;
      case 'tspin_single':    this._playTSpin(1); break;
      case 'tspin_double':    this._playTSpin(2); break;
      case 'tspin_triple':    this._playTSpin(3); break;
      case 'tspin_zero':      this._playTSpin(0); break;
      case 'tspin_mini_single':
      case 'tspin_mini_double':
      case 'tspin_mini_zero': this._playTSpinMini(); break;
      case 'combo':           this._playCombo(); break;
      case 'levelup':         this._playLevelUp(); break;
      case 'gameover':        this._playGameOver(); break;
      case 'hold':            this._playHold(); break;
    }
  }

  // ── Sound synthesis helpers ───────────────────────────────

  _now() { return this._ctx.currentTime; }

  _osc(type, freq, startTime, duration, gainVal, fadeOut) {
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(gainVal, startTime);
    if (fadeOut) {
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    }
    osc.connect(gain);
    gain.connect(this._masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
    return { osc, gain };
  }

  _noise(duration, gainVal) {
    const bufferSize = this._ctx.sampleRate * duration;
    const buffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this._ctx.createBufferSource();
    const gain = this._ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(gainVal, this._now());
    gain.gain.exponentialRampToValueAtTime(0.001, this._now() + duration);
    source.connect(gain);
    gain.connect(this._masterGain);
    source.start(this._now());
    return source;
  }

  // ── Individual sounds ─────────────────────────────────────

  _playLock() {
    // Percussive thud
    const t = this._now();
    this._osc('sine', 120, t, 0.12, 0.4, true);
    this._osc('triangle', 60, t, 0.08, 0.3, true);
  }

  _playRotate() {
    const t = this._now();
    this._osc('sine', 440, t, 0.06, 0.15, true);
  }

  _playMove() {
    // Very subtle tick — nearly silent
    const t = this._now();
    this._osc('sine', 300, t, 0.03, 0.05, true);
  }

  _playHold() {
    const t = this._now();
    this._osc('sine', 330, t, 0.05, 0.2, true);
    this._osc('sine', 440, t + 0.04, 0.05, 0.15, true);
  }

  _playLineClear(lines) {
    // Ascending tones: 1 tone per line cleared
    const baseFreqs = [880, 1100, 1320];
    const t = this._now();
    for (let i = 0; i < lines; i++) {
      this._osc('sine', baseFreqs[Math.min(i, baseFreqs.length - 1)], t + i * 0.07, 0.15, 0.35, true);
    }
  }

  _playTetris() {
    // 4 ascending tones + sustained chord
    const freqs = [880, 1108, 1318, 1760];
    const t = this._now();
    for (let i = 0; i < 4; i++) {
      this._osc('sine', freqs[i], t + i * 0.06, 0.25, 0.4, true);
    }
    // Sustain chord
    for (const f of [880, 1108]) {
      this._osc('triangle', f, t + 0.3, 0.4, 0.15, true);
    }
  }

  _playTSpin(lines) {
    // Sawtooth "whomp" with frequency sweep
    const t = this._now();
    const osc = this._ctx.createOscillator();
    const filter = this._ctx.createBiquadFilter();
    const gain = this._ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.25);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this._masterGain);
    osc.start(t);
    osc.stop(t + 0.35);

    if (lines > 0) {
      setTimeout(() => this._playLineClear(lines), 80);
    }
  }

  _playTSpinMini() {
    const t = this._now();
    this._osc('triangle', 660, t, 0.1, 0.25, true);
    this._osc('triangle', 880, t + 0.06, 0.1, 0.2, true);
  }

  _playCombo() {
    // Quick upward blip — could pitch-shift with combo count externally
    const t = this._now();
    this._osc('sine', 660, t, 0.08, 0.25, true);
    this._osc('sine', 880, t + 0.05, 0.07, 0.2, true);
  }

  _playLevelUp() {
    // Ascending arpeggio
    const freqs = [523, 659, 784, 1047];
    const t = this._now();
    for (let i = 0; i < freqs.length; i++) {
      this._osc('triangle', freqs[i], t + i * 0.08, 0.18, 0.35, true);
    }
  }

  _playGameOver() {
    // Descending slow chord
    const freqs = [494, 370, 294, 220];
    const t = this._now();
    for (let i = 0; i < freqs.length; i++) {
      this._osc('triangle', freqs[i], t + i * 0.18, 0.5, 0.3, true);
    }
    // Low rumble at end
    this._osc('sine', 60, t + 0.7, 0.8, 0.2, true);
  }
}
