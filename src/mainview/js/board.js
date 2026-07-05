const badge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const generateBtn = document.getElementById('generate-btn');
const boardContainer = document.getElementById('generation-board-container');
const numImagesInput = document.getElementById('num-images-input');

document.addEventListener('click', function(event) {
    // Check if the clicked element has the class 'save-btn'
    if (event.target.classList.contains('save-btn')) {
        const buttonElement = event.target;
        const src = buttonElement.getAttribute('data-src');
        const index = buttonElement.getAttribute('data-index');
        const time = new Date().getDate();
        
        // Your existing download logic
        var a = document.createElement("a");
        a.href = "data:image/png;base64," + src;
        a.download = `Generated-image-${index}-${time}.png`;
        a.click();
    }
});

export function renderBoard(status, generatedImages) {
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
                    <img src="data:image/png;base64, ${src}" alt="Generated result ${i + 1}" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-transparent to-[var(--bg-color)] opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex flex-col justify-between p-4 pointer-events-none group-hover:pointer-events-auto">
                        <div class="flex justify-end">
                            <button class="glass-button px-3 py-1.5 text-xs font-semibold tracking-wide text-[var(--text-primary)] flex items-center gap-1.5" title="Use as reference">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Ref
                            </button>
                        </div>
                        <div class="flex justify-between items-center translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <span class="text-xs font-mono text-[var(--accent-color)] bg-[var(--menu-bg)] border border-[var(--border-color)] px-2.5 py-1 rounded-[50px]">#${i + 1}</span>
                            <button class="save-btn primary-button px-4 py-1.5 text-sm font-semibold shadow-lg" data-src="${src}" data-index="${i}">Save</button>
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
}

export function updateStatusUI(status, generatedImages) {
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

    renderBoard(status, generatedImages);
}