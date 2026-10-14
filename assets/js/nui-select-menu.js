/*
 * Desplegable con el aspecto y comportamiento de USelectMenu (Nuxt UI v3, tema por defecto, size "xl"),
 * en vanilla JS: buscador, check en la opción elegida, navegación con teclado y animación scale-in.
 *
 * Uso: <select data-nui-select> dentro de un contenedor con data-nui-anchor (el campo visible).
 * El <select> nativo se mantiene como fuente de verdad: al elegir se actualiza su value y se emite "change".
 */
(function () {
  // Contenedor de referencia: lienzo de escritorio (#canvas, con zoom) o versión móvil (#m-canvas)
  var canvas = document.getElementById('canvas');
  if (!canvas) return;

  var ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  var css = [
    /* tokens: Nuxt UI (--ui-*) mapeados a la paleta Dogfy */
    '.nui-sm{--ui-primary:#ff6d45;--ui-bg:#fff;--ui-bg-elevated:#f6f1ec;--ui-border:#ebe4da;--ui-text:#4f4a43;--ui-text-highlighted:#2a2724;--ui-text-muted:#4f4a43;--ui-text-dimmed:#5c564f;',
    'position:absolute;z-index:60;display:flex;flex-direction:column;max-height:380px;background:var(--ui-bg);border-radius:6px;',
    'box-shadow:0 0 0 1px var(--ui-border),0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);overflow:hidden;',
    "font-family:'K Labil Grotesk',system-ui,sans-serif;transform-origin:top center}",
    '.nui-sm[data-side=top]{transform-origin:bottom center}',
    '.nui-sm[data-state=open]{animation:nui-scale-in .1s ease-out}',
    '.nui-sm[data-state=closed]{animation:nui-scale-out .1s ease-in forwards}',
    '@keyframes nui-scale-in{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}',
    '@keyframes nui-scale-out{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.95)}}',
    /* input (UInput variant none, size xl) */
    '.nui-sm-input{position:relative;display:flex;align-items:center;border-bottom:1px solid var(--ui-border)}',
    '.nui-sm-input svg{position:absolute;left:14px;width:20px;height:20px;color:var(--ui-text-dimmed);pointer-events:none}',
    '.nui-sm-input input{width:100%;border:0;outline:0;background:transparent;padding:12px 14px 12px 42px;font:inherit;font-size:16px;line-height:24px;font-weight:400;color:var(--ui-text-highlighted)}',
    '.nui-sm-input input::placeholder{color:var(--ui-text-dimmed)}',
    /* viewport + group */
    '.nui-sm-viewport{position:relative;flex:1;overflow-y:auto;scroll-padding-block:4px}',
    '.nui-sm-group{padding:4px;isolation:isolate}',
    /* item (size xl: p-2 text-base gap-2) */
    '.nui-sm-item{position:relative;display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;font-size:16px;line-height:24px;font-weight:400;color:var(--ui-text);cursor:pointer;user-select:none;outline:0}',
    '.nui-sm-item::before{content:"";position:absolute;inset:1px;z-index:-1;border-radius:6px;transition:background-color .15s}',
    '.nui-sm-item[data-highlighted]{color:var(--ui-text-highlighted)}',
    '.nui-sm-item[data-highlighted]::before{background:color-mix(in srgb,var(--ui-bg-elevated) 50%,transparent);background:var(--ui-bg-elevated)}',
    '.nui-sm-item-label{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.nui-sm-item-check{flex-shrink:0;width:20px;height:20px;color:var(--ui-primary);opacity:0}',
    '.nui-sm-item[data-state=checked] .nui-sm-item-check{opacity:1}',
    '.nui-sm-item[data-state=checked]{color:var(--ui-text-highlighted)}',
    '.nui-sm-empty{padding:8px 12px;text-align:center;font-size:16px;line-height:24px;color:var(--ui-text-muted)}',
    /* trigger abierto: anillo de foco primario como en Nuxt UI */
    '[data-nui-anchor][data-state=open]{box-shadow:0 0 0 3px rgba(255,109,69,.35)}',
    '[data-nui-anchor] [data-nui-chevron]{transition:transform .2s}',
    '[data-nui-anchor][data-state=open] [data-nui-chevron]{transform:rotate(180deg)}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var current = null; // menú abierto

  // Posición en unidades del lienzo (el lienzo puede tener zoom; offset* no lo aplica)
  function canvasOffset(el, canvas) {
    var x = 0, y = 0;
    while (el && el !== canvas) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: x, y: y };
  }

  function normalize(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function enhance(select) {
    var canvas = select.closest('#m-canvas') || document.getElementById('canvas');
    var anchor = select.closest('[data-nui-anchor]') || select.parentElement;
    var options = Array.prototype.filter.call(select.options, function (o) { return o.value !== '' && !o.disabled; });
    var placeholder = (select.querySelector('option[value=""]') || {}).textContent || '';
    var uid = 'nui-sm-' + Math.random().toString(36).slice(2, 8);

    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true'); // el combobox del anchor lo sustituye para lectores de pantalla
    select.style.pointerEvents = 'none';
    anchor.tabIndex = 0;
    anchor.setAttribute('role', 'combobox');
    anchor.setAttribute('aria-haspopup', 'listbox');
    anchor.setAttribute('aria-expanded', 'false');
    anchor.setAttribute('aria-controls', uid);
    anchor.setAttribute('aria-label', placeholder);
    anchor.dataset.state = 'closed';
    anchor.style.cursor = 'pointer';
    anchor.style.outline = 'none';

    var panel, input, viewport, group, items = [], hi = -1;

    function build() {
      panel = document.createElement('div');
      panel.className = 'nui-sm';
      panel.id = uid;
      panel.innerHTML =
        '<div class="nui-sm-input">' + ICON_SEARCH + '<input type="text" autocomplete="off" placeholder="Buscar raza…" aria-label="Buscar raza"></div>' +
        '<div class="nui-sm-viewport"><div class="nui-sm-group" role="listbox"></div></div>';
      input = panel.querySelector('input');
      viewport = panel.querySelector('.nui-sm-viewport');
      group = panel.querySelector('.nui-sm-group');
      options.forEach(function (o, i) {
        var it = document.createElement('div');
        it.className = 'nui-sm-item';
        it.setAttribute('role', 'option');
        it.id = uid + '-' + i;
        it.dataset.value = o.value;
        it.innerHTML = '<span class="nui-sm-item-label"></span><span class="nui-sm-item-check">' + ICON_CHECK + '</span>';
        it.firstChild.textContent = o.textContent;
        it.addEventListener('mousemove', function () { highlight(items.indexOf(it)); });
        it.addEventListener('mousedown', function (e) { e.preventDefault(); });
        it.addEventListener('click', function () { choose(o.value); });
        group.appendChild(it);
      });
      var empty = document.createElement('div');
      empty.className = 'nui-sm-empty';
      empty.textContent = 'Sin resultados';
      empty.hidden = true;
      group.appendChild(empty);

      input.addEventListener('input', function () { filter(input.value); });
      input.addEventListener('keydown', onKey);
      panel.addEventListener('mousedown', function (e) { if (e.target !== input) e.preventDefault(); });
    }

    function visibleItems() { return Array.prototype.filter.call(group.querySelectorAll('.nui-sm-item'), function (i) { return !i.hidden; }); }

    function filter(q) {
      var n = normalize(q.trim());
      var any = false;
      group.querySelectorAll('.nui-sm-item').forEach(function (it) {
        var show = !n || normalize(it.textContent).indexOf(n) !== -1;
        it.hidden = !show;
        any = any || show;
      });
      group.querySelector('.nui-sm-empty').hidden = any;
      items = visibleItems();
      highlight(items.length ? 0 : -1);
    }

    function highlight(i) {
      items.forEach(function (it) { delete it.dataset.highlighted; });
      hi = i;
      if (i < 0 || !items[i]) { input.removeAttribute('aria-activedescendant'); return; }
      items[i].dataset.highlighted = '';
      input.setAttribute('aria-activedescendant', items[i].id);
      var it = items[i], vp = viewport;
      if (it.offsetTop < vp.scrollTop) vp.scrollTop = it.offsetTop - 4;
      else if (it.offsetTop + it.offsetHeight > vp.scrollTop + vp.clientHeight) vp.scrollTop = it.offsetTop + it.offsetHeight - vp.clientHeight + 4;
    }

    function position() {
      var o = canvasOffset(anchor, canvas);
      var gap = 8;
      panel.style.left = o.x + 'px';
      panel.style.width = anchor.offsetWidth + 'px';
      // Abre hacia arriba si no cabe debajo en la ventana (como el "collision avoidance" de Reka UI)
      panel.style.maxHeight = '';
      var zoom = parseFloat(canvas.style.zoom) || 1;
      var r = anchor.getBoundingClientRect();
      var below = window.innerHeight - r.bottom;
      var need = (panel.offsetHeight + gap) * zoom;
      // data-nui-side="bottom" en el campo fuerza que se abra siempre hacia abajo
      var top = anchor.dataset.nuiSide !== 'bottom' && below < need && r.top > below;
      panel.dataset.side = top ? 'top' : 'bottom';
      // Nunca sobrepasa el borde de la ventana: deja 16px de margen y la lista hace scroll
      var room = ((top ? r.top : below) - gap - 16) / zoom;
      if (room < panel.offsetHeight) panel.style.maxHeight = Math.max(160, room) + 'px';
      panel.style.top = (top ? o.y - gap - panel.offsetHeight : o.y + anchor.offsetHeight + gap) + 'px';
    }

    function open() {
      if (current && current !== api) current.close();
      if (!panel) build();
      input.value = '';
      filter('');
      group.querySelectorAll('.nui-sm-item').forEach(function (it) {
        it.dataset.state = it.dataset.value === select.value ? 'checked' : 'unchecked';
        it.setAttribute('aria-selected', it.dataset.value === select.value);
      });
      panel.dataset.state = 'open';
      canvas.appendChild(panel);
      position();
      var sel = items.findIndex(function (it) { return it.dataset.value === select.value; });
      highlight(sel >= 0 ? sel : 0);
      anchor.dataset.state = 'open';
      anchor.setAttribute('aria-expanded', 'true');
      input.focus({ preventScroll: true });
      current = api;
      window.addEventListener('resize', position);
      window.addEventListener('scroll', position, { passive: true });
    }

    function close(refocus) {
      if (!panel || !panel.isConnected || panel.dataset.state === 'closed') return;
      panel.dataset.state = 'closed';
      anchor.dataset.state = 'closed';
      anchor.setAttribute('aria-expanded', 'false');
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position);
      setTimeout(function () { if (panel.dataset.state === 'closed') panel.remove(); }, 100);
      if (refocus) anchor.focus({ preventScroll: true });
      if (current === api) current = null;
    }

    function choose(value) {
      select.value = value;
      select.style.color = "#2a2724";
      select.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    }

    function onKey(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) highlight((hi + 1) % items.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) highlight((hi - 1 + items.length) % items.length); }
      else if (e.key === 'Home') { e.preventDefault(); highlight(0); }
      else if (e.key === 'End') { e.preventDefault(); highlight(items.length - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (items[hi]) choose(items[hi].dataset.value); }
      else if (e.key === 'Escape' || e.key === 'Tab') { if (e.key === 'Escape') e.preventDefault(); close(e.key === 'Escape'); }
    }

    anchor.addEventListener('mousedown', function (e) {
      e.preventDefault();
      if (anchor.dataset.state === 'open') close(true); else open();
    });
    anchor.addEventListener('click', function (e) { e.preventDefault(); });
    anchor.addEventListener('keydown', function (e) {
      if (anchor.dataset.state === 'open') return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });

    var api = { close: close, anchor: anchor, panel: function () { return panel; } };
    return api;
  }

  document.addEventListener('mousedown', function (e) {
    if (!current) return;
    var p = current.panel();
    if (p && p.contains(e.target)) return;
    if (current.anchor.contains(e.target)) return;
    current.close();
  });

  document.querySelectorAll('select[data-nui-select]').forEach(enhance);
})();
