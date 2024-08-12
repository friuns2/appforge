globalThis.apiUrl = (globalThis.isLocal ? "http://localhost:3000/" : "https://api.gptcall.net/");
globalThis.getChatGPTResponse = async function* ({messages,functions,model=settings.model.selected,signal,apiUrl=settings.apiUrl,apiKey=settings.apiKey}) {

    messages  =  messages.map(message => ({
        role: message.role,
        content: message.content,
        name: message.name,
        function_call: message.function_call
    }));
    let body = {
        model: model, 
        messages:messages,
        functions: functions,
        stream: true,
        
        max_tokens:200000/2
     }


    const HF_TOKEN = apiKey ||'kg' + generateHash(JSON.stringify(body));
    const hf = new HfInference(HF_TOKEN);
    const ep = hf.endpoint(apiUrl ||  globalThis.apiUrl); 
    const stream = await ep.chatCompletionStream(body,{signal});
    let combined = {};
    for await (const chunk of stream) {
        if (chunk.choices && chunk.choices.length > 0) {
            combined.message = combineJSON(combined.message, chunk.choices[0].delta);
            combined = { ...combined, ...chunk.choices[0] };
            yield combined;
        }
    }
}


function combineJSON(obj1, obj2) {
    var combinedObj = {};

    for (var key in obj1) {
        if (obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key) && obj1[key] !== obj2[key]) {
            if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
                combinedObj[key] = combineJSON(obj1[key], obj2[key]);
            } else {
                combinedObj[key] = obj1[key] + obj2[key];
            }
        } else {
            combinedObj[key] = obj1[key];
        }
    }

    for (var key in obj2) {
        if (!combinedObj.hasOwnProperty(key)) {
            combinedObj[key] = obj2[key];
        }
    }

    return combinedObj;
}

function generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
    }
    return Math.abs(hash); // Ensure the hash is positive
}