import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faX } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { AuthControls } from './AuthControls';
import { InstructionsButton } from './InstructionsButton';
import { DifficultySelect } from './DifficultySelect';
import { VolumePanel } from './VolumePanel';

export function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        /** @param {KeyboardEvent} e */
        function handleEscape(e) {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            setIsOpen(false);
        }

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    return (
        <div className="hamburger-menu">
            {!isOpen && (
                <button
                    className={`hamburger-btn open`}
                    onClick={() => setIsOpen(true)}
                    aria-label="Open menu"
                    aria-controls="hamburger-drawer"
                >
                    <FontAwesomeIcon icon={faBars} aria-hidden="true"/>
                </button>
            )}
            {isOpen && <div className="hamburger-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />}

            <aside id="hamburger-drawer" className={`hamburger-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
                <div className="hamburger-drawer-header">
                    <AuthControls />
                    <button 
                        className="hamburger-btn"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close menu"
                        aria-controls="hamburger-drawer"
                    >
                        <FontAwesomeIcon icon={faX} aria-hidden="true" />
                    </button>
                </div>
                <InstructionsButton />
                <DifficultySelect />
                <VolumePanel />
            </aside>
        </div>
    );  
}