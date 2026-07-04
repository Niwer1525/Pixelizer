import { BrowserView, BrowserWindow } from "electrobun/bun";
import { type MainSchema } from '../shared/types';
import { generate_images } from './generator';
import { ensurePythonEnv } from './python';
import { load_settings, save_settings } from './settings';
import { getAppDataDir } from './utils';

/* Create the RPC */
const RPC = BrowserView.defineRPC<MainSchema>({
	maxRequestTime: 5000,
	handlers: {
		requests: {
			load_settings: async () => { return await load_settings(); },
			save_settings: async (payload) => {
				try {
					await save_settings(payload.settings);
					return { success: true, message: "Settings saved successfully" };
				} catch (e: any) {
					return { success: false, message: `Failed to save settings: ${e.message}` };
				}
			},
			generate_images: async (args) => {
				try {
					const images = await generate_images(args);
					return { success: true, images };
				} catch (e: any) {
					return { success: false, error: `Failed to generate pixel-art: ${e.message}` };
				}
			}
		},
	},
});

/* Create the main application window */
const window = new BrowserWindow({
	title: "Pixelizer",
	url: "views://mainview/index.html",
	frame: {
		width: 1200,
		height: 800,
		x: 200,
		y: 200,
	},
	rpc: RPC,
});
export const webView = window.webview;

/* Install python environment at start if not already installed. (This check is also done when clicking the Generate Button) */
ensurePythonEnv();

/* Print the path to the application dir */
console.log("Application folder is at : " + getAppDataDir());