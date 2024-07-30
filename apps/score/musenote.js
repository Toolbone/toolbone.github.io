// main.js
// Load external scripts dynamically
const scripts = [
    "https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js",
    "https://cdn.jsdelivr.net/combine/npm/tone@14.7.58,npm/@magenta/music@1.23.1/es6/core.js,npm/focus-visible@5,npm/html-midi-player@1.5.0"
];

scripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
});

// Your existing code here
document.addEventListener("DOMContentLoaded", (event) => {
    // Your existing JavaScript code goes here
    // Example:
    let playHead = document.getElementById("playHead");
    var vrvToolkit = null;
    var zoom = 30;
    var currentPage = 1;
    var isPause = false;
    let notationElement = document.getElementById("notation");

    var swipe_pages = false;
    var ids = [];
    var pdfFormat = "A4";
    var pdfOrientation = "portrait";
    var savedOptions = undefined;
    var customOptions = undefined;
    var target = "";

    var prevEventTime = 0;

    var midiPlayer;
    var currentTime = 0;

    midiPlayer = document.querySelector('midi-player');
    midiPlayer.addEventListener('note', onPlayEvent);

    document.getElementById("playButton").addEventListener("click", play);
    document.getElementById("pauseButton").addEventListener("click", pause);
    document.getElementById("stopButton").addEventListener("click", stop);
    document.getElementById("skipButton").addEventListener("click", skipper);

    playHead.style.height = 0 + "px";

    let staffHeight = 0;

    function setOptions() {
        const options = {
            breaks: "auto",
            mmOutput: false,
            footer: "none",
            pageHeight: document.body.clientHeight * 100 / zoom,
            pageWidth: document.body.clientWidth * 100 / zoom,
            scale: zoom,
        };
        vrvToolkit.setOptions(options);
    }

    verovio.module.onRuntimeInitialized = function () {
        vrvToolkit = new verovio.toolkit();
        console.log("onRuntimeInitialized Verovio");
        fetchAndRenderScore("Beauty_and_the_Beast.musicxml");
    }

    function fetchAndRenderScore(url) {
        fetch(url)
            .then((response) => response.text())
            .then((meiXML) => {
                const cleanedMeiData = removeInstrumentLabels(meiXML);
                setOptions();
                vrvToolkit.loadData(cleanedMeiData);
                renderMIDI();
                applyLayout();
            });
    }

    function removeInstrumentLabels(musicXMLData) {
        const parser = new DOMParser();
        const musicXMLDoc = parser.parseFromString(musicXMLData, 'application/xml');

        const partNames = musicXMLDoc.querySelectorAll('part-name');
        partNames.forEach(partName => partName.parentNode.removeChild(partName));

        const partAbbrNames = musicXMLDoc.querySelectorAll('part-abbreviation');
        partAbbrNames.forEach(partAbbrName => partAbbrName.parentNode.removeChild(partAbbrName));

        const serializer = new XMLSerializer();
        return serializer.serializeToString(musicXMLDoc);
    }

    async function renderMIDI() {
        let base64midi = vrvToolkit.renderToMIDI();
        midiPlayer.src = 'data:audio/midi;base64,' + base64midi;
    }

    function applyLayout() {
        if (vrvToolkit.getPageCount() === 0) return;
        setOptions();
        renderPage();
        selectMeasure();
    }

    function onPlayEvent(event) {
        const currentNote = event.detail.note;
        console.log("*----->" + JSON.stringify(event));

        let playingNotes = document.querySelectorAll('g.note.playing');
        for (let playingNote of playingNotes) playingNote.classList.remove("playing");

        let currentElements = vrvToolkit.getElementsAtTime((currentNote.startTime * 1000) + 100);

        if (currentElements.page === 0) return;

        if (currentElements.page !== currentPage) {
            currentPage = currentElements.page;
            applyLayout();
        }

        const staffBounds = document.getElementById(currentElements.measure).getBoundingClientRect();
        const noteElement = document.getElementById(currentElements.notes[0]);
        const noteBounds = noteElement.getBoundingClientRect();
        let playHeadX = noteBounds.left;
        playHead.style.left = playHeadX + "px";

        staffHeight = staffBounds.height;
        playHead.style.height = staffHeight + "px";
        let playHeadY = staffBounds.top;
        playHead.style.top = playHeadY + "px";

        for (let note of currentElements.notes) {
            const noteElement = document.getElementById(note);
            if (noteElement) noteElement.classList.add("playing");
        }
    }

    function stop() {
        midiPlayer.currentTime = 0;
        midiPlayer.stop();
    }

    function pause() {
        currentTime = midiPlayer.currentTime;
        midiPlayer.stop();
    }

    function resume() {
        midiPlayer.currentTime = currentTime;
        midiPlayer.start();
    }

    function play() {
        midiPlayer.start();
    }

    function skipper() {
        midiPlayer.currentTime = 10;
    }

    function zoomOut() {
        if (zoom < 30) {
            return;
        }
        zoom -= 10;
        applyLayout();
    }

    function zoomIn() {
        if (zoom >= 80) {
            return;
        }
        zoom += 10;
        applyLayout();
    }

    function renderPage() {
        vrvToolkit.redoLayout({"resetCache": true});
        notationElement.innerHTML = vrvToolkit.renderToSVG(currentPage);
    }

    function adjustElements(systemElements) {
        systemElements.forEach(system => {
            const children = Array.from(system.children);
            let yOffset = 0;

            children.forEach(child => {
                if (child.tagName !== 'path') {
                    const bbox = child.getBBox();
                    const transform = child.getAttribute('transform') || '';
                    const translateMatch = transform.match(/translate\(([^,]+),([^\)]+)\)/);

                    let x = 0, y = yOffset;
                    if (translateMatch) {
                        x = parseFloat(translateMatch[1]);
                        y += parseFloat(translateMatch[2]);
                    }

                    child.setAttribute('transform', `translate(${x}, ${y})`);
                    yOffset += bbox.height;
                }
            });
        });
    }

    function selectMeasure() {
        const measureElements = document.querySelectorAll('g[class^="measure"]');
        measureElements.forEach((measure, index) => {
            const bBox = measure.getBBox();
            const overlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            overlay.setAttribute('x', bBox.x);
            overlay.setAttribute('y', bBox.y);
            overlay.setAttribute('width', bBox.width);
            overlay.setAttribute('height', bBox.height);
            overlay.setAttribute('class', 'measure-overlay');
            overlay.setAttribute('id', measure.getAttribute('id'));

            measure.insertBefore(overlay, measure.firstChild);
            overlay.addEventListener('click', handleMeasureClick);
        });

        function handleMeasureClick(event) {
            const measureElement = event.target.closest('g.measure');
            const staffElement = event.target.closest('g.staff');
            const layerElement = event.target.closest('g.layer');
            const noteElement = event.target.closest('g.note');

            const measureId = measureElement ? measureElement.getAttribute('id') : null;
            const staffId = staffElement ? staffElement.getAttribute('id') : null;
            const layerId = layerElement ? layerElement.getAttribute('id') : null;
            const noteId = noteElement ? noteElement.getAttribute('id') : null;

            console.log('Clicked Measure Element:', measureElement);
            console.log('Clicked Staff Element:', staffElement);
            console.log('Clicked Layer Element:', layerElement);
            console.log('Measure ID:', measureId);
            console.log('Staff ID:', staffId);
            console.log('Layer ID:', layerId);

            if (measureId) {
                const measureTime = vrvToolkit.getTimeForElement(measureId);
                console.log(`Start time for measure ${measureId}:`, measureTime);
                midiPlayer.currentTime = measureTime * .001;
                currentTime = measureTime * .001;
                resume();
            }
        }
    }

    window.addEventListener('message', (event) => {
        if (event.data.fetchUrl !== undefined) {
            fetchAndRenderScore(event.data.fetchUrl);
        } else if (event.data === "play") {
            play();
            isPause = false;
        } else if (event.data === "resume") {
            resume();
            isPause = false;
        } else if (event.data === "pause") {
            pause();
            isPause = true;
        } else if (event.data === "zoomOut") {
            zoomOut();
        } else if (event.data === "zoomIn") {
            zoomIn();
        } else if (event.data === "applyLayout") {
            applyLayout();
        }
    });
});
