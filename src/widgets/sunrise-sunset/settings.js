import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await loadSettings();
    }
});

async function loadSettings() {
    const location = await storage.get('location');
    const timezone = await storage.get('timezone');

    if (location) {
        document.getElementById('latitude').value = location.latitude;
        document.getElementById('longitude').value = location.longitude;
    }

    if (timezone) {
        document.getElementById('timezone').value = timezone;
    }
}

document.getElementById('use-location').addEventListener('click', async () => {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        document.getElementById('latitude').value = position.coords.latitude;
        document.getElementById('longitude').value = position.coords.longitude;
        
        // Try to determine timezone based on location
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        document.getElementById('timezone').value = timezone;
        
        showStatus('Location set successfully', 'success');
    } catch (error) {
        showStatus('Error getting location: ' + error.message, 'error');
    }
});

document.getElementById('save-settings').addEventListener('click', async () => {
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const timezone = document.getElementById('timezone').value;

    if (isNaN(latitude) || isNaN(longitude) || !timezone) {
        showStatus('Please fill in all fields', 'error');
        return;
    }

    await storage.set('location', { latitude, longitude });
    await storage.set('timezone', timezone);
    showStatus('Settings saved successfully', 'success');
});

function showStatus(message, type) {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    statusElement.className = type;
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = '';
    }, 3000);
} 