export function setupDimensionEnforcement(inputElement) {
    const enforceEvenDimension = (e) => {
        if (e.target.value === '') return;
        let val = parseInt(e.target.value, 10);

        if (isNaN(val)) {
            e.target.value = 512;
            return;
        }

        if (val % 2 !== 0) val -= 1; // Force multiple of 2
        if (val < 64) val = 64;
        if (val > 2048) val = 2048;

        e.target.value = val;
    };

    inputElement.addEventListener('change', enforceEvenDimension);
    inputElement.addEventListener('blur', enforceEvenDimension);
}

export function bindSlider(sliderId, displayId) {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    slider.addEventListener('input', (e) => {
        display.textContent = parseFloat(e.target.value).toFixed(2);
    });
}

export function setupDropzone(type, onUpdate) {
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
}