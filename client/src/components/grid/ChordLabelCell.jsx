import PropTypes from "prop-types";

/**
 * @param {{labelText: string}} props
 */
export function ChordLabelCell({ labelText }) {
    return <div>{labelText}</div>;
}

ChordLabelCell.propTypes = {
    labelText: PropTypes.string.isRequired,
};