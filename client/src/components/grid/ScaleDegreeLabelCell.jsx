import PropTypes from "prop-types";

/**
 * @param {{scaleDegree: string, scaleName: string}} props
 */
export function ScaleDegreeLabelCell({ scaleDegree, scaleName }) {
    const accidental = scaleDegree.length > 1 ? scaleDegree[0] : null;
    const degree = accidental ? scaleDegree.slice(1) : scaleDegree;
    return (
        <div className={`scale-label-row ${scaleName}-row scale-degree-label-cell `}>
            {accidental && <span className="accidental">{accidental}</span>}
            <span className="degree-number">{degree}</span>
        </div>
    );
};

ScaleDegreeLabelCell.propTypes = {
    scaleDegree: PropTypes.string.isRequired,
    scaleName: PropTypes.string.isRequired,
};