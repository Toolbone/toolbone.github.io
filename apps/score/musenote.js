function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
        console.log(`${url} loaded successfully`);
        if (callback) callback();
    };
    script.onerror = () => {
        console.error(`Error loading ${url}`);
    };
    document.head.appendChild(script);
}

// Load Verovio first, then other scripts
loadScript("https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js", function() {
    console.log("Verovio is ready");
    // Verovio is loaded, now load other scripts
    loadScript("https://cdn.jsdelivr.net/combine/npm/tone@14.7.58,npm/@magenta/music@1.23.1/es6/core.js,npm/focus-visible@5,npm/html-midi-player@1.5.0", function() {
        console.log("All other scripts are loaded");
        // Initialize any JavaScript here that depends on the above libraries
    });
});
