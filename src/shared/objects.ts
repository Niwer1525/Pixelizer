export interface Settings {
    negativePrompt: string;
    seed: string;
    theme: string;
}

export const EMPTY_SETTINGS = {
    negativePrompt: "",
    seed: "",
    theme: "light"
};

export interface ImageGenerationArgs {
    num_images: number;

    prompt: string;

    reference_image: string;
    style_image: string;
    reference_inference: number;
    style_inference: number;

    negative_prompt: string;

    width: number | 1024;
    height: number | 1024;
    transparentBg: boolean | true;

    generationStyle: string;

    seed: string | null;
    guidance_scale: number | 6.5;
    num_inference_steps: number | 24;
}

export const DEFAULT_GENERATION_ARGS = {
    num_images: 1,

    prompt: "A cute cat",

    reference_image: "",
    style_image: "",
    reference_inference: 0.5,
    style_inference: 1.0,
    
    negative_prompt: "photorealistic, realistic, 3d, render, cgi, photography, painting, drawing, sketch, smooth, gradients, anti-aliased, blurry, soft focus, high definition, 4k, wallpaper, grainy, noisy, text, watermark, signature, distorted, bad anatomy",

    width: 1024,
    height: 1024,

    seed: "123456789",
    guidance_scale: 6.5,
    num_inference_steps: 24,

    output_dir: ""
}

export interface SnapperConfig {
    kColors: number;
    kSeed: string | number;
    maxKmeansIterations: number;
    peakThresholdMultiplier: number;
    peakDistanceFilter: number;
    walkerSearchWindowRatio: number;
    walkerMinSearchWindow: number;
    walkerStrengthThreshold: number;
    minCutsPerAxis: number;
    fallbackTargetSegments: number;
    maxStepRatio: number;
    pixelSizeOverride: number | null;
}

export const DEFAULT_CONFIG: SnapperConfig = {
    kColors: 16,
    kSeed: "42",
    maxKmeansIterations: 15,
    peakThresholdMultiplier: 0.2,
    peakDistanceFilter: 4,
    walkerSearchWindowRatio: 0.35,
    walkerMinSearchWindow: 2.0,
    walkerStrengthThreshold: 0.5,
    minCutsPerAxis: 4,
    fallbackTargetSegments: 64,
    maxStepRatio: 1.8,
    pixelSizeOverride: null
};

export interface Profiles {
    colProj: number[];
    rowProj: number[];
}

export const REMOVE_BG_CONFIG = {
    model: 'medium' as 'medium' | 'small', // Explicitly cast the string - 'small' (faster, less accurate), 'medium' (default)
    debug: true,
    output: {
        format: 'image/webp' as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/x-rgba8',
        quality: 0.8,
        type: 'foreground' as 'foreground' | 'background' | 'mask', // The output type. (Default "foreground")
    },
    progress: (key: string, current: number, total: number) => {
        console.log(`Downloading ${key}: ${current} of ${total}`);
    }
};