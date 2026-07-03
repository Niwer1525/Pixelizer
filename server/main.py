import sys
import json
from generator import ImageGenerator

def main():
    # Communicate via standard input/output with JSON strings
    try:
        input_data = sys.stdin.read()
        config = json.loads(input_data)
        
        # Instantiate and run model
        generator = ImageGenerator()
        paths = generator.generate(config)
        
        # Output result back to Rust via stdout
        print(json.dumps({"status": "success", "images": paths}))
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()