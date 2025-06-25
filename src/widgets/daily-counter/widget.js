import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initCounter();
    }
});

async function initCounter() {
    await recordLoad();
    await updateDisplay();
    
    // Update display every minute to catch midnight transitions
    setInterval(async () => {
        await updateDisplay();
    }, 60000);
}

async function recordLoad() {
    const today = getToday();
    
    // Get today's current count
    const todayCount = await storage.get(`count_${today}`) || 0;
    
    // Increment and save
    await storage.set(`count_${today}`, todayCount + 1);
}

async function updateDisplay() {
    const today = getToday();
    
    // Get today's count
    const todayCount = await storage.get(`count_${today}`) || 0;
    
    // Calculate average
    const average = await calculateAverage();
    
    // Update display
    document.getElementById('today-count').textContent = `Today: ${todayCount}`;
    document.getElementById('average-count').textContent = `Average: ${Math.round(average)}`;
}

async function calculateAverage() {
    // Get all stored data to find all days
    const allKeys = await getAllCountKeys();
    
    if (allKeys.length === 0) {
        return 0;
    }
    
    let total = 0;
    let dayCount = 0;
    
    for (const key of allKeys) {
        const count = await storage.get(key);
        if (count !== undefined && count !== null) {
            total += count;
            dayCount++;
        }
    }
    
    return dayCount > 0 ? total / dayCount : 0;
}

async function getAllCountKeys() {
    // This is a workaround since we can't list all keys directly
    // We'll check for the last 365 days worth of data
    const keys = [];
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        const key = `count_${dateStr}`;
        
        // Check if this key has data
        const value = await storage.get(key);
        if (value !== undefined && value !== null) {
            keys.push(key);
        }
    }
    
    return keys;
}

function getToday() {
    return formatDate(new Date());
}

function formatDate(date) {
    // Format as YYYY-MM-DD using local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
} 