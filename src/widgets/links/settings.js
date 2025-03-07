import { WidgetStorage } from '../../core/WidgetStorage.js';

let links = [];
let storage;
let editingIndex = -1; // Track which link is being edited
let draggedItem = null;
let draggedIndex = -1;

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
        itemDiv.draggable = true;
        itemDiv.dataset.index = index;
        
        // Add drag event listeners
        itemDiv.addEventListener('dragstart', handleDragStart);
        itemDiv.addEventListener('dragover', handleDragOver);
        itemDiv.addEventListener('drop', handleDrop);
        itemDiv.addEventListener('dragend', handleDragEnd);
        itemDiv.addEventListener('dragenter', handleDragEnter);
        itemDiv.addEventListener('dragleave', handleDragLeave);
        
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '&#8942;&#8942;'; // Unicode for vertical dots
        
        const linkInfo = document.createElement('span');
        linkInfo.textContent = `${link.title} (${link.url})`;
        linkInfo.className = 'link-info';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'link-buttons';
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit-button';
        editButton.onclick = () => editLink(index);
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => deleteLink(index);
        
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);
        
        itemDiv.appendChild(dragHandle);
        itemDiv.appendChild(linkInfo);
        itemDiv.appendChild(buttonContainer);
        listElement.appendChild(itemDiv);
    });
}

function handleDragStart(e) {
    draggedItem = e.currentTarget;
    draggedIndex = parseInt(draggedItem.dataset.index);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedIndex.toString());
    
    // Add a class to indicate dragging is active and delay to allow visual effect to be seen
    setTimeout(() => {
        draggedItem.classList.add('dragging');
    }, 0);
}

function handleDragOver(e) {
    e.preventDefault(); // Allow dropping
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    const targetItem = e.currentTarget;
    
    // Skip if dragging over itself
    if (targetItem === draggedItem) return;
    
    targetItem.classList.add('drop-target');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drop-target');
}

async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const targetItem = e.currentTarget;
    
    // Skip if dropping onto itself
    if (targetItem === draggedItem) {
        return;
    }
    
    // Get indexes
    const fromIndex = draggedIndex;
    const toIndex = parseInt(targetItem.dataset.index);
    
    if (fromIndex === toIndex) {
        return;
    }
    
    // Reorder the links array
    const [movedItem] = links.splice(fromIndex, 1);
    links.splice(toIndex, 0, movedItem);
    
    // Save the reordered links immediately
    await storage.set('links', links);
    
    // Re-render the list
    renderLinks();
}

function handleDragEnd(e) {
    // Remove all drag and drop visual effects
    const items = document.querySelectorAll('.links-item');
    items.forEach(item => {
        item.classList.remove('dragging', 'drop-target');
    });
    
    draggedItem = null;
    draggedIndex = -1;
}

function editLink(index) {
    const link = links[index];
    const titleInput = document.getElementById('link-title-input');
    const urlInput = document.getElementById('link-url-input');
    const addButton = document.getElementById('add-link-button');
    const cancelButton = document.getElementById('cancel-edit-button');
    
    titleInput.value = link.title;
    urlInput.value = link.url;
    addButton.textContent = 'Update Link';
    cancelButton.style.display = 'inline-block';
    
    editingIndex = index;
}

function cancelEdit() {
    const titleInput = document.getElementById('link-title-input');
    const urlInput = document.getElementById('link-url-input');
    const addButton = document.getElementById('add-link-button');
    const cancelButton = document.getElementById('cancel-edit-button');
    
    titleInput.value = '';
    urlInput.value = '';
    addButton.textContent = 'Add Link';
    cancelButton.style.display = 'none';
    
    editingIndex = -1;
}

async function addLink() {
    const titleInput = document.getElementById('link-title-input');
    const urlInput = document.getElementById('link-url-input');
    const addButton = document.getElementById('add-link-button');
    const cancelButton = document.getElementById('cancel-edit-button');
    
    if (titleInput.value && urlInput.value) {
        if (editingIndex >= 0) {
            // Update existing link
            links[editingIndex] = { 
                title: titleInput.value, 
                url: urlInput.value 
            };
            editingIndex = -1;
            addButton.textContent = 'Add Link';
            cancelButton.style.display = 'none';
        } else {
            // Add new link
            links.push({ 
                title: titleInput.value, 
                url: urlInput.value 
            });
        }
        
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
    document.getElementById('cancel-edit-button').addEventListener('click', cancelEdit);
}
