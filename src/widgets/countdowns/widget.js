import { WidgetStorage } from '../../core/WidgetStorage.js';

let countdowns = [];
let storage;

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initialize();
    }
});

async function initialize() {
    countdowns = await storage.get('countdowns') || [];
    renderCountdowns();
    // Update every hour
    setInterval(renderCountdowns, 1000 * 60 * 60);
}

function calculateDaysRemaining(targetDate) {
    const now = new Date();
    // Set time to start of day to avoid time zone issues
    now.setHours(0, 0, 0, 0);
    
    const target = new Date(targetDate + 'T00:00:00');
    const diffTime = target - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function renderCountdowns() {
    const listElement = document.getElementById('countdowns-list');
    listElement.innerHTML = '';
    
    console.log(countdowns);
    // Sort countdowns: pinned first, then by days remaining
    countdowns.sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return b.pinned ? 1 : -1;
        }
        const daysA = calculateDaysRemaining(a.date);
        const daysB = calculateDaysRemaining(b.date);
        return daysA - daysB;
    });

    console.log(countdowns);
    
    // Create containers for pinned and unpinned items
    const pinnedContainer = document.createElement('div');
    pinnedContainer.className = 'pinned-countdowns';
    const unpinnedContainer = document.createElement('div');
    unpinnedContainer.className = 'unpinned-countdowns';
    
    countdowns.forEach(countdown => {
        const daysRemaining = calculateDaysRemaining(countdown.date);
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'countdown-item';
        if (countdown.pinned) {
            itemDiv.classList.add('pinned');
        }
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'countdown-title';
        titleSpan.textContent = countdown.title;
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'countdown-date';
        dateSpan.textContent = new Date(countdown.date).toLocaleDateString();
        
        const daysSpan = document.createElement('span');
        daysSpan.className = 'countdown-days';
        daysSpan.textContent = `${daysRemaining} days`;
        
        itemDiv.appendChild(titleSpan);
        itemDiv.appendChild(dateSpan);
        itemDiv.appendChild(daysSpan);
        
        if (countdown.pinned) {
            pinnedContainer.appendChild(itemDiv);
        } else {
            unpinnedContainer.appendChild(itemDiv);
        }
    });
    
    if (pinnedContainer.children.length > 0) {
        listElement.appendChild(pinnedContainer);
    }
    if (unpinnedContainer.children.length > 0) {
        listElement.appendChild(unpinnedContainer);
    }
} 