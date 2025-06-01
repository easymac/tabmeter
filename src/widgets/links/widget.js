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
    const emptyStateElement = document.getElementById('empty-state');
    
    listElement.innerHTML = '';
    
    if (links.length === 0) {
        // Show empty state
        listElement.style.display = 'none';
        emptyStateElement.style.display = 'flex';
        return;
    }
    
    // Show links
    listElement.style.display = 'flex';
    emptyStateElement.style.display = 'none';
    
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