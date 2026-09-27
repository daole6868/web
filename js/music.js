/* ==========================================================================
   music.js — Trình phát nhạc
   - Nhạc "tích hợp" được tạo trực tiếp bằng Web Audio API (không cần file,
     chạy offline, không lo bản quyền): lofi, ambient, piano, upbeat
   - Hỗ trợ file nhạc tải lên (lưu IndexedDB) và link nhạc (URL .mp3)
   - Có bộ phân tích tần số cho hiệu ứng visualizer / nền nhún theo nhạc
   ========================================================================== */
(function (global) {
  'use strict';

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ---------------- Engine âm thanh ---------------- */
  const Engine = {
    ctx: null, master: null, analyser: null, reverb: null, noise: null,

    ensure() {
      if (this.ctx) return this.ctx;
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain();
      this.master.gain.value = 0.5;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 3;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
      this.master.connect(comp); comp.connect(this.analyser); this.analyser.connect(ctx.destination);

      // Reverb nhân tạo
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this._impulse(2.8, 3);
      const rvGain = ctx.createGain(); rvGain.gain.value = 0.7;
      this.reverb.connect(rvGain); rvGain.connect(this.master);

      // Buffer nhiễu trắng dùng cho trống
      const len = ctx.sampleRate * 2;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return ctx;
    },

    _impulse(sec, decay) {
      const ctx = this.ctx, len = ctx.sampleRate * sec;
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const ch = buf.getChannelData(c);
        for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return buf;
    },

    /* ---- Nhạc cụ ---- */
    _out(node, bus, send) {
      node.connect(bus.dry);
      if (send) { const s = this.ctx.createGain(); s.gain.value = send; node.connect(s); s.connect(bus.wet); }
    },
    keys(bus, t, midi, dur, vel, send) {
      const ctx = this.ctx, f = mtof(midi);
      const g = ctx.createGain(), lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 2200;
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2;
      const g2 = ctx.createGain(); g2.gain.value = 0.18;
      o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vel, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      this._out(lp, bus, send == null ? 0.35 : send);
      o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    },
    pad(bus, t, notes, dur, vel) {
      const ctx = this.ctx;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vel, t + dur * 0.35);
      g.gain.linearRampToValueAtTime(vel * 0.8, t + dur * 0.7);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      lp.connect(g);
      notes.forEach(m => {
        [-8, 8].forEach(det => {
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.value = mtof(m); o.detune.value = det;
          o.connect(lp); o.start(t); o.stop(t + dur + 0.1);
        });
      });
      this._out(g, bus, 0.6);
    },
    pluck(bus, t, midi, dur, vel) {
      const ctx = this.ctx;
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(midi);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4;
      lp.frequency.setValueAtTime(4000, t); lp.frequency.exponentialRampToValueAtTime(300, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); this._out(g, bus, 0.3);
      o.start(t); o.stop(t + dur + 0.05);
    },
    bass(bus, t, midi, dur, vel) {
      const ctx = this.ctx;
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(midi);
      const s = ctx.createOscillator(); s.type = 'sine'; s.frequency.value = mtof(midi);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.02);
      g.gain.setValueAtTime(vel, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); s.connect(lp); lp.connect(g); this._out(g, bus, 0);
      o.start(t); s.start(t); o.stop(t + dur + 0.05); s.stop(t + dur + 0.05);
    },
    bell(bus, t, midi, vel) {
      const ctx = this.ctx, f = mtof(midi);
      const g = ctx.createGain();
      [1, 2.76, 5.4].forEach((r, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * r;
        const og = ctx.createGain(); og.gain.value = [1, 0.25, 0.08][i];
        o.connect(og); og.connect(g); o.start(t); o.stop(t + 3);
      });
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
      this._out(g, bus, 0.8);
    },
    kick(bus, t, vel) {
      const ctx = this.ctx;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      o.connect(g); this._out(g, bus, 0);
      o.start(t); o.stop(t + 0.4);
    },
    snare(bus, t, vel) {
      const ctx = this.ctx;
      const n = ctx.createBufferSource(); n.buffer = this.noise;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      n.connect(bp); bp.connect(g); this._out(g, bus, 0.25);
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 185;
      const og = ctx.createGain(); og.gain.setValueAtTime(vel * 0.6, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(og); this._out(og, bus, 0);
      n.start(t, Math.random()); n.stop(t + 0.2); o.start(t); o.stop(t + 0.12);
    },
    hat(bus, t, vel, open) {
      const ctx = this.ctx;
      const n = ctx.createBufferSource(); n.buffer = this.noise;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500;
      const g = ctx.createGain(); const d = open ? 0.22 : 0.045;
      g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      n.connect(hp); hp.connect(g); this._out(g, bus, 0.1);
      n.start(t, Math.random()); n.stop(t + d + 0.02);
    }
  };

  /* ---------------- Các bản nhạc tích hợp ---------------- */
  const PRESETS = {
    lofi: {
      bpm: 76, swing: 0.28,
      chords: [[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [45, 48, 52, 55]], // Dm7 G7 Cmaj7 Am7
      start(E, bus) { // tiếng rè đĩa than nhẹ
        const ctx = E.ctx, n = ctx.createBufferSource(); n.buffer = E.noise; n.loop = true;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4000;
        const g = ctx.createGain(); g.gain.value = 0.012;
        n.connect(hp); hp.connect(g); g.connect(bus.dry); n.start();
        return () => { try { n.stop(); } catch (e) { /* noop */ } };
      },
      step(E, bus, t, i, sx) {
        const s = i % 16, bar = Math.floor(i / 16) % 4, ch = this.chords[bar];
        if (s === 0 || s === 10) ch.forEach((m, k) => E.keys(bus, t + k * 0.025, m + 12, s === 0 ? sx * 14 : sx * 6, s === 0 ? 0.09 : 0.05));
        if (s === 0) E.bass(bus, t, ch[0] - 12, sx * 6, 0.32);
        if (s === 7) E.bass(bus, t, ch[0] - 5, sx * 2, 0.22);
        if (s === 10) E.bass(bus, t, ch[0] - 12, sx * 4, 0.26);
        if (s === 0 || s === 7 || s === 10) E.kick(bus, t, s === 0 ? 0.7 : 0.45);
        if (s === 4 || s === 12) E.snare(bus, t, 0.22);
        if (s % 2 === 0) E.hat(bus, t, s % 4 === 0 ? 0.05 : 0.03);
        if (s % 4 === 2 && Math.random() < 0.35) E.keys(bus, t, rand([72, 74, 77, 79, 81, 84]), sx * 4, 0.05, 0.6);
      }
    },
    ambient: {
      bpm: 60, swing: 0,
      chords: [[48, 55, 59, 62, 64], [45, 52, 55, 59, 64], [41, 48, 52, 57, 60], [43, 50, 55, 59, 62]],
      step(E, bus, t, i, sx) {
        const s = i % 32, bar = Math.floor(i / 32) % 4, ch = this.chords[bar];
        if (s === 0) { E.pad(bus, t, ch.slice(1), sx * 36, 0.035); E.bass(bus, t, ch[0] - 12, sx * 30, 0.18); }
        if (s % 4 === 0 && Math.random() < 0.4) E.bell(bus, t, rand([72, 74, 76, 79, 81, 84, 86]), 0.05);
        if (s % 8 === 6 && Math.random() < 0.3) E.bell(bus, t, rand([60, 64, 67]), 0.035);
      }
    },
    piano: {
      bpm: 88, swing: 0.1,
      chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], // Am F C G
      step(E, bus, t, i, sx) {
        const s = i % 16, bar = Math.floor(i / 16) % 4, ch = this.chords[bar];
        const arp = [ch[0], ch[1], ch[2], ch[1], ch[0] + 12, ch[2], ch[1], ch[2]];
        if (s % 2 === 0) E.keys(bus, t, arp[s / 2], sx * 5, 0.07, 0.45);
        if (s === 0 || s === 8) E.keys(bus, t, ch[0] - 12, sx * 10, 0.1, 0.4);
        if (s % 4 === 0 && Math.random() < 0.45) E.keys(bus, t, rand([72, 74, 76, 79, 81]), sx * 7, 0.06, 0.6);
      }
    },
    upbeat: {
      bpm: 116, swing: 0,
      chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
      step(E, bus, t, i, sx) {
        const s = i % 16, bar = Math.floor(i / 16) % 4, ch = this.chords[bar];
        if (s % 4 === 0) E.kick(bus, t, 0.75);
        if (s === 4 || s === 12) E.snare(bus, t, 0.2);
        if (s % 4 === 2) { E.hat(bus, t, 0.07, true); E.bass(bus, t, ch[0] - 24, sx * 1.8, 0.35); }
        else E.hat(bus, t, 0.025);
        if ([0, 3, 6, 10, 12].indexOf(s) >= 0) ch.forEach(m => E.pluck(bus, t, m + 12, sx * 1.6, 0.045));
        if (s % 2 === 1 && Math.random() < 0.25) E.pluck(bus, t, rand([76, 79, 81, 84]), sx * 1.2, 0.03);
      }
    }
  };

  // Nhạc phiêu lưu hoành tráng (hợp phong cách fantasy / RPG)
  PRESETS.epic = {
    bpm: 84, swing: 0,
    chords: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], // Dm Bb F C
    step(E, bus, t, i, sx) {
      const s = i % 16, bar = Math.floor(i / 16) % 4, ch = this.chords[bar];
      if (s === 0) { E.pad(bus, t, ch.map(m => m + 12).concat([ch[0] + 24]), sx * 17, 0.03); E.bass(bus, t, ch[0] - 12, sx * 15, 0.3); }
      if (s === 0 || s === 8) E.kick(bus, t, 0.55);
      if (bar === 3 && s >= 12) E.kick(bus, t, 0.25 + (s - 12) * 0.08);
      if (s % 2 === 0) { const arp = [0, 1, 2, 1]; E.keys(bus, t, ch[arp[(s / 2) % 4]] + 24, sx * 3, 0.035, 0.6); }
      if (s === 4 || s === 12) E.hat(bus, t, 0.03, true);
      if (s % 8 === 0 && Math.random() < 0.5) E.bell(bus, t, rand([74, 77, 79, 81, 84]), 0.04);
    }
  };
  // Synthwave đêm neon (hợp phong cách đô thị / cyber)
  PRESETS.synthwave = {
    bpm: 102, swing: 0,
    chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], // Am F C G
    step(E, bus, t, i, sx) {
      const s = i % 16, bar = Math.floor(i / 16) % 4, ch = this.chords[bar];
      if (s % 2 === 0) E.pluck(bus, t, ch[0] - 24 + (s % 4 === 2 ? 12 : 0), sx * 1.8, 0.09);
      E.pluck(bus, t, ch[[0, 1, 2, 1][s % 4]] + 12 + (s >= 8 ? 12 : 0), sx * 1.2, 0.03);
      if (s === 0 || s === 8) E.kick(bus, t, 0.7);
      if (s === 4 || s === 12) E.snare(bus, t, 0.24);
      if (s % 4 === 2) E.hat(bus, t, 0.05, true); else if (s % 2 === 1) E.hat(bus, t, 0.02);
      if (s === 0) E.pad(bus, t, ch.map(m => m + 12), sx * 16, 0.02);
    }
  };

  /* ---------------- Trình phát ---------------- */
  const Player = {
    tracks: [], index: 0, playing: false, volume: 0.5, shuffle: false,
    _listeners: {}, _synth: null, _startedAt: 0, _remote: false, _objectUrl: null,

    on(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); },
    _emit(ev, a) { (this._listeners[ev] || []).forEach(fn => fn(a)); },

    init(tracks, opts) {
      this.tracks = (tracks || []).filter(Boolean);
      opts = opts || {};
      this.volume = opts.volume != null ? opts.volume : 0.5;
      this.shuffle = !!opts.shuffle;

      // Phần tử audio cho file cục bộ (đi qua bộ phân tích) và link ngoài (phát trực tiếp)
      this.elLocal = new Audio(); this.elLocal.preload = 'auto';
      this.elRemote = new Audio(); this.elRemote.preload = 'none';
      [this.elLocal, this.elRemote].forEach(el => {
        el.addEventListener('ended', () => this.next());
        el.addEventListener('error', () => { if (this.playing && this.current() && this.current().type !== 'synth') this._emit('error', this.current()); });
      });
      document.addEventListener('visibilitychange', () => { /* lookahead tự điều chỉnh trong _tick */ });
    },

    current() { return this.tracks[this.index]; },

    async play(i) {
      if (!this.tracks.length) return;
      if (i != null) this.index = (i + this.tracks.length) % this.tracks.length;
      const ctx = Engine.ensure();
      if (ctx && ctx.state === 'suspended') { try { await ctx.resume(); } catch (e) { /* noop */ } }
      this._stopAll();
      const tr = this.current();
      this.playing = true;
      this._startedAt = Date.now();
      Engine.master && Engine.master.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.05);

      if (tr.type === 'synth') {
        this._startSynth(tr.preset);
      } else {
        let src = tr.url;
        this._remote = tr.type === 'url';
        if (tr.type === 'upload') {
          try {
            const blob = await AudioDB.get(tr.id);
            if (!blob) throw new Error('missing');
            this._objectUrl = URL.createObjectURL(blob); src = this._objectUrl;
          } catch (e) { this._emit('error', tr); this.playing = false; this._emit('state'); return; }
        }
        const el = this._remote ? this.elRemote : this.elLocal;
        if (!this._remote && !this._routed && ctx) {
          try { const node = ctx.createMediaElementSource(this.elLocal); node.connect(Engine.master); this._routed = true; } catch (e) { /* noop */ }
        }
        el.src = src;
        el.volume = this._remote ? this.volume : 1;
        try { await el.play(); } catch (e) { this._emit('error', tr); this.playing = false; }
      }
      this._emit('change', tr); this._emit('state');
    },

    pause() {
      this.playing = false;
      this._stopAll();
      this._emit('state');
    },

    toggle() { this.playing ? this.pause() : this.play(); },
    next() { this.play(this.shuffle && this.tracks.length > 1 ? this._randIndex() : this.index + 1); },
    prev() { this.play(this.index - 1); },
    _randIndex() { let r; do { r = Math.floor(Math.random() * this.tracks.length); } while (r === this.index); return r; },

    setVolume(v) {
      this.volume = Math.max(0, Math.min(1, v));
      if (Engine.ctx) Engine.master.gain.setTargetAtTime(this.volume, Engine.ctx.currentTime, 0.05);
      this.elRemote.volume = this.volume;
      this._emit('volume', this.volume);
    },

    seek(ratio) {
      const el = this._remote ? this.elRemote : this.elLocal;
      if (this.current() && this.current().type !== 'synth' && el.duration) el.currentTime = el.duration * ratio;
    },

    time() {
      const tr = this.current();
      if (!tr || !this.playing) return null;
      if (tr.type === 'synth') return { live: true, elapsed: (Date.now() - this._startedAt) / 1000 };
      const el = this._remote ? this.elRemote : this.elLocal;
      return { live: false, elapsed: el.currentTime || 0, duration: el.duration || 0 };
    },

    /* Dữ liệu tần số cho visualizer (0..255) */
    freq(arr) {
      if (this.playing && Engine.analyser && !this._remote) { Engine.analyser.getByteFrequencyData(arr); return arr; }
      const t = Date.now() / 1000;
      for (let i = 0; i < arr.length; i++) arr[i] = this.playing ? (Math.sin(t * 6 + i * 0.7) * 0.5 + 0.5) * 150 * (1 - i / arr.length) + Math.random() * 40 : 0;
      return arr;
    },
    level() {
      if (!this.playing) return 0;
      const a = this._buf || (this._buf = new Uint8Array(64));
      this.freq(a);
      let s = 0; for (let i = 1; i < 9; i++) s += a[i];
      return s / (8 * 255);
    },

    _startSynth(name) {
      const ctx = Engine.ctx; if (!ctx) return;
      const P = PRESETS[name] || PRESETS.lofi;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, ctx.currentTime);
      out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2);
      out.connect(Engine.master);
      const wet = ctx.createGain(); wet.connect(Engine.reverb);
      const bus = { dry: out, wet };
      const sx = 60 / P.bpm / 4;
      const st = { bus, out, wet, step: 0, next: ctx.currentTime + 0.1, stopExtra: P.start ? P.start(Engine, bus) : null };
      const tick = () => {
        const ahead = document.hidden ? 1.5 : 0.25; // tab ẩn: hẹn giờ trước lâu hơn để không bị ngắt
        while (st.next < ctx.currentTime + ahead) {
          const swing = (st.step % 2 === 1) ? sx * (P.swing || 0) : 0;
          P.step(Engine, bus, st.next + swing, st.step, sx);
          st.next += sx; st.step++;
        }
      };
      tick();
      st.timer = setInterval(tick, 50);
      this._synth = st;
    },

    _stopAll() {
      if (this._synth) {
        const st = this._synth, ctx = Engine.ctx;
        clearInterval(st.timer);
        st.out.gain.cancelScheduledValues(ctx.currentTime);
        st.out.gain.setValueAtTime(st.out.gain.value, ctx.currentTime);
        st.out.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        st.wet.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        setTimeout(() => { try { st.out.disconnect(); st.wet.disconnect(); } catch (e) { /* noop */ } if (st.stopExtra) st.stopExtra(); }, 3000);
        this._synth = null;
      }
      [this.elLocal, this.elRemote].forEach(el => { if (el) { el.pause(); } });
      if (this._objectUrl) { const u = this._objectUrl; setTimeout(() => URL.revokeObjectURL(u), 1000); this._objectUrl = null; }
    }
  };

  global.MusicPlayer = Player;
  global.MUSIC_PRESETS = { epic: 'Epic Adventure', synthwave: 'Neon Night', lofi: 'Lofi Chill', ambient: 'Ambient Dream', piano: 'Piano Calm', upbeat: 'Upbeat Energy' };
})(window);
