let config;

window.addEventListener('message', (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        config = message.config;
        if (!config.targetDate) {
            config.targetDate = '2026-08-07'; // Default date
        }
        initCountdown();
    }
});

function initCountdown() {
    const display = document.getElementById('date-display');
    
    function updateCountdown() {
        const now = new Date();
        const target = new Date(config.targetDate);
        
        // Calculate days between dates
        const diffTime = target - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        display.textContent = `${diffDays} days remain`;
    }

    updateCountdown();
    // Update every hour (no need to update more frequently for days)
    setInterval(updateCountdown, 1000 * 60 * 60);
} 