/**
 * Provides a standardized storage interface for widgets
 */
export class WidgetStorage {
    constructor(widgetId) {
        this.widgetId = widgetId;
        this.prefix = `widget_${widgetId}_`;
    }

    /**
     * Get a value from storage
     * @param {string} key - Storage key
     * @returns {Promise<any>} Stored value
     */
    async get(key) {
        return new Promise((resolve) => {
            const messageHandler = (event) => {
                if (event.data.type === 'STORAGE_GET_RESULT' && 
                    event.data.key === this.prefix + key) {
                    window.removeEventListener('message', messageHandler);
                    resolve(event.data.value);
                }
            };

            window.addEventListener('message', messageHandler);
            
            window.parent.postMessage({
                type: 'STORAGE_GET',
                key: this.prefix + key
            }, '*');
        });
    }

    /**
     * Set a value in storage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {Promise<void>}
     */
    async set(key, value) {
        window.parent.postMessage({
            type: 'STORAGE_SET',
            key: this.prefix + key,
            value
        }, '*');
    }
} 