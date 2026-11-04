const http = require('http');
const pages = ['', 'shag/', 'fokus/', 'zvuki/', 'parkovka/', 'sensornaya-komnata/', 'kuda-obratitsya/', 'kak-nachat-zadachu/', 'sensornaya-peregruzka/', 'mysli-ne-dayut-usnut/', 'giperfokus/'];
const get = u => new Promise(r => http.get(u, res => { let d = ''; res.setEncoding('utf8'); res.on('data', c => d += c); res.on('end', () => r([res.statusCode, d])); }));
(async () => {
  const bad = [];
  for (const p of pages) {
    const base = 'http://localhost:8765/' + p;
    const [st, html] = await get(base);
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]).filter(h => !/^(https?:|tel:|mailto:|#)/.test(h));
    for (const h of new Set(refs)) { const u = new URL(h, base).href.split('#')[0]; const [s] = await get(u); if (s !== 200) bad.push(p + ' -> ' + h + ' ' + s); }
    const ext = [...html.matchAll(/<(script|link)[^>]+(?:src|href)="(https?:[^"]+)"/g)].map(m => m[2]).filter(u => !u.includes('xn--c1ahcafso1a2a'));
    const words = (html.replace(/<[^>]+>/g, ' ').match(/[а-яё-]*(лен[ьи]\b|лень|дисциплин|болезн|больн|лечить|просто сделай|суперсил)[а-яё]*/gi) || []);
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    console.log((p || 'index').padEnd(24), st, Buffer.byteLength(html), 'B', text, 'words', ext.length ? 'EXT:' + ext : '', words.length ? 'WORDS:' + words : '', (html.match(/не медицинская услуга/g) || []).length ? '' : 'NO-DISCLAIMER');
  }
  console.log('broken:', bad.length ? bad : 'none');
})();
