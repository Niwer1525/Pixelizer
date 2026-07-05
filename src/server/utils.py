import io
import base64

from PIL import Image

def decode_base64_image(base64_str: str) -> Image.Image | None:
    # Safely return None if the string is empty or missing
    if not base64_str or not base64_str.strip():
        return None
    
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    
    try:
        image_data = base64.b64decode(base64_str)
        return Image.open(io.BytesIO(image_data)).convert("RGB")
    except Exception:
        return None

def get_default_config():
    return {
        "num_images": 1,

        "prompt": "A cute cat",

        "reference_image": "",
        "style_image": "",
        "reference_inference": 0.5,
        "style_inference": 1.0,
        
        "negative_prompt": "photorealistic, realistic, 3d, render, cgi, photography, painting, drawing, sketch, smooth, gradients, anti-aliased, blurry, soft focus, high definition, 4k, wallpaper, grainy, noisy, text, watermark, signature, distorted, bad anatomy",

        "width": 640,
        "height": 360,

        "seed": "123456789",
        "guidance_scale": 6.5,
        "num_inference_steps": 24,

        "output_dir": "./output"
}