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
  prompt: string;
  refImage: string;
  styleImage: string;
  refWeight: number;
  styleWeight: number;
  numImages: number;
  width: number;
  height: number;
  generationStyle: string;
  transparentBg: boolean;
  negativePrompt: string;
  seed: string | null;
}

export const DEFAULT_GENERATION_ARGS = {
    num_images: 1,

    prompt: "A cute cat",

    reference_image: "",
    style_image: "",
    reference_inference: 0.5,
    style_inference: 1.0,
    
    negative_prompt: "No realistic images",

    width: 640,
    height: 360,
    transparentBg: false,

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