import PropTypes from "prop-types";

/**
 * @param {{scaleName: string, label: string}} props
 */
export function ScaleLabelCell({ scaleName, label }) {
    return (
        <div className={`scale-label-row ${scaleName}-row scale-label-cell`}>
            <span>{scaleName.charAt(0).toUpperCase() + scaleName.slice(1)}</span>
            <span>{label}</span>
        </div>
    );
}

ScaleLabelCell.propTypes = {
    scaleName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
};