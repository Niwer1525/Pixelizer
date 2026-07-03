import gc
import os

""" Image stuff """
import utils
from PIL import Image

""" AI stuff """
import torch
from diffusers import DiffusionPipeline, EulerAncestralDiscreteScheduler
from transformers import CLIPVisionModelWithProjection

# Optimize CUDA allocation
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
torch.backends.cuda.matmul.allow_tf32 = True

class ImageGenerator:
    def __init__(self, model_id="stabilityai/stable-diffusion-xl-base-1.0"):
        # Load the single unified ViT-H encoder 
        image_encoder = CLIPVisionModelWithProjection.from_pretrained("laion/CLIP-ViT-H-14-laion2B-s32B-b79K", torch_dtype=torch.float16 )
        self.pipe = DiffusionPipeline.from_pretrained(model_id, image_encoder=image_encoder, torch_dtype=torch.float16, variant="fp16", use_safetensors=True)
        self.pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(self.pipe.scheduler.config)
        
        # Load Pixel LoRA
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.pipe.load_lora_weights(current_dir, weight_name="pixel-art-xl.safetensors", adapter_name="pixel")
        self.pipe.set_adapters(["pixel"], adapter_weights=[1.0]) 

        # Load IP Adapters
        self.pipe.load_ip_adapter(
            ["h94/IP-Adapter", "h94/IP-Adapter"], 
            subfolder=["sdxl_models", "sdxl_models"], 
            weight_name=["ip-adapter-plus_sdxl_vit-h.safetensors", "ip-adapter-plus_sdxl_vit-h.safetensors"]
        )
        
        self.pipe.enable_sequential_cpu_offload()
        self.pipe.vae.enable_slicing()

    def generate(self, config: dict) -> list:
        # Safely decode base64 images (returns PIL Image or None)
        style_image = utils.decode_base64_image(config.get("style_image", ""))
        reference_image = utils.decode_base64_image(config.get("reference_image", ""))
        
        style_scale = config.get("style_inference", 0.0)
        reference_scale = config.get("reference_inference", 0.0)
        
        # Use a minimal valid 1x1 image as a placeholder if nothing was provided.
        # This satisfies diffusers' strict validation without wasting memory.
        if style_image is None:
            style_image = Image.new("RGB", (1, 1), color="black")
            style_scale = 0.0
            
        if reference_image is None:
            reference_image = Image.new("RGB", (1, 1), color="black")
            reference_scale = 0.0

        # Always set the scales (even if 0.0)
        self.pipe.set_ip_adapter_scale([style_scale, reference_scale])
        
        generated_paths = []
        output_dir = config.get("output_dir", "./output")
        os.makedirs(output_dir, exist_ok=True)

        for i in range(config["num_images"]):
            gc.collect()
            torch.cuda.empty_cache()
            
            # We always pass exactly two images to match the dual adapter setup
            img = self.pipe(
                prompt=config["prompt"],
                negative_prompt=config["negative_prompt"],
                num_inference_steps=config.get("num_inference_steps", 24),  
                guidance_scale=config.get("guidance_scale", 6.5),
                height=config.get("height", 1024),
                width=config.get("width", 1024),
                ip_adapter_image=[style_image, reference_image], 
            ).images[0]
            
            out_path = os.path.abspath(os.path.join(output_dir, f"generated_{i}.png"))
            img.save(out_path)
            generated_paths.append(out_path)
            
        return generated_paths