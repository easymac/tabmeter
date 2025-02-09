let links = [];

// Storage helper functions
async function storageGet(key) {
    return new Promise((resolve) => {
        window.parent.postMessage({
            type: 'STORAGE_GET',
            key: `widget_links_${key}`
        }, '*');

        window.addEventListener('message', function handler(event) {
            if (event.data.type === 'STORAGE_GET_RESULT' && 
                event.data.key === `widget_links_${key}`) {
                window.removeEventListener('message', handler);
                resolve(event.data.value);
            }
        });
    });
}

async function storageSet(key, value) {
    window.parent.postMessage({
        type: 'STORAGE_SET',
        key: `widget_links_${key}`,
        value
    }, '*');
}

// Initialize
window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        links = await storageGet('links') || [];
        renderLinks();
        initEventListeners();
    }
});

function initEventListeners() {
    document.getElementById('add-link-button').addEventListener('click', addLink);
}

function renderLinks() {
    const listElement = document.getElementById('links-list');
    listElement.innerHTML = '';
    
    links.forEach((link, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'link-item';
        
        const anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.textContent = link.title;
        anchor.target = '_blank';
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '×';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => deleteLink(index);
        
        itemDiv.appendChild(anchor);
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
        await storageSet('links', links);
        renderLinks();
        
        titleInput.value = '';
        urlInput.value = '';
    }
}

async function deleteLink(index) {
    links.splice(index, 1);
    await storageSet('links', links);
    renderLinks();
} 