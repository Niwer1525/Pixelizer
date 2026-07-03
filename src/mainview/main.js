const invoke = async function (method, ...args) {
	const result = await invoke(method, ...args);
	return result;
}

async function loadAppSettings() {
	try {
		const settings = await invoke('load_settings');

		if (settings) {
		document.getElementById('negative-prompt-desc').value = settings.negativePrompt || '';
		document.getElementById('seed-input').value = settings.seed || '';
		themeSelect.value = settings.theme || 'light';
		applyTheme(themeSelect.value)
		}
	} catch (error) {
		console.error("Failed to load settings:", error);
	}
}

	document.addEventListener('DOMContentLoaded', () => {
	// Global State
	let refImage = null;
	let styleImage = null;
	let status = 'Idle';
	let generatedImages = [];

	// UI Elements
	const badge = document.getElementById('status-badge');
	const statusText = document.getElementById('status-text');
	const generateBtn = document.getElementById('generate-btn');
	const boardContainer = document.getElementById('generation-board-container');
	const numImagesInput = document.getElementById('num-images-input');
	const widthInput = document.getElementById('width-input');
	const heightInput = document.getElementById('height-input');

	// --- Theme Management ---
	const themeSelect = document.getElementById('theme-select');

	const applyTheme = (theme) => {
		if (theme === 'system') {
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme', 'dark');
		else document.documentElement.setAttribute('data-theme', 'light');
		} else document.documentElement.setAttribute('data-theme', theme);
	};

	// Listen for system theme changes
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
		if (themeSelect.value === 'system') applyTheme('system');
	});

	// Load saved theme or default to system
	const savedTheme = localStorage.getItem('pixelizer-theme') || 'system';
	themeSelect.value = savedTheme;
	applyTheme(savedTheme);

	themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));

	// Load saved settings
	loadAppSettings();

	// --- Dimensions Enforcement ---
	const enforceEvenDimension = (e) => {
		if (e.target.value === '') return; // Allow clearing the input while typing
		let val = parseInt(e.target.value, 10);

		if (isNaN(val)) {
		e.target.value = 512;
		return;
		}

		// Force multiple of 2 (round down odd numbers, e.g., 65 -> 64)
		if (val % 2 !== 0) val -= 1;

		// Clamp between 64 and 2048
		if (val < 64) val = 64;
		if (val > 2048) val = 2048;

		// Update the input field
		e.target.value = val;
	};

	widthInput.addEventListener('change', enforceEvenDimension);
	widthInput.addEventListener('blur', enforceEvenDimension); // Apply on click-away
	heightInput.addEventListener('change', enforceEvenDimension);
	heightInput.addEventListener('blur', enforceEvenDimension); // Apply on click-away

	// --- Range Sliders Binding ---
	const bindSlider = (sliderId, displayId) => {
		const slider = document.getElementById(sliderId);
		const display = document.getElementById(displayId);
		slider.addEventListener('input', (e) => {
		display.textContent = parseFloat(e.target.value).toFixed(2);
		});
	};
	bindSlider('ref-weight-slider', 'ref-weight-value');
	bindSlider('style-weight-slider', 'style-weight-value');

	// --- Dropzone Logic Builder ---
	const setupDropzone = (type, onUpdate) => {
		const dropzone = document.getElementById(`${type}-dropzone`);
		const input = document.getElementById(`${type}-input`);
		const emptyState = document.getElementById(`${type}-empty`);
		const previewContainer = document.getElementById(`${type}-preview-container`);
		const previewImg = document.getElementById(`${type}-preview-img`);
		const clearBtn = document.getElementById(`${type}-clear-btn`);

		const loadFile = (file) => {
		if (file && file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (e) => {
			const result = e.target.result;
			previewImg.src = result;
			emptyState.classList.add('hidden');
			dropzone.classList.remove('border-dashed');
			previewContainer.classList.remove('hidden');
			onUpdate(result);
			};
			reader.readAsDataURL(file);
		}
		};

		const clearFile = (e) => {
		e.stopPropagation();
		input.value = "";
		previewImg.src = "";
		previewContainer.classList.add('hidden');
		dropzone.classList.add('border-dashed');
		emptyState.classList.remove('hidden');
		onUpdate(null);
		};

		dropzone.addEventListener('click', () => input.click());
		input.addEventListener('change', (e) => loadFile(e.target.files[0]));
		clearBtn.addEventListener('click', clearFile);

		dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dropzone-dragging'); });
		dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.classList.remove('dropzone-dragging'); });
		dropzone.addEventListener('drop', (e) => {
		e.preventDefault();
		dropzone.classList.remove('dropzone-dragging');
		if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
		});
	};

	setupDropzone('ref', (val) => { refImage = val; });
	setupDropzone('style', (val) => { styleImage = val; });


	// --- Status & Rendering Logic ---
	const updateStatus = (newStatus) => {
		status = newStatus;
		badge.className = "px-4 py-1.5 rounded-[50px] text-[0.78rem] tracking-wider uppercase font-bold border flex items-center gap-2 shadow-[var(--shadow-soft)]";

		if (status === 'Generating...') {
		badge.classList.add('bg-[rgba(216,180,254,0.1)]', 'border-[var(--accent-color)]', 'text-[var(--accent-color)]', 'shadow-[0_0_15px_var(--accent-glow)]');
		statusText.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Generating...`;
		generateBtn.disabled = true;
		generateBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin text-[var(--bg-color)]"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Processing`;
		} else if (status === 'Complete') {
		badge.classList.add('bg-[rgba(124,58,237,0.1)]', 'border-[rgba(124,58,237,0.3)]', 'text-[#b490fc]');
		statusText.innerHTML = `<div class="w-1.5 h-1.5 rounded-full bg-[#b490fc]"></div> Complete`;
		generateBtn.disabled = false;
		generateBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--bg-color)]"><polygon points="5 3 19 12 5 21 5 3"/></svg> Generate Artwork`;
		} else if (status === 'Error') {
		badge.classList.add('bg-[rgba(255,0,0,0.1)]', 'border-[rgba(255,0,0,0.3)]', 'text-red-400');
		statusText.innerHTML = `<div class="w-1.5 h-1.5 rounded-full bg-red-500"></div> Error`;
		generateBtn.disabled = false;
		generateBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--bg-color)]"><polygon points="5 3 19 12 5 21 5 3"/></svg> Generate Artwork`;
		} else {
		badge.classList.add('bg-[var(--surface-glass)]', 'border-[var(--border-color)]', 'text-[var(--text-secondary)]');
		statusText.innerHTML = `<div class="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]"></div> Idle`;
		generateBtn.disabled = false;
		generateBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--bg-color)]"><polygon points="5 3 19 12 5 21 5 3"/></svg> Generate Artwork`;
		}

		renderBoard();
	};

	const renderBoard = () => {
		if (status === 'Generating...') {
		let skeletons = '<div id="generation-board" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-max">';
		const count = parseInt(numImagesInput.value) || 4;
		for (let i = 0; i < count; i++) {
			skeletons += `
						<div class="aspect-square bg-[var(--surface-glass)] border border-[var(--border-color)] rounded-[var(--border-radius)] overflow-hidden shadow-[var(--shadow-soft)] flex items-center justify-center relative">
							<div class="absolute inset-0 bg-gradient-to-tr from-[rgba(216,180,254,0.05)] to-transparent animate-pulse"></div>
							<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--accent-color)] animate-spin opacity-50"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
						</div>`;
		}
		boardContainer.innerHTML = skeletons + '</div>';
		} else if (generatedImages.length > 0) {
		let grid = '<div id="generation-board" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-max">';
		generatedImages.forEach((src, i) => {
			grid += `
						<div class="generated-card aspect-square bg-[var(--surface-glass)] border border-[var(--border-color)] rounded-[var(--border-radius)] overflow-hidden backdrop-blur-md relative group">
							<img src="${src}" alt="Generated result ${i + 1}" class="w-full h-full object-cover" />
							<div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-transparent to-[var(--bg-color)] opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex flex-col justify-between p-4 pointer-events-none group-hover:pointer-events-auto">
								<div class="flex justify-end">
									<button class="glass-button px-3 py-1.5 text-xs font-semibold tracking-wide text-[var(--text-primary)] flex items-center gap-1.5" title="Use as reference">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Ref
									</button>
								</div>
								<div class="flex justify-between items-center translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
									<span class="text-xs font-mono text-[var(--accent-color)] bg-[var(--menu-bg)] border border-[var(--border-color)] px-2.5 py-1 rounded-[50px]">#${i + 1}</span>
									<button class="primary-button px-4 py-1.5 text-sm font-semibold shadow-lg">Save</button>
								</div>
							</div>
						</div>`;
		});
		boardContainer.innerHTML = grid + '</div>';
		} else {
		boardContainer.innerHTML = `
					<div class="empty-state h-full flex flex-col items-center justify-center text-[var(--text-secondary)] max-w-md mx-auto text-center animate-in fade-in zoom-in duration-500 min-h-[400px]">
						<div class="w-32 h-32 mb-6 rounded-full bg-[var(--surface-glass)] border border-[var(--border-color)] flex items-center justify-center shadow-[var(--shadow-soft)] relative">
							<div class="absolute inset-0 rounded-full border border-[var(--accent-color)] opacity-20 animate-[ping_3s_ease-in-out_infinite]"></div>
							<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--text-secondary)]"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
						</div>
						<h3 class="text-xl font-bold text-[var(--text-primary)] mb-3">Ready to create</h3>
						<p class="text-[0.95rem] leading-relaxed">Configure your references in the sidebar and hit <span class="text-[var(--accent-color)] font-medium px-1 rounded bg-[rgba(216,180,254,0.1)]">Generate Artwork</span> to see your designs appear here.</p>
					</div>`;
		}
	};

	// --- Generation Execution ---
	generateBtn.addEventListener('click', async () => {
		// Force dimension checks in case the user typed an invalid number and clicked Generate immediately
		enforceEvenDimension({ target: widthInput });
		enforceEvenDimension({ target: heightInput });

		updateStatus("Generating...");
		generatedImages = [];
		try {
		// return new Promise((resolve, reject) => {
	//             setTimeout(() => {
	//                     const count = args.numImages || 4;
	//                     const mockImages = Array.from({ length: count }).map((_, i) =>
	//                         `https://picsum.photos/seed/${args.seed || Math.random()}-${i}/512/512`
	//                     );
	//                     resolve({ status: 'success', images: mockImages });
	//             }, 2500);
	//         });

		const response = await invoke('generate_images', {
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

		generatedImages = response.images;
		updateStatus("Complete");
		} catch (error) {
		console.error(error);
		updateStatus("Error");
		}
	});

	// --- Settings Modal ---
	const settingsModal = document.getElementById('settings-modal-overlay');

	const openSettings = () => {
		settingsModal.classList.remove('hidden');
		settingsModal.classList.add('flex');
	};

	const closeSettings = () => {
		settingsModal.classList.add('hidden');
		settingsModal.classList.remove('flex');
	};

	document.getElementById('settings-btn').addEventListener('click', openSettings);
	document.getElementById('close-settings-x').addEventListener('click', closeSettings);
	document.getElementById('cancel-settings-btn').addEventListener('click', closeSettings);

	document.getElementById('save-settings-btn').addEventListener('click', async () => {
		const oldStatus = status;
		updateStatus('Saving...');
		try {
		await invoke('save_settings', {
			settings: {
			negativePrompt: document.getElementById('negative-prompt-desc').value,
			seed: document.getElementById('seed-input').value,
			theme: themeSelect.value
			}
		});

		// Persist to local storage for frontend reactivity on reload
		localStorage.setItem('pixelizer-theme', themeSelect.value);

		closeSettings();
		updateStatus(oldStatus === 'Saving...' ? 'Idle' : oldStatus);
		} catch (error) {
		console.error(error);
		updateStatus("Error");
		}
	});
});
