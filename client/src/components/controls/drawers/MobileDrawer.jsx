import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Drawer } from './Drawer';
import { AuthControls } from '../AuthControls';
import { InstructionsButton } from '../InstructionsButton';
import { DifficultySelect } from '../DifficultySelect';
import { VolumePanel } from '../VolumePanel';
import { LibraryDrawer } from './LibraryDrawer';
import { useAuth } from '../../../contexts/AuthContext';
import { useRecordings } from '../../../contexts/RecordingsContext';

export function MobileDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const { currentUser } = useAuth();
    const { setIsLibraryDrawerOpen } = useRecordings();
    
    const menuIcon = <FontAwesomeIcon icon={faBars} aria-hidden="true" />;

    return (
        <>
            {!isOpen && (
                <button
                    className="drawer-open-btn mobile-drawer-open-btn"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open menu"
                    aria-controls="mobile-drawer"
                >{menuIcon}</button>
            )}
            <Drawer
                id="mobile-drawer"
                className="mobile-drawer"
                isOpen={isOpen}
                onClose={() => { setIsOpen(false); setIsLibraryDrawerOpen(false); }}
                header={
                    <>
                        {currentUser && (
                            <LibraryDrawer />
                        )}
                        <AuthControls />
                    </>
                }
            >
                <InstructionsButton />
                <DifficultySelect />
                <VolumePanel />
            </Drawer>
        </>
    );
}
