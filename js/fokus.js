/* «Фокус»: таймер 15/3, 25/5, 50/10 с паузой и пропуском, тихий звук в конце, «тихое присутствие».
   Время считается по часам, поэтому не «уплывает» в фоновой вкладке.
   В браузере хранятся: tm-focus (настройки), tm-focus-log (круги за сегодня), tm-focus-task (над чем сейчас). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var PRESETS = { '15': [15, 3], '25': [25, 5], '50': [50, 10] };
  var LINES = [
    'Я здесь. Можно просто продолжать.',
    'Отвлёкся — просто вернись. Это нормально.',
    'Не нужно делать идеально. Нужно делать понемногу.',
    'Если тяжело, можно сделать кусок поменьше.',
    'Плечи можно опустить. Задача никуда не денется.'
  ];
  var BREAK_TEXT = 'Перерыв. Можно встать, попить воды, посмотреть в окно.';
  var opts = Object.assign({ preset: '25', chime: true, presence: false, hideNums: false, bg: false, bgVol: 15 }, TM.get('tm-focus', {}));

  var ring = $('ring'), arc = $('arc'), timeEl = $('fTime'), phaseEl = $('fPhase'), line = $('fLine');
  var startBtn = $('fStart'), skipBtn = $('fSkip'), stopBtn = $('fStop'), roundsEl = $('fRounds');
  var taskEl = $('fTask'), segBtns = document.querySelectorAll('#fPreset button');
  var R = 2 * Math.PI * 47;
  arc.style.strokeDasharray = R;

  var phase = 'work', state = 'idle', endAt = 0, left = 0, total = 0, tick = null, lineIdx = 0, lineTimer = null;
  var baseTitle = document.title;

  function saveOpts() { TM.set('tm-focus', opts); }
  function mins(p) { return PRESETS[opts.preset][p === 'work' ? 0 : 1] * 60000; }

  function log() {
    var l = TM.get('tm-focus-log', null);
    return l && l.date === TM.today() ? l : { date: TM.today(), n: 0 };
  }
  function showRounds() {
    var n = log().n;
    roundsEl.textContent = n ? 'Сегодня ' + TM.plural(n, 'сделан', 'сделано', 'сделано') + ' ' + n + ' ' + TM.plural(n, 'круг', 'круга', 'кругов') + ' фокуса.' : '';
  }

  function draw() {
    var p = total ? 1 - left / total : 0;
    arc.style.strokeDashoffset = R * p; /* дуга показывает, сколько осталось */
    timeEl.textContent = TM.fmt(left);
    phaseEl.textContent = state === 'idle' ? 'Готово к старту' : (phase === 'work' ? 'Фокус' : 'Перерыв') + (state === 'paused' ? ' · пауза' : '');
    document.title = state === 'running' ? TM.fmt(left) + ' · ' + (phase === 'work' ? 'Фокус' : 'Перерыв') + ' · Тихий мозг' : baseTitle;
  }
  function loop() {
    if (state !== 'running') return;
    left = Math.max(0, endAt - Date.now());
    if (left <= 0) { phaseEnd(); return; }
    draw();
  }

  function setPhase(p) {
    phase = p; total = left = mins(p); draw();
  }
  function run() {
    state = 'running'; endAt = Date.now() + left;
    clearInterval(tick); tick = setInterval(loop, 250);
    ring.classList.remove('is-paused');
    startBtn.textContent = 'Пауза'; skipBtn.hidden = false; stopBtn.hidden = false;
    $('fPreset').setAttribute('aria-disabled', 'true');
    if (phase === 'work' && opts.presence) cycleLines(true);
    if (phase === 'break') line.textContent = BREAK_TEXT;
    if (opts.bg) bgOn();
    draw();
  }
  function pause() {
    state = 'paused'; left = Math.max(0, endAt - Date.now()); clearInterval(tick);
    ring.classList.add('is-paused'); startBtn.textContent = 'Продолжить'; draw();
  }
  function phaseEnd() {
    clearInterval(tick); left = 0; draw();
    if (opts.chime && window.TM.Sound) TM.Sound.chime(35);
    if (phase === 'work') {
      var l = log(); l.n++; TM.set('tm-focus-log', l); showRounds();
      setPhase('break'); run();
      line.textContent = BREAK_TEXT;
    } else {
      stop();
      line.textContent = 'Перерыв закончился. Можно начать новый круг или на сегодня хватит.';
    }
  }
  function stop() {
    clearInterval(tick); state = 'idle'; ring.classList.remove('is-paused');
    startBtn.textContent = 'Начать'; skipBtn.hidden = true; stopBtn.hidden = true;
    $('fPreset').removeAttribute('aria-disabled');
    cycleLines(false); line.textContent = '';
    setPhase('work');
  }

  function cycleLines(on) {
    clearInterval(lineTimer); lineTimer = null;
    if (!on) return;
    line.textContent = LINES[lineIdx % LINES.length];
    lineTimer = setInterval(function () {
      if (state !== 'running' || phase !== 'work') return;
      lineIdx++; line.textContent = LINES[lineIdx % LINES.length];
    }, 150000);
  }

  function syncOpts() {
    Array.prototype.forEach.call(segBtns, function (b) { b.setAttribute('aria-pressed', b.dataset.p === opts.preset ? 'true' : 'false'); });
    $('fChime').checked = opts.chime;
    $('fPresence').setAttribute('aria-pressed', opts.presence ? 'true' : 'false');
    $('fNums').setAttribute('aria-pressed', opts.hideNums ? 'true' : 'false');
    $('fBg').setAttribute('aria-pressed', opts.bg ? 'true' : 'false');
    $('fBgVolWrap').hidden = !opts.bg;
    $('fBgVol').value = opts.bgVol; $('fBgVolOut').textContent = opts.bgVol + '%';
    ring.classList.toggle('is-presence', opts.presence);
    ring.classList.toggle('is-hidden-nums', opts.hideNums);
  }

  function bgOn() { if (TM.Sound && !TM.Sound.play('brown', opts.bgVol)) $('fBgNote').textContent = 'Звук не запустился. Таймер работает и без него.'; }

  Array.prototype.forEach.call(segBtns, function (b) {
    b.addEventListener('click', function () {
      if (state !== 'idle') { $('fBusy').textContent = 'Длительность меняется, когда таймер остановлен.'; return; }
      $('fBusy').textContent = '';
      opts.preset = b.dataset.p; saveOpts(); syncOpts(); setPhase('work');
    });
  });
  startBtn.addEventListener('click', function () {
    if (opts.chime && TM.Sound) TM.Sound.prime();
    if (state === 'running') pause();
    else { if (state === 'idle') { setPhase('work'); line.textContent = ''; } run(); }
  });
  skipBtn.addEventListener('click', function () { if (state !== 'idle') { left = 0; endAt = Date.now(); phaseEnd(); } });
  stopBtn.addEventListener('click', function () { stop(); startBtn.focus(); });
  $('fChime').addEventListener('change', function () { opts.chime = this.checked; saveOpts(); if (opts.chime && TM.Sound) TM.Sound.chime(35); });
  $('fPresence').addEventListener('click', function () {
    opts.presence = !opts.presence; saveOpts(); syncOpts();
    if (state === 'running' && phase === 'work') cycleLines(opts.presence);
    if (!opts.presence && phase === 'work') line.textContent = '';
  });
  $('fNums').addEventListener('click', function () { opts.hideNums = !opts.hideNums; saveOpts(); syncOpts(); });
  $('fBg').addEventListener('click', function () {
    opts.bg = !opts.bg; saveOpts(); syncOpts();
    if (opts.bg) bgOn(); else if (TM.Sound) TM.Sound.stop('brown');
  });
  $('fBgVol').addEventListener('input', function () {
    opts.bgVol = +this.value; $('fBgVolOut').textContent = opts.bgVol + '%'; saveOpts();
    if (TM.Sound) TM.Sound.setVolume('brown', opts.bgVol);
  });
  if (TM.Sound) TM.Sound.onChange(function () {
    if (opts.bg && !TM.Sound.isOn('brown')) { opts.bg = false; saveOpts(); syncOpts(); }
  });

  var saveTask = TM.debounce(function () {
    var v = taskEl.value.trim();
    if (v) TM.set('tm-focus-task', v); else TM.del('tm-focus-task');
    $('fSaved').textContent = v ? 'Сохранено в этом браузере' : '';
  }, 500);
  taskEl.addEventListener('input', saveTask);
  var t = TM.get('tm-focus-task', '');
  if (t) { taskEl.value = t; $('fSaved').textContent = 'Сохранено в этом браузере'; }

  $('fErase').addEventListener('click', function () {
    TM.confirm($('fConfirm'), function () {
      ['tm-focus', 'tm-focus-log', 'tm-focus-task'].forEach(TM.del);
      taskEl.value = ''; $('fSaved').textContent = 'Всё стёрто из этого браузера.';
      opts = { preset: '25', chime: true, presence: false, hideNums: false, bg: false, bgVol: 15 };
      if (TM.Sound) TM.Sound.stop('brown');
      syncOpts(); showRounds(); if (state === 'idle') setPhase('work');
    }, $('fErase'));
  });

  document.addEventListener('visibilitychange', function () { if (!document.hidden) loop(); });

  syncOpts(); showRounds(); setPhase('work');
})();
