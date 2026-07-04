/**
 * This snapper system a translation of "https://github.com/Hugo-Dz/spritefusion-pixel-snapper/" to TypeScript.
 */

import { PNG } from 'pngjs';
import { DEFAULT_CONFIG, type SnapperConfig } from '../../shared/objects';
import { quantizeImage } from './quantize';
import * as profile from './profile';
import { resample } from './resample';

export async function processImage(inputBuffer: Buffer, customConfig: Partial<SnapperConfig> = {}): Promise<Buffer> {
    const config: SnapperConfig = { ...DEFAULT_CONFIG, ...customConfig };

    const png = PNG.sync.read(inputBuffer);
    const { width, height, data: rgbaPixels } = png;

    if (width === 0 || height === 0 || width > 10000 || height > 10000) throw new Error("Invalid image dimensions");

    const quantizedPixels = quantizeImage(width, height, rgbaPixels, config);
    const { colProj, rowProj } = profile.computeProfiles(width, height, quantizedPixels);

    const stepXOpt = profile.estimateStepSize(colProj, config);
    const stepYOpt = profile.estimateStepSize(rowProj, config);
    const [stepX, stepY] = profile.resolveStepSizes(stepXOpt, stepYOpt, width, height, config);

    const rawColCuts = profile.walk(colProj, stepX, width, config);
    const rawRowCuts = profile.walk(rowProj, stepY, height, config);

    const [colCuts, rowCuts] = profile.stabilizeBothAxes(
        colProj, rowProj, rawColCuts, rawRowCuts, width, height, config
    );

    const outputPng = resample(width, height, quantizedPixels, colCuts, rowCuts);
    
    return PNG.sync.write(outputPng);
}