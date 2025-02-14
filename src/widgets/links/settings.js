import { WidgetStorage } from '../../core/WidgetStorage.js';

let links = [];
let storage;

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initialize();
    }
});

function renderLinks() {
    const listElement = document.getElementById('links-list');
    listElement.innerHTML = '';
    links.forEach((link, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'links-item';
        
        const linkInfo = document.createElement('span');
        linkInfo.textContent = `${link.title} (${link.url})`;
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => deleteLink(index);
        
        itemDiv.appendChild(linkInfo);
        itemDiv.appendChild(deleteButton);
        listElement.appendChild(itemDiv);
    });
}

async function addLink() {
    const titleInput = document.getElementById('link-title-input');
    const urlInput = document.getElementById('link-url-input');
    
    if (titleInput.value && urlInput.value) {
        links.push({ 
            title: titleInput.value, 
            url: urlInput.value 
        });
        await storage.set('links', links);
        renderLinks();
        
        titleInput.value = '';
        urlInput.value = '';
    }
}

async function deleteLink(index) {
    links.splice(index, 1);
    await storage.set('links', links);
    renderLinks();
}

async function initialize() {
    links = await storage.get('links') || [];
    renderLinks();

    document.getElementById('add-link-button').addEventListener('click', addLink);
}
