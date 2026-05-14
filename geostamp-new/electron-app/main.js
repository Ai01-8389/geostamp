const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'GeoStamp',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'icon.ico')
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Images',
          accelerator: 'CmdOrCtrl+O',
          click: () => selectFiles()
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => dialog.showMessageBox(mainWindow, {
            title: 'About GeoStamp',
            message: 'GeoStamp Desktop v1.0.0',
            detail: 'Process unlimited photos with GPS geotagging. All processing happens locally on your device.'
          })
        },
        {
          label: 'Visit Website',
          click: () => shell.openExternal('https://geostamp.app')
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

function selectFiles() {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'heic'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      mainWindow.webContents.send('files-selected', result.filePaths);
    }
  }).catch(err => {
    console.error('Error selecting files:', err);
  });
}

ipcMain.on('select-files', () => {
  selectFiles();
});

ipcMain.on('save-file', (event, { blob, filename }) => {
  dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [{ name: 'JPEG', extensions: ['jpg'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFile(result.filePath, Buffer.from(blob), (err) => {
        if (err) {
          event.reply('save-file-result', { success: false, error: err.message });
        } else {
          event.reply('save-file-result', { success: true });
        }
      });
    }
  }).catch(err => {
    event.reply('save-file-result', { success: false, error: err.message });
  });
});

ipcMain.on('save-folder', (event, { files }) => {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      let savedCount = 0;
      let errorCount = 0;

      files.forEach(({ blob, filename }) => {
        const filePath = path.join(folderPath, filename);
        fs.writeFile(filePath, Buffer.from(blob), (err) => {
          if (err) {
            errorCount++;
          } else {
            savedCount++;
          }

          if (savedCount + errorCount === files.length) {
            event.reply('save-folder-result', {
              success: true,
              savedCount,
              errorCount
            });
          }
        });
      });
    }
  }).catch(err => {
    event.reply('save-folder-result', { success: false, error: err.message });
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});