/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { RecordingService } from '../api/RecordingService';
import { useAuth } from './AuthContext';

/**
 * @typedef {{
 *   recordingsList: import('../api/RecordingService').Recording[],
 *   count: number,
 *   isLoading: boolean,
 *   refresh: () => Promise<void>,
 *   create: (params: { audioBlob: Blob, logObject: Object, title: string, notes: string, durationSeconds: number }) => Promise<void>,
 *   update: (id: string, params: { title?: string, notes?: string }) => Promise<void>,
 *   remove: (id: string) => Promise<void>,
 *   fetchArtifacts: (id: string) => Promise<{ audioBlob: Blob, logObject: Object }>
 *   isLibraryDrawerOpen: boolean,
 *   setIsLibraryDrawerOpen: (isOpen: boolean) => void,
 * }} RecordingsContextType
 */
export const RecordingsContext = createContext(/** @type {RecordingsContextType | null} */ (null));

/**
 * This provider manages the state of authenticated user's recordings.
 * @param {{ children: import('react').ReactNode }} props 
 * @returns 
 */
export function RecordingsProvider({ children }) {
    const [recordingService] = useState(() => new RecordingService());
    const [recordingsList, setRecordingsList] = useState(/** @type {import('../api/RecordingService').Recording[]} */ ([]));
    const [isLoading, setIsLoading] = useState(false);
    const { currentUser } = useAuth();
    const count = recordingsList.length;
    const [isLibraryDrawerOpen, setIsLibraryDrawerOpen] = useState(false); // UI!

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const recordings = await recordingService.list();
            setRecordingsList(recordings);
        } finally {
            setIsLoading(false);
        }
    }, [recordingService]);

    useEffect(() => {
        if (!currentUser) {
            setRecordingsList([]);
            setIsLoading(false);
            return;
        }
        refresh().catch(error => {
            console.error('Failed to load recordings:', error);
            setRecordingsList([]);
            setIsLoading(false);
        });
    }, [currentUser, refresh]);

    // create, update, remove
    /**
     * Creates a new recording by uploading audio, log, and metadata (notes optional).
     * @param {{ audioBlob: Blob, logObject: Object, title: string, notes?: string, durationSeconds: number }} param0 
     */
    const create = async ({ audioBlob, logObject, title, notes, durationSeconds }) => {
        const newRecording = await recordingService.create({ audioBlob, logObject, title, notes, durationSeconds });
        setRecordingsList(prev => [newRecording, ...prev]);
    };

    /**
     * One of title or notes must be provided.
     * @param {string} id recording ID to be updated
     * @param {{ title?: string, notes?: string }} param1
     */
    const update = async (id, { title, notes }) => {
        const updatedRecording = await recordingService.updateMetadata(id, { title, notes });
        setRecordingsList(prev => prev.map(r => r.id === id ? updatedRecording : r));
    }

    /**
     * @param {string} id recording ID to be deleted
     */
    const remove = async (id) => {
        await recordingService.remove(id);
        setRecordingsList(prev => prev.filter(r => r.id !== id));
    }

    /**
     * @param {string} id recording ID to fetch artifacts for
     */
    const fetchArtifacts = async (id) => {
        return await recordingService.fetchArtifacts(id);
    };

    return (
        <RecordingsContext.Provider value={{ recordingsList, count, isLoading, refresh, create, update, remove, fetchArtifacts, isLibraryDrawerOpen, setIsLibraryDrawerOpen }}>
            {children}
        </RecordingsContext.Provider>
    );
}

export function useRecordings() {
    const context = useContext(RecordingsContext);
    if (!context) throw new Error('useRecordings must be used within a RecordingsProvider');
    return context;
}

RecordingsProvider.propTypes = {
    children: PropTypes.node.isRequired,
}