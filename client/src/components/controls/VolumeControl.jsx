import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeUp, faVolumeMute, faUndo } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import { useStudio } from '../../contexts/StudioContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { PREFERENCE_DEFAULTS } from '/src/constants.js';

/** @typedef {import('/src/constants.js').AudioSourceKey} AudioSourceKey */
/** @typedef {import('/src/audio/AudioEngine.js').AudioEngine} AudioEngine */

/**
 * @typedef {{
 *   setVolume: (audioEngine: AudioEngine, volume: number) => void,
 *   setMuted: (audioEngine: AudioEngine, muted: boolean) => void,
 *   volumePreferenceKey: 'backingTrackVolume' | 'samplesVolume',
 *   mutePreferenceKey: 'backingTrackMuted' | 'samplesMuted',
 * }} SourceConfig
 */
const SOURCE_CONFIG = /** @type {Record<AudioSourceKey, SourceConfig>} */ ({
    backingTrack: {
        setVolume: (audioEngine, volume) => audioEngine.setBackingTrackVolume(volume),
        setMuted: (audioEngine, muted) => audioEngine.setBackingTrackMuted(muted),
        volumePreferenceKey: 'backingTrackVolume',
        mutePreferenceKey: 'backingTrackMuted',
    },
    samples: {
        setVolume: (audioEngine, volume) => audioEngine.setSamplesVolume(volume),
        setMuted: (audioEngine, muted) => audioEngine.setSamplesMuted(muted),
        volumePreferenceKey: 'samplesVolume',
        mutePreferenceKey: 'samplesMuted',
    },
});

/** @param {{ source: AudioSourceKey }} props */
export function VolumeControl({ source }) {
    const { audioEngine } = useStudio();
    const { preferences, setPreference } = usePreferences();

    const config = SOURCE_CONFIG[source];

    /** @param {import('react').ChangeEvent<HTMLInputElement>} e */
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        config.setVolume(audioEngine, newVolume);
        setPreference(config.volumePreferenceKey, newVolume);
    };

    const handleMuteToggle = () => {
        const newMuted = !preferences[config.mutePreferenceKey];
        config.setMuted(audioEngine, newMuted);
        setPreference(config.mutePreferenceKey, newMuted);
    };

    const handleReset = () => {
        config.setVolume(audioEngine, PREFERENCE_DEFAULTS[config.volumePreferenceKey]);
        config.setMuted(audioEngine, PREFERENCE_DEFAULTS[config.mutePreferenceKey]);
        setPreference(config.volumePreferenceKey, PREFERENCE_DEFAULTS[config.volumePreferenceKey]);
        setPreference(config.mutePreferenceKey, PREFERENCE_DEFAULTS[config.mutePreferenceKey]);
    };

    return (
        <div className="volume-control">
            <label>
                {source === 'backingTrack' ? 'Backing Track' : 'Samples'}
            </label>
            <input
                className="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={preferences[config.volumePreferenceKey]}
                onChange={handleVolumeChange}
            />
            <div className="mute-toggle">
                <button onClick={handleMuteToggle}>
                    {preferences[config.mutePreferenceKey] ? (
                        <FontAwesomeIcon icon={faVolumeMute} />
                    ) : (
                        <FontAwesomeIcon icon={faVolumeUp} />
                    )}
                </button>
                <label>
                    {preferences[config.mutePreferenceKey] ? 'Muted' : 'Unmuted'}
                </label>
            </div>
            <div className="reset-button">
                <button onClick={handleReset}>
                    <FontAwesomeIcon icon={faUndo} />
                </button>
                <label>Reset</label>
            </div>
        </div>
    );
}

VolumeControl.propTypes = {
    source: PropTypes.oneOf(['backingTrack', 'samples']).isRequired,
};