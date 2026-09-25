const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0a0d08',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true, // oculta la barra de menú tipo navegador
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Necesario para que Three.js pueda cargar el mapa .glb desde disco
      webSecurity: true
    }
  });

  // Sin menú (File/Edit/View...) para que se sienta como una app de juego, no un navegador
  Menu.setApplicationMenu(null);

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  // F11 para pantalla completa real dentro de la app
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
    // Descomenta para bloquear F12/DevTools en la versión final:
    // if (input.key === 'F12') event.preventDefault();
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
