import { WidgetStorage } from '../../core/WidgetStorage.js';
import { Hemisphere, lunarPhaseEmoji, lunarPhase, nextFullMoonDate } from './utils.js';

let storage;
let config = {
    hemisphere: Hemisphere.NORTHERN // Default to northern hemisphere
};

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initLunarPhase();
    }
});

async function initLunarPhase() {
    // Load settings
    const hemisphereValue = await storage.get('hemisphere');
    if (hemisphereValue) {
        config.hemisphere = hemisphereValue;
    }
    
    updateLunarDisplay();
    
    // Update every hour to keep data fresh
    setInterval(updateLunarDisplay, 60 * 60 * 1000);
}

function updateLunarDisplay() {
    const today = new Date();
    
    // Get lunar phase emoji
    const emoji = lunarPhaseEmoji(today, {
        hemisphere: config.hemisphere
    });
    document.getElementById('moon-emoji').textContent = emoji;
    
    // Get lunar phase name
    const phaseName = lunarPhase(today);
    document.getElementById('phase-name').textContent = phaseName;
    
    // Calculate time until next full moon
    const nextFullMoonDiv = document.getElementById('next-full-moon');
    
    // Check if we're currently in a full moon
    if (phaseName.toLowerCase() === 'full moon') {
        nextFullMoonDiv.style.display = 'none';
    } else {
        const nextFullMoon = nextFullMoonDate(today);
        const daysUntil = Math.ceil((nextFullMoon - today) / (1000 * 60 * 60 * 24));
        
        nextFullMoonDiv.style.display = 'block';
        nextFullMoonDiv.textContent = `Next full moon in ${daysUntil} days`;
        
        // If very close, show hours
        if (daysUntil <= 1) {
            const hoursUntil = Math.ceil((nextFullMoon - today) / (1000 * 60 * 60));
            nextFullMoonDiv.textContent = `Next full moon in ${hoursUntil} hours`;
        }
    }
} 