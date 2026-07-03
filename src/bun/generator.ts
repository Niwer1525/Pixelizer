import { getAppDataDir } from './utils';
import { type ImageGenerationArgs } from '../shared/objects';

export async function generate_images(args: ImageGenerationArgs) {
    // Map your frontend object structure to your Python script's expected schema
    const payload = {
        num_images: args.numImages,
        prompt: args.prompt,
        reference_image: args.refImage,
        style_image: args.styleImage,
        reference_inference: args.refWeight,
        style_inference: args.styleWeight,
        negative_prompt: args.negativePrompt,
        width: args.width,
        height: args.height,
        guidance_scale: 6.5,
        num_inference_steps: 24,
        output_dir: getAppDataDir()
    };

    const sidecarPath = "./sidecars/main"; 

    // Spawn the subprocess using Bun.spawn
    const proc = Bun.spawn([sidecarPath], {
        stdin: "pipe",   // Open stdin so we can write to Python
        stdout: "pipe",  // Open stdout to capture python's response
        stderr: "pipe",  // Capture logs/errors
    });

    // Write payload data straight to Python's stdin, then close it
    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.flush();
    proc.stdin.end();

    // Wait for the sidecar process to exit completely
    const exitCode = await proc.exited;
    console.log(`Sidecar process terminated with exit code: ${exitCode}`);

    // Read streams
    const stdoutOutput = await new Response(proc.stdout).text();
    const stderrOutput = await new Response(proc.stderr).text();

    if (stderrOutput) {
        console.error("Python Sidecar Log/Errors:\n", stderrOutput);
    }

    try {
        const response = JSON.parse(stdoutOutput);
        
        if (response.status === "success") {
            return response.images; // Return the array of strings
        } else {
            throw new Error(response.error || "Unknown execution error occurred.");
        }
    } catch (e: any) {
        throw new Error(`Failed to parse Python response: ${e.message}`);
    }
}