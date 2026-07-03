import { join } from "path";
import { existsSync } from "fs";
import { getAppDataDir } from './utils';

/**
 * Create Virtual Environment using system python
 * @param venvDir The environment directory
 * @param isWindows If we're on Windows
 * @return True if the process succeeded, false otherwise
 */
async function setupVenv(venvDir: string, isWindows: boolean) {
    // TODO (Ensure the user has Python installed, or ship a portable python embeddable version zip)
    const systemPython = isWindows ? "python" : "python3";
    const venvProc = Bun.spawn([systemPython, "-m", "venv", venvDir], {
        stdin: "pipe",
        stdout: "inherit",
        stderr: "inherit"
    });
    return await venvProc.exited == 0;
}

/**
 * Install all required dependencies
 * @param venvDir The environment directory
 * @param isWindows If we're on Windows
 * @returns True if the process succeeded, false otherwise
 */
async function installDependencies(venvDir: string, isWindows: boolean) {
    const pipExec = isWindows ? join(venvDir, "Scripts", "pip.exe") : join(venvDir, "bin", "pip");
    
    // Pass standard torch install (modify with --index-url if specific CUDA/ROCm versions are mandatory)
    const pipProc = Bun.spawn([
        pipExec, "install", 
        "torch",
        "torchvision",
        "transformers",
        "diffusers",
        "accelerate",
        "safetensors",
        "Pillow",
        "peft"
    ], {
        stdout: "pipe",
        stderr: "pipe",
    });
    return await pipProc.exited == 0;
}

/**
 * Ensures the Python environment and dependencies exist.
 * Runs silently on boot up or right before generation.
 */
export async function ensurePythonEnv(): Promise<string> {
    const venvDir = join(getAppDataDir(), "python_env");
    
    /* Determine the python executable path based on OS */
    const isWindows = process.platform === "win32";
    const pythonExec = isWindows ? join(venvDir, "Scripts", "python.exe") : join(venvDir, "bin", "python");
    
    /* Ensure the pytonh executable is there */
    if (existsSync(pythonExec)) return pythonExec;
    console.log("Setting up local Python environment... This might take a few minutes.");

    /* Setup Venv environment, and if it succeeds, continue with the rest of the setup */
    if(await setupVenv(venvDir, isWindows)) {
        console.log("Installing dependencies...");
        if(await installDependencies(venvDir, isWindows)) console.log("Python environment setup complete!");
        else throw new Error("Failed installing dependencies");
    }
    
    return pythonExec;
}