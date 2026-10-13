# Dogfy Diet · Home (landing)

Landing estática maquetada a partir del diseño de Figma "TEST NUXT - Rebrand (Javi)".

- `index.html` — página generada (no editar a mano).
- `sections/*.html` — versión **escritorio** (≥1024 px, lienzo de 1428 px). Es la versión de referencia.
- `msections/*.html` — versión **móvil / tablet** (<1024 px).
- `head.html`, `foot.html` — cabecera y cierre de la página.
- `assets/` — imágenes, iconos y scripts (`assets/js`).
- `build.sh` — une todo en `index.html`.

## Uso

```bash
./build.sh                         # regenera index.html
ruby -run -e httpd . -p 8080       # servidor local → http://localhost:8080
```

## Fuentes

Las tipografías de marca (Youth y K Labil Grotesk) **no se incluyen** en el repositorio porque son de licencia comercial.
Copia estos archivos en una carpeta `fonts/` junto a `index.html`:

- `Youth-Bold.otf`, `Youth-Medium.otf`, `Youth-Black.otf`
- `KLabilGrotesk-50Regular.otf`, `KLabilGrotesk-70Bold.otf`
