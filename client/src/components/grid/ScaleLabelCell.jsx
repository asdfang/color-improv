import PropTypes from "prop-types";

/**
 * @param {{labelText: string}} props
 */
export function ScaleLabelCell({ labelText }) {
    return <div>{labelText}</div>;
}

ScaleLabelCell.propTypes = {
    labelText: PropTypes.string.isRequired,
};