
async function LoadFolder() {
    const directory = await window.showDirectoryPicker();

    for await (const entry of directory.values()) {
        if (entry.kind === 'file') {
            const file = await entry.getFile();
            const content = await file.text();
            const existingFile = chat.editorFiles.find(f => f.name === entry.name);
            if (existingFile) {
                existingFile.content = content;
            } else {
                chat.editorFiles.push({ name: entry.name, content: content });
            }
        } else if (entry.kind === 'directory') {
            // Recursively sync subdirectories
            const subDirectory = await directory.getDirectoryHandle(entry.name);
            await LoadFolder(subDirectory);
        }
    }
    chat.updateEditorContent();
    const fileData = chat.editorFiles.map(file => ({
        name: file.name,
        type: file.name.endsWith('.html') ? 'text/html' : file.name.endsWith('.js') ? 'application/javascript' : 'text/plain',
        buffer: new TextEncoder().encode(file.content).buffer
    }));
    navigator.serviceWorker.controller.postMessage({
        action: 'uploadFiles',
        files: fileData
    });
}

async function SaveFolder() {
    const directory = await window.showDirectoryPicker();
    for (const file of chat.editorFiles) {
        const fileHandle = await directory.getFileHandle(file.name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file.content);
        await writable.close();
    }
}

async function OpenFile() {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const content = await file.text();
    const existingFile = chat.editorFiles.find(f => f.name === file.name);
    if (existingFile) {
        existingFile.content = content;
    } else {
        chat.editorFiles.push({ name: file.name, content: content,hidden:false });
    }
    chat.updateEditorContent();
}
async function PublishToCloudFlare() {
    
}
async function OpenFromUrl(url = window.prompt('Enter the URL of the site to open, eg https://websim.ai/c/Q9ppwaXcatf2lfMUW')) {

    
    if(!url) return;
    const match = url.match(/\/c\/([a-zA-Z0-9]+)/);
    const id = match ? match[1] : null;
    if (id) {
        const response = await fetch(`https://party.websim.ai/api/v1/sites/${id}/html?origin=https%3A%2F%2FGPTCall.ai`);
        if (response.ok) {
            let htmlContent = await response.text();
            htmlContent = htmlContent.replace(/ w-tid="\d+"/g, '');
            htmlContent = htmlContent.replace(/<base[^>]*>/, '<base href="https://party.websim.ai/">');
            chat.editorFiles = [{ name: `index.html`, content: htmlContent, hidden: false }];
            chat.messages.push({
                role: 'assistant',
                content: ``,
                variants: [{ content: ``, error: null, files: [{ name: `index.html`, content: htmlContent, hidden: false }] }],
                activeVariant: 0
            });
            chat.updateEditorContent();
        } else {
            console.error('Failed to load HTML:', response.statusText);
        }
    }
}

