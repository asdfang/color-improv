/**
 * LocalStorageBackend provides a simple interface to save and load preferences using the browser's localStorage.
 */

export class LocalStorageBackend {
    constructor() {
        this.storageKey = 'color-improv:prefs';
    }

    /**
     * Loads data object from localStorage, parsing from JSON.
     * @returns {object} the loaded preferences object, or an empty object if not found or on error
     */
    load() {
        const storedData = localStorage.getItem(this.storageKey);
        if (storedData) {
            try {
                return JSON.parse(storedData);
            } catch (error) {
                console.error('Error parsing stored preferences:', error);
                }
            }
        
        return {}
    }

    /**
     * Saves stringified data object to localStorage.
     * @param {string} data 
     * @returns saved data if successful
     */
    save(data) {
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(this.storageKey, jsonData);
            return data;
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }
}