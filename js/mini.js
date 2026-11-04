/* Маленькие инструменты для статей:
   [data-razgon] — «Разгон», 2 минуты рядом с задачей;
   [data-nudge]  — мягкое напоминание при гиперфокусе: подвигаться, попить, посмотреть в окно.
   Ничего не хранится, кроме выбранного интервала напоминаний (tm-nudge). */
(function () {
  'use strict';

  Array.prototype.forEach.call(document.querySelectorAll('[data-razgon]'), function (root) {
    var q = function (n) { return root.querySelector('[data-r="' + n + '"]'); };
    var btn = q('go'), time = q('time'), bar = q('bar'), text = q('text'), after = q('after');
    var DUR = 120000, end = 0, tick = null;
    function draw(left) {
      time.textContent = TM.fmt(left);
      bar.style.width = ((1 - left / DUR) * 100) + '%';
    }
    function stop(done) {
      clearInterval(tick); tick = null;
      btn.textContent = done ? 'Ещё 2 минуты' : 'Разгон: 2 минуты';
      if (done) { text.textContent = 'Две минуты прошли. Хочешь — продолжай. Хочешь — остановись, это тоже честно.'; after.hidden = false; }
      else { text.textContent = 'Не обязательно работать. Просто будь рядом с задачей.'; draw(DUR); }
    }
    btn.addEventListener('click', function () {
      if (tick) { stop(false); return; }
      after.hidden = true;
      end = Date.now() + DUR; btn.textContent = 'Остановить';
      text.textContent = 'Не обязательно работать. Просто будь рядом с задачей.';
      tick = setInterval(function () {
        var left = end - Date.now();
        if (left <= 0) { draw(0); stop(true); return; }
        draw(left);
      }, 250);
      draw(DUR);
    });
    draw(DUR);
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-nudge]'), function (root) {
    var q = function (n) { return root.querySelector('[data-n="' + n + '"]'); };
    var segs = root.querySelectorAll('[data-min]'), btn = q('go'), status = q('status'), box = q('box'), chime = q('chime');
    var NUDGES = ['Подвигайся немного: встань, потянись.', 'Попей воды.', 'Посмотри в окно или вдаль на 20 секунд.', 'Проверь: ты ел сегодня?', 'Опусти плечи и выдохни.'];
    var min = TM.get('tm-nudge', 30), timer = null, next = 0, k = 0, baseTitle = document.title, flash = null;
    function sync() { Array.prototype.forEach.call(segs, function (b) { b.setAttribute('aria-pressed', +b.dataset.min === min ? 'true' : 'false'); }); }
    function showStatus() {
      status.textContent = timer ? 'Напомню через ' + Math.max(1, Math.ceil((next - Date.now()) / 60000)) + ' мин. Вкладку нужно оставить открытой.' : '';
    }
    function fire() {
      box.textContent = NUDGES[k++ % NUDGES.length]; box.hidden = false;
      if (chime.checked && TM.Sound) TM.Sound.chime(30);
      document.title = '• Пора выдохнуть · Тихий мозг';
      clearTimeout(flash); flash = setTimeout(function () { document.title = baseTitle; }, 60000);
      next = Date.now() + min * 60000;
    }
    function start() {
      clearInterval(timer);
      next = Date.now() + min * 60000;
      timer = setInterval(function () { if (Date.now() >= next) fire(); showStatus(); }, 5000);
      btn.textContent = 'Выключить напоминания'; btn.setAttribute('aria-pressed', 'true'); showStatus();
    }
    function stop() {
      clearInterval(timer); timer = null; box.hidden = true; document.title = baseTitle;
      btn.textContent = 'Включить напоминания'; btn.setAttribute('aria-pressed', 'false'); showStatus();
    }
    Array.prototype.forEach.call(segs, function (b) {
      b.addEventListener('click', function () { min = +b.dataset.min; TM.set('tm-nudge', min); sync(); if (timer) start(); });
    });
    btn.addEventListener('click', function () {
      if (timer) stop(); else { if (chime.checked && TM.Sound) TM.Sound.prime(); start(); }
    });
    box.addEventListener('click', function () { box.hidden = true; document.title = baseTitle; });
    sync();
  });
})();
