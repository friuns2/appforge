
import('./gptapi.js');




let oldSettingsValue;

let chat  = {
    ...chatMore,
    settings,
    messages: [],
    globalThis:globalThis,
    document:document,
    matchedTags:[],
    abortController: null,
    get isMobile() { return this.isFullScreen || window.innerWidth <= 1024; },
    newMessage: '',
    editor: null,
    editorFiles: [{ name: 'index.html', content: '',hidden:false }],
    activeEditorTab: 0, 
    keywords: [],
    get contact () {
        return this.settings.contacts.find(a => a.name === this.params.activeContact)|| this.settings.contacts.find(a => a.name === "Devin");
    },        
    watch:{
        newMessage(newVal){
            this.$refs.messageInput.rows = Math.min(5, (newVal.split('\n').length + (newVal.split('\n').some(line => line.length > 20) ? 1 : 0)));
        }
    },
    params: {
        activeTab: 'chat',
        chatId:"",
        url:"",
        prompt:"",
        activeContact:"Web App"
    },
    isFullScreen:false,
    previousChats: [],
    async mounted() {
        while (!globalThis.HfInference) await new Promise(resolve => requestAnimationFrame(resolve));

        if(!this.params.chatId)
            this.params.chatId = new Date().getTime().toString();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleFullScreen();
            }
        });
        chat.initMonaco();
       
        this.loadPreviousChats();        
        if(this.params.url)
        {
            OpenFromUrl(decodeURIComponent(this.params.url));
            this.params.url = "";
        }
        if(this.params.prompt)
        {
            this.newMessage = this.params.prompt;
            this.params.prompt = "";
            requestAnimationFrame(() => this.sendMessage());
        }
        this.toggleTheme();
    },
    OpenDirectory: LoadFolder,
    toggleTheme(isDarkTheme = this.settings.isDarkTheme) {
        this.settings.isDarkTheme = isDarkTheme;
        document.documentElement.setAttribute('data-theme', this.settings.isDarkTheme ? 'dark' : 'light');
        
    },
    toggleFullScreen(tab) {
        this.isFullScreen = !this.isFullScreen;
        tailwind.config = { theme: { extend: { screens: {  lg: this.isFullScreen ? '12224px' : '1024px', } } } }
        if(tab)
            this.setActiveTab(tab);
        this.editor.layout({height: 0, width: 0})
        requestAnimationFrame(() => this.editor.layout());
    },
    setActiveTab(tab) {        
        this.params.activeTab = tab;    
    },
    async handleSuggestionClick(suggestion) {
        this.newMessage = '';
        for (const char of suggestion.content||suggestion.tooltip||suggestion.name) {
            this.newMessage += char;
            await new Promise(resolve => setTimeout(resolve, 5));
        }
    },
    initMonaco() {     
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            this.OnEditorLoaded();
        });

        
    }
    ,
    async OnEditorLoaded(){
        let options={
            value: '',
            language: 'html',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false }, 
            readOnly: this.isMobile,
            domReadOnly: this.isMobile
        }
        this.editor = monaco.editor.create(document.getElementById('monaco-editor'), options);
        this.editor.onDidChangeModelContent(() => {
            const updatedContent = this.editor.getValue();
            const activeFile = this.editorFiles[this.activeEditorTab];
            
            if (activeFile) {
                activeFile.content = updatedContent;
            }

            const fileData = this.editorFiles
                .filter(file => !file.isBinary)
                .map(file => {
                    const isHtml = file.name.endsWith('.html');
                    const type = isHtml ? 'text/html' : file.name.endsWith('.js') ? 'application/javascript' : 'text/plain';
                    const CONTENT = !isHtml ? file.content : `
                        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
                        <script src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
                        <script src="../../errorsForward.js"></script>
                        <script src="../../output.js"></script>
                    `+ file.content ;
                    return {
                        name: file.name,
                        type,
                        buffer: new TextEncoder().encode(CONTENT).buffer
                    };
                });
            this.UploadFiles(fileData);
            this.lastActiveFile = activeFile.name.toLowerCase().endsWith('.html') && activeFile || this.lastActiveFile;              
            if (this.lastActiveFile) 
                this.updatePreview(this.lastActiveFile);
        });

        this.editor.addAction({
            id: 'toggle-edit',
            label: 'Toggle Edit',
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1,
            run: () => {
                options.readOnly = options.domReadOnly= !options.readOnly;
                this.editor.updateOptions(options);
            }
        });

        await this.loadChat(this.params.chatId);
    }
    ,    
    async bookmarkChat() {
        localStorage.removeItem(`chat_${this.params.chatId}`);
        if (this.params.chatId.startsWith('f')) {
            this.params.chatId = this.params.chatId.slice(1);
        } else {
            this.params.chatId = 'f' + this.params.chatId;
        }
        this.saveChat();

        
        this.loadPreviousChats();
        try {
            const response = await fetch(`${apiUrl}/like/${this.params.chatId}?admin=true`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to bookmark chat');
            }
            const result = await response.json();
            console.log(result.message);
        } catch (error) {
            console.error('Error bookmarking chat:', error);
        }
    },
    UploadFiles(fileData) {
        navigator.serviceWorker?.controller.postMessage({
            action: 'uploadFiles',
            chatId: this.params.chatId,
            files: fileData
        });

        setTimeout(() => {
            manifest.short_name = manifest.name = this.getChatTitle();
            navigator.serviceWorker?.controller.postMessage({
                action: 'uploadFiles',
                chatId: this.params.chatId,
                files: [{ name: 'manifest.json', type: 'application/json', buffer: new TextEncoder().encode(JSON.stringify(manifest)).buffer }]
            });
        }, 500);
    },
    lastActiveFile:null,
    touch:new Set(),

    setActiveEditorTab(index) {
        chat.setActiveTab('editor');
        chat.activeEditorTab = index;        
        chat.updateEditorContent();
    },
    async updateEditorContent() {
        if (this.editor && this.editorFiles.length > 0) {
            const activeFile = this.editorFiles[this.activeEditorTab];            
            this.editor.setValue(activeFile.content);
            const fileExtension = activeFile.name.split('.').pop().toLowerCase();
            const languageMap = {
                'js': 'javascript',
                'html': 'html',
                'css': 'css',
                'py': 'python',
            };
            const language = languageMap[fileExtension] || 'plaintext';
            monaco.editor.setModelLanguage(this.editor.getModel(), language);
        }        
    }, 
    promptInstall() {
        document.head.querySelector('link[rel="manifest"]')?.remove();
        document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'manifest', href: 'preview/' + chat.params.chatId + '/manifest.json' }));
    },
    get previewFrame () {
        return document.getElementById('html-preview');
    },
    updatePreview(htmlFile) {
        let previewContent = htmlFile.content;
        let loadingChat = this.loadingChat;
   
        
        this.previewFrame.contentWindow.postMessage({ type: 'html', value: previewContent }, '*');
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {            
            if (navigator.serviceWorker) {
                console.log("load full page");
                this.previewFrame.src = "preview/" + chat.params.chatId + '/' + htmlFile.name;
                // Add this: Update chat title after preview loads
                this.previewFrame.onload = () => {
                    if(!loadingChat)
                        this.saveChat(); // This will update the title                                    
                };
            }
        }, chat.abortController ? 2000 : 300);
    },
    resendMessage(message) {
        const selectedIndex = this.messages.findIndex(msg => msg === message);
        if (selectedIndex !== -1) {
            const selectedMessage = this.messages[selectedIndex];
            this.messages = this.messages.slice(0, selectedIndex);
            this.newMessage = selectedMessage.content;
            this.sendMessage();
        }
    },
    
    copyMessage(message) {
        navigator.clipboard.writeText(message.contentFull||message.content);
    },
    getChatTitle() {
        const previewFrame = document.getElementById('html-preview');
        let title = previewFrame.contentWindow.document.title;
        if (!title || title === '') {
            // If no title, use the first few words of the first message
            const firstMessage = this.messages.find(msg => msg.role === 'user');
            title = firstMessage ? firstMessage.content.split(' ').slice(0, 5).join(' ') + '...' : '';
        }
        document.title = title;
        return title;
    },

    loadPreviousChats() {
        this.previousChats = Object.keys(localStorage)
            .filter(key  => key.startsWith('chat_'))
            .sort((a, b) => b.localeCompare(a))
            .slice(0, 10)
            .map(key => JSON.parse(localStorage.getItem(key)))
    },
    loadingChat:false,
    async loadChat(chatId) {
        this.loadingChat = true;
        setTimeout(() => this.loadingChat = false, 0);
        let chatData = JSON.parse(localStorage.getItem(`chat_${chatId}`));
        chatData = chatData || await fetch(`https://api.tmrace.net/getChat?id=${chatId}`).then(a => a.json());
        if (chatData) {
            this.params.chatId = chatData.id || new Date().getTime().toString();  //in prod use commented code
            this.messages = chatData.messages;
            
            this.editorFiles = chatData.editorFiles;
            this.contact.suggestions = chatData.suggestions;
            this.params.activeContact = chatData.activeContact || "App Dev";
            this.updateEditorContent();
        }
        
    },
    saveChat() {
        // Don't save untitled chats
        //if (this.getChatTitle() === 'Untitled Chat') return;

        const chatData = {
            id: this.params.chatId,
            messages: this.messages,
            timestamp: new Date().toISOString(),
            title: this.getChatTitle(),
            editorFiles: this.editorFiles,
            suggestions: this.contact.suggestions,
            activeContact: this.params.activeContact,
            
        };
        localStorage.setItem(`chat_${this.params.chatId}`, JSON.stringify(chatData));
        this.loadPreviousChats();
        UploadChat();
    },
    startNewChat() {
        location.href = "/";
    },
    

    stopProcessing() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    },
    
    continueMessage(message) {
        this.messages = this.messages.slice(0, this.messages.indexOf(message) + 1);
        this.sendMessages(true);
    },
    async sendMessages(continueMessage) {
        this.touch.clear();
        this.stopProcessing();
        this.abortController = new AbortController();

        const botMessage = continueMessage ? this.messages.last() : {
            role: 'assistant',
            content: '',
            contentFull: '',
            error: null,
            files: [],
            variants: Array.from({ length: this.settings.variantCount }, () => ({ content: '', contentFull: '', error: null, files: [] })),
            activeVariant: 0
        };
        
        if (!continueMessage)      
            this.messages.push(botMessage);

        const filesToPrepend = this.editorFiles.filter(a => !a.hidden && a.content.trim()).map(file => ({
            role: 'assistant',
            content: `# ${file.name}\n\`\`\`${languageMap[file.name.split('.').pop().toLocaleLowerCase()]}\n${file.content}\n\`\`\``
        }));
        let messages = this.messages.filter(msg => msg != botMessage);
        

        await Promise.all(Array.from({ length: this.settings.variantCount }, async (_, index) => 
        {

            let retryCount = 0;
            const maxRetries = 6;
            let variant = botMessage.variants[index];
            let examples = this.matchedTags?.length > 0 &&
            {
                role: "system",
                content: "Examples:" + this.matchedTags.slice(0, 3).map(a => 
                    "\n<example>\n<user>\n" + a.reverseEngineeredPrompt + "\n</user>\n<assistant>\n" + 
                    (a.category == "Document" ? a.content : "# index.html\n```html\n" + a.content + "\n```") + 
                    "\n</assistant>\n</example>\n"
                ).join("")
            } 
            while (retryCount < maxRetries) {
                if (variant.contentFull)
                    variant.contentFull = variant.contentFull.trim().split('\n').slice(0, -2).join('\n') + "\n";

                let renderMessages = [
                    this.contact.systemPrompt || this.contact.description && { content: this.contact.description, role: "system" }, 
                    this.contact.welcomeMessage && { content: this.contact.welcomeMessage, role: "assistant" },
                    examples,
                    ...messages.slice(0, -1),
                    ...filesToPrepend,
                    ...(this.contact.append && !continueMessage && !retryCount ? [this.contact.append] : []),
                    messages.last(),
                    variant.contentFull && { content: variant.contentFull, role: "assistant" }
                ].filter(a => a);       
                
                try {
                    for await (const content of getChatGPTResponse({ messages: renderMessages, signal: this.abortController.signal })) {
                        variant.contentFull += content.delta.content;
                        
                        if(botMessage.activeVariant == index)
                            this.setActiveVariant(botMessage, index);
                    }
                    break; // Exit retry loop if successful
                } catch (error) {
                    console.error('Error generating message, retrying...', error);
                    retryCount++;
                    if (retryCount === maxRetries || error.name === 'AbortError') {
                        console.error('Max retries reached. Unable to generate message.');
                        this.abortController = null;
                        variant.error = error.message;
                        return;
                    }
                }
            }

            if (variant.files.length > 0)
                this.setActiveTab('preview');
        }));        
        this.matchedTags?.push(...this.matchedTags.splice(0, 3)); 
        console.log(botMessage.contentFull);
        this.generateSuggestions(botMessage.content.trim()||botMessage.contentFull);
        
        this.abortController = null;
    },    
    async setActiveVariant(message, index) {
        message.activeVariant = index;
        let variant = message.variants[index]
        var { files, messageWithoutCodeBlocks } = await parseFilesFromMessage(variant.contentFull);
        if (files.length > 0) 
            variant.files = files;

        message.content = variant.content= messageWithoutCodeBlocks;
        message.contentFull = variant.contentFull;
        message.error = variant.error;
        if (variant.files && variant.files.length > 0) {
            if (!chat.editorFiles) {
                chat.editorFiles = variant.files;
            } else {
                variant.files.forEach(newFile => {
                    const existingFileIndex = chat.editorFiles.findIndex(file => file.name === newFile.name);
                    const isNewFile = existingFileIndex === -1;

                    if (isNewFile || newFile.content.trim() !== '') {
                        if (isNewFile) {
                            chat.editorFiles.push(newFile);
                        } else {
                            chat.editorFiles[existingFileIndex] = newFile;
                        }

                        if (!chat.touch.has(newFile.name)) {
                            if (chat.params.activeTab != "preview")
                                chat.setActiveEditorTab(isNewFile ? chat.editorFiles.length - 1 : existingFileIndex);
                            chat.touch.add(newFile.name);
                        }
                    }
                });
            }
            chat.editorFiles.forEach(file => file.hidden = !variant.files.some(variantFile => variantFile.name === file.name));

            await chat.updateEditorContent();
        }
    },
   
    renderMessage(content) {
        const rawHtml = marked.parse(content||'');
        //return DOMPurify.sanitize(rawHtml);
        return rawHtml;
    },
    createNewFile() {
        const fileName = prompt("Enter the name for the new file:", "example");
        if (!fileName) return;
        this.editorFiles.push({ name: fileName, content: '', language: fileName.split('.').pop().toLowerCase(),hidden:false });
        this.updateEditorContent();
    },
    closeFile(file) {
        file.hidden = true;
        this.updateEditorContent();
    },
    renameFile(index) {
        const file = this.editorFiles[index];
        const newName = prompt(`Enter new name for ${file.name}:`, file.name);
        if (newName && newName !== file.name) {
            this.editorFiles[index].name = newName;
            this.updateEditorLanguage(newName);
        }
    },
    updateEditorLanguage(fileName) {
        if (this.editor) {
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            const language = languageMap[fileExtension] || 'plaintext';
            monaco.editor.setModelLanguage(this.editor.getModel(), language);
        }
    },
    editMessage(message) {
        const newContent = prompt("Edit message:", message.content);
        if (newContent !== null && newContent !== message.content) {
            message.content = newContent;
            this.saveChat();
        }
    },



    deleteMessage(message) {
        this.messages.splice(this.messages.findIndex(msg => msg === message), 1); 
       // this.renderMessages.splice(this.renderMessages.findIndex(msg => msg === message), 1); 
        //this.saveChat();
    },
    async sendMessage() {
        let newMessage = this.newMessage;
        this.newMessage = '';
        if (!newMessage.trim()) return;

        const userMessage = { id: this.messages.length + 1, role: 'user', content: newMessage };
        this.messages.push(userMessage);
        if (!this.matchedTags.length) {
            await this.getMatchedTags(newMessage);
        }
        await this.sendMessages();
        this.saveChat();
    },
    ShareChat(){
        let urlIndex = window.location.href.lastIndexOf('/') ;

        if(!navigator.share)
            this.newMessage =  'https://aidark.net' + window.location.href.substring(urlIndex);
        navigator.share({
            title:  this.getChatTitle(),
            url: 'https://aidark.net' + window.location.href.substring(urlIndex),
            text: this.getChatTitle()
        });
    },
    async getMatchedTags(newMessage) {
        
        if(this.params.activeContact=="None")
            return;
        if (this.settings.disableExamples) {
            for (let example of this.settings.disableExamples) {
                let text = await fetch(example.file).then(a=>a.text());
                return this.matchedTags = [{content:text,reverseEngineeredPrompt:example.user}];
            }
        }

        let database = await getDatabase();
        let {keywords, category} = await this.pickRelevantKeywords([this.getChatTitle(), newMessage].join(", "), await getMostUsedKeywords());

        this.params.activeContact = category;
        if(this.params.activeContact != this.contact.name) //question or greeting
            return;
        

        console.log("keywords",keywords);
        let keywordCount = Object.values(database).flatMap(item => item.keywords)
            .reduce((acc, keyword) => ({ ...acc, [keyword]: (acc[keyword] || 0) + 1 }), {});

        let contentMatches = [];
        for (let key in database) {
            let item = database[key];
            if(item.category != this.params.activeContact && item.category != "Document")
                continue;
            let matchCount = 0;
            for (let keyword of item.keywords) {
                let maxSimilarity = 0;
                keywords.forEach(k => {
                    const similarity = jaccardSimilarity(k, keyword);
                    if (similarity > maxSimilarity) {
                        maxSimilarity = similarity;
                    }
                });
                if (maxSimilarity)
                    matchCount += maxSimilarity / keywordCount[keyword];
            }

            matchCount /= Math.sqrt(Math.sqrt(Math.sqrt(item.keywords.length)));
            contentMatches.push({ key, ...item, matchCount });

        }
        contentMatches.sort((a, b) => b.matchCount - a.matchCount);
        contentMatches.splice(10);
        console.log(contentMatches.map(a => a.fileName));

        this.matchedTags = contentMatches;
    },
    async pickRelevantKeywords(phrase, keywords) {

        const prompt = `Identify and return the 20 most relevant keywords from the given list that are closely related to the following phrase. Exclude any terms that are overly broad or only loosely related. Focus on the central theme of the phrase and choose a subset of keywords that are most directly applicable.
    For the purpose of this task, relevance and centrality will be determined based on the degree to which the keywords reflect the main ideas and concepts conveyed by the phrase. We will prioritize nouns and verbs over other parts of speech, and we will aim to return a diverse set of keywords that capture the different aspects of the phrase. 
    Also, determine the category that best describes what the user is asking for, choosing from the following options: Web App, Website, Web Game, Greeting, Question. Return the keywords and category in the following JSON format:
    {
      "keywords": "keyword1, keyword2, ...",
      "category": "category"
    }
    
    Keywords list: ${keywords.join(', ')}
    
    Phrase: "${phrase}"
    `
        console.log(prompt);

        try {
            
            const response = getChatGPTResponse({

                messages: [{ role: "user", content: prompt }],
                max_tokens: 100,
                temperature: Math.random() / 10,
            });
            let content;
            for await (const chunk of response) {
                if (chunk.message?.content) {
                    content = chunk.message.content;
                }
            }
            console.log("Relevant keywords:", content);
            const jsonString = content.match(/\{.*\}/s)[0];
            let { keywords, category } = JSON.parse(jsonString);

            keywords = keywords.split(',').map(keyword => keyword.trim()).slice(0, 20);
            return {keywords, category};
        } catch (error) {
            console.error("Error in API call:", error);
            return {};
        }
    }

  
};
const { data, methods, mounted, watch } = InitVue(chat, { mounted: chat.mounted,watch:chat.watch });

let vue = chat = new Vue({
    el: '#app',
    data,
    methods,
    watch,
    mounted
});


resolveSettingsPromises(chat.functions).then(a => {
    chat.functions = a;
    console.log("Settings resolved", a);
  });
  