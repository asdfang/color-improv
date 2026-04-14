import PropTypes from "prop-types";

/** @param {{ id: string, label: string, labelClassName?: string, onClick: () => void, disabled: boolean, children: import('react').ReactNode}} props */
export function PlaybackButton({ id, label, labelClassName='', onClick, disabled, children }) {
    return (
        <div className="playback-btn-wrapper">
            <button
                id={id}
                className="btn-circle playback-btn"
                onClick={onClick}
                disabled={disabled}
            >
                {children}
            </button>
            <span className={`playback-btn-label ${labelClassName}`}>
                {label}
            </span>
        </div>
    );
}

PlaybackButton.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    labelClassName: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired,
    children: PropTypes.node
};