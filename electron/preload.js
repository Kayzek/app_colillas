const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Login
    login: (credentials) => ipcRenderer.invoke('auth-login', credentials),

    // Obtener lotes
    getLotes: (params) => ipcRenderer.invoke('get-lotes', params),

    // Imprimir
    printColillas: (params) => ipcRenderer.invoke('print-colillas', params),
});
