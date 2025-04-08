import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

async function getWeatherData(lat, lng) {
    // Try to get cached weather data
    const weatherCache = await storage.get('weather_cache');
    if (weatherCache && weatherCache.timestamp > Date.now() - CACHE_DURATION) {
        return weatherCache.data;
    }

    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code&temperature_unit=fahrenheit`
    );
    const data = await response.json();

    // Cache the weather data
    await storage.set('weather_cache', {
        timestamp: Date.now(),
        data: data
    });

    return data;
}

async function updateWeather() {
    try {
        const location = await storage.get('location');
        if (!location) {
            displayError('No location set');
            return;
        }

        const weatherData = await getWeatherData(location.latitude, location.longitude);
        displayWeather(weatherData);
    } catch (error) {
        console.error('Error updating weather:', error);
        displayError('Error fetching weather data');
    }
}

function getWeatherDescription(code) {
    // Open-Meteo weather codes mapping
    const weatherCodes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown weather';
}

function displayWeather(weatherData) {
    const current = weatherData.current;
    
    document.getElementById('description').textContent = 
        getWeatherDescription(current.weather_code);

    document.getElementById('temperature').textContent = 
        `Feels like ${Math.round(current.apparent_temperature)}°F`;
}

function displayError(message) {
    document.getElementById('temperature').textContent = message;
    document.getElementById('description').textContent = '';
} 