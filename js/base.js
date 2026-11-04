/* Тихий мозг — общее для внутренних страниц: тема, «без движения», хранение в браузере.
   Ничего не отправляется на сервер. Всё лежит в localStorage этого браузера. */
(function () {
  'use strict';
  var root = document.documentElement;
  var TM = window.TM = window.TM || {};

  /* ---------- хранение ---------- */
  TM.get = function (k, fallback) {
    try { var v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  };
  /* возвращает true, если сохранилось; false — если места нет или хранилище недоступно */
  TM.set = function (k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  };
  TM.del = function (k) { try { localStorage.removeItem(k); } catch (e) {} };
  TM.isQuiet = function () {
    return root.getAttribute('data-quiet') === 'on' ||
      (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  TM.today = function () {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  TM.debounce = function (fn, ms) {
    var t = null;
    return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); };
  };
  TM.fmt = function (ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
  };
  TM.plural = function (n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };

  /* Подтверждение стирания прямо в строке, без всплывающих окон.
     box — элемент .confirm с кнопками [data-yes] и [data-no]. */
  TM.confirm = function (box, onYes, focusBack) {
    var yes = box.querySelector('[data-yes]'), no = box.querySelector('[data-no]');
    box.hidden = false; no.focus();
    function done(ok) {
      box.hidden = true; yes.onclick = no.onclick = null;
      if (ok) onYes();
      if (focusBack) focusBack.focus();
    }
    yes.onclick = function () { done(true); };
    no.onclick = function () { done(false); };
  };

  /* ---------- «без движения» ---------- */
  var quietBtn = document.getElementById('quietBtn');
  if (quietBtn) {
    var syncQuiet = function () { quietBtn.setAttribute('aria-pressed', TM.isQuiet() ? 'true' : 'false'); };
    syncQuiet();
    quietBtn.addEventListener('click', function () {
      var q = root.getAttribute('data-quiet') === 'on' ? 'off' : 'on';
      root.setAttribute('data-quiet', q);
      try { localStorage.setItem('tm-quiet', q); } catch (e) {}
      syncQuiet();
      document.dispatchEvent(new CustomEvent('tm:quiet'));
    });
  }

  /* ---------- тема ---------- */
  var themeBtn = document.getElementById('themeBtn');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeBtn) {
    var syncTheme = function () {
      var dark = root.getAttribute('data-theme') !== 'light';
      themeBtn.setAttribute('aria-label', dark ? 'Светлая тема' : 'Тёмная тема');
      if (themeMeta) themeMeta.setAttribute('content', dark ? '#1D2621' : '#ECE5D9');
    };
    syncTheme();
    themeBtn.addEventListener('click', function () {
      var t = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', t);
      try { localStorage.setItem('tm-theme', t); } catch (e) {}
      syncTheme();
    });
  }
})();
