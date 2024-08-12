

(new function() {

    let html =document.documentElement.outerHTML 
    
    if (globalThis.errorsForward) 
        return;
    globalThis.errorsForward = true;
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    originalConsoleLog("forward loaded");
    let lastFetch;
    
  
    let googlemaps;
    
    function OnHeadInited() {
        originalConsoleLog("OnHeadInited");
        if (!document.querySelector('script[src*="vue"]')) {
            const vueScript = document.createElement('script');
            vueScript.src = 'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js';
            document.head.appendChild(vueScript);
            originalConsoleLog("Added vue");
        }
        if (!document.querySelector('link[href*="tailwind"]') && !document.querySelector('script[src*="tailwind"]')) 
        {
            const tailwindScript = document.createElement('script');
            tailwindScript.src = 'https://cdn.tailwindcss.com';
            document.head.appendChild(tailwindScript);
            tailwindScript.onload = () => {
                tailwind.config = {
                    corePlugins: {
                        preflight: false,
                    }
                }
            }
            originalConsoleLog("Added tailwind");
        }
        /*
        if (!document.querySelector('link[href*="daisy"]')) {
            const daisyLink = document.createElement('link');
            daisyLink.href = 'https://cdn.jsdelivr.net/npm/daisyui@3.1.0/dist/full.css';
            daisyLink.rel = 'stylesheet';
            daisyLink.type = 'text/css';
            document.head.appendChild(daisyLink);
        }*/
        if (document.querySelector('script[src*="huggingface"]')) {
            
            originalConsoleLog("Hugging Face script detected");
        }
        
        if (googlemaps) {
            let callback = googlemaps.src.split('callback=')[1]?.split('&')[0] || '';
            
            // Get all scripts in body and delay execution
            const bodyScripts = document.body.getElementsByTagName('script');
            const scriptContents = [];

            for (let i = 0; i < bodyScripts.length; i++) {
                if (bodyScripts[i].src) {
                    const script = document.createElement('script');
                    script.src = bodyScripts[i].src;
                    scriptContents.push(script);
                } else {
                    scriptContents.push(bodyScripts[i].innerHTML);
                }
                bodyScripts[i].remove();
            }
            LoadMaps(()=>{
                scriptContents.forEach(content => {
                    if (typeof content === 'string') {
                        const script = document.createElement('script');
                        script.innerHTML = content;
                        document.body.appendChild(script);
                    } else {
                        document.body.appendChild(content);
                    }
                });
                setTimeout(() => {
                    globalThis[callback ?? "initMap"]?.();
                }, 0);
            });
        }

        document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' }));
    }
    


    let oldInitializeApp;
    let PhotonConstructor;

    function HandleNode(node) {

        if (node.tagName === 'SCRIPT') {
            if (node.src && node.src.includes('https://maps.googleapis.com/maps/api/js?')) {
                googlemaps = node;
                node.remove();
            }
            node.onerror = () => {
                displayErrorToast("404 Not Found", node.src?.replace(location.origin, ''));
            }
        }
        if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
            node.onerror = () => {
                displayErrorToast("Could not load stylesheet, don't use integrity or crossorigin", node.href);
            };
        }
     

    }
    //                                                                      MutationObserver
    const observer = new MutationObserver(function (mutations) {
        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                for (let node of mutation.addedNodes) {
                    if (node.nodeName === 'BODY') {
                        OnHeadInited();
                    }
                    if(node.nodeType !== Node.ELEMENT_NODE)
                        continue;
                    HandleNode(node);
                }
            }
        }

        if (globalThis.firebase && !oldInitializeApp) {

            originalConsoleLog("Firebase has been loaded. " + firebase);
            oldInitializeApp = globalThis.firebase.initializeApp;
            globalThis.firebase.initializeApp = function (config) {

                if (globalThis.firebase.firestore) {
                    const originalFirestore = firebase.firestore;
                    globalThis.firebase.firestore = function () {
                        const fsInstance = originalFirestore.apply(this, arguments);
                        const originalCollection = fsInstance.collection;
                        fsInstance.collection = function (name) { 
                            const url = new URL(location.href);
                            const dirname = document.title || url.pathname.split('/').slice(-2, -1)[0]; //TODO remove document title from production, use publish for sharing
                            let col = originalCollection.call(this, dirname + name);
                            const originalDoc = col.doc;
                            col.doc = function (...args) { //patch FieldValue
                                const docRef = originalDoc.apply(this, args);
                                const originalUpdate = docRef.update;
                                docRef.update = async function (data) {
                                    const processedData = {};
                                    for (const [key, value] of Object.entries(data)) {
                                        if (typeof value === 'function') {
                                            // This is a FieldValue
                                            const currentValue = await docRef.get().then(doc => doc.data()?.[key]);
                                            processedData[key] = await value(currentValue);
                                        } else {
                                            processedData[key] = value;
                                        }
                                    }
                                    return originalUpdate.call(this, processedData);
                                };
                                return docRef;
                            };
                            return col;
                        };
                        return fsInstance;
                    };
                    if (!firebase.firestore.FieldValue) {
                        firebase.firestore.FieldValue = {
                            serverTimestamp: function () {
                                return new Date();
                            },
                            delete: function () {
                                return null;
                            },
                            increment: function (n) {
                                return function (current) {
                                    return (current || 0) + n;
                                };
                            },
                            arrayUnion: function (...elements) {
                                return function (current) {
                                    if (!Array.isArray(current)) {
                                        current = [];
                                    }
                                    return [...new Set([...current, ...elements])];
                                };
                            },
                            arrayRemove: function (...elements) {
                                return function (current) {
                                    if (!Array.isArray(current)) {
                                        return [];
                                    }
                                    return current.filter(item => !elements.includes(item));
                                };
                            }
                        };
                        originalConsoleLog("Firebase FieldValue polyfill added");
                    }
                }
                var firebaseConfig = { apiKey: "AIzaSyAf0CIHBZ-wEQJ8CCUUWo1Wl9P7typ_ZPI", authDomain: "gptcall-416910.firebaseapp.com", projectId: "gptcall-416910", storageBucket: "gptcall-416910.appspot.com", messagingSenderId: "99275526699", appId: "1:99275526699:web:3b623e1e2996108b52106e" };
                return oldInitializeApp(firebaseConfig);
            }






        }
        if (globalThis.Photon && !PhotonConstructor) {
            originalConsoleLog("Photon has been loaded. " + globalThis.Photon);
            PhotonConstructor = globalThis.Photon.LoadBalancing.LoadBalancingClient;
            globalThis.Photon.LoadBalancing.LoadBalancingClient = Object.assign(function (protocol, appId) {
                return new PhotonConstructor(protocol, "36ad7218-349f-4f3d-b570-0093d61e9349");
            }, PhotonConstructor);
        }

    });
    observer.observe(document, { childList: true, subtree: true });


    const displayedErrors = new Set();

    const displayErrorToast = async (...args) => {

        let message = args.map(a => a?.message || a).join(' ').substring(0, 300);
        if (lastFetch) {
            try {
                const text = await (await fetch(lastFetch.input, lastFetch.init)).text();
                message += `\n fetch returned: ${text.substring(0, 300)}`;
                lastFetch="";
            } catch (e) {
            }
        }
       
        if (message.includes?.("The query requires an index"))
            message += "\nThe query requires an index, don't use compound or complex queries, they ar not supported";

        if (message.includes?.("google is not defined"))
            message += "\n Please define initMap function globaly";

        if (/example\.com|dummy|placeholder/.test(message))
            message += "\n do not use placeholders in your code, use the real url to api (eg. firebase)";
        
        if(args[1]?.includes?.("getElementById") || message.includes?.("mapDiv"))
            message += "\n instead of v-if use v-show";


        message = message?.replace("does not seem to support chat completion", "");

        if (displayedErrors.has(message)) {
            return;
        }

        displayedErrors.add(message);
        originalConsoleLog("displayErrorToast", args);
        let isLog = args[0] == "Log: ";
        if(!isLog)
            window.parent.postMessage({ error: true, lastError: true, message: Array.from(displayedErrors).join('\n') }, '*');
        try {
            Toastify({
                text: message,
                duration: 3000,
                gravity: "top",
                position: 'right',
                backgroundColor: isLog ? "blue" : "red",
                onClick: () => {
                    window.parent.postMessage({ error: true, message: Array.from(displayedErrors).join('\n') }, '*');
                }
            }).showToast();
        }
        catch (e) {
            originalConsoleLog("Error in displayErrorToast", e);
        }
    };

    window.addEventListener('error', event => {
        if (event instanceof ErrorEvent) handleError(event.error, event.filename, event.lineno);
    });

    function handleError(error, filename, lineno) {
        if (error.message == "google is not defined" && globalThis.initMap) return;
        
        const stackLines = error?.stack?.split('\n');
        
        const stackLine = stackLines && stackLines[(stackLines.findIndex(line => line.includes('errorsForward.js')) + 1) ||1];
        const match = stackLine?.match(/(http.*?):(\d+):\d+/);
        
        const [file, line] = match ? [match[1], match[2]] : [filename, lineno];
        if (file && line)
             logFileErrorDetails(file, line, error.message); 
        else 
             displayErrorToast("Fix Error:", error.message??error);
    }

    function logFileErrorDetails(file, line, message) {
        originalFetch(file)
            .then(res => res.text())
            .then(content => {
                const lineContent = content.split(/\r\n|\n/)[line - 1];
                displayErrorToast("Fix Error:", message, file.split('/').pop(), lineContent?.substring(0, 100) || "");
            })
            .catch(err => { });
    }
    function cleanStack(stack) {
        if (!stack) return '';
        const filteredLines = stack.split('\n').slice(stack.split('\n').findIndex(line => line.includes('errorsForward.js')) + 1);
        return filteredLines.slice(0, 2).map(line => {
            const match = line.match(/(?:\(|at\s+)(.+?):(\d+):\d+/);
            return match ? `    at ${match[1].split('/').pop()}:${match[2]}` : line;
        }).join('\n');
    }

    window.addEventListener('unhandledrejection', event => {
        event.preventDefault();
        handleError(event.reason, event.reason?.fileName, event.reason?.lineNumber);
      //  displayErrorToast("Unhandled Promise Rejection:", event.reason, cleanStack(event.reason?.stack));
    });



    function appendFavicon(iconUrl) {
        let link = document.createElement('link');
        link.rel = 'icon';
        link.href = iconUrl;
        link.type = 'image/png';
        document.head.appendChild(link);
    }
    let originalFetch = window.fetch;
    function checkProxy(input) {
        let url;
        if (typeof input === 'string') {
            url = input;
        } else if (input instanceof Request) {
            url = input.url;
        } else {
            return true;
        }
        return url.startsWith("https") && !url.includes("localhost") && !url.includes("gptcall.net");
    }
    //todo fix handleError
    window.fetch2 = async function (input, init) {
        lastFetch = { input, init };

        if (checkProxy(input) && (!init?.body || typeof init.body === 'string')) {
            // First, try the original fetch
            try {
                const originalResponse = await originalFetch(input, init);
                if (originalResponse.ok) {
                    return originalResponse;
                }
            } catch (e) {
            }
            // If original fetch fails, use proxy
            let proxyUrl = "https://api.tmrace.net/proxy?url=" + encodeURIComponent(new URL(input instanceof Request ? input.url : input, window.location.href).href) + "&sets=" + encodeURIComponent(JSON.stringify(init || { method: "GET", headers: { 'Content-Type': 'text/html' } }));
            //if (window.location.hostname === "localhost")  proxyUrl += "&forceProxy=true";
            return await originalFetch(proxyUrl);
            
        }

        return await originalFetch(input, init);
    }
    originalFetch('favicon.png').then(() => appendFavicon('favicon.png')).catch(err => { });
    



    function addMobileControls() {
        document.body.insertAdjacentHTML('beforeend', `
  <style>
    .control-panel {
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background-color: rgba(255, 255, 255, 0); /* Make panel fully transparent */
      position: fixed; /* Make the panel overlay */
      bottom: 0; /* Position at the bottom */
    }
    .arrow-keys, .action-keys {
      display: flex;
      flex-direction: column;
      align-items: center;
      user-select: none;
    }
    .row {
      display: flex;
    }
    .key {
      width: 50px;
      height: 50px;
      margin: 5px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 10px;
      user-select: none;
    }
    .key.large {
      width: 110px;
    }
    .active {
      background-color: #ccc;
    }
  </style>
  <div class="control-panel">
    <div class="arrow-keys">
      <div class="row">
        <div class="key" id="up">Up</div>
      </div>
      <div class="row">
        <div class="key" id="left">Left</div>
        <div class="key" id="down">Down</div>
        <div class="key" id="right">Right</div>
      </div>
    </div>
    <div class="action-keys">
      <div class="row">
        <div class="key" id="enter">Enter</div>
        <div class="key large" id="space">Space</div>
      </div>
    </div>
  </div>
`);

        const keys = document.querySelectorAll('.key');

        keys.forEach(key => {
            key.addEventListener('mousedown', function (e) {
                handleKeyInteraction(e);
            });
            key.addEventListener('touchstart', function (e) {
                handleKeyInteraction(e);
            });

            function handleKeyInteraction(e) {
                e.preventDefault(); // Prevents the default mouse or touch event
                key.classList.add('active');
                fireKeyboardEvent('keydown', key.id);
                const holdInterval = setInterval(() => fireKeyboardEvent('keydown', key.id), 1000 / 60);
                const endInteraction = function () {
                    clearInterval(holdInterval);
                    key.classList.remove('active');
                    fireKeyboardEvent('keyup', key.id);
                };
                document.addEventListener('mouseup', endInteraction, { once: true });
                key.addEventListener('touchend', endInteraction, { once: true });
            }
        });
        function fireKeyboardEvent(eventType, keyId) {
            const keyMap = {
                'up': [{ key: 'ArrowUp', keyCode: 38 }, { key: 'w', keyCode: 87 }],
                'down': [{ key: 'ArrowDown', keyCode: 40 }, { key: 's', keyCode: 83 }],
                'left': [{ key: 'ArrowLeft', keyCode: 37 }, { key: 'a', keyCode: 65 }],
                'right': [{ key: 'ArrowRight', keyCode: 39 }, { key: 'd', keyCode: 68 }],
                'enter': [{ key: 'Enter', keyCode: 13 }],
                'space': [{ key: ' ', keyCode: 32 }]
            };

            const additionalKeys = keyMap[keyId];
            if (!additionalKeys) return;

            const createEvent = (keyCode, keyName) => new KeyboardEvent(eventType, {
                bubbles: true,
                cancelable: true,
                keyCode: keyCode,
                code: keyName,
                key: keyName
            });

            additionalKeys.forEach(({ keyCode, key }) => {
                document.dispatchEvent(createEvent(keyCode, key));
            });
        }
    }



    document.addEventListener('DOMContentLoaded', function () {
        originalConsoleLog("Body has been loaded.");
        if (('ontouchstart' in window || navigator.maxTouchPoints) && /keyIsDown|keyPressed|keyDown/i.test(document.body.textContent)) {
            addMobileControls();
        }

    });






    globalThis.sendRequestThroughCROSproxy = function (url, callback) {
        fetch('https://api.gptcall.net/proxy?url=' + encodeURIComponent(url))
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('Network response was not ok');
                }
            })
            .then(data => {
                if (callback) callback(data);
            })
            .catch(() => {
                sendRequestThroughCROSproxy(url, callback); // retry
            });
    }
    //glloooogle maps
    
        function LoadMaps(callback){

            var bypass = function (googleAPIcomponentJS, googleAPIcomponentURL) {
                if (googleAPIcomponentURL.toString().indexOf("common.js") != -1) {
                    var removeFailureAlert = function (googleAPIcomponentURL) {
                        sendRequestThroughCROSproxy(googleAPIcomponentURL, (responseText) => {
                            var anotherAppendChildToHeadJSRegex = /.src=(.*?);\(void 0\)/;
                            var anotherAppendChildToHeadJS = responseText.match(anotherAppendChildToHeadJSRegex);
                            var googleAPItrustedScriptURL = anotherAppendChildToHeadJS[1];
                            var bypassQuotaServicePayload = anotherAppendChildToHeadJS[0].replace(googleAPItrustedScriptURL, googleAPItrustedScriptURL + '.toString().indexOf("QuotaService.RecordEvent")!=-1?"":' + googleAPItrustedScriptURL);

                            var script = document.createElement('script');
                            script.innerHTML = responseText.replace(new RegExp(/;if\(![a-z]+?\).*Failure.*?\}/), ";").replace(new RegExp(/(\|\|\(\(\)=>\{\}\);\S+\?\S+?\()/), "$1true||").replace(anotherAppendChildToHeadJSRegex, bypassQuotaServicePayload);
                            document.head.appendChild(script);
                        });
                    }
                    googleAPIcomponentJS.innerHTML = '(' + removeFailureAlert.toString() + ')("' + googleAPIcomponentURL.toString() + '")';
                } else if (googleAPIcomponentURL.toString().indexOf("map.js") != -1) {
                    var hijackMapJS = function (googleAPIcomponentURL) {
                        sendRequestThroughCROSproxy(googleAPIcomponentURL, (responseText) => {
                            var unknownStatusRegex = /\);default:.*;const.*getStatus\(\);/;
                            var unknownStatusMatch = responseText.match(unknownStatusRegex);
                            var replaceUnknownStatusPayload = unknownStatusMatch[0].substring(0, unknownStatusMatch[0].lastIndexOf("=") + 1) + "1;";

                            var script = document.createElement('script');
                            script.innerHTML = responseText.replace(unknownStatusRegex, replaceUnknownStatusPayload);
                            document.head.appendChild(script);
                        });
                    }
                    googleAPIcomponentJS.innerHTML = '(' + hijackMapJS.toString() + ')("' + googleAPIcomponentURL.toString() + '")';
                } else {
                    googleAPIcomponentJS.src = googleAPIcomponentURL;
                }
            }

            var createAndExecutePayload = function (googleAPIjs) {
                var script = document.createElement('script');
                var appendChildToHeadJS = googleAPIjs.match(/(\w+)\.src=(_.*?);/);
                var googleAPIcomponentJS = appendChildToHeadJS[1];
                var googleAPIcomponentURL = appendChildToHeadJS[2];
                script.innerHTML = googleAPIjs.replace(appendChildToHeadJS[0], '(' + bypass.toString() + ')(' + googleAPIcomponentJS + ', ' + googleAPIcomponentURL + ');');
                document.head.appendChild(script);
            }

            sendRequestThroughCROSproxy('https://maps.googleapis.com/maps/api/js?key=AIzaSyBge1gWq7zcR1FopsposEcXSqZpXtqLHsk&callback=initMap2&libraries=places', (googleAPIjs) => {
                createAndExecutePayload(googleAPIjs);
            });



            
            let timer = null;
            globalThis.initMap2 = function() {
                let geocoder = new google.maps.Geocoder();
                //bug geocoder.geocode fails first time
                geocoder.geocode({ address: "Tetovo" }, (results, status) => {
                    originalConsoleLog("geocode", results, status);
                });
                clearTimeout(timer);
                timer = setTimeout(() => {
                    callback?.();
                }, 1500);
            }


    }
    
    console.log = (...args) => {
        originalConsoleLog(...args);
        displayErrorToast("Log: ", ...args);
    };

    console.error = (...args) => {


        originalConsoleError(...args);
        const error = args.find(arg => arg instanceof Error);

        error ? handleError(error) : handleError(new Error(args));
    };
    window.addEventListener("message", (event) => {
        observer.disconnect();

        const { type, value } = event.data;
        if (type === 'html') {
            document.documentElement.innerHTML = value;
        }
        if(type === 'install'){
            promptInstall();
        }
    });
    

    globalThis.firebaseConfig ||= {};
    let originalRegister = navigator.serviceWorker.register;
    navigator.serviceWorker.register = async function (scriptURL) {
        /*
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
        }
        await originalRegister('../../service-worker.mjs');
        */

        const scriptFileName = scriptURL.split('/').pop();
        return fetch(scriptURL)
            .then(response => response.text())
            .then(code => {
                const message = { action: 'eval', code, scriptFileName };
                navigator.serviceWorker.controller.postMessage(message);
                return {}
            });

    };

});



