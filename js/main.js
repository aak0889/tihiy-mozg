/* Тихий мозг — поведение страницы. Без библиотек и сторонних сервисов.
   В localStorage хранятся только настройки: тема, «без движения», громкость. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function isQuiet() {
    return root.getAttribute('data-quiet') === 'on' ||
      (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------- волна-знак: колебание у начала, дальше прямая ---------- */
  function wavePath(w, h, amp, phase) {
    var mid = h / 2, n = 200, d = '';
    var a = Math.max(w * 0.05, 26), period = Math.max(w * 0.08, 44);
    for (var i = 0; i <= n; i++) {
      var x = (w * i) / n;
      var env = (x / a) * Math.exp(1 - x / a);
      var y = mid - amp * env * Math.sin((2 * Math.PI * x) / period + phase);
      d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d;
  }
  var heroPath = document.querySelector('#heroWave path');
  function drawHero(amp, phase) {
    if (!heroPath) return;
    var s = heroPath.ownerSVGElement, w = Math.round(s.getBoundingClientRect().width) || 560;
    s.setAttribute('viewBox', '0 0 ' + w + ' 90');
    heroPath.setAttribute('d', wavePath(w, 90, amp, phase));
  }
  drawHero(34, 0.6);
  if (heroPath && !isQuiet()) {
    var t0 = null;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / 2600), e = 1 - Math.pow(1 - p, 3);
      drawHero(34 + 16 * (1 - e), 0.6 + 1.2 * (1 - e));
      if (p < 1 && !isQuiet()) requestAnimationFrame(step); else drawHero(34, 0.6);
    };
    requestAnimationFrame(step);
  }
  window.addEventListener('resize', function () { drawHero(34, 0.6); });

  /* ---------- «без движения» ---------- */
  var quietBtn = $('quietBtn');
  function syncQuiet() { quietBtn.setAttribute('aria-pressed', isQuiet() ? 'true' : 'false'); }
  syncQuiet();
  quietBtn.addEventListener('click', function () {
    var q = root.getAttribute('data-quiet') === 'on' ? 'off' : 'on';
    root.setAttribute('data-quiet', q); store('tm-quiet', q); syncQuiet();
  });

  /* ---------- тема (тёмная по умолчанию) ---------- */
  var themeBtn = $('themeBtn');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncTheme() {
    var dark = root.getAttribute('data-theme') !== 'light';
    themeBtn.setAttribute('aria-label', dark ? 'Светлая тема' : 'Тёмная тема');
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#1D2621' : '#ECE5D9');
  }
  syncTheme();
  themeBtn.addEventListener('click', function () {
    var t = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', t); store('tm-theme', t); syncTheme();
  });

  /* ---------- незаполненные ссылки ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-todo]'), function (a) {
    a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); a.title = 'Ссылка появится скоро';
  });

  /* ================= СБРОС: 60 секунд ================= */
  var DURATION = 60000;
  var dlg = $('reset'), circle = $('circle'), promptEl = $('resetPrompt');
  var timeEl = $('resetTime'), fill = $('progressFill'), pdot = $('progressDot');
  var runControls = $('runControls'), endBox = $('endControls'), stepBox = $('stepBox'), stayBox = $('stayBox');
  var pauseBtn = $('resetPause'), startBtn = $('resetStart'), textBtn = $('textToggle');
  var prompts = [];
  try { prompts = JSON.parse(promptEl.getAttribute('data-prompts')) || []; } catch (e) {}
  var outside = [document.querySelector('.skip'), document.querySelector('header'), $('main'), document.querySelector('footer')];

  var state = 'idle', elapsed = 0, lastT = 0, tick = null, promptIdx = -1, showText = true;

  function setInert(on) {
    outside.forEach(function (el) { if (!el) return; if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
    document.body.style.overflow = on ? 'hidden' : '';
  }
  function show(el, on) { el.hidden = !on; }

  function render() {
    var p = Math.min(1, elapsed / DURATION);
    fill.style.width = (p * 100) + '%';
    pdot.style.left = (p * 100) + '%';
    var left = Math.ceil((DURATION - elapsed) / 1000);
    timeEl.textContent = state === 'paused' ? 'Пауза' : (left > 0 ? left + ' с' : 'Готово');
    /* подсказки: одна на каждые 15 секунд */
    if (state === 'running' || state === 'paused') {
      var i = Math.min(prompts.length - 1, Math.floor(elapsed / 15000));
      if (i !== promptIdx) { promptIdx = i; promptEl.textContent = prompts[i] || ''; }
    }
  }
  function loop() {
    var now = performance.now();
    if (state === 'running') { elapsed += now - lastT; }
    lastT = now;
    if (elapsed >= DURATION && state === 'running') { finish(); return; }
    render();
  }
  function startTick() { stopTick(); lastT = performance.now(); tick = setInterval(loop, 250); }
  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }

  function breathe(on) {
    circle.classList.toggle('is-breathing', on);
    circle.classList.remove('is-paused');
  }

  function begin() {
    state = 'running'; elapsed = 0; promptIdx = -1;
    show(runControls, true); show(endBox, false); show(textBtn, true); show(stepBox, false); show(stayBox, false);
    show(timeEl, true); show(document.querySelector('.progress'), true);
    pauseBtn.textContent = 'Пауза';
    /* перезапуск анимации круга с начала */
    circle.classList.remove('is-breathing', 'is-still'); void circle.offsetWidth; breathe(true);
    render(); startTick();
  }
  function open() {
    dlg.hidden = false; setInert(true); begin();
    pauseBtn.focus();
  }
  function close() {
    stopTick(); state = 'idle'; breathe(false); circle.classList.remove('is-still'); soundStop(); soundHint.textContent = HINT;
    dlg.hidden = true; setInert(false); startBtn.focus();
  }
  function togglePause() {
    if (state === 'running') {
      state = 'paused'; circle.classList.add('is-paused'); pauseBtn.textContent = 'Продолжить';
      timeEl.textContent = 'Пауза';
    } else if (state === 'paused') {
      state = 'running'; lastT = performance.now(); circle.classList.remove('is-paused'); pauseBtn.textContent = 'Пауза';
    }
  }
  function finish() {
    stopTick(); elapsed = DURATION; state = 'done'; render(); show(timeEl, false);
    circle.classList.add('is-paused');
    promptEl.textContent = '';
    show(runControls, false); show(endBox, true); show(textBtn, false);
    $('resetDone').focus();
  }
  function stay() {
    state = 'stay'; show(endBox, false); show(stayBox, true); circle.classList.remove('is-still');
    show(timeEl, false); show(document.querySelector('.progress'), false);
    circle.classList.remove('is-paused');
    $('stayTitle').focus();
  }
  function oneStep() {
    state = 'step'; show(endBox, false); show(stepBox, true); circle.classList.remove('is-breathing', 'is-paused'); circle.classList.add('is-still');
    $('stepTitle').focus();
  }

  startBtn.addEventListener('click', open);
  pauseBtn.addEventListener('click', togglePause);
  $('resetSkip').addEventListener('click', finish);
  $('resetStop').addEventListener('click', close);
  $('resetAgain').addEventListener('click', function () { begin(); pauseBtn.focus(); });
  $('resetStay').addEventListener('click', stay);
  $('resetStep').addEventListener('click', oneStep);
  ['resetExit', 'stepExit', 'stayExit'].forEach(function (id) { $(id).addEventListener('click', close); });

  textBtn.addEventListener('click', function () {
    showText = !showText;
    textBtn.textContent = showText ? 'Скрыть подсказки' : 'Показать подсказки';
    promptEl.classList.toggle('is-off', !showText);
  });

  /* клавиатура: Esc — остановить, Tab не выходит за пределы окна паузы */
  document.addEventListener('keydown', function (e) {
    if (dlg.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      var f = Array.prototype.filter.call(dlg.querySelectorAll('button, input, [tabindex="0"]'), function (el) { return el.offsetParent !== null && !el.disabled; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  /* вкладка в фоне: сверяемся с часами, чтобы время не «уплывало» */
  document.addEventListener('visibilitychange', function () { if (!document.hidden && tick) loop(); });

  /* ================= мягкий фон: генеративный шум (Web Audio) ================= */
  var ctx = null, src = null, gain = null;
  var volEl = $('soundVol'), soundOnBtn = $('soundOn'), soundCtrl = $('soundCtrl'), soundHint = $('soundHint');
  var HINT = soundHint.textContent;
  var savedVol = parseInt(store('tm-volume'), 10);
  if (!isNaN(savedVol)) volEl.value = Math.max(0, Math.min(100, savedVol));
  function volume() { return (volEl.value / 100) * 0.35; }   /* 100% = комфортный максимум */
  function soundStart() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      var len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      var lp1 = ctx.createBiquadFilter(); lp1.type = 'lowpass'; lp1.frequency.value = 420; lp1.Q.value = 0.4;
      var lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 900; lp2.Q.value = 0.3;
      gain = ctx.createGain(); gain.gain.value = 0;
      src.connect(lp1); lp1.connect(lp2); lp2.connect(gain); gain.connect(ctx.destination);
      src.start();
      gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(volume(), ctx.currentTime + 3);
      show(soundOnBtn, false); show(soundCtrl, true); soundHint.textContent = HINT;
      $('soundOff').focus();
    } catch (e) {
      soundHint.textContent = 'Звук не запустился. Пауза работает и без него.';
    }
  }
  function soundStop() {
    if (src && ctx) {
      var s = src, g = gain;
      try { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setTargetAtTime(0, ctx.currentTime, 0.15); s.stop(ctx.currentTime + 0.8); } catch (e) {}
    }
    src = null; gain = null;
    show(soundCtrl, false); show(soundOnBtn, true);
  }
  soundOnBtn.addEventListener('click', soundStart);
  $('soundOff').addEventListener('click', function () { soundStop(); soundOnBtn.focus(); });
  volEl.addEventListener('input', function () {
    store('tm-volume', volEl.value);
    if (gain && ctx) gain.gain.setTargetAtTime(volume(), ctx.currentTime, 0.1);
  });
})();
