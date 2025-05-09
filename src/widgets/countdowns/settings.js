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

function renderCountdowns() {
    const listElement = document.getElementById('countdowns-list');
    listElement.innerHTML = '';
    
    countdowns.forEach((countdown, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'countdown-item';
        if (countdown.pinned) {
            itemDiv.classList.add('pinned');
        }
        
        const countdownInfo = document.createElement('div');
        countdownInfo.className = 'countdown-info';
        const localDate = new Date(countdown.date + 'T00:00:00');
        countdownInfo.textContent = `${countdown.title} (${localDate.toLocaleDateString()})`;
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'countdown-buttons';
        
        const pinButton = document.createElement('button');
        pinButton.textContent = countdown.pinned ? 'Unpin' : 'Pin';
        pinButton.className = 'pin-button';
        pinButton.onclick = () => togglePin(index);
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit-button';
        editButton.onclick = () => editCountdown(index);
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => deleteCountdown(index);
        
        buttonsDiv.appendChild(pinButton);
        buttonsDiv.appendChild(editButton);
        buttonsDiv.appendChild(deleteButton);
        
        itemDiv.appendChild(countdownInfo);
        itemDiv.appendChild(buttonsDiv);
        listElement.appendChild(itemDiv);
    });
}

function sortCountdowns() {
    countdowns.sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return b.pinned ? 1 : -1;
        }
        const daysA = calculateDaysRemaining(a.date);
        const daysB = calculateDaysRemaining(b.date);
        return daysA - daysB;
    });
}

function calculateDaysRemaining(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function togglePin(index) {
    countdowns[index].pinned = !countdowns[index].pinned;
    sortCountdowns();
    await storage.set('countdowns', countdowns);
    renderCountdowns();
}

// Add this helper function to standardize date handling
function normalizeDate(dateString) {
    // Convert date string to local midnight
    const date = new Date(dateString + 'T00:00:00');
    return date.toISOString().split('T')[0]; // Store in YYYY-MM-DD format
}

async function addCountdown() {
    const titleInput = document.getElementById('countdown-title-input');
    const dateInput = document.getElementById('countdown-date-input');
    
    if (titleInput.value && dateInput.value) {
        countdowns.push({
            title: titleInput.value,
            date: normalizeDate(dateInput.value), // Normalize date on save
            pinned: false
        });
        sortCountdowns();
        await storage.set('countdowns', countdowns);
        renderCountdowns();
        
        titleInput.value = '';
        dateInput.value = '';
    }
}

async function deleteCountdown(index) {
    countdowns.splice(index, 1);
    sortCountdowns();
    await storage.set('countdowns', countdowns);
    renderCountdowns();
}

function editCountdown(index) {
    const countdown = countdowns[index];
    const titleInput = document.getElementById('countdown-title-input');
    const dateInput = document.getElementById('countdown-date-input');
    
    titleInput.value = countdown.title;
    dateInput.value = countdown.date; // Date input expects YYYY-MM-DD format
    
    const addButton = document.getElementById('add-countdown-button');
    addButton.textContent = 'Update Countdown';
    addButton.onclick = async () => {
        if (titleInput.value && dateInput.value) {
            countdowns[index] = {
                title: titleInput.value,
                date: normalizeDate(dateInput.value), // Normalize date on save
                pinned: countdown.pinned
            };
            sortCountdowns();
            await storage.set('countdowns', countdowns);
            renderCountdowns();
            
            // Reset form
            titleInput.value = '';
            dateInput.value = '';
            addButton.textContent = 'Add Countdown';
            addButton.onclick = addCountdown;
        }
    };
}

async function removeExpiredCountdowns() {
    const currentCountdowns = countdowns.filter(countdown => {
        const daysRemaining = calculateDaysRemaining(countdown.date);
        return daysRemaining >= 0;
    });
    
    if (currentCountdowns.length !== countdowns.length) {
        countdowns = currentCountdowns;
        await storage.set('countdowns', countdowns);
    }
}

async function initialize() {
    countdowns = await storage.get('countdowns') || [];
    await removeExpiredCountdowns();
    sortCountdowns();
    renderCountdowns();
    
    document.getElementById('add-countdown-button').addEventListener('click', addCountdown);
} 