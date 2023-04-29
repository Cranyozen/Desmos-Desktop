const file_filter = [ {name: "Desmos Desktop File", extensions: ["dmdf"] }];

let StateData = {
    filePath: null,
    lastState: null
}

function setStateData(data) {
    StateData.filePath = data.filePath;
    StateData.lastState = data.lastState;
    // updateTitle();
}

function setCaculatorState(des_file_data) {
    // https://www.desmos.com/api/v1.8/docs/index.html?lang=zh-CN#document-saving-and-loading
    state = JSON.parse(des_file_data);
    try {
        calculator.setState(state);
    }
    catch(err) {
        calculator.setBlank();
    }
}


function saveText(text, file){
    window.func.writeFile({path: file, content: text});
}

function updateTitle() {
    if (StateData.filePath)
        if (isSaved()) {
            document.title = "Desmos - " + StateData.filePath;
        } else {
            document.title = "Desmos - * " + StateData.filePath;
        }
    else
        document.title = "Desmos - * Untitled";
}

setInterval(updateTitle, 200);


async function newFile() {
    var canceled = await askIfSaveIfNeed();
    if (!canceled) return;

    calculator.setBlank();
    setStateData( { filePath: null, lastState: null } );
    // updateTitle();
}


async function openFile(filePath=null) {
    if (!(await askIfSaveIfNeed())) { return; }
    if (!filePath) {
        const result = await window.func.showOpenDialog( {filters: file_filter} );
        if (!result.canceled && result.filePaths.length > 0) {
            filePath = result.filePaths[0];
        } else { return; }
    }

    const content = await window.func.readFile(filePath);
    setCaculatorState(content);
    setStateData( { filePath: filePath, lastState: JSON.parse(content) } );
}


async function saveFile() {
    if (isSaved()) { return; }
    if(!StateData.filePath) {
        await saveAsFile();
        return;
    }
    const state = calculator.getState();
    const state_content = JSON.stringify(state);
    setStateData( { filePath: StateData.filePath, lastState: state } );
    saveText(state_content, StateData.filePath);
}


async function saveAsFile() {
    const result = await window.func.showSaveDialog( { filters: file_filter } );
    if (!result.canceled && result.filePath != undefined) {
        setStateData({filePath: result.filePath, lastState: StateData.lastState});
        saveFile();
    }
}

async function exportImage() {
    var image = calculator.screenshot({
        targetPixelRatio: 2
    });
    var image_data = image.replace(/^data:image\/png;base64,/, "");
    const result = await window.func.showSaveDialog({filters: [ {name: "png", extensions: ["png"] }]});
    if (!result.canceled && result.filePath != undefined) {
        window.func.writeFile({path: result.filePath, content: image_data, options: "base64"});
    }
}


function isStateNull() {
    if (StateData.lastState == null && calculator.getState().expressions.list[0].latex === undefined) { return true; }
    else { return false; }
}


function isSaved() {
    if (isStateNull()) { return true; }
    if (!StateData.filePath || !StateData.lastState) { return false; }
    else {
        // console.log(JSON.stringify(calculator.getState()));
        // console.log(StateData.lastState)
        // Only compare expressions
        // MAKE SURE STATE IS OBJECT!!!
        if (JSON.stringify(calculator.getState().expressions) == JSON.stringify(StateData.lastState.expressions)) { return true; }
        else { return false; }
    }
}

async function askIfSaveIfNeed(){
    console.log(await window.func.readI18n("AskSaveTips"));
    if(isSaved()) { return true; }
    const result = await window.func.showMessageBox({
        message: await window.func.readI18n("AskSaveTips"),
        title: await window.func.readI18n("AskSaveTitle"),
        type: "question",
        buttons: [ "Yes", "No", "Cancel"]
    });
    if (result.response == 0) {
        await saveFile();
        return true;
    } else
        if (result.response == 1) { return true; }
        else { return false; }
}

async function exitApp() {
    var exit = await askIfSaveIfNeed();
    if (exit) {
        window.func.exit();
    }
}

window.func.onNewFile((event, arg) => newFile());
window.func.onOpenFile((event, path) => openFile(path));
window.func.onSaveFile((event, arg) => saveFile());
window.func.onSaveAsFile((event, arg) => saveAsFile());
window.func.onExportImage((event, arg) => exportImage());
window.func.onUndo((event, arg) => calculator.undo());
window.func.onRedo((event, arg) => calculator.redo());
window.func.onClear((event, arg) => calculator.setBlank());
window.func.onExitting((event, arg) => exitApp());


window.func.toInit();

// document.ondragover = document.ondrop = (ev) => {
    // ev.preventDefault()
// }
  
// document.body.ondrop = (ev) => {
//     console.log(ev.dataTransfer.files[0].path)
//     ev.preventDefault()
// }
window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    window.func.popMenu();
}, false);
