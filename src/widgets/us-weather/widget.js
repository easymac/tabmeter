import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const POINTS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initWeather();
    }
});

async function initWeather() {
    await updateWeather();
    // Update weather every 5 minutes
    setInterval(updateWeather, CACHE_DURATION);
}

async function getForecast(forecastUrl) {
    // Try to get cached forecast
    const forecastCache = await storage.get('forecast_cache');
    if (forecastCache && forecastCache.timestamp > Date.now() - CACHE_DURATION) {
        return forecastCache.data;
    }

    const response = await fetch(forecastUrl);
    const data = await response.json();

    // Cache the forecast
    await storage.set('forecast_cache', {
        timestamp: Date.now(),
        data: data
    });

    return data;
}

async function getForecastUrl(lat, lng) {
    // Check cache first
    const cacheKey = `nws-forecast-url-${lat}-${lng}`;
    const cached = await chrome.storage.local.get(cacheKey);
    
    if (cached[cacheKey]) {
        return cached[cacheKey];
    }

    // If not cached, fetch from API
    const pointsUrl = `https://api.weather.gov/points/${lat},${lng}`;
    const response = await fetch(pointsUrl);
    const data = await response.json();
    const forecastUrl = data.properties.forecast;

    // Cache for 30 days
    await chrome.storage.local.set({
        [cacheKey]: forecastUrl,
        [`${cacheKey}-timestamp`]: Date.now()
    });

    return forecastUrl;
}

async function updateWeather() {
    try {
        const location = await storage.get('location');
        if (!location) {
            displayError('No location set');
            return;
        }

        const forecastUrl = await getForecastUrl(location.latitude, location.longitude);
        const forecast = await getForecast(forecastUrl);

        console.log(forecast);
        
        displayWeather(forecast);
    } catch (error) {
        console.error('Error updating weather:', error);
        displayError('Error fetching weather data');
    }
}

function displayWeather(forecast) {
    const currentPeriod = forecast.properties.periods[0];
    
    document.getElementById('description').textContent = 
        currentPeriod.shortForecast;

    document.getElementById('temperature').textContent = 
        `Feels like ${currentPeriod.temperature}°${currentPeriod.temperatureUnit}`;
}

function displayError(message) {
    document.getElementById('temperature').textContent = message;
    document.getElementById('description').textContent = '';
} 