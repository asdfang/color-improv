/**
 * SampleLoader is a utility class for AudioEngine.
 * It asynchronously loads and caches audio samples in parallel.
 */

export class SampleLoader {
    /**
     * 
     * @param {AudioContext} audioContext 
     */
    constructor(audioContext) {
        this.audioContext = audioContext;
        /** @type {Map<string, AudioBuffer>} */
        this.cache = new Map(); // Holds URL -> buffer, prevents re-downloading samples
    }

   /**
    * Load, decode, and cache a single audio file.
    * @param {string} url A url to the audio file.
    * @returns {Promise<AudioBuffer>} A promise that immediately resolves to a decoded audio buffer.
    */
    async loadSample(url) {
        // Check cache first
        if (this.cache.has(url)) {
            return /** @type {AudioBuffer} */ this.cache.get(url);
        }
        
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.statusText}`);
            }

            // Get raw audio data from Response
            const arrayBuffer = await response.arrayBuffer();

            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Cache
            this.cache.set(url, audioBuffer);

            return /** @type {AudioBuffer} */ audioBuffer;
        } catch (error) {
            console.error(`Error loading sample ${url}:`, error);
            throw error; // Re-throw so caller can handle
        }
    }

    /**
     * Load, decode, and cache multiple audio files in parallel.
     * @param {string[]} urls - An array of urls to samples to load.
     * @returns {Promise<AudioBuffer[]>} - A promise that resolves to to an array of decoded audio buffers.
     */
    async loadMultipleSamples(urls) {
        const loadPromises = urls.map(url => this.loadSample(url));
        return Promise.all(loadPromises);
    }

    /**
     * Load all trumpet sound files.
     * @param {number[]} midiNumbers - An array of MIDI numbers to load trumpet samples of.
     * @param {string} basePath - Where the trumpet samples are stored in the project.
     * @returns {Promise<Map>} - A promise that resolves to a mapping from MIDI number to audio buffer.
     */
    async loadTrumpetSamples(midiNumbers, basePath, audioFormat) {
        const sampleMap = new Map();

        // Convert MIDI numbers to urls
        const urls = midiNumbers.map(num => `${basePath}${num}.${audioFormat}`);
        const buffers = await this.loadMultipleSamples(urls);

        midiNumbers.forEach((num, index) => {
            // sampleMap and this.cache map to same references
            sampleMap.set(num, buffers[index]);
        });

        return sampleMap
    }

    /**
     * Get loading progress (for future proress bar)
     * @param {*} totalExpected 
     * @returns 
     */
    getProgress(totalExpected) {
        return {
            loaded: this.cache.size,
            total: totalExpected,
            percentage: (this.cache.size / totalExpected) * 100
        };
    }
}