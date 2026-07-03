import os from 'os';
import path from 'path';
import fs from 'fs';

export function getAppDataDir() {
    const home = os.homedir();
    
    let appDir = '';
    if (process.platform === 'win32') appDir = path.join(process.env["APPDATA"] || path.join(home, 'AppData', 'Roaming'), 'Pixelizer');
    else if (process.platform === 'darwin') appDir = path.join(home, 'Library', 'Application Support', 'Pixelizer');
    else appDir = path.join(home, '.config', 'Pixelizer');

    if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });
    return appDir;
}

export function getGeneratedImagesPath() {
    return path.join(getAppDataDir(), 'generated_images');
}

export const SETTINGS_PATH = path.join(getAppDataDir(), 'settings.json');