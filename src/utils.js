if (!navigator.serviceWorker && !window.location.hostname.startsWith('192')) {
    alert("Error: Service worker is not supported");
  } else {
    (async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
        }
        await navigator.serviceWorker.register('service-worker.mjs');
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    })();
  }

async function parseFilesFromMessage(message) {
    
    
    let files = [];
    let regexHtml = /(?:^|\n)(?:(?:[#*][^\r\n]*?([\w.\-_]+)[^\r\n]*?\n)?\n?```(\w+)\n?(.*?)(?:\n```|$(?!\n)))|(?:<html.*?>.*?(?:<\/html>|$(?!\n)))/gs;
    let match;
    let messageWithoutCodeBlocks = message;
    let correctFormat=false;
    while ((match = regexHtml.exec(message)) !== null) {
        let fileName;
        let content = '';
        if (match[0].startsWith('<html') && !correctFormat) {
            fileName = "index.html";
            content = match[0];
        }
        else if (match[1]) {
            fileName = match[1].trim();
            content = match[3];
            if(!correctFormat)
                files = [];
            correctFormat=true;
        }
        else if(!correctFormat) {
            fileName = match[2] === 'css' ? "styles.css" :
                match[2] === 'javascript' ? "script.js" :
                    match[2] === 'python' ? "script.py" : "index.html";
            content = match[3];
        }
        else 
            continue;
        messageWithoutCodeBlocks = messageWithoutCodeBlocks.replace(match[0],'\n');// "# "+fileName
        if (files.find(a => a.name == fileName)?.content.length > content.length)
            continue;

        files.push({ name: fileName, content,langauge:match[2]||"html" ,hidden:false});



    }

    return { messageWithoutCodeBlocks, files };
}
function extractMeaningfulText(file, minLength = 4, maxLength = 1000, encoding = 'utf-8') {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const uint8Array = new Uint8Array(event.target.result.slice(0, maxLength));
            let meaningfulText = '';
            let currentText = '';
            let consecutiveTextChars = 0;

            for (const byte of uint8Array) {
                if (byte >= 32 && byte <= 126) {
                    currentText += String.fromCharCode(byte);
                    consecutiveTextChars++;
                } else {
                    if (consecutiveTextChars >= minLength) {
                        meaningfulText += currentText.trim() + ' ';
                        if (meaningfulText.length >= maxLength) {
                            break;
                        }
                    }
                    currentText = '';
                    consecutiveTextChars = 0;
                }
            }

            if (consecutiveTextChars >= minLength && meaningfulText.length < maxLength) {
                meaningfulText += currentText.trim();
            }

            resolve(meaningfulText.slice(0, maxLength).trim());
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}



function InitVue(obj, args = {}) {

    let defaultParams = structuredClone(obj.params);
    let updating = false;
    const updateParamsFromHash = (event) => {

        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        for (let key in obj.params) {
            if (!key.startsWith("_"))
                if (hashParams.has(key))
                    try { obj.params[key] = JSON.parse(hashParams.get(key)); } catch (e) { obj.params[key] = hashParams.get(key); }
                else
                    obj.params[key] = defaultParams[key];
        }
    };
    updateParamsFromHash();
    window.addEventListener('hashchange', () => {
        //if (!updating)location.reload();
        updating = false;
    });
    return {
        data: () => {
            //obj = shallowClone(obj)
            for (let key in obj) {
                if (typeof obj[key] === 'function') {
                    delete obj[key];
                }
            }
            obj.data = obj;
            return obj;
        },
        ...args
        ,
        mounted() {
            Object.assign(obj, this);
            args.mounted?.call(obj);
        },
        methods: Object.keys(obj).reduce((methods, key) => {
            if (typeof obj[key] === 'function') {
                methods[key] = obj[key];
            }
            return methods;
        }, {}),
        watch: Object.keys(obj.params || {}).reduce((watchers, key) => {
            if (!key.startsWith("_"))
                watchers["params." + key] = function (newValue) {
                    updating = true;
                    const hashParams = new URLSearchParams(window.location.hash.slice(1));
                    hashParams.set(key, JSON.stringify(newValue));
                    window.location.hash = hashParams.toString();
                };
            return watchers;
        }, args.watch || {})
    };
}

document.querySelectorAll('[data-template]').forEach(dropdown => {
    const template = document.getElementById(dropdown.getAttribute('data-template'));
    if (template) dropdown.appendChild(template.content.cloneNode(true));
});

Array.prototype=Array.prototype
Array.prototype.last = function() {
    return this[this.length - 1];
};
async function resolveSettingsPromises(obj) {
    if (typeof obj === 'function' && obj.constructor.name === 'AsyncFunction') {
      return await obj();
    }
    if (obj && typeof obj.then === 'function') return await obj;
    if (Array.isArray(obj)) return await Promise.all(obj.map(resolveSettingsPromises));
    if (typeof obj === 'object' && obj !== null) {
      const entries = await Promise.all(
        Object.entries(obj).map(async ([k, v]) => [k, await resolveSettingsPromises(v)])
      );
      return Object.fromEntries(entries);
    }
    return obj;
  }

async function getDatabase() {    
    if (!chat.contact.databases) return {};
    if (chat.contact.db) return chat.contact.db;
    let db = await Promise.all(chat.contact.databases.map(async dbPath => (await import(dbPath)).database));
    return chat.contact.db = Object.assign({}, ...db);
}

async function getMostUsedKeywords() {
    const data = await getDatabase();

    const keywords = Object.values(data).map(item => item.keywords).flat();
    const keywordCount = {};
    keywords.forEach(keyword => {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
    });
    chat.keywords = Object.entries(keywordCount).sort(([, countA], [, countB]) => countB - countA);
    return chat.keywords.slice(0, 300).map(([keyword]) => keyword);
}




function jaccardSimilarity(a, b) {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return intersection / union;
};
function deepMerge(target, source) {
    function isObject(item) {   
        return (item && typeof item === 'object' && !Array.isArray(item));
    }
    let output = target;
    for (let key in source) {
        if (isObject(source[key])) {
            if (!(key in target))
                Object.assign(output, { [key]: source[key] });
            else
                output[key] = deepMerge(target[key], source[key]);
        } else {
            try {
                Object.assign(output, { [key]: source[key] });
            } catch (e) { console.log(e) }
        }
    }
    return output;
}
const languageMap = {
    'js': 'javascript',
    'html': 'html',
    'css': 'css',
    'py': 'python',
};