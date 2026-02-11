// @ts-check
import { SampleLoader } from '../src/audio/SampleLoader.js';
import { AUDIO_CONFIG } from '../src/constants.js';

const output = document.getElementById('output');

function log(message, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌' : '✓';
    const line = `[${timestamp}] ${prefix} ${message}`;
    console.log(line);
    output.textContent += line + '\n';
}

let audioContext = null;
let loader = null;

async function runInitTest() {
    log('Testing initialization: AudioContext and SampleLoader');
    const startTime = performance.now();
    audioContext = new (window.AudioContext || window.webkitAudioContext)(); // polyfill
    loader = new SampleLoader(audioContext);
    const ellapsedTime = performance.now() - startTime;
    log(`Initialization finished in ${ellapsedTime.toFixed(2)}ms.`);
}

let buffer1;
async function runLoadOneFileTest() {
    log('\nTesting loading single file: 60.mp3');
    const startLoadTime = performance.now();
    buffer1 = await loader.loadSample(AUDIO_CONFIG.getSamplePath(60));
    const loadTime = (performance.now() - startLoadTime).toFixed(2);
    log(`Sample loaded in ${loadTime}ms`);
    log(`Duration: ${buffer1.duration.toFixed(2)}s, Channels: ${buffer1.numberOfChannels}`);
}

async function runLoadCachedFileTest() {
    log('\nTesting loading already cached file: 60.mp3')
    const startCachedTime = performance.now();
    const buffer2 = await loader.loadSample(AUDIO_CONFIG.getSamplePath(60));
    const cacheTime = (performance.now() - startCachedTime).toFixed(2);
    const isCached = buffer1 === buffer2;
    log(`Sample loaded in ${cacheTime}ms. Should be faster. Cache hit: ${isCached}`);

}

async function runLoadParallelTest() {
    log('\nTesting loading multiple files in parallel.')
    const startParallelTime = performance.now();
    const urls = AUDIO_CONFIG.samples.map(midiNumber => AUDIO_CONFIG.getSamplePath(midiNumber));
    const buffers = await loader.loadMultipleSamples(urls);
    const parallelTime = (performance.now() - startParallelTime).toFixed(2);
    log(`Loaded ${buffers.length} buffers in ${parallelTime}ms.`);
}

async function runErrorTest() {
    log('\nTesting error handling on non-existent file.');
    try {
        await loader.loadSample('/fake-file-does-not-exist.wav');
        log('ERROR: Should have thrown an error!', true);
    } catch (error) {
        log(`Correctly caught error: ${error.message}`);
    }
}

async function runPlaySoundTest() {
    log('\nTesting playing 60.mp3.');
    try {
        const buffer = await loader.loadSample(AUDIO_CONFIG.getSamplePath(60));
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
    } catch (error) {
        log(`Play error: ${error.message}`, true);
    }
}

async function onPageLoad() {
    try {
        log('onPageLoad: Creating AudioContext...');
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        log(`AudioContext created successfully. Sample rate: ${audioContext.sampleRate}Hz`);
        
        log('onPageLoad: Initializing SampleLoader...');
        loader = new SampleLoader(audioContext);
        log('SampleLoader initialized');
        
        log('onPageLoad: Fetching and decoding audio file...');
        const startDecodeTime = performance.now();
        const buff = await loader.loadSample(AUDIO_CONFIG.getSamplePath(60));
        const decodeTime = (performance.now() - startDecodeTime).toFixed(2);
        log(`Audio file decoded successfully in ${decodeTime}ms`);
        log(`Buffer: Duration ${buff.duration.toFixed(2)}s, Channels: ${buff.numberOfChannels}`);
        
        log('onPageLoad: Playing audio without user interaction...');
        const source = audioContext.createBufferSource();
        source.buffer = buff;
        source.connect(audioContext.destination);
        source.start();
        log('Audio playback started');
        
        log('onPageLoad: All tests passed!');
    } catch (error) {
        log(`onPageLoad failed: ${error.message}`, true);
    }
}

async function testAutoplayPolicy() {
    log('=== AUTOPLAY POLICY TEST ===');
    
    const audioContext = new AudioContext();
    log(`Initial state: ${audioContext.state}`);
    
    if (audioContext.state === 'suspended') {
        log('⚠️  AudioContext is suspended (normal on fresh page)');
        log('Click anywhere to resume...');
        
        document.addEventListener('click', async () => {
            await audioContext.resume();
            log(`After click: ${audioContext.state}`);
            
            // Now try playing
            const buff = await loader.loadSample(AUDIO_CONFIG.getSamplePath(60));
            const source = audioContext.createBufferSource();
            source.buffer = buff;
            source.connect(audioContext.destination);
            source.start();
            log('✅ Audio played after user gesture');
        }, { once: true });
    } else {
        log('✅ AudioContext running (Firefox or already interacted)');
    }
}

// document.addEventListener('DOMContentLoaded', onPageLoad);
// document.addEventListener('DOMContentLoaded', testAutoplayPolicy);
document.getElementById('initTest').addEventListener('click', runInitTest);
document.getElementById('loadOneFileTest').addEventListener('click', runLoadOneFileTest);
document.getElementById('loadCachedFileTest').addEventListener('click', runLoadCachedFileTest);
document.getElementById('loadParallelTest').addEventListener('click', runLoadParallelTest);
document.getElementById('errorTest').addEventListener('click', runErrorTest);
document.getElementById('playSoundTest').addEventListener('click', runPlaySoundTest);
