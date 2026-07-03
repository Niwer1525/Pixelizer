import gc
import os
import io
import base64
from PIL import Image
import torch
from diffusers import DiffusionPipeline, EulerAncestralDiscreteScheduler
from diffusers.utils import load_image
from transformers import CLIPVisionModelWithProjection

# Optimize CUDA allocation
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
torch.backends.cuda.matmul.allow_tf32 = True

class ImageGenerator:
    def __init__(self, model_id="stabilityai/stable-diffusion-xl-base-1.0"):
        # Load the single unified ViT-H encoder 
        image_encoder = CLIPVisionModelWithProjection.from_pretrained(
            "laion/CLIP-ViT-H-14-laion2B-s32B-b79K",
            torch_dtype=torch.float16
        )

        self.pipe = DiffusionPipeline.from_pretrained(
            model_id, 
            image_encoder=image_encoder,
            torch_dtype=torch.float16, 
            variant="fp16",
            use_safetensors=True
        )
        self.pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(self.pipe.scheduler.config)
        
        # Load Pixel LoRA
        # NOTE: In production, ensure paths to weights point to absolute paths or relative to the sidecar execution dir
        self.pipe.load_lora_weights("./pixel-art-xl.safetensors", adapter_name="pixel")
        self.pipe.set_adapters(["pixel"], adapter_weights=[1.0]) 

        # Load IP Adapters
        self.pipe.load_ip_adapter(
            ["h94/IP-Adapter", "h94/IP-Adapter"], 
            subfolder=["sdxl_models", "sdxl_models"], 
            weight_name=["ip-adapter-plus_sdxl_vit-h.safetensors", "ip-adapter-plus_sdxl_vit-h.safetensors"]
        )
        
        self.pipe.enable_sequential_cpu_offload()
        self.pipe.enable_vae_slicing()

    def decode_base64_image(self, base64_str: str) -> Image.Image:
        """Converts frontend base64 string data to PIL Image."""
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        image_data = base64.b64decode(base64_str)
        return Image.open(io.BytesIO(image_data)).convert("RGB")

    def generate(self, config: dict) -> list:
        # Set scales dynamically from Rust args
        self.pipe.set_ip_adapter_scale([config["style_inference"], config["reference_inference"]])
        
        style_image = self.decode_base64_image(config["style_image"])
        reference_image = self.decode_base64_image(config["reference_image"])
        
        generated_paths = []
        output_dir = config.get("output_dir", "./output")
        os.makedirs(output_dir, exist_ok=True)

        for i in range(config["num_images"]):
            gc.collect()
            torch.cuda.empty_cache()
            
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