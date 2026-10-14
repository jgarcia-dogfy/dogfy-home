#!/bin/sh
# Ensambla index.html: lienzo de escritorio (sections/, ≥1024px) + versión móvil/tablet (msections/, <1024px)
# Cada lienzo queda como header + <main> (secciones de contenido) + footer, para navegar por regiones
cd "$(dirname "$0")"
SECCIONES="hero como-empezar conoce recetas si-real precio primer-pedido testimonios empecemos faq descuento"
lienzo() { # $1 = carpeta, $2 = prefijo de los comentarios
  [ -f "$1/header.html" ] && { echo "<!-- ===== ${2}header ===== -->"; cat "$1/header.html"; }
  echo '<main>'
  for s in $SECCIONES; do
    [ -f "$1/$s.html" ] && { echo "<!-- ===== $2$s ===== -->"; cat "$1/$s.html"; }
  done
  echo '</main>'
  [ -f "$1/footer.html" ] && { echo "<!-- ===== ${2}footer ===== -->"; cat "$1/footer.html"; }
}
{
  cat head.html
  lienzo sections ""
  echo '</div>'
  echo '<!-- ===================== MÓVIL / TABLET (<1024px) ===================== -->'
  echo '<div id="m-canvas" class="lg:hidden relative w-full overflow-x-clip bg-white">'
  lienzo msections "m-"
  echo '</div>'
  cat whatsapp.html
  cat foot.html
} > index.html
echo "index.html generado"
