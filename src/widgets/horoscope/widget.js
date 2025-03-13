import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initHoroscope();
    }
});

async function initHoroscope() {
    await updateHoroscope();
    // Check cache validity every hour
    setInterval(checkCacheValidity, 60 * 60 * 1000);
}

async function checkCacheValidity() {
    const cache = await storage.get('horoscope_cache');
    if (!cache || isCacheExpired(cache.timestamp)) {
        await updateHoroscope();
    }
}

function isCacheExpired(timestamp) {
    const now = new Date();
    const cacheDate = new Date(timestamp);
    
    // Check if it's a new day (past midnight)
    return now.getDate() !== cacheDate.getDate() || 
           now.getMonth() !== cacheDate.getMonth() || 
           now.getFullYear() !== cacheDate.getFullYear();
}

async function getHoroscope(sign) {
    // Try to get cached horoscope
    const cache = await storage.get('horoscope_cache');
    if (cache && cache.sign === sign && !isCacheExpired(cache.timestamp)) {
        return cache.data;
    }

    try {
        console.log('Getting horoscope for sign:', sign);
        const apiUrl = `https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${sign}&day=TODAY`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();

        // Cache the horoscope until midnight
        await storage.set('horoscope_cache', {
            timestamp: Date.now(),
            sign: sign,
            data: data
        });

        return data;
    } catch (error) {
        console.error('Error fetching horoscope:', error);
        throw error;
    }
}

async function updateHoroscope() {
    try {
        const signData = await storage.get('sign');
        const horoscopeContainer = document.getElementById('horoscope-container');
        const signDisplay = document.getElementById('sign-display');
        const horoscopeContent = document.getElementById('horoscope-content');
        const horoscopeDate = document.getElementById('horoscope-date');
        
        if (!signData) {
            horoscopeContainer.classList.add('no-sign');
            signDisplay.textContent = '';
            horoscopeContent.textContent = 'Please configure your zodiac sign in settings.';
            horoscopeDate.textContent = '';
            return;
        }
        
        horoscopeContainer.classList.remove('no-sign');
        const horoscopeData = await getHoroscope(signData);
        
        if (horoscopeData && horoscopeData.data) {
            const horoscope = horoscopeData.data;
            signDisplay.textContent = signData;
            horoscopeContent.textContent = horoscope.horoscope_data;
            
            // Format date: e.g., "January 1, 2023"
            const date = new Date();
            horoscopeDate.textContent = date.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            });
        } else {
            signDisplay.textContent = signData;
            horoscopeContent.textContent = 'Unable to retrieve horoscope data.';
            horoscopeDate.textContent = '';
        }
    } catch (error) {
        console.error('Error updating horoscope:', error);
        displayError('Error fetching horoscope data');
    }
}

function displayError(message) {
    const signDisplay = document.getElementById('sign-display');
    const horoscopeContent = document.getElementById('horoscope-content');
    const horoscopeDate = document.getElementById('horoscope-date');
    
    signDisplay.textContent = '';
    horoscopeContent.textContent = message;
    horoscopeDate.textContent = '';
} 