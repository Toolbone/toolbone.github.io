function loadScript(url, defer=false) {
    const script = document.createElement('script');
    script.src = url;
    script.defer = defer;
    document.head.appendChild(script);
}

// Load Verovio Toolkit with defer
loadScript("https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js", true);

// Load other libraries
loadScript("https://cdn.jsdelivr.net/combine/npm/tone@14.7.58,npm/@magenta/music@1.23.1/es6/core.js,npm/focus-visible@5,npm/html-midi-player@1.5.0");