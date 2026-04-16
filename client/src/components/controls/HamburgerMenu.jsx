import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faX } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { AuthControls } from './AuthControls';
import { InstructionsButton } from './InstructionsButton';
import { DifficultySelect } from './DifficultySelect';
import { VolumePanel } from './VolumePanel';

export function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const toggleMenu = () => setIsOpen(prev => !prev);

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
            <button className={`hamburger-btn ${isOpen ? 'open' : ''}`} onClick={toggleMenu} aria-label="Open menu">
                <FontAwesomeIcon icon={isOpen ? faX : faBars} />
            </button>
            {isOpen && <button className="hamburger-backdrop" onClick={() => setIsOpen(false)} aria-label="Close menu backdrop" />}

            <aside className={`hamburger-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
                <div className="hamburger-drawer-header">
                    <AuthControls />
                    <button className="hamburger-btn" onClick={() => setIsOpen(false)} aria-label="Close menu">
                        <FontAwesomeIcon icon={faX} />
                    </button>
                </div>
                <InstructionsButton />
                <DifficultySelect />
                <VolumePanel />
            </aside>
        </div>
    );  
}