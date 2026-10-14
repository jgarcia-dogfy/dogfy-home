# Dogfy Diet · Home (landing)

Landing estática maquetada a partir del diseño de Figma "TEST NUXT - Rebrand (Javi)".

- `index.html` — página generada (no editar a mano).
- `sections/*.html` — versión **escritorio** (≥1024 px, lienzo de 1428 px). Es la versión de referencia.
- `msections/*.html` — versión **móvil / tablet** (<1024 px).
- `head.html`, `foot.html` — cabecera y cierre de la página.
- `whatsapp.html` — botón flotante de WhatsApp (común a escritorio y móvil).
- `assets/` — imágenes, iconos y scripts (`assets/js`).
- `build.sh` — une todo en `index.html`.

## Uso

```bash
./build.sh                         # regenera index.html
ruby -run -e httpd . -p 8080       # servidor local → http://localhost:8080
```

## Fuentes

Las tipografías de marca (Youth y K Labil Grotesk) se sirven en formato web (`fonts/*.woff2`), con la licencia web de Dogfy Diet.
No reutilizar estos archivos fuera de los proyectos de Dogfy Diet.
