importScripts('./output.js')
importScripts('./gptapi.js')
importScripts('./webEmu.js')

const CACHE_NAME = 'file-drop-cache';
self.addEventListener('install', function(event) {
    console.log('Service Worker installing...');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker activating...');
    event.waitUntil(self.clients.claim());
});
let title='';

self.addEventListener('fetch', function(event) {
    let request = event.request;
    const url = request.url;
  

    let huggingface = url.startsWith('https://api-inference.huggingface.co') && !request.headers.get('authorization')?.includes('hf_');
    let image = request.headers.get('accept')?.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|ico|tiff|webp)(\?.*)?$/i.test(request.url);
    
    if (url.startsWith(self.location.origin)) {
        if (url.includes('/preview/')) {
            return event.respondWith((async () => {

                const networkResponse = await fetch(request);

                if (networkResponse.status === 404) {

                    
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(request) || await cache.match(new Request(request.url.replace('style.css', 'styles.css'))) || await cache.match(new Request(request.url.replace('scripts.js', 'script.js')));
                    if (cachedResponse && url.includes('preview/') && url.endsWith('/index.html'))
                    {
                        const indexContent = await cachedResponse.text();
                        title = indexContent.match(/<title>(.*?)<\/title>/i)?.[1] || '';
                        return new Response(indexContent, { status: 200, headers: { 'Content-Type': 'text/html' } });
                    }

                    if (cachedResponse && cachedResponse.status === 200)
                        return new Response(cachedResponse.body, { status: 200 });

                    if (image)
                        return Response.redirect(GetRedirectImage(url), 302);

                    throw new Error('Not found' + request.url);

                }
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, networkResponse.clone());
                return networkResponse;
            })().catch(async (e) => {
                console.error(e);
                const cache = await caches.open(CACHE_NAME);
                return await cache.match(request);
            }));
        }
    }
    else {

        if (!huggingface && !image || url.startsWith("https://image.pollinations.ai"))
            return;

        if (image && ["via.placeholder.com", "placekitten.com", "dummyimage.com", "lorempixel.com"/*, "picsum.photos"*/, "placebear.com", "placeimg.com"].some(p => url.includes(p)))       
        {
            console.log("Redirecting image URL:", url)
            return event.respondWith(Response.redirect(GetRedirectImage(url), 302));
        }


        if ([self.location.origin, 'api.gptcall.net', 'api.tmrace.net'].some(domain => request.url.includes(domain))) 
            return;
        if(images[url]){
            if(images[url]!=200)
                return event.respondWith(Response.redirect(images[url], 301));
            else
                return;
        }
        return event.respondWith((async () => {
            
            let sets ={
                headers: Object.fromEntries(request.headers),
                method: request.method,
            };
            
            if (huggingface) {
                sets.headers.authorization = "Bearer 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";
            }
            if (request.body) {
                const reader = request.body?.getReader();
                let text = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    text += new TextDecoder().decode(value);
                }
                sets.body = text;
            }
            if(image) sets.method = 'HEAD';

            let proxyUrl = `https://api.tmrace.net/proxy?url=${encodeURIComponent(url)}&sets=${encodeURIComponent(JSON.stringify(sets))}`;
            const response = await fetch(proxyUrl);
            if (image) {
                console.log(`Image request status: ${response.status}, URL: ${url}`)    
                if (response.status!=200) 
                {
                    //return RedirectImage(url);
                    return Response.redirect(GetRedirectImage(url), 302);
                }
                else{
                    images[url] = 200;
                    return Response.redirect(url, 301);
                }
            }
            const data = await response.blob();            
            console.log("prox2y", url, JSON.stringify(Object.fromEntries(request.headers)));

            return new Response(data, { headers: response.headers });
        })());
    }

    function GetRedirectImage(url) {
        let imageName = url.replace(/^https?:\/\/[^\/]+/, '')
        imageName = imageName.replace(/\W/g, ' ');
        let prompt = [title,imageName].join(' ');
        return 'https://image.pollinations.ai/prompt/'+ encodeURIComponent(prompt);
    }

   
});
let images = {};
 


self.addEventListener('message', function(event) {
    if (event.data.action === 'eval') {
        eval(event.data.code);
    }
    if (event.data.action === 'uploadFiles') {
        uploadFiles(event.data.files, event.data.chatId);
    }
});

async function uploadFiles(files, chatId) {
    const cache = await caches.open(CACHE_NAME);
    const baseUrl = self.registration.scope + 'preview/' + chatId + '/';

    files.forEach(async file => {
        const url = baseUrl + file.name;
        const response = new Response(new Uint8Array(file.buffer), 
        {headers: { 'Content-Type': file.type||"text/plain" }});

        if (file.name === 'index.html') {
            const text = await response.text();
            title = text.match(/<title>(.*?)<\/title>/i)?.[1] || '';
            
            await cache.put(url, new Response(text, { headers: { 'Content-Type': 'text/html' } }));
        }
        else
            await cache.put(url, response);
    });

    
}




