import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

let mainWindow: BrowserWindow | null = null;
const pendingProjectPaths = new Set<string>();

const isProjectFile = (filePath: string): boolean =>
  filePath.endsWith('.fpvproj') || filePath.endsWith('.json');

const collectArgvProjectPaths = (argv: string[]): string[] =>
  argv.filter((argument) => isProjectFile(argument));

const getPreloadPath = (): string => path.join(__dirname, 'preload.js');

const getIndexUrl = (): string => {
  const devServer = process.env.ELECTRON_DEV_SERVER_URL ?? process.env.VITE_DEV_SERVER_URL;
  if (devServer) {
    return devServer;
  }
  const indexFile = path.join(__dirname, '../../web/dist/index.html');
  return `file://${indexFile}`;
};

const deliverProjectToRenderer = async (filePath: string) => {
  if (!mainWindow) {
    pendingProjectPaths.add(filePath);
    return;
  }
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    mainWindow.webContents.send('project:open', { filePath, content });
    app.addRecentDocument(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    mainWindow.webContents.send('project:open-error', { filePath, error: message });
  }
};

const flushPendingProjects = () => {
  if (!mainWindow || mainWindow.webContents.isLoading()) {
    return;
  }
  const entries = Array.from(pendingProjectPaths.values());
  pendingProjectPaths.clear();
  entries.forEach((filePath) => {
    void deliverProjectToRenderer(filePath);
  });
};

const handleOpenProjectDialog = async () => {
  if (!mainWindow) {
    return;
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Ouvrir un projet FireFalck',
    filters: [
      { name: 'Projet FireFalck', extensions: ['fpvproj', 'json'] },
      { name: 'JSON', extensions: ['json'] },
    ],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return;
  }
  const [filePath] = result.filePaths;
  if (filePath) {
    queueProjectFromPath(filePath);
  }
};

const createMenu = () => {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Fichier',
      submenu: [
        { label: 'Ouvrir un projet…', click: () => void handleOpenProjectDialog() },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Consulter docs/USER_GUIDE.md',
          enabled: false,
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'FireFalck Configurateur',
    show: false,
  });

  const indexUrl = getIndexUrl();
  await mainWindow.loadURL(indexUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.once('did-finish-load', () => {
    flushPendingProjects();
  });
};

const queueProjectFromPath = (filePath: string) => {
  if (!isProjectFile(filePath)) {
    return;
  }
  pendingProjectPaths.add(filePath);
  if (mainWindow && !mainWindow.webContents.isLoading()) {
    flushPendingProjects();
  }
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const [, ...args] = argv;
    collectArgvProjectPaths(args).forEach(queueProjectFromPath);
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  queueProjectFromPath(filePath);
});

app.whenReady().then(() => {
  createMenu();
  createWindow().catch((error) => {
    console.error('Impossible de créer la fenêtre principale', error);
  });

  collectArgvProjectPaths(process.argv.slice(1)).forEach(queueProjectFromPath);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('project:open-dialog', handleOpenProjectDialog);
