import { WidgetStorage } from '../../core/WidgetStorage.js';

let storage;

window.addEventListener('message', async (event) => {
    const message = event.data;
    
    if (message.type === 'INIT') {
        storage = new WidgetStorage(message.widgetId);
        await initBTCPrice();
    }
});

async function initBTCPrice() {
    await updateBTCPrice();
    // Update price every minute
    setInterval(updateBTCPrice, 60 * 1000);
}

async function updateBTCPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const price = data.bitcoin.usd;
        
        // Format price with commas
        const formattedPrice = price.toLocaleString('en-US');
        
        // Update display
        const priceElement = document.getElementById('btc-price');
        priceElement.textContent = `BTC$${formattedPrice}`;
    } catch (error) {
        console.error('Error fetching BTC price:', error);
        const priceElement = document.getElementById('btc-price');
        priceElement.textContent = 'Error fetching price';
    }
} 