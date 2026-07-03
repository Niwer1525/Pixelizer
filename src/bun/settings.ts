import { SETTINGS_PATH } from './utils';
import { type Settings, EMPTY_SETTINGS } from '../shared/objects'

export async function load_settings(): Promise<Settings> {
    const file = Bun.file(SETTINGS_PATH);
    
    // If file doesn't exist, return your default object
    if (!(await file.exists())) return EMPTY_SETTINGS;

    try {
        return await file.json();
    } catch (e) {
        throw new Error(`Failed to read settings: ${e}`);
    }
}

export async function save_settings(settings: Settings) {
    try {
        // Bun.write automatically stringifies objects smoothly
        await Bun.write(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    } catch (e: any) {
        throw new Error(`Failed to save settings: ${e.message}`);
    }
}