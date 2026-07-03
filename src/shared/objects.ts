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