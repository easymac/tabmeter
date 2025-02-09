class WidgetRuntime {
    constructor() {
        this.widgets = new Map();
        this.widgetsRoot = document.getElementById('widgets-root');
    }

    async loadWidget(widgetId, config) {
        // Create container
        const container = document.createElement('div');
        container.className = 'widget-container';
        
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = `widgets/${widgetId}/index.html`;
        iframe.className = 'widget-frame';
        container.appendChild(iframe);
        this.widgetsRoot.appendChild(container);

        // Create bridge and register handlers
        const bridge = new WidgetBridge(iframe);
        
        this.widgets.set(widgetId, { iframe, bridge, container });
        
        // Initialize widget once iframe loads
        iframe.onload = async () => {
            // Inject default styles
            const doc = iframe.contentDocument;
            
            // Inject main CSS variables
            const mainStyles = document.createElement('link');
            mainStyles.rel = 'stylesheet';
            mainStyles.href = '/styles/main.css';
            doc.head.insertBefore(mainStyles, doc.head.firstChild);
            
            // Inject default widget styles
            const widgetStyles = document.createElement('link');
            widgetStyles.rel = 'stylesheet';
            widgetStyles.href = '/styles/widget-default.css';
            doc.head.insertBefore(widgetStyles, doc.head.firstChild);
            
            // Initialize the widget
            bridge.sendMessage({ 
                type: 'INIT', 
                config 
            });
        };
    }
}

class WidgetBridge {
    constructor(iframe) {
        this.iframe = iframe;
        this.handlers = new Map();

        // Handle messages from iframe
        window.addEventListener('message', (event) => {
            if (event.source === this.iframe.contentWindow) {
                this.handleWidgetMessage(event.data);
            }
        });
    }

    sendMessage(message) {
        this.iframe.contentWindow.postMessage(message, '*');
    }

    registerHandler(type, handler) {
        this.handlers.set(type, handler);
    }

    handleWidgetMessage(message) {
        const handler = this.handlers.get(message.type);
        if (handler) {
            handler(message, this.iframe.contentWindow);
        }
    }
}

// Initialize the runtime
const runtime = new WidgetRuntime();

// Load widgets
runtime.loadWidget('clock', { timezone: 'UTC' });
runtime.loadWidget('links', {}); 