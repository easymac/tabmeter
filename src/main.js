import { createLayoutManager } from './core/LayoutManager.js';
import { createStorageManager } from './core/StorageManager.js';

// Add to the top of the file after imports
let runtime;

// Create a widget bridge factory
function createWidgetBridge(iframe, widgetId) {
    const handlers = new Map();
    const storageManager = createStorageManager();

    // Handle messages from iframe
    window.addEventListener('message', (event) => {
        if (event.source === iframe.contentWindow) {
            const data = event.data;
            
            // Add storage handling
            if (data.type === 'STORAGE_GET') {
                data.widgetId = widgetId;
                storageManager.handleStorageGet(data, iframe.contentWindow);
                return;
            }
            
            if (data.type === 'STORAGE_SET') {
                data.widgetId = widgetId;
                storageManager.handleStorageSet(data, widgetId);
                return;
            }

            const handler = handlers.get(data.type);
            if (handler) {
                handler(data, iframe.contentWindow);
            }
        }
    });

    return {
        sendMessage: (message) => iframe.contentWindow.postMessage(message, '*'),
        registerHandler: (type, handler) => handlers.set(type, handler)
    };
}

// Create the widget runtime factory
function createWidgetRuntime() {
    const widgets = new Map();
    const widgetsRoot = document.getElementById('widgets-root');
    const layoutManager = createLayoutManager(widgetsRoot);

    async function loadWidget(widgetId, config, skipSave = false) {
        // Create container
        const container = document.createElement('div');
        container.className = 'widget-container';
        
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = `widgets/${widgetId}/index.html`;
        iframe.className = 'widget-frame';
        iframe.allowTransparency = 'true';
        iframe.style.backgroundColor = 'transparent';
        
        // Add iframe to container
        container.appendChild(iframe);
        
        // Create widget object with ID
        const widget = {
            id: widgetId,
            iframe,
            container,
            bridge: createWidgetBridge(iframe, widgetId)
        };

        // Add to layout manager and store gridItem reference
        widget.gridItem = layoutManager.addWidget(widget);
        
        // Store widget reference
        widgets.set(widgetId, widget);

        // Save active widgets list unless skipSave is true
        if (!skipSave) {
            await saveActiveWidgets();
        }
        
        // Initialize widget once iframe loads
        iframe.onload = async () => {
            const doc = iframe.contentDocument;
            
            // Manually add a style element to the body
            // to hide the widget until the styles are loaded
            const style = document.createElement('style');
            style.textContent = 'body { opacity: 0; }';
            doc.head.insertBefore(style, doc.head.firstChild);

            // Create a promise that resolves when all stylesheets are loaded
            const styleLoadPromises = [];
            
            // Inject CSS variables
            const variablesStyles = document.createElement('link');
            variablesStyles.rel = 'stylesheet';
            variablesStyles.href = '/styles/variables.css';
            styleLoadPromises.push(new Promise(resolve => {
                variablesStyles.onload = resolve;
            }));
            doc.head.insertBefore(variablesStyles, doc.head.firstChild);
            
            // Inject default widget styles
            const widgetStyles = document.createElement('link');
            widgetStyles.rel = 'stylesheet';
            widgetStyles.href = '/styles/widget-default.css';
            styleLoadPromises.push(new Promise(resolve => {
                widgetStyles.onload = resolve;
            }));
            doc.head.insertBefore(widgetStyles, doc.head.firstChild);

            // Wait for all stylesheets to load
            await Promise.all(styleLoadPromises);

            console.log('styles-loaded');
            
            // Remove the style element from the body
            // to show the widget
            style.textContent = 'body { opacity: 1; }';
            
            // Set up event bubbling from iframe
            const eventTypes = ['contextmenu'];
            const iframeWindow = iframe.contentWindow;
            
            eventTypes.forEach(eventType => {
                iframeWindow.addEventListener(eventType, (iframeEvent) => {
                    if (eventType === 'contextmenu') {
                        iframeEvent.preventDefault();
                    }
                    
                    const event = new PointerEvent(iframeEvent.type, {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        detail: iframeEvent.detail,
                        screenX: iframeEvent.screenX,
                        screenY: iframeEvent.screenY,
                        clientX: iframeEvent.clientX,
                        clientY: iframeEvent.clientY,
                        ctrlKey: iframeEvent.ctrlKey,
                        altKey: iframeEvent.altKey,
                        shiftKey: iframeEvent.shiftKey,
                        metaKey: iframeEvent.metaKey,
                        button: iframeEvent.button,
                        buttons: iframeEvent.buttons,
                        relatedTarget: iframe // Manually set relatedTarget to iframe
                    });
                    container.dispatchEvent(event);
                });
            });

            // Initialize the widget with its ID
            widget.bridge.sendMessage({ 
                type: 'INIT', 
                config,
                widgetId 
            });
        };
    }

    async function saveActiveWidgets() {
        const activeWidgets = Array.from(widgets.entries()).map(([id, widget]) => ({
            id,
            config: widget.config || {}
        }));
        await chrome.storage.local.set({ activeWidgets });
    }

    async function restoreWidgets() {
        try {
            const result = await chrome.storage.local.get('activeWidgets');
            const activeWidgets = result.activeWidgets || [];
            
            // Load each widget
            for (const widget of activeWidgets) {
                await loadWidget(widget.id, widget.config, true); // Skip saving during restore
            }
        } catch (error) {
            console.error('Failed to restore widgets:', error);
        }
    }

    return {
        loadWidget,
        getWidget: (id) => widgets.get(id),
        getAllWidgets: () => Array.from(widgets.values()),
        restoreWidgets
    };
}

// Update the initialization
runtime = createWidgetRuntime();

// Restore widgets on startup
runtime.restoreWidgets();

// Update the message handler to include widget removal
window.addEventListener('message', (event) => {
    const message = event.data;
    
    if (message.type === 'ADD_WIDGET') {
        runtime.loadWidget(message.widgetId, message.config);
    }
});

// Remove the automatic widget loading at the bottom
// runtime.loadWidget('clock', { timezone: 'UTC' });
// runtime.loadWidget('links', {});
// etc... 