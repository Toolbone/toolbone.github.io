function loadScript(url, defer=false) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.defer = defer;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Sequential loading example using Promises
loadScript("https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js", true)
    .then(() => {
        return loadScript("https://cdn.jsdelivr.net/combine/npm/tone@14.7.58,npm/@magenta/music@1.23.1/es6/core.js,npm/focus-visible@5,npm/html-midi-player@1.5.0");
    })
    .then(() => {
        console.log('All scripts loaded successfully!');
    })
    .catch(error => {
        console.error('Error loading scripts:', error);
    });