import { join } from 'path';
import { type ImageGenerationArgs } from '../shared/objects';
import { ensurePythonEnv } from './python';
import { processImage } from './snapper/snapper';
import { getGeneratedImagesPath } from './utils';

export async function snap_images(imagesPaths: any) {
    console.log("Starting snapping images...");
    
    const resultImages = []; // Initialize as an empty array for the base64 results
    for (let path of imagesPaths) {
        try {
            const file = Bun.file(path);
            if (!(await file.exists())) continue; // Skip if the files doesn't exist

            const arrayBuffer = await file.arrayBuffer();
            const inputBuffer = Buffer.from(arrayBuffer);
            
            console.log(`Processing grid extraction logic for : ${path}`);
            const outputBuffer = await processImage(inputBuffer, { kColors: 16 });

            /* Base64 */
            const base64Image = outputBuffer.toString('base64'); // Convert the output buffer to a Base64 string
            resultImages.push(base64Image); // Push to the results array
        } catch (e) {
            console.error("Error ", e);
        }
    }

    return resultImages;
}

export async function generate_images(args: ImageGenerationArgs) {
    console.log("Starting image generation...");
    try {
        const pythonExecutable = await ensurePythonEnv();
        const mainPythonScript = join(import.meta.dir, "server", "main.py");
        const proccess = Bun.spawn([pythonExecutable, mainPythonScript], {
            stdin: "pipe",
            stdout: "pipe",
            stderr: "pipe",
        });

        // TODO add support for transparentBg, style selector

        const payload = JSON.stringify({
            num_images: args.numImages,

            prompt: args.prompt,

            reference_image: args.refImage,
            style_image: args.styleImage,
            reference_inference: args.refWeight,
            style_inference: args.styleWeight,

            negative_prompt: args.negativePrompt,

            seed: "",
            width: args.width,
            height: args.height,

            guidance_scale: 6.5,
            num_inference_steps: 24,

            output_dir: getGeneratedImagesPath()
        });

        // Write payload data straight to Python's stdin, then close it
        console.log(`Sending payload to the server. ${payload}`);
        proccess.stdin.write(payload);
        proccess.stdin.flush();
        proccess.stdin.end();

        // Wait for the sidecar process to exit completely
        console.log("Generating...");
        const exitCode = await proccess.exited;
        console.log(`Server process terminated with exit code: ${exitCode}`);

        // Check for errors
        const stderrOutput = await new Response(proccess.stderr).text();
        if (stderrOutput) console.error("Server Errors:\n", stderrOutput);
        
        const stdoutOutput = await new Response(proccess.stdout).text();
        console.log("Server Output:\n", stdoutOutput);

        try {
            const lines = stdoutOutput.split('\n');
            const jsonLine = lines.find(line => line.startsWith('{"status":'));

            /* Read the json line if it exists */
            if (!jsonLine) throw new Error(`No JSON found in stdout. Raw output: ${stdoutOutput}`);
            const response = JSON.parse(jsonLine);
            
            if (response.status === "success") return snap_images(response.images); // Return the array of strings
            else throw new Error(response.error || "Unknown execution error occurred.");
        } catch (e: any) {
            throw new Error(`Failed to parse Python response: ${e.message}`);
        }
    } catch (e: any) {
        throw new Error(`Failed to interact with the server: ${e.message}`);
    }
}