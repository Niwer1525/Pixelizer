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