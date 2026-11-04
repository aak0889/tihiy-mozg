/* «Сделай шаг»: задача → три маленьких первых шага. Без ИИ и сервера, по простым шаблонам.
   Хранится только в этом браузере: ключ tm-step. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'tm-step';

  /* шаблоны: [регулярка по тексту задачи, [три шага]] — порядок важен */
  var TEMPLATES = [
    [/позвон|звонк|созвон|записаться|запись к|набрать/, [
      'Найди номер или ссылку и положи перед глазами (2 мин)',
      'Запиши 2–3 слова: что хочешь сказать или спросить (2 мин)',
      'Набери номер. Если не ответят, это тоже попытка, её можно засчитать (3 мин)']],
    [/отч[её]т|текст|стать|диплом|курсов|презентац|доклад|эссе|пост|сценари|резюме|сочинени/, [
      'Открой файл и напиши заголовок. Больше ничего (2 мин)',
      'Набросай три пункта, о чём будет текст. Обрывками тоже можно (5 мин)',
      'Раскрой первый пункт настолько плохо, насколько получится (10 мин)']],
    [/оплат|заплат|налог|квитанц|документ|заполн|анкет|справк|сч[её]т|бумаг|заявлени|госуслуг/, [
      'Найди нужную бумагу или сайт и открой (3 мин)',
      'Выпиши на листок, каких данных не хватает, если не хватает (3 мин)',
      'Заполни только первое поле или первую строку (5 мин)']],
    [/напис|ответ|письм|сообщени|мейл|e-?mail|почт/, [
      'Открой переписку или пустое письмо. Только открой (1 мин)',
      'Напиши одну фразу: зачем это письмо. Можно коряво (3 мин)',
      'Перечитай один раз и отправь или сохрани черновик (3 мин)']],
    [/убр|убор|помы|посуд|стирк|постира|пылесос|порядок|разобрать (шкаф|вещи|стол|завал)|мусор/, [
      'Возьми пакет или корзину и встань в одной точке комнаты (1 мин)',
      'Поставь таймер на 5 минут и собери только то, что лежит рядом с этой точкой (5 мин)',
      'Когда время выйдет, можно остановиться. Если хочется, ещё 5 минут (5 мин)']],
    [/куп|покупк|заказ|магазин|продукт/, [
      'Открой заметку и напиши первые три вещи, которые вспомнишь (2 мин)',
      'Проверь одно место дома: холодильник, полку или шкаф (3 мин)',
      'Положи в корзину или отметь первую позицию (3 мин)']],
    [/уч[иу]|выучи|подготов|экзамен|урок|домашк|курс|лекци|прочита|читать|конспект/, [
      'Положи учебник или открой материал на нужной странице (2 мин)',
      'Прочитай только первый абзац или первый слайд (5 мин)',
      'Запиши одну мысль, которая осталась в голове (3 мин)']],
    [/приготов|свари|пожар|испеч|ужин|обед|завтрак/, [
      'Достань одну кастрюлю, сковородку или миску (1 мин)',
      'Выложи на стол продукты для блюда. Готовить пока не обязательно (3 мин)',
      'Сделай первое действие: помой, нарежь или поставь воду (5 мин)']],
    [/спорт|трениров|зарядк|пробежк|(^|\s)бег|прогул|погуля|йог|растяжк|\sзал/, [
      'Надень одну нужную вещь: носки, кроссовки или куртку (2 мин)',
      'Сделай одно движение: потянись или дойди до двери (1 мин)',
      'Реши: ещё 5 минут или на сегодня достаточно. Оба ответа нормальные (5 мин)']],
    [/почин|ремонт|повес|собрать|переезд|разобра|коробк/, [
      'Найди и положи рядом одну нужную вещь или инструмент (3 мин)',
      'Сделай первое физическое действие: открой коробку, сними крышку (3 мин)',
      'Сфотографируй, как сейчас, чтобы потом увидеть, где остановился (1 мин)']]
  ];
  var GENERIC = [
    ['Открой или положи перед собой то, что нужно для этого дела (2 мин)',
     'Сделай самое маленькое видимое действие: одну строку, один предмет, одно нажатие (5 мин)',
     'Запиши, где остановишься, чтобы потом было легко вернуться (1 мин)'],
    ['Опиши одной фразой, как выглядит «готово» (2 мин)',
     'Побудь рядом с задачей 2 минуты. Работать не обязательно (2 мин)',
     'Выбери кусок на 10 минут и начни только его (10 мин)'],
    ['Убери со стола или с экрана одну лишнюю вещь (1 мин)',
     'Найди самую понятную часть задачи и начни с неё, даже если она не первая (5 мин)',
     'Сделай её на троечку и отметь галочкой (5 мин)']
  ];
  var NEXT = [
    'Посмотри, что уже получилось. Это настоящий прогресс (1 мин)',
    'Выбери следующий самый маленький кусок (2 мин)',
    'Сделай его 5–10 минут и остановись, если хочется (10 мин)'
  ];
  var CHEERS = ['Первый шаг сделан. Это уже начало.', 'Ещё один. Можно передохнуть или идти дальше.', ''];

  function options(task) {
    var t = (task || '').toLowerCase().replace(/ё/g, 'е'), list = [];
    TEMPLATES.forEach(function (tp) { if (tp[0].test(t) || tp[0].test(task.toLowerCase())) list.push(tp[1]); });
    return list.slice(0, 2).concat(GENERIC);
  }

  var form = $('stepForm'), taskEl = $('stepTask'), listEl = $('stepList'), out = $('stepOut');
  var cheer = $('stepCheer'), more = $('stepMore'), saved = $('stepSaved'), titleEl = $('stepTitle');
  var state = TM.get(KEY, null); /* {task, steps:[{t,done}], variant} */

  function save() {
    if (!state) { TM.del(KEY); saved.textContent = ''; return; }
    saved.textContent = TM.set(KEY, state) ? 'Сохранено в этом браузере' : 'Не получилось сохранить: в браузере нет места. Шаги видны, пока страница открыта.';
  }

  function autosize(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }

  function render(focusIdx) {
    out.hidden = !state;
    if (!state) return;
    titleEl.textContent = state.task;
    listEl.innerHTML = '';
    state.steps.forEach(function (s, i) {
      var li = document.createElement('li'); li.className = 'stepitem' + (s.done ? ' is-done' : '');
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!s.done; cb.id = 'st' + i;
      cb.setAttribute('aria-label', 'Шаг ' + (i + 1) + ' сделан');
      var ta = document.createElement('textarea'); ta.rows = 1; ta.value = s.t; ta.setAttribute('aria-label', 'Шаг ' + (i + 1) + ', можно поправить');
      var del = document.createElement('button'); del.type = 'button'; del.className = 'del'; del.innerHTML = '&times;'; del.setAttribute('aria-label', 'Убрать шаг ' + (i + 1));
      cb.addEventListener('change', function () { s.done = cb.checked; li.classList.toggle('is-done', s.done); save(); celebrate(cb.checked); });
      ta.addEventListener('input', function () { s.t = ta.value; autosize(ta); saveSoon(); });
      del.addEventListener('click', function () { state.steps.splice(i, 1); save(); render(Math.min(i, state.steps.length - 1)); });
      li.appendChild(cb); li.appendChild(ta); li.appendChild(del); listEl.appendChild(li);
      requestAnimationFrame(function () { autosize(ta); });
    });
    if (typeof focusIdx === 'number' && focusIdx >= 0) { var f = listEl.querySelectorAll('textarea')[focusIdx]; if (f) f.focus(); }
    celebrate(false);
  }
  var saveSoon = TM.debounce(save, 500);

  function celebrate(justChecked) {
    var steps = state.steps, done = steps.filter(function (s) { return s.done; }).length;
    var all = steps.length > 0 && done === steps.length;
    more.hidden = !all;
    if (all) {
      cheer.textContent = done === 1 ? 'Шаг сделан. Можно на этом остановиться, это честно. Или взять следующий кусок.'
        : 'Все ' + done + ' ' + TM.plural(done, 'шаг', 'шага', 'шагов') + ' сделаны. Можно на этом остановиться, это честно. Или взять следующий кусок.';
    } else if (justChecked && done > 0) {
      cheer.textContent = CHEERS[Math.min(done - 1, 1)];
    } else if (!justChecked && done === 0) {
      cheer.textContent = '';
    }
    cheer.hidden = !cheer.textContent;
  }

  function make(task, variant) {
    var opts = options(task), v = variant % opts.length;
    state = { task: task, variant: v, steps: opts[v].map(function (t) { return { t: t, done: false }; }) };
    save(); render();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var task = taskEl.value.trim();
    if (!task) { taskEl.focus(); $('stepEmpty').hidden = false; return; }
    $('stepEmpty').hidden = true;
    make(task, 0);
    titleEl.focus();
  });
  taskEl.addEventListener('input', function () { $('stepEmpty').hidden = true; });

  $('stepOther').addEventListener('click', function () {
    if (!state) return;
    make(state.task, (state.variant || 0) + 1);
    $('stepOther').focus();
  });
  $('stepAdd').addEventListener('click', function () {
    state.steps.push({ t: '', done: false }); save(); render(state.steps.length - 1);
  });
  more.addEventListener('click', function () {
    NEXT.forEach(function (t) { state.steps.push({ t: t, done: false }); });
    save(); render(state.steps.length - 3);
  });
  $('stepFocus').addEventListener('click', function () {
    var first = state && state.steps.filter(function (s) { return !s.done; })[0];
    TM.set('tm-focus-task', first ? first.t.replace(/\s*\(\d+.*?мин\)\s*$/, '') : (state ? state.task : ''));
    location.href = '../fokus/';
  });
  $('stepNew').addEventListener('click', function () {
    state = null; save(); render(); taskEl.value = ''; taskEl.focus();
  });
  $('stepErase').addEventListener('click', function () {
    TM.confirm($('stepConfirm'), function () {
      state = null; TM.del(KEY); TM.del('tm-focus-task'); taskEl.value = ''; render();
      saved.textContent = 'Всё стёрто из этого браузера.';
    }, taskEl);
  });

  if (state) { taskEl.value = state.task; render(); save(); }
})();
