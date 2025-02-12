let config;

window.addEventListener('message', (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        config = message.config;
        initDate();
    }
});

function initDate() {
    const display = document.getElementById('date-display');
    
    function updateDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        };
        const formatted = now.toLocaleDateString('en-US', options);
        // Remove comma after day of month by splitting on commas and rejoining
        const parts = formatted.split(',');
        display.textContent = `${parts[0]}, ${parts[1].trim()} ${parts[2].trim()}`;
    }

    updateDate();
    // Update date at midnight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow - new Date();
    setTimeout(() => {
        updateDate();
        // After first midnight update, update every 24 hours
        setInterval(updateDate, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
} 