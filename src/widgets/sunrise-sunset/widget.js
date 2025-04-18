import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initSunriseSunset();
    }
});

async function initSunriseSunset() {
    await updateTimes();
    // Update times every hour
    setInterval(updateTimes, CACHE_DURATION);
}

async function getSunriseSunsetData(lat, lng, tzid) {
    // Try to get cached data
    const cache = await storage.get('sunrise_sunset_cache');
    if (cache && cache.timestamp > Date.now() - CACHE_DURATION) {
        return cache.data;
    }

    const response = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&tzid=${tzid}&formatted=0`
    );
    const data = await response.json();

    // Cache the data
    await storage.set('sunrise_sunset_cache', {
        timestamp: Date.now(),
        data: data
    });

    return data;
}

async function updateTimes() {
    try {
        const location = await storage.get('location');
        const timezone = await storage.get('timezone');
        
        if (!location || !timezone) {
            displayError('Location and timezone not set');
            return;
        }

        const data = await getSunriseSunsetData(location.latitude, location.longitude, timezone);
        displayTimes(data);
    } catch (error) {
        console.error('Error updating times:', error);
        displayError('Error fetching sunrise/sunset data');
    }
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

async function displayTimes(data) {
    if (data.status !== 'OK') {
        displayError('Error fetching times');
        return;
    }

    const sunrise = formatTime(data.results.sunrise);
    const sunset = formatTime(data.results.sunset);

    document.getElementById('sunrise').textContent = sunrise;
    document.getElementById('sunset').textContent = sunset;
}

function displayError(message) {
    document.getElementById('sunrise').textContent = message;
    document.getElementById('sunset').textContent = '';
} 