import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * 
 * @param {{isOpen: boolean, onClose: () => void, title?: string, closeOnBackdrop?: boolean, children: import('react').ReactNode}} props
 * @returns 
 */
export function Dialog({isOpen, onClose, title, closeOnBackdrop = false, children}) {
    const dialogRef = useRef(/** @type {HTMLDialogElement | null} */ (null));

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) dialog.showModal();
        else if (dialog.open) dialog.close();
    }, [isOpen]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        /** @param {Event} e */
        const handleCancel = (e) => {
            e.preventDefault();
            onClose();
        };

        dialog.addEventListener('cancel', handleCancel);
        return () => dialog.removeEventListener('cancel', handleCancel);
    }, [onClose]);

    /** @param {import('react').MouseEvent<HTMLDialogElement>} e */
    const handleClick = (e) => {
        if (closeOnBackdrop && e.target === dialogRef.current) onClose();
    }

    return (
        <dialog
            ref={dialogRef}
            className="dialog"
            onClick={handleClick}
        >
            {title && (
                <header>
                    <h2>{title}</h2>
                </header>
            )}
            <div className="dialog-content">
                {children}
            </div>
        </dialog>
    );
}

Dialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    closeOnBackdrop: PropTypes.bool,
    children: PropTypes.node
};