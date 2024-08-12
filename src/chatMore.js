let chatMore = {
    devConsoleOpen: false,
    toggleEruda() {
        const previewFrame = document.getElementById('html-preview');
        let eruda = previewFrame.contentWindow.eruda;

        if (!eruda) {
            const script = previewFrame.contentWindow.document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/eruda';
            script.onload = () => {
                eruda = previewFrame.contentWindow.eruda;
                eruda.init();
                eruda.show();
                this.devConsoleOpen = true;
            };
            previewFrame.contentWindow.document.body.appendChild(script);
        } else {
            if (this.devConsoleOpen) {
                eruda.hide();
                this.devConsoleOpen = false;
            } else {
                eruda.show();
                this.devConsoleOpen = true;
            }
        }
    },  
    async generateSuggestions(message) {
        const hf = await getHuggingFace();
        const prompt = `Generate 5 coding task suggestions based on the following message: \n"""\n${message}\n"""\nEach suggestion should be brief and concise. Return the suggestions as a JSON array. 

        Example: 
        Input: "I want to create a personal blog."
        Output: [
            {"name": "Create a homepage", "content": "Design a homepage for the blog."},
            {"name": "Implement a comment section", "content": "Add a feature for users to comment on posts."},
            {"name": "Set up a contact form", "content": "Create a contact form for user inquiries."},
            {"name": "Add social media links", "content": "Include links to social media profiles."},
            {"name": "Optimize for SEO", "content": "Implement SEO best practices for better visibility."}
        ]`;

        try {
            const response = await hf.chatCompletion({
                model: "mistralai/Mistral-7B-Instruct-v0.3",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1200,
                temperature: 0.5+Math.random()*0.2,
            });

            const suggestionsJson = response.choices[0].message.content.match(/(\[.*?\])/s)[0];
            this.contact.suggestions = JSON.parse(suggestionsJson);
        } catch (error) {
            console.error('Error generating suggestions:', error);
        }
    },
}




window.addEventListener('dragover', (event) => event.preventDefault());
window.addEventListener('drop', async (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;

    if (files.length) {
        const fileContents = await Promise.all(Array.from(files).map(async (file) => {
            if (file.type === 'application/pdf') {
                const reader = new FileReader();
                reader.onload = function () {
                    const typedarray = new Uint8Array(reader.result);
                    pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
                        let totalPages = pdf.numPages;
                        let text = '';
                        let currentPage = 1;

                        const extractText = function (pageNum) {
                            pdf.getPage(pageNum).then(function (page) {
                                page.getTextContent().then(function (textContent) {
                                    textContent.items.forEach(function (item) {
                                        text += item.str + '\n';
                                    });
                                    if (currentPage < totalPages) {
                                        currentPage++;
                                        extractText(currentPage);
                                    } else {
                                        console.log(text);
                                        chat.editorFiles.push({ name: file.name, content: text, isBinary: false,hidden:false });
                                    }
                                });
                            });
                        };

                        extractText(currentPage);
                    });
                };
                reader.readAsArrayBuffer(file);
            } else {
                const buffer = await file.arrayBuffer();
                const content = new TextDecoder().decode(buffer);
                const isTextFile = file.type.startsWith('text/');
                const existingFile = chat.editorFiles.find(a => a.name === file.name);
                const fileContent = isTextFile ? content : await extractMeaningfulText(file);

                if (existingFile) {
                    existingFile.content = fileContent;
                } else {
                    chat.editorFiles.push({ name: file.name, content: fileContent, isBinary: !isTextFile,hidden:false });
                }
            }
        }));

        chat.updateEditorContent();
        navigator.serviceWorker.controller.postMessage({
            action: 'uploadFiles',
            files: fileContents
        });
    }
});




window.addEventListener('message', function (event) {
    if (event.data.error === true && event.data.message!= "Script error.") {
        let message = event.data.message;
        
            chat.newMessage = message;                        
        
        if(!chat.abortController && !event.data.lastError && !message.includes("Log:"))
        {
            if (globalThis.iframeModal) 
                M.Modal.getInstance(iframeModal).close();
            chat.setActiveTab("chat");
            chat.sendMessage();
        }
    }
});


function UploadChat() {  
    fetch( apiUrl + '/saveChat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            version: 3,
            chatId: chat.params.chatId,
            messages: chat.messages,
            title: chat.getChatTitle(),
            editorFiles: chat.editorFiles,
            donthash:true
        }),
    }).then(response => response.json()).then(data => console.log('Messages sent successfully:', data)).catch((error) => {
        console.error('Error sending messages:', error);
    });
}

let deferredPrompt=null;
window.addEventListener('beforeinstallprompt', (e) => {
    console.log("123")
    e.preventDefault();
    deferredPrompt = e;
    promptInstall();
});

async function promptInstall() { 

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
        //window.close();
        window.location.href = 'preview/' + chat.params.chatId + '/index.html';
    }
    deferredPrompt = null;

}