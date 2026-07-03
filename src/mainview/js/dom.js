import { view } from '../index.ts';
import { updateStatusUI } from './board.js';
import { initTheme } from './theme.js';
import { bindSlider, setupDimensionEnforcement, setupDropzone } from './ui-components.js';

document.addEventListener('DOMContentLoaded', () => {
    // Global State
    let refImage = null;
    let styleImage = null;
    let status = 'Idle';
    let generatedImages = [];

    // UI Cache Elements
    const generateBtn = document.getElementById('generate-btn');
    const numImagesInput = document.getElementById('num-images-input');
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    const settingsModal = document.getElementById('settings-modal-overlay');

    // 1. Initialize Theme Engine
    initTheme('theme-select');

    // 2. Initialize UI Components
    setupDimensionEnforcement(widthInput);
    setupDimensionEnforcement(heightInput);

    bindSlider('ref-weight-slider', 'ref-weight-value');
    bindSlider('style-weight-slider', 'style-weight-value');

    setupDropzone('ref', (val) => { refImage = val; });
    setupDropzone('style', (val) => { styleImage = val; });

    // Helper to change local state and trigger UI updates
    const setStatus = (newStatus) => {
        status = newStatus;
        updateStatusUI(status, generatedImages);
    };

    // 3. Application Data Methods
    async function loadAppSettings() {
        try {
            const settings = await view.rpc?.request.load_settings();
            if (settings) {
                document.getElementById('negative-prompt-desc').value = settings.negativePrompt || '';
                document.getElementById('seed-input').value = settings.seed || '';
                const themeSelect = document.getElementById('theme-select');
                themeSelect.value = settings.theme || 'light';
                themeSelect.dispatchEvent(new Event('change'));
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    }

    // Trigger Initial Data Load
    loadAppSettings();

    // 4. Event Handlers (Generations & Modals)
    generateBtn.addEventListener('click', async () => {
        // Force manual dispatch of dimension enforcement checks before firing
        widthInput.dispatchEvent(new Event('blur'));
        heightInput.dispatchEvent(new Event('blur'));

        setStatus("Generating...");
        generatedImages = [];

        try {
            const response = await view.rpc?.request.generate_images({
                prompt: document.getElementById('prompt-desc').value,
                refImage,
                styleImage,
                refWeight: parseFloat(document.getElementById('ref-weight-slider').value),
                styleWeight: parseFloat(document.getElementById('style-weight-slider').value),
                numImages: parseInt(numImagesInput.value),
                width: parseInt(widthInput.value, 10),
                height: parseInt(heightInput.value, 10),
                generationStyle: document.getElementById('style-enum-select').value,
                transparentBg: document.getElementById('transparent-bg-checkbox').checked,
                negativePrompt: document.getElementById('negative-prompt-desc').value,
                seed: document.getElementById('seed-input').value || null
            });

            /* If an error occured */
            if(!response || !response.success || !response.images)
                throw new Error(`Error generating images. ${JSON.stringify(response)}`);

            generatedImages = response.images;
            setStatus("Complete");
        } catch (error) {
            console.error(error);
            setStatus("Error");
        }
    });

    // Settings Modal Navigation
    const openSettings = () => { settingsModal.classList.replace('hidden', 'flex'); };
    const closeSettings = () => { settingsModal.classList.replace('flex', 'hidden'); };

    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('close-settings-x').addEventListener('click', closeSettings);
    document.getElementById('cancel-settings-btn').addEventListener('click', closeSettings);

    document.getElementById('save-settings-btn').addEventListener('click', async () => {
        const oldStatus = status;
        setStatus('Saving...');
        try {
            const currentTheme = document.getElementById('theme-select').value;
            await view.rpc?.request.save_settings({
                settings: {
                    negativePrompt: document.getElementById('negative-prompt-desc').value,
                    seed: document.getElementById('seed-input').value,
                    theme: currentTheme
                }
            });

            localStorage.setItem('pixelizer-theme', currentTheme);
            closeSettings();
            setStatus(oldStatus === 'Saving...' ? 'Idle' : oldStatus);
        } catch (error) {
            console.error(error);
            setStatus("Error");
        }
    });
});