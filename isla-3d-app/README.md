# Isla 3D - Battle Royale (App de escritorio)

Esto convierte tu juego en una **aplicación de escritorio real** (Windows/Mac/Linux) con
[Electron](https://www.electronjs.org/): se abre como una ventana de app con su propio ícono,
sin barra de direcciones, sin pestañas, sin menú de navegador.

## Requisitos (en tu PC, no aquí)
- [Node.js](https://nodejs.org) 18 o superior instalado.

## 1. Probar la app en modo desarrollo
```bash
cd isla-3d-app
npm install
npm start
```
Esto abre la ventana del juego tal cual, usando los archivos de `app/`.

## 2. Generar el instalador (.exe / .dmg / .AppImage)
```bash
npm run dist:win     # genera instalador .exe (ejecútalo en Windows, o en Linux/Mac con Wine)
npm run dist:mac     # genera .dmg (solo funciona en macOS)
npm run dist:linux   # genera .AppImage
```
Los archivos finales quedan en la carpeta `dist_installers/`. Ese `.exe`/`.AppImage`/`.dmg`
es lo que le das a cualquier persona para que instale el juego como una app normal,
con ícono en el escritorio y todo — sin necesidad de abrir ningún navegador.

> Nota: para compilar el `.exe` de Windows necesitas hacerlo desde Windows, o desde
> Linux/Mac con Wine instalado. Si no tienes Windows a mano, la forma más simple es
> subir esta carpeta a un repo de GitHub y usar **GitHub Actions** (hay plantillas
> gratis de "electron-builder action") para que te genere el `.exe` en la nube.

## 3. Meter tu mapa de Blender
1. En Blender: **Archivo → Exportar → glTF 2.0 (.glb/.gltf)**.
   - Formato: **glTF Binario (.glb)** (un solo archivo, más fácil de mover).
   - Marca "+Y Up" si Blender te lo pide (three.js usa Y como arriba, Blender usa Z).
   - Escala: modela en metros reales (1 unidad Blender = 1 metro) para que coincida
     con la escala del personaje del juego (~1.8 m de alto).
   - Aplica todas las transformaciones (Ctrl+A → All Transforms) antes de exportar.
   - Activa compresión **Draco** en el exportador si el mapa es muy grande (pesa
     mucho menos y carga más rápido).
2. Copia el archivo exportado a: `app/assets/map/map.glb`
3. Abre `app/index.html`, busca el comentario `MAPA DE BLENDER` cerca del inicio
   del script, y descomenta esta línea:
   ```js
   loadBlenderMap('./assets/map/map.glb',{scale:1});
   ```
4. Corre `npm start` de nuevo. Tu mapa debería aparecer en la escena.

### Importante sobre colisiones
Por ahora `loadBlenderMap` solo agrega el mapa **visualmente**. El juego actual
tiene su propio sistema de colisiones/paredes/puertas basado en el mundo generado
por código (no en el mapa 3D). Cuando tengas el mapa de Blender terminado, el
siguiente paso es decirme qué partes deben bloquear el paso (paredes, edificios,
terreno) para generar la colisión a partir de tu geometría — probablemente usando
cajas de colisión simplificadas nombradas en Blender (ej. `COL_muro01`,
`COL_edificio02`) que exportamos aparte del modelo visual detallado. Cuando tengas
el mapa listo, mándamelo (o dime cómo está estructurado) y te ayudo a conectar
las colisiones reales.

## Estructura del proyecto
```
isla-3d-app/
├─ package.json      ← configuración de Electron y del instalador
├─ main.js            ← crea la ventana de la app (sin menú, sin barra de navegador)
├─ preload.js         ← puente seguro entre el juego y Electron
├─ build/icon.png     ← ícono de la app
└─ app/
   ├─ index.html       ← tu juego (motor Three.js) — es el mismo que ya tenías
   └─ assets/map/      ← aquí va tu map.glb exportado desde Blender
```
