export function initTheme(themeSelectId) {
    const themeSelect = document.getElementById(themeSelectId);
    
    const applyTheme = (theme) => {
        if (theme === 'system') {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    };

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (themeSelect.value === 'system') applyTheme('system');
    });

    // Load saved theme or default to system
    const savedTheme = localStorage.getItem('pixelizer-theme') || 'system';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);

    themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });
}