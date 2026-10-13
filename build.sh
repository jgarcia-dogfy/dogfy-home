#!/bin/sh
# Ensambla index.html: lienzo de escritorio (sections/, ≥1024px) + versión móvil/tablet (msections/, <1024px)
cd "$(dirname "$0")"
{
  cat head.html
  for s in header hero como-empezar conoce recetas si-real precio primer-pedido testimonios empecemos faq descuento footer; do
    [ -f "sections/$s.html" ] && { echo "<!-- ===== $s ===== -->"; cat "sections/$s.html"; }
  done
  echo '</div>'
  echo '<!-- ===================== MÓVIL / TABLET (<1024px) ===================== -->'
  echo '<div id="m-canvas" class="lg:hidden relative w-full overflow-x-clip bg-white">'
  for s in header hero como-empezar conoce recetas si-real precio primer-pedido testimonios empecemos faq descuento footer; do
    [ -f "msections/$s.html" ] && { echo "<!-- ===== m-$s ===== -->"; cat "msections/$s.html"; }
  done
  echo '</div>'
  cat foot.html
} > index.html
echo "index.html generado"
