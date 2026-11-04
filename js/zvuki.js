/* «Звуки»: карточки шумов, громкость у каждой, «остановить всё», таймер выключения.
   В браузере хранится только громкость: tm-sound-vol. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var S = TM.Sound, DEF = 15;
  var vols = TM.get('tm-sound-vol', {});
  var cards = document.querySelectorAll('.snd[data-sound]');
  var note = $('sndNote');

  if (!S.supported) note.textContent = 'Этот браузер не умеет создавать звук. Попробуй открыть страницу в другом.';

  Array.prototype.forEach.call(cards, function (card) {
    var name = card.dataset.sound, btn = card.querySelector('button'), range = card.querySelector('input'), out = card.querySelector('output');
    range.value = vols[name] !== undefined ? vols[name] : DEF; out.textContent = range.value + '%';
    btn.addEventListener('click', function () {
      if (S.isOn(name)) S.stop(name);
      else if (!S.play(name, +range.value)) note.textContent = 'Звук не запустился. Попробуй ещё раз или в другом браузере.';
    });
    range.addEventListener('input', function () {
      out.textContent = range.value + '%'; vols[name] = +range.value; TM.set('tm-sound-vol', vols);
      S.setVolume(name, +range.value);
    });
  });

  function sync() {
    Array.prototype.forEach.call(cards, function (card) {
      var on = S.isOn(card.dataset.sound), btn = card.querySelector('button');
      card.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = on ? 'Остановить' : 'Включить';
      btn.classList.toggle('btn--solid', !on);
    });
    $('stopAll').disabled = !S.playing().length;
    if (!S.playing().length) setSleepBtn(0);
    showLeft();
  }
  S.onChange(sync);

  /* таймер выключения */
  var sleepBtns = document.querySelectorAll('#sleepSeg button'), leftTimer = null;
  function setSleepBtn(m) {
    Array.prototype.forEach.call(sleepBtns, function (b) { b.setAttribute('aria-pressed', +b.dataset.min === m ? 'true' : 'false'); });
  }
  function showLeft() {
    var ms = S.sleepLeft();
    $('sleepLeft').textContent = ms && S.playing().length ? 'Выключится через ' + Math.max(1, Math.ceil(ms / 60000)) + ' мин.' : '';
  }
  Array.prototype.forEach.call(sleepBtns, function (b) {
    b.addEventListener('click', function () {
      var m = +b.dataset.min;
      S.sleep(m); setSleepBtn(m); showLeft();
      clearInterval(leftTimer); if (m) leftTimer = setInterval(showLeft, 15000);
    });
  });

  $('stopAll').addEventListener('click', function () { S.stopAll(); });
  $('sndErase').addEventListener('click', function () {
    TM.confirm($('sndConfirm'), function () {
      TM.del('tm-sound-vol'); vols = {};
      Array.prototype.forEach.call(cards, function (card) {
        var r = card.querySelector('input'); r.value = DEF; card.querySelector('output').textContent = DEF + '%';
        S.setVolume(card.dataset.sound, DEF);
      });
      note.textContent = 'Настройки громкости стёрты.';
    }, $('sndErase'));
  });
  sync();
})();
