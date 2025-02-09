let config;

window.addEventListener('message', (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        config = message.config;
        initClock();
    }
});

function initClock() {
    const display = document.getElementById('clock-display');
    
    function updateTime() {
        const now = new Date();
        display.textContent = now.toLocaleTimeString('en-US', { 
            timeZone: config.timezone 
        });
    }

    updateTime();
    setInterval(updateTime, 1000);
} 