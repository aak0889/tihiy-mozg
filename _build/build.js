// Сборка внутренних страниц «Тихого мозга»: общая шапка и подвал вокруг тела страницы.
// node build.js <папка с pages> <папка сайта>
const fs = require('fs'), path = require('path');
const [, , SRC, OUT] = process.argv;
const ORIGIN = 'https://xn--c1ahcafso1a2a.xn--p1ai/';

const NAV = [
  ['shag', 'Сделай шаг'], ['fokus', 'Фокус'], ['zvuki', 'Звуки'], ['parkovka', 'Парковка мыслей'],
  ['sensornaya-komnata', 'Сенсорная комната'], ['kuda-obratitsya', 'Куда обратиться']
];

function page(meta, body) {
  const url = ORIGIN + meta.slug + '/';
  const scripts = ['base'].concat(meta.scripts || []).map(s => `<script src="../js/${s}.js" defer></script>`).join('\n');
  const soundbar = meta.soundbar ? `
<div class="soundbar" id="soundbar" role="region" aria-label="Звук" hidden><span></span><button type="button">Остановить звук</button></div>` : '';
  const extra = meta.after || '';
  return `<!doctype html>
<html lang="ru" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title>
<meta name="description" content="${meta.desc}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#1D2621">
<meta property="og:type" content="${meta.article ? 'article' : 'website'}">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="Тихий мозг">
<meta property="og:title" content="${meta.ogTitle || meta.title}">
<meta property="og:description" content="${meta.desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="../img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="../img/apple-touch-icon.png">
<link rel="stylesheet" href="../css/style.css">
<link rel="stylesheet" href="../css/tools.css">
<script>
  (function () {
    var d = document.documentElement, t = null, q = null;
    try { t = localStorage.getItem('tm-theme'); q = localStorage.getItem('tm-quiet'); } catch (e) {}
    if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
    if (!q) q = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'on' : 'off';
    d.setAttribute('data-quiet', q);
  })();
</script>
</head>
<body>
<a class="skip" href="#main">Перейти к содержанию</a>

<header class="top" id="top">
  <div class="wrap top__inner">
    <a class="brand" href="../" aria-label="Тихий мозг, на главную">
      <svg class="brand__mark" viewBox="0 0 64 32" aria-hidden="true"><path d="M4 22 C8 8 11 4 14 6 S19 28 24 26 S31 15 37 16 S44 18 48 18" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="57" cy="18" r="4.2" class="dot"/></svg>
    </a>
    <nav class="top__nav" aria-label="Разделы"><a href="../#instrumenty">Инструменты</a></nav>
    <div class="toggles">
      <button class="toggle" id="quietBtn" type="button" aria-pressed="false" title="Убрать движение на странице">Без движения</button>
      <button class="toggle toggle--icon" id="themeBtn" type="button" aria-label="Светлая тема" title="Сменить тему">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
  </div>
</header>

<main id="main">
${body.trim()}
</main>

<footer class="foot">
  <div class="wrap wrap--text">
    <div class="foot__line" aria-hidden="true"><span></span></div>
    <nav class="foot__nav" aria-label="Инструменты">
      <a href="../">Главная</a>
${NAV.filter(n => n[0] !== meta.slug).map(n => `      <a href="../${n[0]}/">${n[1]}</a>`).join('\n')}
    </nav>
    <p class="foot__disclaimer" id="disclaimer"><strong>Тихий мозг — медиа и простые инструменты, а не медицинская услуга.</strong> Материалы не заменяют консультацию врача и медицинскую помощь. Если состояние ухудшается или ты в кризисе, обратись за профессиональной или экстренной помощью: <a href="tel:112">112</a>. Телефон доверия (бесплатно, круглосуточно): <a href="tel:88002000122">8-800-2000-122</a>.</p>
    <p class="foot__small">Связаться: <a href="mailto:aak0889@yandex.ru">aak0889@yandex.ru</a></p>
    <p class="foot__small">© 2026 Тихий мозг, тихиймозг.рф</p>
  </div>
</footer>
${extra}${soundbar}
${scripts}
</body>
</html>
`;
}

for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.html'))) {
  const src = fs.readFileSync(path.join(SRC, f), 'utf8');
  const m = src.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  const meta = JSON.parse(m[1]);
  let body = src.slice(m[0].length).replace(/<!--(park|sensory):(\{.*?\})-->/g, (_, name, json) => {
    const vars = JSON.parse(json);
    return fs.readFileSync(path.join(SRC, '..', name + '-widget.inc'), 'utf8').replace(/\{\{(\w+)\}\}/g, (__, k) => vars[k] !== undefined ? vars[k] : '');
  });
  body = body.replace('<!--more-->', () => fs.readFileSync(path.join(SRC, '..', 'more.inc'), 'utf8'));
  if (/\{\{\w+\}\}/.test(body)) throw new Error('unfilled var in ' + f);
  if (meta.sensory) meta.after = `
<div class="dimmer" id="dimmer" aria-hidden="true" hidden></div>
<div class="textonly" id="textonly" role="dialog" aria-modal="true" aria-label="Только текст" hidden><p></p><button type="button">Назад</button></div>`;
  const html = page(meta, body);
  const dir = path.join(OUT, meta.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(meta.slug, Buffer.byteLength(html), 'bytes');
}
