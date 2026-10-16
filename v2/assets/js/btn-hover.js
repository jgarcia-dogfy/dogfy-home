/*
 * Hover "Simple" (ref. Aaron Iker · Playful button hovers): el fondo se oscurece
 * y las letras del texto dan un pequeño salto en ola, una tras otra.
 * Se aplica a los botones de píldora de la landing (rounded-[999px] / rounded-[64.507px]).
 */
(function () {
  var css = [
    '.btn-play{transition:background-color .3s ease,filter .3s ease,color .3s ease!important}',
    /* Se oscurece solo el fondo (no se usa filter, que agrisaba el texto blanco) */
    '.btn-play:hover{filter:none!important;box-shadow:none!important}',
    '.btn-play.bp-solid:hover{background-color:color-mix(in srgb,var(--bp-bg) 86%,#000)!important}',
    '.btn-play.bp-light:hover{background-color:color-mix(in srgb,var(--bp-bg) 92%,#000)!important}',
    /* Botón de color con texto oscuro: se aclara el fondo para no perder contraste (WCAG 4,5:1) */
    '.btn-play.bp-lift:hover{background-color:color-mix(in srgb,var(--bp-bg) 85%,#fff)!important}',
    '.btn-play .bp-l{display:inline-block;white-space:pre;will-change:transform}',
    '.btn-play:hover .bp-l{animation:bp-wave .5s cubic-bezier(.34,1.56,.64,1) both;animation-delay:calc(var(--i) * 28ms)}',
    '@keyframes bp-wave{0%{transform:none}40%{transform:translateY(-5px) rotate(-6deg)}70%{transform:translateY(1px) rotate(2deg)}100%{transform:none}}',
    '@media (prefers-reduced-motion: reduce){.btn-play:hover .bp-l{animation:none}}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function split(label) {
    var text = label.textContent;
    if (!text.trim() || label.dataset.bpSplit) return;
    label.dataset.bpSplit = '1';
    label.setAttribute('aria-label', text.trim());
    label.textContent = '';
    Array.from(text.trim()).forEach(function (ch, i) {
      var s = document.createElement('span');
      s.className = 'bp-l';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      s.textContent = ch;
      label.appendChild(s);
    });
  }

  var buttons = document.querySelectorAll('#canvas a[class*="rounded-[999px]"], #canvas a[class*="rounded-[64.507px]"], #canvas button[class*="rounded-[999px]"], #m-canvas a[class*="rounded-[999px]"], #m-canvas button[class*="rounded-[999px]"]');
  buttons.forEach(function (btn) {
    // "Mostrar detalle" de las recetas: sin efecto de ola (mantiene su hover de relleno naranja)
    if (btn.classList.contains('rc-toggle')) return;
    // El botón debe tener un único texto: buscamos el elemento hoja que lo contiene
    var leaves = Array.prototype.filter.call(btn.querySelectorAll('span, p'), function (el) {
      return el.children.length === 0 && el.textContent.trim();
    });
    if (leaves.length !== 1) return;
    btn.classList.add('btn-play');
    // Fondo de partida: se guarda para oscurecerlo en hover sin tocar el color del texto
    var bg = getComputedStyle(btn).backgroundColor;
    if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)) {
      btn.style.setProperty('--bp-bg', bg);
      var rgb = bg.match(/\d+/g).map(Number), lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
      var fg = getComputedStyle(leaves[0]).color.match(/\d+/g).map(Number), fgLum = (0.299 * fg[0] + 0.587 * fg[1] + 0.114 * fg[2]) / 255;
      btn.classList.add(lum > 0.75 ? 'bp-light' : fgLum < 0.3 ? 'bp-lift' : 'bp-solid');
    }
    // Chips de filtro de recetas: solo se oscurece el fondo, sin ola en las letras
    if (btn.hasAttribute('data-chip')) return;
    split(leaves[0]);
    // Si un script cambia el texto del botón, se vuelve a partir en letras
    new MutationObserver(function () {
      if (!leaves[0].querySelector('.bp-l')) { delete leaves[0].dataset.bpSplit; split(leaves[0]); }
    }).observe(leaves[0], { childList: true });
  });
})();
