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

function calculateDaysRemaining(dateString) {
    // Get current date at local midnight
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Parse the target date at local midnight
    const target = new Date(dateString + 'T00:00:00');
    
    const diffTime = target - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function renderCountdowns() {
    const listElement = document.getElementById('countdowns-list');
    listElement.innerHTML = '';

    // Sort countdowns: pinned first, then by days remaining
    countdowns.sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return b.pinned ? 1 : -1;
        }
        const daysA = calculateDaysRemaining(a.date);
        const daysB = calculateDaysRemaining(b.date);
        return daysA - daysB;
    });
    
    // Create containers for pinned and unpinned items
    const pinnedContainer = document.createElement('div');
    pinnedContainer.className = 'pinned-countdowns';
    const unpinnedContainer = document.createElement('div');
    unpinnedContainer.className = 'unpinned-countdowns';
    
    countdowns.forEach(countdown => {
        const daysRemaining = calculateDaysRemaining(countdown.date);
        
        // Skip if countdown has elapsed
        if (daysRemaining <= -1) {
            return;
        }
        
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
        // Create date object from YYYY-MM-DD string in local timezone
        const localDate = new Date(countdown.date + 'T00:00:00');
        dateSpan.textContent = localDate.toLocaleDateString();
        
        const daysSpan = document.createElement('span');
        daysSpan.className = 'countdown-days';
        daysSpan.textContent = daysRemaining === 0 ? 'Today!' : 
                              daysRemaining === 1 ? '1 day' :
                              `${daysRemaining} days`;
        
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