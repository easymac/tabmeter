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
    const signData = await storage.get('sign');
    if (signData) {
        document.getElementById('zodiac-sign').value = signData;
    }

    document.getElementById('save-settings').addEventListener('click', saveSettings);
}

async function saveSettings() {
    const signSelect = document.getElementById('zodiac-sign');
    const sign = signSelect.value;
    const statusMessage = document.getElementById('status-message');
    
    if (!sign) {
        statusMessage.textContent = 'Please select a zodiac sign';
        return;
    }

    // Clear any existing cache
    await storage.set('horoscope_cache', null);
    
    // Save the zodiac sign
    await storage.set('sign', sign);
    
    statusMessage.textContent = 'Settings saved!';
    setTimeout(() => {
        window.parent.postMessage({ type: 'SETTINGS_SAVED' }, '*');
    }, 1000);
} 