// Puente seguro entre el juego (index.html) y Node/Electron.
// Por ahora no expone nada; lo dejamos listo por si luego necesitas
// leer/guardar archivos del mapa, partidas guardadas, etc.
window.addEventListener('DOMContentLoaded', () => {
  // ejemplo futuro: exponer una API tipo window.electronAPI.saveGame(...)
});
