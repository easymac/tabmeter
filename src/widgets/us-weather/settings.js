import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initSettings();
    }
});

async function initSettings() {
    const locationData = await storage.get('location');
    if (locationData) {
        document.getElementById('latitude').value = locationData.latitude;
        document.getElementById('longitude').value = locationData.longitude;
    }

    const temperatureUnit = await storage.get('temperatureUnit') || 'fahrenheit';
    document.querySelector(`input[name="temperatureUnit"][value="${temperatureUnit}"]`).checked = true;

    document.getElementById('use-location').addEventListener('click', getCurrentLocation);
    document.getElementById('save-settings').addEventListener('click', saveSettings);
}

function getCurrentLocation() {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = 'Requesting location...';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('latitude').value = position.coords.latitude;
            document.getElementById('longitude').value = position.coords.longitude;
            statusMessage.textContent = 'Location obtained!';
        },
        (error) => {
            statusMessage.textContent = `Error getting location: ${error.message}`;
        }
    );
}

async function saveSettings() {
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const temperatureUnit = document.querySelector('input[name="temperatureUnit"]:checked').value;
    
    if (isNaN(latitude) || isNaN(longitude)) {
        document.getElementById('status-message').textContent = 'Please enter valid coordinates';
        return;
    }

    await storage.set('location', { latitude, longitude });
    await storage.set('temperatureUnit', temperatureUnit);
    window.parent.postMessage({ type: 'SETTINGS_SAVED' }, '*');
} 