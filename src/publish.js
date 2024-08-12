async function runPython(code) {

    const serialised = await compressWorker(serialiseWorker(code));
    const playgroundUrl = `https://workers.cloudflare.com/playground/static#${serialised}`;
    console.log(playgroundUrl);
    document.getElementById('html-preview').src = playgroundUrl;
}

async function compressWorker(worker) {
    const serialisedWorker = new Response(worker);
    return LZString.compressToEncodedURIComponent(
        `${serialisedWorker.headers.get("content-type")}:${await serialisedWorker.text()}`
    );
}

function serialiseWorker(code) {
    const formData = new FormData();

    const metadata = {
        main_module: "index.html",
    };

    formData.set(
        "index.html",
        new Blob([code], {
            type: "application/javascript"
        }),
        "index.html"
    );

    formData.set(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );

    return formData;
}

