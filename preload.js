const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("func", {
  onNewFile: (callback) => ipcRenderer.on("NewFile", callback),
  onOpenFile: (callback) => ipcRenderer.on("OpenFile", callback),
  onSaveFile: (callback) => ipcRenderer.on("SaveFile", callback),
  onSaveAsFile: (callback) => ipcRenderer.on("SaveAsFile", callback),
  onExportImage: (callback) => ipcRenderer.on("ExportImage", callback),
  onUndo: (callback) => ipcRenderer.on("Undo", callback),
  onRedo: (callback) => ipcRenderer.on("Redo", callback),
  onClear: (callback) => ipcRenderer.on("Clear", callback),
  onExitting: (callback) => ipcRenderer.on("Exitting", callback),
  exit: () => ipcRenderer.send("Exit"),
  toInit: () => ipcRenderer.send("ToInit"),
  showMessageBox: (args) => ipcRenderer.invoke("showMessageBox", args),
  showOpenDialog: (args) => ipcRenderer.invoke("showOpenDialog", args),
  showSaveDialog: (args) => ipcRenderer.invoke("showSaveDialog", args),
  writeFile: (data) => ipcRenderer.invoke("WriteFile", data),
  readFile: (path) => ipcRenderer.invoke("ReadFile", path),
  popMenu: () => ipcRenderer.send("PopMenu"),
});
console.log("Preload.js loaded.");
