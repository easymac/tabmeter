import { WidgetStorage } from '../../core/WidgetStorage.js';

let links = [];
let storage;
// Initialize
window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        links = await storage.get('links') || [];
        renderLinks();
    }
});

function renderLinks() {
    const listElement = document.getElementById('links-list');
    listElement.innerHTML = '';
    
    links.forEach((link, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'link-item';
        
        const anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.textContent = link.title;
        // Add click handler to navigate parent window
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            window.parent.location.href = link.url;
        });
        
        itemDiv.appendChild(anchor);
        listElement.appendChild(itemDiv);
    });
}