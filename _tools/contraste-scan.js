// Escaneo de contraste WCAG (texto sobre color sólido + texto sobre foto). Uso en consola: await contrasteScan() / nivel AAA: await contrasteScan({ aaa: true })
window.contrasteScan = async function (opts = {}) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true }); const cache = {};
  const parse = c => { if (!cache[c]) { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; cache[c] = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }; } return { ...cache[c] }; };
  const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  const lum = c => .2126 * lin(c.r) + .7152 * lin(c.g) + .0722 * lin(c.b);
  const blend = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const root = document.querySelector(innerWidth >= 1024 ? '#canvas' : '#m-canvas');
  const photoCache = new Map();
  async function photoLums(sec, img) {
    if (photoCache.has(img)) return photoCache.get(img);
    await img.decode().catch(() => {});
    const R = img.getBoundingClientRect(), W = Math.round(R.width), H = Math.round(R.height);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight), dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    const [px, py] = getComputedStyle(img).objectPosition.split(' ').map(p => parseFloat(p) / 100);
    g.fillStyle = getComputedStyle(sec).backgroundColor; g.fillRect(0, 0, W, H); g.filter = getComputedStyle(img).filter;
    g.drawImage(img, (W - dw) * px, (H - dh) * py, dw, dh); g.filter = "none";
    for (const o of sec.querySelectorAll('*')) {
      const bi = getComputedStyle(o).backgroundImage; if (!/gradient/.test(bi) || !o.checkVisibility()) continue; const r = o.getBoundingClientRect();
      for (const gr of (bi.match(/linear-gradient\((?:[^()]|\([^)]*\))*\)/g) || []).reverse()) {
        const parts = gr.slice(16, -1).split(/,(?![^(]*\))/).map(x => x.trim()); let ang = 180; if (/deg/.test(parts[0])) ang = parseFloat(parts.shift());
        const x0 = r.left - R.left, y0 = r.top - R.top; const lg = ang === 90 ? g.createLinearGradient(x0, 0, x0 + r.width, 0) : g.createLinearGradient(0, y0, 0, y0 + r.height);
        parts.forEach((p, i) => { const m = p.match(/(rgba?\([^)]*\)|#\w+)\s*([\d.]+%)?/); lg.addColorStop(m[2] ? parseFloat(m[2]) / 100 : i / (parts.length - 1), m[1]); });
        g.fillStyle = lg; g.fillRect(x0, y0, r.width, r.height);
      }
    }
    const res = { R, W, H, data: g.getImageData(0, 0, W, H).data }; photoCache.set(img, res); return res;
  }
  const out = [], seen = new Set();
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) {
    const t = tw.currentNode; if (!t.textContent.trim()) continue;
    let el = t.parentElement; el = el.closest('[data-bp-split]') || el;
    if (seen.has(el) || /SCRIPT|STYLE/.test(el.tagName) || !el.checkVisibility({ checkVisibilityCSS: true })) continue; seen.add(el);
    const s = getComputedStyle(el); let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity; if (op < .05) continue;
    const fg = parse(getComputedStyle(t.parentElement).color); fg.a *= op;
    const css = parseFloat(s.fontSize), bold = /Bold|Black/.test(s.fontFamily) || +s.fontWeight >= 700, need = css >= 24 || (css >= 18.66 && bold) ? (opts.aaa ? 4.5 : 3) : (opts.aaa ? 7 : 4.5);
    // fondo: capas de color hasta una opaca; si antes hay una foto absoluta en un ancestro, se mide sobre la foto
    let layers = [], photo = null, sec = null, opaque = null;
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0) { layers.push(c); if (c.a >= 1) { opaque = e; break; } }
    }
    { const b = el.getBoundingClientRect(), cy = b.top + b.height / 2; sec = [...root.querySelectorAll(":scope > section, :scope > main > section, :scope > footer")].find(x => { const q = x.getBoundingClientRect(); return cy >= q.top && cy <= q.bottom; }); photo = sec && [...sec.querySelectorAll("img")].find(i => i.checkVisibility() && i.getBoundingClientRect().width > Math.min(600, innerWidth * .8)); if (photo && (!opaque || opaque.contains(photo))) layers = []; else photo = null; }
    let r, bgTxt;
    if (photo) {
      const P = await photoLums(sec, photo), f = blend(fg, { r: 0, g: 0, b: 0, a: 1 }); const Lf = lum(fg.a < 1 ? blend(fg, { r: 128, g: 128, b: 128, a: 1 }) : fg); const ls = [];
      const rg = document.createRange(); rg.selectNodeContents(el);
      for (const q of rg.getClientRects()) for (let y = Math.max(0, q.top - P.R.top | 0); y < Math.min(P.H, q.bottom - P.R.top); y += 2) for (let x = Math.max(0, q.left - P.R.left | 0); x < Math.min(P.W, q.right - P.R.left); x += 2) { const i = (y * P.W + x) * 4; ls.push(.2126 * lin(P.data[i]) + .7152 * lin(P.data[i + 1]) + .0722 * lin(P.data[i + 2])); }
      if (!ls.length) continue; ls.sort((a, b) => a - b); const Lb = ls[Math.floor(ls.length * .5)];
      r = (Math.max(Lf, Lb) + .05) / (Math.min(Lf, Lb) + .05); bgTxt = 'foto(mediana)';
    } else {
      let bg = { r: 255, g: 255, b: 255, a: 1 }; for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg);
      r = ratio(blend(fg, bg), bg); bgTxt = `rgb(${bg.r | 0},${bg.g | 0},${bg.b | 0})`;
    }
    if (r < need) out.push(`${(el.closest('section') || {}).id || '-'} | ${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 38)} | ${getComputedStyle(t.parentElement).color} / ${bgTxt} | ${r.toFixed(2)} < ${need} | ${css}px`);
  }
  return `ancho ${innerWidth}px · ${out.length} fallos\n` + out.join('\n');
};
