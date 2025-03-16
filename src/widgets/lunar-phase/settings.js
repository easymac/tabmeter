import { WidgetStorage } from '../../core/WidgetStorage.js';
import { Hemisphere } from './utils.js';

let storage;

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initSettings();
    }
});

async function initSettings() {
    const hemisphereValue = await storage.get('hemisphere');
    
    if (hemisphereValue) {
        if (hemisphereValue === Hemisphere.SOUTHERN) {
            document.getElementById('southern').checked = true;
        } else {
            document.getElementById('northern').checked = true;
        }
    }

    document.getElementById('save-settings').addEventListener('click', saveSettings);
}

async function saveSettings() {
    const hemisphereValue = document.querySelector('input[name="hemisphere"]:checked').value;
    const hemisphere = hemisphereValue === 'southern' ? Hemisphere.SOUTHERN : Hemisphere.NORTHERN;
    const statusMessage = document.getElementById('status-message');
    
    // Save the hemisphere setting
    await storage.set('hemisphere', hemisphere);
    
    statusMessage.textContent = 'Settings saved!';
    setTimeout(() => {
        window.parent.postMessage({ type: 'SETTINGS_SAVED' }, '*');
    }, 1000);
} 