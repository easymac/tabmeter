import { WidgetStorage } from '../../core/WidgetStorage.js';

let config;
let storage;
const MANIFEST_URL = 'https://cdn.jsdelivr.net/gh/easymac/william-blake@main/collection/_manifest.json';
const CACHE_KEY = 'manifest';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Initialize
window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initGallery();
    }
});

async function getManifest() {
    // Try to get cached manifest
    const cached = await storage.get(CACHE_KEY);
    if (cached && cached.timestamp > Date.now() - CACHE_DURATION) {
        return cached.data;
    }

    // Fetch fresh manifest
    const response = await fetch(MANIFEST_URL);
    const manifest = await response.json();
    
    // Cache the manifest
    await storage.set(CACHE_KEY, {
        timestamp: Date.now(),
        data: manifest
    });
    
    return manifest;
}

function getDayNumber() {
    // Get local date components for the user's timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    // Calculate days since epoch for the current local date
    const start = new Date(2000, 0, 1); // Use year 2000 as epoch start
    const current = new Date(year, month, day);
    const daysSinceEpoch = Math.floor((current - start) / (1000 * 60 * 60 * 24));
    
    // This will return a stable number for each date that increments by 1 each day
    // All users will get the same number on the same date in their local timezone
    return daysSinceEpoch;
}

async function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

async function initGallery() {
    try {
        const manifest = await getManifest();
        const dayNumber = getDayNumber();
        const imageIndex = dayNumber % manifest.length;
        const selectedImage = manifest[imageIndex];
        
        const photoElement = document.getElementById('photo');
        
        const imageUrl = getImageUrl(selectedImage);
        console.log(selectedImage, imageUrl);
        // Pre-load the image
        await loadImage(imageUrl);
        
        // Set the image source
        photoElement.src = imageUrl;
        photoElement.alt = selectedImage.title || 'Daily artwork';

        addImageCaption(selectedImage);
        
    } catch (error) {
        console.error('Failed to initialize gallery:', error);
    }
}

function getImageUrl(image) {
    return `https://cdn.jsdelivr.net/gh/easymac/william-blake@main/collection/${image.file}`;
}

function addImageCaption(image) {
    // Build the caption from the image object
    const captionElement = document.getElementById('caption');

    // Add the artist name
    const artistName = image.artist;
    const artistElement = document.createElement('span');
    artistElement.className = 'artist';
    artistElement.textContent = `${artistName}, `;
    captionElement.appendChild(artistElement);

    // Add the title
    const title = image.title;
    const titleElement = document.createElement('span');
    titleElement.className = 'title';
    titleElement.textContent = `${title}, `;
    captionElement.appendChild(titleElement);

    // Add the year
    const year = image.year;
    const yearElement = document.createElement('span');
    yearElement.className = 'year';
    yearElement.textContent = year;
    captionElement.appendChild(yearElement);

}