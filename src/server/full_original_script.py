import gc
import os
import torch
from diffusers import DiffusionPipeline, EulerAncestralDiscreteScheduler
from diffusers.utils import load_image
from transformers import CLIPVisionModelWithProjection

os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
torch.backends.cuda.matmul.allow_tf32 = True

model_id = "stabilityai/stable-diffusion-xl-base-1.0"

# Load the single unified ViT-H encoder 
image_encoder = CLIPVisionModelWithProjection.from_pretrained(
    "laion/CLIP-ViT-H-14-laion2B-s32B-b79K",
    torch_dtype=torch.float16
)

pipe = DiffusionPipeline.from_pretrained(
    model_id, 
    image_encoder=image_encoder,
    torch_dtype=torch.float16, 
    variant="fp16",
    use_safetensors=True
)

pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)

# Load Pixel LoRA
pipe.load_lora_weights("./pixel-art-xl.safetensors", adapter_name="pixel")
pipe.set_adapters(["pixel"], adapter_weights=[1.0]) 

# FIXED: Load TWO instances of the Plus adapter to keep cross-attention matrices identical shapes
pipe.load_ip_adapter(
    [
        "h94/IP-Adapter", 
        "h94/IP-Adapter"
    ], 
    subfolder=[
        "sdxl_models", 
        "sdxl_models"
    ], 
    weight_name=[
        "ip-adapter-plus_sdxl_vit-h.safetensors",  # Slot 0: Handles Style Sheet
        "ip-adapter-plus_sdxl_vit-h.safetensors"   # Slot 1: Handles Red Barrel Content
    ]
)

# FIXED: Balanced weights across the unified dimensions
# 0.35 pulls the isometric pixel cluster aesthetic softly
# 0.95 forces the strict shape, horizontal rings, and red tint of the barrel
pipe.set_ip_adapter_scale([0.50, 0.75]) 

pipe.enable_sequential_cpu_offload()
pipe.enable_vae_slicing()

style_image = load_image("./shorter.png")
reference_image = load_image("./reference.webp")

prompt = """pixel art, isometric game asset, a single red metal oil barrel, steel drum, 
weathered red painted metal, horizontal ridges, post-apocalyptic asset, clean pixel lines, 
project zomboid style, solid dark gray background"""

negative_prompt = "wood, wooden barrel, staves, hoops, planks, medieval chest, 3d render, realistic, blurry, collage, grid lines"

num_images = 2
for i in range(num_images):
    gc.collect()
    torch.cuda.empty_cache()
    
    img = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=24,  
        guidance_scale=6.5,      
        # Pass style to slot 0, structure to slot 1
        ip_adapter_image=[style_image, reference_image], 
    ).images[0]
    
    img.save(f"dual_adapter_{i}.png")