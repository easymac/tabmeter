import { createLayoutManager } from './core/LayoutManager.js';
import { createStorageManager } from './core/StorageManager.js';

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

    async function loadWidget(widgetId, config) {
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
        
        // Initialize widget once iframe loads
        iframe.onload = async () => {
            const doc = iframe.contentDocument;
            
            // Inject CSS variables
            const variablesStyles = document.createElement('link');
            variablesStyles.rel = 'stylesheet';
            variablesStyles.href = '/styles/variables.css';
            doc.head.insertBefore(variablesStyles, doc.head.firstChild);
            
            // Inject default widget styles
            const widgetStyles = document.createElement('link');
            widgetStyles.rel = 'stylesheet';
            widgetStyles.href = '/styles/widget-default.css';
            doc.head.insertBefore(widgetStyles, doc.head.firstChild);
            
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

    

    return {
        loadWidget,
        getWidget: (id) => widgets.get(id),
        getAllWidgets: () => Array.from(widgets.values())
    };
}

// Initialize the runtime
const runtime = createWidgetRuntime();

// Load widgets
runtime.loadWidget('clock', { timezone: 'UTC' });
runtime.loadWidget('links', {});
runtime.loadWidget('date', {});
runtime.loadWidget('countdown', { targetDate: '2026-08-07' });
runtime.loadWidget('photo-gallery', {});
runtime.loadWidget('us-weather', {});
runtime.loadWidget('countdowns', {}); 