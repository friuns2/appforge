import('https://esm.sh/@huggingface/inference').then(({ HfInference }) => {
    globalThis.HfInference = HfInference;
    
});
globalThis.isLocal = window.location.hostname === 'localhost';


let getAlternativeUrlRetryCount = 0;

let keys = ["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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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","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"]
async function getAlternativeUrl(requestUrl) {
    getAlternativeUrlRetryCount++;
    if (getAlternativeUrlRetryCount > 1) {
        throw new Error("Maximum retries reached");
    }

    // Check if the response is cached in localStorage
    const cachedUrl = localStorage.getItem(requestUrl);
    if (cachedUrl) {
        return cachedUrl;
    }

    const hf = await getHuggingFace();
    const response = await hf.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.3",
        messages: [            
            { role: "system", content: "You are an AI assistant that must always provide a complete, valid URL starting with https:// when asked for an alternative URL. No matter what, your response should contain only the URL and nothing else." },
            { role: "user", content: `The URL ${requestUrl} is missing with a 404 error. You must provide a complete, alternative URL to replace it. Begin your response with https:// and include only the URL itself, with no other text.` }],
        max_tokens: 100,
        temperature: 0.5,
    });

    const alternativeUrl = response.choices[0].message.content.trim();
    localStorage.setItem(requestUrl, alternativeUrl);
    if(!alternativeUrl.startsWith("https://")) 
        throw new Error("Alternative URL does not start with https://",alternativeUrl);
    
    return alternativeUrl;
}
async function getHuggingFace() {
    const { HfInference } = await import("https://esm.sh/@huggingface/inference");
    return new HfInference("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");
}