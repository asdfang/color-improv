import { usePreferences } from '../../contexts/PreferencesContext';

export function DifficultySelect() {
    const { preferences, setPreference } = usePreferences();

    /** @param {import('react').ChangeEvent<HTMLSelectElement>} e */
    const handleSelect = (e) => {
        setPreference('difficulty', e.target.value);
    };

    return (
        <div className="difficulty-select">
            <label htmlFor="difficulty-select">Difficulty:</label>
            <select id="difficulty-select" value={preferences.difficulty} onChange={handleSelect}>
                <option value="easy">Easy (both helpers)</option>
                <option value="medium">Medium (one helper)</option>
                <option value="hard">Hard (no helpers)</option>
            </select>
        </div>
     );
}