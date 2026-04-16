import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * 
 * @param {{
 *   id?: string,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   closeOnBackdrop?: boolean,
 *   children: import('react').ReactNode,
 *   footer?: import('react').ReactNode
 * }} props
 */
export function Dialog({id='', isOpen, onClose, title, closeOnBackdrop = false, children, footer=null}) {
    const dialogRef = useRef(/** @type {HTMLDialogElement | null} */ (null));

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        // When opening, make sure to reset scroll and focus without scroll jump.
        if (isOpen) {
            dialog.showModal();
            const content = dialog.querySelector('.dialog-content');
            const resetScroll = () => {
                dialog.scrollTop = 0;
                if (content instanceof HTMLElement) {
                    content.scrollTop = 0;
                }
            };
            try {
                dialog.focus({ preventScroll: true });
            } catch {
                dialog.focus();
            }
            resetScroll();
            // requestAnimationFrame(resetScroll);
        }
        else if (dialog.open) dialog.close();
    }, [isOpen]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        /** @param {KeyboardEvent} e */
        const handleEscape = (e) => {
            if (e.key !== 'Escape') return;
            e.preventDefault();
            e.stopPropagation();
            onClose();
        };

        dialog.addEventListener('keydown', handleEscape);
        return () => {
            dialog.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    /** @param {import('react').MouseEvent<HTMLDialogElement>} e */
    const handleClick = (e) => {
        if (closeOnBackdrop && e.target === dialogRef.current) onClose();
    }

    return (
        <dialog
            ref={dialogRef}
            id={id || undefined}
            className="dialog"
            tabIndex={-1}
            onClick={handleClick}
        >
            {title && (<header className="dialog-header"><h2>{title}</h2></header>)}
            <div className="dialog-content">{children}</div>
            {footer && (<footer className="dialog-footer">{footer}</footer>)}
        </dialog>
    );
}

Dialog.propTypes = {
    id: PropTypes.string,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    closeOnBackdrop: PropTypes.bool,
    children: PropTypes.node,
    footer: PropTypes.node,
};