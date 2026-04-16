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
    const isMuted = preferences[SOURCE_CONFIG[source].mutePreferenceKey];
    const config = SOURCE_CONFIG[source];

    const mutedIcon = <FontAwesomeIcon icon={faVolumeMute} aria-hidden="true" />;
    const unmutedIcon = <FontAwesomeIcon icon={faVolumeUp} aria-hidden="true" />;
    const undoIcon = <FontAwesomeIcon icon={faUndo} aria-hidden="true" />;

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
            <label htmlFor={`${source}-volume-slider`} className="volume-label">
                {source === 'backingTrack' ? 'Backing Track:' : 'Samples:'}
            </label>
            <input
                id={`${source}-volume-slider`}
                className="volume-slider"
                title="Volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={preferences[config.volumePreferenceKey]}
                onChange={handleVolumeChange}
            />
            <div className="mute-toggle">
                <button
                    className={`btn-circle volume-btn mute-btn ${isMuted ? 'muted' : ''}`}
                    title="Mute/Unmute"
                    onClick={handleMuteToggle}
                >
                    {preferences[config.mutePreferenceKey] ? mutedIcon : unmutedIcon}
                </button>
            </div>
            <div className="reset-button">
                <button
                    className="btn-circle volume-btn"
                    title="Reset to Defaults"
                    onClick={handleReset}
                >
                    {undoIcon}
                </button>
            </div>
        </div>
    );
}

VolumeControl.propTypes = {
    source: PropTypes.oneOf(['backingTrack', 'samples']).isRequired,
};