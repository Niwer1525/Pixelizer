import { type RPCSchema } from "electrobun/bun";
import { type Settings } from './objects'
import { type ImageGenerationArgs } from '../shared/objects';

export type MainSchema = {
    bun: RPCSchema<{
        requests: {
            load_settings: {
                params: undefined; // Takes no arguments
                response: Settings;
            };
            save_settings: {
                params: { settings: Settings };
                response: { success: boolean; message: string };
            };
            generate_images: {
                params: ImageGenerationArgs;
                response: { success: boolean; images?: string[]; error?: string };
            }
        };
    }>;
    webview: RPCSchema<{}>;
};