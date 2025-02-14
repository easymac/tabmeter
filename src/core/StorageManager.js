/**
 * Manages storage operations for widgets
 */
export function createStorageManager() {
    /**
     * Validates a storage key
     * @param {string} key - Storage key to validate
     * @param {string} expectedPrefix - Expected widget prefix
     * @returns {boolean}
     */
    function validateKey(key, expectedPrefix) {
        return key.startsWith(expectedPrefix) && 
               key.length > expectedPrefix.length;
    }

    /**
     * Handles storage get requests
     * @param {Object} data - Message data
     * @param {Window} source - Message source
     */
    async function handleStorageGet(data, source) {
        const widgetId = data.widgetId;
        const prefix = `widget_${widgetId}_`;

        if (!validateKey(data.key, prefix)) {
            console.error(`Invalid storage key access attempt: ${data.key}`);
            return;
        }

        try {
            const result = await chrome.storage.local.get(data.key);
            source.postMessage({
                type: 'STORAGE_GET_RESULT',
                key: data.key,
                value: result[data.key]
            }, '*');
        } catch (error) {
            console.error('Storage get error:', error);
        }
    }

    /**
     * Handles storage set requests
     * @param {Object} data - Message data
     * @param {string} widgetId - Widget ID
     */
    async function handleStorageSet(data, widgetId) {
        const prefix = `widget_${widgetId}_`;

        if (!validateKey(data.key, prefix)) {
            console.error(`Invalid storage key access attempt: ${data.key}`);
            return;
        }

        try {
            await chrome.storage.local.set({ [data.key]: data.value });
        } catch (error) {
            console.error('Storage set error:', error);
        }
    }

    return {
        handleStorageGet,
        handleStorageSet
    };
} 