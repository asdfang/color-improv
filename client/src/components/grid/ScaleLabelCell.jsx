import PropTypes from "prop-types";

/**
 * @param {{label: string}} props
 */
export function ScaleLabelCell({ label }) {
    return <div>{label}</div>;
}

ScaleLabelCell.propTypes = {
    label: PropTypes.string.isRequired,
};