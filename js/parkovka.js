/* «Парковка мыслей»: выгрузить из головы всё, что крутится, и оставить в надёжном месте.
   Текст никуда не отправляется. В браузере: tm-parking (мысли) и tm-parking-draft (черновик). */
(function () {
  'use strict';
  var KEY = 'tm-parking', DRAFT = 'tm-parking-draft';
  var COLS = { 'do': 'Сделать', think: 'Подумать', go: 'Отпустить' };
  var PH = [
    'Всё, что крутится в голове. В любом порядке.',
    'Например: ответить Вере, купить батарейки, не забыть про…',
    'Пиши как думается: кусками, списком, строчками.'
  ];
  var FULL = 'Здесь не помещается больше. Попробуй выгрузить и стереть.';

  Array.prototype.forEach.call(document.querySelectorAll('[data-park]'), function (root) {
    var q = function (n) { return root.querySelector('[data-p="' + n + '"]'); };
    var text = q('text'), saved = q('saved'), msg = q('msg'), list = q('list'), actions = q('actions'), cols = q('cols');
    var night = root.hasAttribute('data-night');
    var items = TM.get(KEY, []), sorting = false;
    if (!Array.isArray(items)) items = [];

    /* живой плейсхолдер */
    var phI = 0; text.placeholder = PH[0];
    setInterval(function () {
      if (document.activeElement === text || text.value) return;
      phI = (phI + 1) % PH.length; text.placeholder = PH[phI];
    }, 4500);

    /* черновик сохраняется сам */
    var d = TM.get(DRAFT, '');
    if (d) { text.value = d; saved.textContent = 'Черновик сохранён в этом браузере'; }
    text.addEventListener('input', TM.debounce(function () {
      if (!text.value.trim()) { TM.del(DRAFT); saved.textContent = ''; return; }
      saved.textContent = TM.set(DRAFT, text.value) ? 'Сохранено в этом браузере' : FULL;
    }, 500));

    function persist() { return TM.set(KEY, items); }

    function split(s) {
      var parts = s.split(/\r?\n|;/);
      if (parts.length === 1 && (s.match(/,/g) || []).length >= 2) parts = s.split(',');
      return parts.map(function (p) { return p.replace(/^\s*([-–—•*·]|\d+[.)])\s*/, '').trim(); }).filter(Boolean);
    }

    function render(fresh) {
      list.innerHTML = '';
      items.forEach(function (it, i) {
        var li = document.createElement('li'); li.className = 'park__item';
        if (!fresh || fresh.indexOf(it.id) < 0 || TM.isQuiet()) li.style.animation = 'none';
        else li.style.animationDelay = (fresh.indexOf(it.id) * 0.08) + 's';
        var p = document.createElement('p'); p.textContent = it.t; li.appendChild(p);
        if (it.col && !sorting) { var tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = COLS[it.col]; li.appendChild(tag); }
        var sort = document.createElement('div'); sort.className = 'park__sort'; sort.hidden = !sorting;
        sort.setAttribute('role', 'group'); sort.setAttribute('aria-label', 'Куда положить: ' + it.t);
        Object.keys(COLS).forEach(function (c) {
          var b = document.createElement('button'); b.type = 'button'; b.textContent = COLS[c];
          b.setAttribute('aria-pressed', it.col === c ? 'true' : 'false');
          b.addEventListener('click', function () { it.col = it.col === c ? '' : c; persist(); render(); var nb = list.children[i] && list.children[i].querySelectorAll('button')[Object.keys(COLS).indexOf(c)]; if (nb) nb.focus(); });
          sort.appendChild(b);
        });
        li.appendChild(sort);
        list.appendChild(li);
      });
      actions.hidden = !items.length;
      q('sortBtn').textContent = sorting ? 'Закончить разбор' : 'Разобрать (по желанию)';
      q('sortBtn').setAttribute('aria-pressed', sorting ? 'true' : 'false');
      cols.hidden = !sorting;
      if (sorting) {
        Object.keys(COLS).forEach(function (c) {
          var ul = cols.querySelector('[data-col="' + c + '"]'); ul.innerHTML = '';
          items.filter(function (it) { return it.col === c; }).forEach(function (it) {
            var li = document.createElement('li'); li.textContent = it.t; ul.appendChild(li);
          });
        });
      }
      var n = items.length;
      q('count').textContent = n ? 'На парковке ' + n + ' ' + TM.plural(n, 'мысль', 'мысли', 'мыслей') + '.' : '';
    }

    q('park').addEventListener('click', function () {
      var parts = split(text.value);
      if (!parts.length) { msg.textContent = 'Пока пусто. Можно написать хоть одно слово.'; text.focus(); return; }
      var stamp = Date.now(), ids = [];
      parts.forEach(function (t, k) { var id = stamp + '-' + k; ids.push(id); items.push({ id: id, t: t, col: '', d: TM.today() }); });
      if (!persist()) {
        items.splice(items.length - parts.length, parts.length);
        msg.textContent = FULL; return;
      }
      text.value = ''; TM.del(DRAFT); saved.textContent = '';
      msg.textContent = night
        ? 'Записано. До утра оно полежит здесь, в твоём браузере. Голове можно отдыхать.'
        : 'Готово. Это всё лежит здесь, в твоём браузере, и никуда не денется. Можно идти делать одно маленькое дело или просто подышать.';
      render(ids);
    });

    q('keep').addEventListener('click', function () {
      sorting = false; render();
      msg.textContent = 'Хорошо. Всё лежит здесь. Вкладку можно закрыть, мысли не пропадут.';
    });
    q('sortBtn').addEventListener('click', function () { sorting = !sorting; render(); if (sorting) msg.textContent = 'Нажимай под мыслью, куда её положить. Можно разобрать не всё.'; });

    function asText() {
      var out = 'Парковка мыслей — ' + TM.today() + '\n\n', groups = { '': 'Без разбора' };
      Object.keys(COLS).forEach(function (c) { groups[c] = COLS[c]; });
      Object.keys(groups).forEach(function (c) {
        var g = items.filter(function (it) { return (it.col || '') === c; });
        if (g.length) out += groups[c] + ':\n' + g.map(function (it) { return '— ' + it.t; }).join('\n') + '\n\n';
      });
      return out.trim() + '\n';
    }
    function eraseAll() {
      items = []; sorting = false; TM.del(KEY); TM.del(DRAFT); text.value = ''; saved.textContent = '';
      render(); msg.textContent = 'Всё стёрто из этого браузера.';
    }

    q('export').addEventListener('click', function () {
      var t = asText(), box = q('exportConfirm'), info = box.querySelector('p');
      var dl = q('download');
      try { if (dl.href) URL.revokeObjectURL(dl.href); } catch (e) {}
      dl.href = URL.createObjectURL(new Blob([t], { type: 'text/plain;charset=utf-8' }));
      dl.download = 'parkovka-' + TM.today() + '.txt';
      info.textContent = 'Копирую…';
      TM.confirm(box, eraseAll, text);
      var fail = function () { info.textContent = 'Скопировать не вышло. Можно скачать файлом. Стереть всё отсюда?'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () { info.textContent = 'Скопировано: можно вставить в заметки. Стереть всё отсюда?'; }, fail);
      } else fail();
    });
    q('erase').addEventListener('click', function () { TM.confirm(q('confirm'), eraseAll, text); });

    var sleepBtn = q('sleep');
    if (sleepBtn) sleepBtn.addEventListener('click', function () {
      var t = text.value.trim();
      if (t) q('park').click();
      q('sleepDone').hidden = false; q('sleepDone').focus();
    });

    render();
  });
})();
