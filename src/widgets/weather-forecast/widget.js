import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initWeatherForecast();
    }
});

async function initWeatherForecast() {
    await updateWeatherForecast();
    // Update weather every 30 minutes
    setInterval(updateWeatherForecast, CACHE_DURATION);
}

async function getWeatherForecastData(lat, lng, tempUnit) {
    // Try to get cached weather data
    const weatherCache = await storage.get('forecast_cache');
    if (weatherCache && weatherCache.timestamp > Date.now() - CACHE_DURATION) {
        return weatherCache.data;
    }

    const unit = tempUnit === 'celsius' ? 'celsius' : 'fahrenheit';
    
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=${unit}&timezone=auto&forecast_days=7`
    );
    const data = await response.json();

    // Cache the weather data
    await storage.set('forecast_cache', {
        timestamp: Date.now(),
        data: data
    });

    return data;
}

function convertFahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
}

function convertCelsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

async function updateWeatherForecast() {
    try {
        const location = await storage.get('location');
        if (!location) {
            displayError('No location set');
            return;
        }

        const temperatureUnit = await storage.get('temperatureUnit') || 'fahrenheit';
        const weatherData = await getWeatherForecastData(
            location.latitude, 
            location.longitude,
            temperatureUnit
        );
        
        displayWeatherForecast(weatherData, temperatureUnit);
    } catch (error) {
        console.error('Error updating weather forecast:', error);
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
    return weatherCodes[code] || 'Unknown';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function displayWeatherForecast(weatherData, temperatureUnit) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';
    
    const daily = weatherData.daily;
    const days = daily.time.length;
    
    for (let i = 0; i < days; i++) {
        const day = daily.time[i];
        const weatherCode = daily.weathercode[i];
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const precipProb = daily.precipitation_probability_max[i];
        
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        
        const dateElement = document.createElement('div');
        dateElement.className = 'forecast-date';
        dateElement.textContent = formatDate(day);
        
        const conditionElement = document.createElement('div');
        conditionElement.className = 'forecast-condition';
        conditionElement.textContent = getWeatherDescription(weatherCode);
        
        const tempElement = document.createElement('div');
        tempElement.className = 'forecast-temp';
        const unit = temperatureUnit === 'celsius' ? 'C' : 'F';
        tempElement.textContent = `${minTemp}°${unit} - ${maxTemp}°${unit}`;
        
        const precipElement = document.createElement('div');
        precipElement.className = 'forecast-precip';
        precipElement.textContent = `Precip: ${precipProb}%`;
        
        dayElement.appendChild(dateElement);
        dayElement.appendChild(conditionElement);
        dayElement.appendChild(tempElement);
        dayElement.appendChild(precipElement);
        
        forecastContainer.appendChild(dayElement);
    }
}

function displayError(message) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = `<div class="error-message">${message}</div>`;
} 