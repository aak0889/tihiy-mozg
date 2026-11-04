/* Тихий мозг — звуки, которые рождаются прямо в браузере (Web Audio).
   Никаких аудиофайлов и внешних сервисов. Звук стартует только по нажатию.
   TM.Sound.play('brown'|'pink'|'rain'|'forest', громкость 0–100), stop(name), stopAll(), setVolume(name, v),
   isOn(name), playing(), chime(громкость 0–100), sleep(минуты) / sleep(0), onChange(fn). */
(function () {
  'use strict';
  var TM = window.TM = window.TM || {};
  var ctx = null, master = null, buffers = {}, layers = {}, listeners = [], sleepTimer = null, sleepEnd = 0;

  var NAMES = { brown: 'Коричневый шум', pink: 'Розовый шум', rain: 'Дождь', forest: 'Лес' };
  /* громкость 100% — комфортный максимум, а не предел динамиков */
  var LEVEL = { brown: 0.55, pink: 0.22, rain: 0.5, forest: 0.6 };

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('no audio');
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* бесшовная петля шума: хвост плавно перетекает в начало */
  function noiseBuffer(kind) {
    if (buffers[kind]) return buffers[kind];
    var sr = ctx.sampleRate, n = sr * 8, f = Math.floor(sr * 0.5), raw = new Float32Array(n + f), i;
    if (kind === 'white') {
      for (i = 0; i < n + f; i++) raw[i] = Math.random() * 2 - 1;
    } else if (kind === 'pink') { /* фильтр Пола Келлета */
      var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (i = 0; i < n + f; i++) {
        var w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    } else { /* коричневый: накопленный белый шум */
      var last = 0;
      for (i = 0; i < n + f; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; raw[i] = last * 3.5; }
    }
    var buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    for (i = 0; i < n; i++) d[i] = raw[i];
    for (i = 0; i < f; i++) { var k = i / f; d[i] = raw[i] * k + raw[n + i] * (1 - k); }
    buffers[kind] = buf;
    return buf;
  }
  function loop(kind) { var s = ctx.createBufferSource(); s.buffer = noiseBuffer(kind); s.loop = true; s.loopEnd = s.buffer.duration; return s; }
  function filt(type, freq, q) { var b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = freq; if (q !== undefined) b.Q.value = q; return b; }
  function lfo(rate, depth, target) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(target); o.start();
    return o;
  }
  function chain(nodes) { for (var i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); }

  /* каждый звук возвращает {out: GainNode, stop: function} */
  var build = {
    brown: function (out) {
      var s = loop('brown'), hp = filt('highpass', 25), lp = filt('lowpass', 900, 0.3);
      chain([s, hp, lp, out]); s.start(ctx.currentTime, Math.random() * 7);
      return [s];
    },
    pink: function (out) {
      var s = loop('pink'), lp = filt('lowpass', 6000, 0.3), hp = filt('highpass', 40);
      chain([s, hp, lp, out]); s.start(ctx.currentTime, Math.random() * 7);
      return [s];
    },
    rain: function (out) {
      /* ровный шелест + редкие мягкие капли */
      var body = loop('pink'), hp = filt('highpass', 500), lp = filt('lowpass', 5200, 0.4), g = ctx.createGain(); g.gain.value = 0.9;
      chain([body, hp, lp, g, out]); body.start(ctx.currentTime, Math.random() * 7);
      var gust = lfo(0.06, 0.18, g.gain);
      var low = loop('brown'), lp2 = filt('lowpass', 300), g2 = ctx.createGain(); g2.gain.value = 0.35;
      chain([low, lp2, g2, out]); low.start(ctx.currentTime, Math.random() * 7);
      var dropsBus = ctx.createGain(); dropsBus.gain.value = 0.5; dropsBus.connect(out);
      var white = noiseBuffer('white'), alive = true, next = ctx.currentTime + 0.1;
      function schedule() {
        if (!alive) return;
        while (next < ctx.currentTime + 0.3) {
          var src = ctx.createBufferSource(); src.buffer = white;
          var bp = filt('bandpass', 1800 + Math.random() * 4200, 2 + Math.random() * 4);
          var eg = ctx.createGain(), a = 0.05 + Math.random() * 0.22, t = next;
          eg.gain.setValueAtTime(0, t); eg.gain.linearRampToValueAtTime(a, t + 0.004); eg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.05);
          chain([src, bp, eg, dropsBus]);
          src.start(t, Math.random() * 7, 0.12);
          next += 0.015 + Math.random() * 0.09;
        }
        timer = setTimeout(schedule, 100);
      }
      var timer = setTimeout(schedule, 0);
      return [body, low, gust, { stop: function () { alive = false; clearTimeout(timer); } }];
    },
    forest: function (out) {
      /* ветер в листве + далёкие редкие птицы */
      var wind = loop('brown'), bp = filt('bandpass', 420, 0.6), wg = ctx.createGain(); wg.gain.value = 0.7;
      chain([wind, bp, wg, out]); wind.start(ctx.currentTime, Math.random() * 7);
      var l1 = lfo(0.045, 180, bp.frequency), l2 = lfo(0.07, 0.3, wg.gain);
      var leaves = loop('pink'), hp = filt('highpass', 2600), lg = ctx.createGain(); lg.gain.value = 0.12;
      chain([leaves, hp, lg, out]); leaves.start(ctx.currentTime, Math.random() * 7);
      var l3 = lfo(0.11, 0.09, lg.gain);
      var birds = ctx.createGain(); birds.gain.value = 0.05; birds.connect(out);
      var alive = true, timer = null;
      function chirp() {
        if (!alive) return;
        var t = ctx.currentTime + 0.05, base = 2200 + Math.random() * 2200, notes = 2 + Math.floor(Math.random() * 4);
        for (var i = 0; i < notes; i++) {
          var o = ctx.createOscillator(), e = ctx.createGain(), st = t + i * (0.13 + Math.random() * 0.08), dur = 0.07 + Math.random() * 0.08;
          o.type = 'sine';
          o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.2), st);
          o.frequency.exponentialRampToValueAtTime(base * (1.15 + Math.random() * 0.3), st + dur);
          e.gain.setValueAtTime(0, st); e.gain.linearRampToValueAtTime(1, st + 0.012); e.gain.exponentialRampToValueAtTime(0.0001, st + dur);
          o.connect(e); e.connect(birds); o.start(st); o.stop(st + dur + 0.05);
        }
        timer = setTimeout(chirp, 5000 + Math.random() * 11000);
      }
      timer = setTimeout(chirp, 2500 + Math.random() * 4000);
      return [wind, leaves, l1, l2, l3, { stop: function () { alive = false; clearTimeout(timer); } }];
    }
  };

  function gainFor(name, v) { return Math.pow(Math.max(0, Math.min(100, v)) / 100, 1.6) * LEVEL[name]; }
  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }

  var S = TM.Sound = {
    names: NAMES,
    supported: !!(window.AudioContext || window.webkitAudioContext),
    play: function (name, v) {
      if (layers[name]) { S.setVolume(name, v); return true; }
      try { ensure(); } catch (e) { return false; }
      var out = ctx.createGain(); out.gain.value = 0; out.connect(master);
      var parts = build[name](out);
      out.gain.setValueAtTime(0, ctx.currentTime);
      out.gain.linearRampToValueAtTime(gainFor(name, v), ctx.currentTime + 2.5);
      layers[name] = { out: out, parts: parts, v: v };
      emit();
      return true;
    },
    stop: function (name, fade) {
      var L = layers[name]; if (!L) return;
      delete layers[name];
      var t = ctx.currentTime, f = fade || 0.6;
      try { L.out.gain.cancelScheduledValues(t); L.out.gain.setValueAtTime(L.out.gain.value, t); L.out.gain.linearRampToValueAtTime(0, t + f); } catch (e) {}
      setTimeout(function () {
        L.parts.forEach(function (p) { try { p.stop(); } catch (e) {} });
        try { L.out.disconnect(); } catch (e) {}
      }, f * 1000 + 100);
      emit();
    },
    stopAll: function (fade) { Object.keys(layers).forEach(function (n) { S.stop(n, fade); }); S.sleep(0); },
    setVolume: function (name, v) {
      var L = layers[name]; if (!L) return;
      L.v = v; L.out.gain.cancelScheduledValues(ctx.currentTime);
      L.out.gain.setTargetAtTime(gainFor(name, v), ctx.currentTime, 0.12);
    },
    prime: function () { try { ensure(); } catch (e) {} },
    isOn: function (name) { return !!layers[name]; },
    playing: function () { return Object.keys(layers); },
    onChange: function (fn) { listeners.push(fn); },
    /* мягкий колокольчик: два тихих тона с долгим затуханием */
    chime: function (v) {
      try { ensure(); } catch (e) { return; }
      var vol = (v === undefined ? 40 : v) / 100 * 0.25, t = ctx.currentTime + 0.05;
      [[660, 0], [990, 0], [880, 0.45], [1320, 0.45]].forEach(function (p, i) {
        var o = ctx.createOscillator(), g = ctx.createGain(), st = t + p[1], a = vol * (i % 2 ? 0.35 : 1);
        o.type = 'sine'; o.frequency.value = p[0];
        g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(a, st + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, st + 2.8);
        o.connect(g); g.connect(ctx.destination); o.start(st); o.stop(st + 3);
      });
    },
    /* таймер выключения: последние 30 секунд звук плавно затихает */
    sleep: function (min) {
      clearTimeout(sleepTimer); sleepTimer = null; sleepEnd = 0;
      if (master && ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(1, ctx.currentTime); }
      if (min > 0) {
        sleepEnd = Date.now() + min * 60000;
        var fadeAt = Math.max(0, min * 60000 - 30000);
        sleepTimer = setTimeout(function () {
          if (master && ctx) { master.gain.setValueAtTime(1, ctx.currentTime); master.gain.linearRampToValueAtTime(0, ctx.currentTime + 30); }
          sleepTimer = setTimeout(function () {
            sleepEnd = 0;
            Object.keys(layers).forEach(function (n) { S.stop(n, 0.1); });
            setTimeout(function () { if (master && ctx) master.gain.setValueAtTime(1, ctx.currentTime); }, 400);
          }, Math.min(30000, min * 60000));
        }, fadeAt);
      }
      emit();
    },
    sleepLeft: function () { return sleepEnd ? Math.max(0, sleepEnd - Date.now()) : 0; }
  };

  /* общая плашка «звук играет — остановить», если она есть на странице */
  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.getElementById('soundbar');
    if (!bar) return;
    var label = bar.querySelector('span'), btn = bar.querySelector('button');
    btn.addEventListener('click', function () { S.stopAll(); });
    S.onChange(function () {
      var on = S.playing();
      bar.hidden = !on.length;
      label.textContent = on.map(function (n) { return NAMES[n]; }).join(' + ');
    });
  });
})();
