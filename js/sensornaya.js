/* «Сенсорная комната»: четыре состояния — шумно, свет, тело, всё разом.
   Звук только по нажатию, громкость по умолчанию 15%. В браузере ничего не хранится. */
(function () {
  'use strict';
  var S = TM.Sound;
  var dim = document.getElementById('dimmer'), textonly = document.getElementById('textonly');
  var MOVES = [
    ['Потянись вверх, как получится', 20],
    ['Сожми кулаки и разожми. Десять раз, не спеша', 20],
    ['Медленно покачай головой: вправо, влево', 15],
    ['Перенеси вес с ноги на ногу', 20],
    ['Если можешь, встань', 30],
    ['Надави ладонями друг на друга и отпусти. Пять раз', 15],
    ['Опусти плечи. Можно ничего больше не делать', 20]
  ];
  var CALM = ['Сейчас можно ничего не делать.', 'Ты в безопасности. Можно просто посидеть.', 'Всё остальное подождёт.'];

  var dimOn = false;
  function setDim(on) {
    if (!dim) return;
    dimOn = on;
    if (on) { dim.hidden = false; void dim.offsetWidth; dim.classList.add('is-on'); }
    else { dim.classList.remove('is-on'); setTimeout(function () { if (!dimOn) dim.hidden = true; }, TM.isQuiet() ? 0 : 3000); }
    Array.prototype.forEach.call(document.querySelectorAll('[data-a="dim"]'), function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? 'Вернуть яркость' : 'Приглушить экран';
    });
  }
  var isDim = function () { return dimOn; };

  if (textonly) {
    var tBack = textonly.querySelector('button'), lastFocus = null;
    tBack.addEventListener('click', function () { textonly.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); });
    textonly.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); if (e.key === 'Escape') tBack.click(); } });
  }
  function showTextOnly(from) {
    lastFocus = from;
    textonly.querySelector('p').textContent = CALM[Math.floor(Math.random() * CALM.length)];
    textonly.hidden = false; document.body.style.overflow = 'hidden'; textonly.querySelector('button').focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-sensory]'), function (root) {
    var modes = root.querySelectorAll('[data-mode]'), panels = root.querySelectorAll('[data-panel]');
    var vol = root.querySelector('[data-a="vol"]'), volOut = root.querySelector('[data-a="volout"]');
    var note = root.querySelector('[data-a="note"]');

    function open(m, focus) {
      Array.prototype.forEach.call(modes, function (b) { b.setAttribute('aria-pressed', b.dataset.mode === m ? 'true' : 'false'); });
      Array.prototype.forEach.call(panels, function (p) { p.hidden = p.dataset.panel !== m; });
      var p = root.querySelector('[data-panel="' + m + '"]');
      if (focus && p) { var h = p.querySelector('h2, h3'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
    }
    Array.prototype.forEach.call(modes, function (b) {
      b.addEventListener('click', function () {
        var m = b.dataset.mode;
        if (m === 'all') {
          setDim(true);
          if (!S.isOn('brown')) S.play('brown', 10);
        }
        open(m, true);
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-goto]'), function (b) {
      b.addEventListener('click', function () { open(b.dataset.goto, true); root.scrollIntoView({ block: 'start', behavior: TM.isQuiet() ? 'auto' : 'smooth' }); });
    });

    /* звук */
    function v() { return vol ? +vol.value : 15; }
    if (vol) vol.addEventListener('input', function () { volOut.textContent = vol.value + '%'; S.playing().forEach(function (n) { S.setVolume(n, v()); }); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-snd]'), function (b) {
      b.addEventListener('click', function () {
        var n = b.dataset.snd;
        if (S.isOn(n)) S.stop(n);
        else if (!S.play(n, v()) && note) note.textContent = 'Звук не запустился. Советы ниже работают и без него.';
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-a="stop"]'), function (b) { b.addEventListener('click', function () { S.stopAll(); }); });
    S.onChange(function () {
      Array.prototype.forEach.call(root.querySelectorAll('[data-snd]'), function (b) {
        var on = S.isOn(b.dataset.snd);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.classList.toggle('btn--solid', on);
      });
    });

    /* свет */
    Array.prototype.forEach.call(root.querySelectorAll('[data-a="dim"]'), function (b) { b.addEventListener('click', function () { setDim(!isDim()); }); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-a="textonly"]'), function (b) { b.addEventListener('click', function () { showTextOnly(b); }); });

    /* тело */
    var mText = root.querySelector('[data-a="move"]'), mTime = root.querySelector('[data-a="movetime"]'), mBtn = root.querySelector('[data-a="next"]');
    var mi = -1, mEnd = 0, mTick = null;
    function moveTick() {
      var left = mEnd - Date.now();
      if (left <= 0) { clearInterval(mTick); mTime.textContent = 'Готово. Можно дальше или посидеть так.'; return; }
      mTime.textContent = 'ещё ' + Math.ceil(left / 1000) + ' с';
    }
    if (mBtn) mBtn.addEventListener('click', function () {
      mi++;
      if (mi >= MOVES.length) {
        clearInterval(mTick); mi = -1;
        mText.textContent = 'Круг закончился. Можно повторить или просто посидеть.';
        mTime.textContent = ''; mBtn.textContent = 'Начать заново'; return;
      }
      mText.textContent = MOVES[mi][0];
      mEnd = Date.now() + MOVES[mi][1] * 1000; clearInterval(mTick); mTick = setInterval(moveTick, 250); moveTick();
      mBtn.textContent = 'Дальше';
    });
  });
})();
