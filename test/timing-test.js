import { AudioEngine } from '../src/audio/AudioEngine.js';
import { TimingEngine } from '../src/timing/TimingEngine.js';

async function testTiming() {
    const audioEngine = new AudioEngine();
    await audioEngine.initialize();

    const timing = new TimingEngine(audioEngine);
    audioEngine.playBackingTrack();
    timing.start();

    await new Promise(resolve => setTimeout(resolve, 285)); // Start time after silence offset
    
    // Log position every 500ms
    setInterval(() => {
        const pos = timing.getCurrentPosition();
        console.log(`Beat:${pos.beatNumberInMeasure}, Chord:${pos.currentChord}, Next Chord: ${pos.nextChord}, Beats Until Next: ${pos.beatsUntilNextChord}`);
    }, 500);
}

document.getElementById('startTest').addEventListener('click', () => {
       testTiming();
});