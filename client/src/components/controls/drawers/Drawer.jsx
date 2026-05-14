import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Base drawer component. Parent is responsible for opening/closing.
 * TODO: take in close button?
 * 
 * @param {{
 *   id: string,
 *   className?: string,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   header?: import('react').ReactNode,
 *   children: import('react').ReactNode,
 * }} props
 */
export function Drawer({ id, className = '', isOpen, onClose, header, children}) {
    const closeIcon = <FontAwesomeIcon icon={faX} aria-hidden="true" />;

    useEffect(() => {
        if (!isOpen) return;
        /** @param {KeyboardEvent} e */
        function handleEscape(e) {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            onClose();
        }
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    return (
        <>
            {isOpen && <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />}
            <aside
                id={id}
                className={`drawer ${className} ${isOpen ? 'open' : ''}`}
                inert={!isOpen}
            >
                <div className="drawer-header">
                    {header}
                    <button
                        className="drawer-close-btn"
                        onClick={onClose}
                        aria-label={"Close drawer"}
                        aria-controls={id}
                    >{closeIcon}</button>
                </div>
                {children}
            </aside>
        </>
    );
}

Drawer.propTypes = {
    id: PropTypes.string.isRequired,
    className: PropTypes.string,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    header: PropTypes.node,
    children: PropTypes.node,
};
