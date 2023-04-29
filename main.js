const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const Store = require("electron-store");
const path = require("path");
const url = require("url");
const fs = require('fs');
const i18n = require('i18n')

let safeExit = false;

const store = new Store({
    defaults: {
        // 1000x600 is the default size of our window
        windowSize: [ 1000, 600 ],
        windowPos: [ 200, 200 ], 
        filePath: null
    }
});

i18n.configure({
    locales: ['zh', 'en'],
    directory: path.join(__dirname, '/locales'),
    defaultLocale: "en"
});

function sendReq(msg, data=null) {
    win.webContents.send(msg, data);
}


// Window menu template
const menuTemplate = () => [
    {
        label: i18n.__("File"),
        submenu : [
            {
                label: i18n.__("New"), accelerator: "CmdOrCtrl+N",
                click () {  sendReq("NewFile"); }
            }, {
                label: i18n.__("Open"), accelerator: "CmdOrCtrl+O",
                click () {  sendReq("OpenFile");    }
            }, {
                label: i18n.__("Save"), accelerator: "CmdOrCtrl+S",
                click () {  sendReq("SaveFile");    }
            }, {
                label: i18n.__("Save As"), accelerator: "CmdOrCtrl+Shift+S",
                click () {  sendReq("SaveAsFile");  }
            }, {
                type: "separator"
            }, {
                label: i18n.__("Export Image"),
                accelerator: "CmdOrCtrl+E",
                click () {  sendReq("ExportImage"); }
            }
        ]
    },{
        label: i18n.__("Edit"),
        submenu:[
            {
                label: i18n.__("Undo"), accelerator: "CmdOrCtrl+Z",
                click () {  sendReq("Undo");    }
            }, {
                label: i18n.__("Redo"), accelerator: "CmdOrCtrl+Shift+Z",
                click () {  sendReq("Redo");    }
            }, {
                label: i18n.__("Clear"), accelerator: "CmdOrCtrl+Shift+C",
                click () {  sendReq("Clear");    }
            }
        ]
    }, {
        label: i18n.__("View"),
        submenu: [
            {role: "reload"},
            {role: "forcereload"},
            {role: "toggledevtools"},
            {type: "separator"},
            {role: "resetzoom"},
            {role: "zoomin"},
            {role: "zoomout"},
            {type: "separator"},
            {role: "togglefullscreen"}
        ]
    }, {
        label: i18n.__("Help"),
        role: "Help",
        submenu:[
            {
                label: i18n.__("More"),
                accelerator: "CmdOrCtrl+H",
                click () {
                    // createInfoWindow();
                }
            },
            // {
            //     label: "Open DevTools",
            //     click() {
            //         win.webContents.openDevTools();
            //     }
            // }
        ]
    }
];

// add mac menu (which is a little bit different from Linux/Win)
if (process.platform === "darwin") {
  menuTemplate.unshift({
    label: app.getName(),
    submenu: [
      {role: "about"},
      {type: "separator"},
      {role: "services", submenu: []},
      {type: "separator"},
      {role: "hide"},
      {role: "hideothers"},
      {role: "unhide"},
      {type: "separator"},
      {role: "quit"}
    ]
  });
}


// Init win
let win;
let infoWin;


const createWindow = () => {
    // Create browser window

    let pos = store.get("windowPos");
    let x = pos[0];
    let y = pos[1];

    let shape = store.get("windowSize");
    let width = shape[0];
    let height = shape[1];

    win = new BrowserWindow({
        width: width,
        height: height,
        x: x,
        y: y,
        icon: path.join(__dirname, "./src/desmos.png"),
        webPreferences: {
            nodeIntegration: true,
            // contextIsolation: false,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true
    }));

    // Open devtool
    // win.webContents.openDevTools();
    i18n.setLocale(app.getLocale().split("-")[0]);

    const menu = Menu.buildFromTemplate(menuTemplate());

    Menu.setApplicationMenu(menu);

    win.on("resize", () => {
        let size = win.getSize();
        store.set("windowSize", size);
    });

    win.on("move", () => {
        let pos = win.getPosition();
        store.set("windowPos", pos);
    })
    
    win.on("close", (e) => {
        if(!safeExit) {
            e.preventDefault();
            sendReq("Exitting");
        }
    });
}

// function createInfoWindow() {
//     infoWin = new BrowserWindow({
//         width: 400, height: 450,
//         resizable: false,
//         parent: win,
//         icon: path.join(__dirname, "/res/icons/icon.png")
//     });
//     infoWin.loadURL(url.format({
//         pathname: path.join(__dirname, "/src/info.html"),
//         protocol: "file",
//         slashes: true
//     }));

//     // infoWin.webContents.openDevTools();

//     infoWin.on("close", (e) => {
//         infoWin = null;
//     });
// }


// Run create window
app.on("ready", createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
    if(process.platform != "darwin") {
        app.quit();
    }
});

ipcMain.on("Exit", (event, arg) => {
    // https://github.com/sindresorhus/electron-store
    safeExit = true;
    app.quit();
});


ipcMain.on("TitleChanged", (event, arg) => {
    store.set("filePath", arg);
});

ipcMain.on("ToInit", (event, arg) => {
    filePath = store.get("filePath");
    if (filePath != undefined && filePath != null && filePath != "") {
        event.reply("OpenFile", filePath);
    } else {
        // do not open during testing
        if (process.argv.length >= 2 && process.argv[process.argv.length-1] != ".") {
            event.reply("OpenFile", process.argv[process.argv.length-1]);
        } else {
            event.reply("NewFile");
        }
    }
});

async function handleWriteFile(event, data) {
    return fs.writeFileSync(data.path, data.content, data.options);
}

ipcMain.handle("WriteFile", handleWriteFile);

async function handleReadFile(event, path) {
    return fs.readFileSync(path, "utf-8");
}

ipcMain.handle("ReadFile", handleReadFile);

// Dialogs
async function handleShowMessageBox(event, args) {
    return await dialog.showMessageBox(win, args);
}

ipcMain.handle("showMessageBox", handleShowMessageBox);

async function handleShowOpenDialog(event, args) {
    return await dialog.showOpenDialog(win, args);
}

ipcMain.handle("showOpenDialog", handleShowOpenDialog);

async function handleShowSaveDialog(event, args) {
    return await dialog.showSaveDialog(win, args);
}

ipcMain.handle("showSaveDialog", handleShowSaveDialog);

ipcMain.on("PopMenu", (event) => {
    const menu = Menu.buildFromTemplate([
        {
            label: i18n.__("New"),
            click () {  sendReq("NewFile"); }
        }, {
            label: i18n.__("Open"),
            click () {  sendReq("OpenFile");    }
        }, {
            label: i18n.__("Save"),
            click () {  sendReq("SaveFile");    }
        }, {
            label: i18n.__("Save As"),
            click () {  sendReq("SaveAsFile");  }
        }, {
            type: "separator"
        }, {
            label: i18n.__("Export Image"),
            click () {  sendReq("ExportImage"); }
        }, {
            label: i18n.__("Undo"),
            click () {  sendReq("Undo");    }
        }, {
            label: i18n.__("Redo"),
            click () {  sendReq("Redo");    }
        }, {
            label: i18n.__("Clear"),
            click () {  sendReq("Clear");    }
        }
    ]);
    menu.popup();
});

async function handleReadI18n(event, key) {
    return i18n.__(key);
}

ipcMain.handle("ReadI18n", handleReadI18n);
