import PropTypes from "prop-types";

/**
 * @param {{scaleDegree: string}} props
 */
export function ScaleDegreeLabelCell({ scaleDegree }) {
    return <div>{scaleDegree}</div>
};

ScaleDegreeLabelCell.propTypes = {
    scaleDegree: PropTypes.string.isRequired,
};