class WidgetRuntime {
    constructor() {
        this.widgets = new Map();
        this.widgetsRoot = document.getElementById('widgets-root');
        
        // Initialize GridStack with auto-positioning
        this.grid = GridStack.init({
            column: 12, // 12 column layout
            cellHeight: 200, // Each row is 60px tall
            margin: 10, // 10px margins between widgets
            animate: true, // Enable animations
            draggable: {
                handle: '.widget-container' // Drag handle
            },
            resizable: {
                handles: 'e,se,s,sw,w' // Allow resizing from edges
            },
            float: true, // Allows widgets to float
            staticGrid: false, // Ensures grid is interactive
            disableOneColumnMode: true // Prevents single-column mode on narrow screens
        }, this.widgetsRoot);

        // Add GridStack controls
        this.initializeGridControls();
    }

    initializeGridControls() {
        // // Create controls container
        // const controlsContainer = document.createElement('div');
        // controlsContainer.className = 'grid-controls';
        
        // // Create drag toggle button
        // const dragToggle = document.createElement('button');
        // dragToggle.textContent = 'Toggle Drag';
        // dragToggle.onclick = () => {
        //     const isDraggable = this.grid.opts.draggable;
        //     this.grid.enableMove(!isDraggable);
        //     dragToggle.classList.toggle('active', !isDraggable);
        // };
        
        // // Create resize toggle button
        // const resizeToggle = document.createElement('button');
        // resizeToggle.textContent = 'Toggle Resize';
        // resizeToggle.onclick = () => {
        //     const isResizable = this.grid.opts.resizable;
        //     this.grid.enableResize(!isResizable);
        //     resizeToggle.classList.toggle('active', !isResizable);
        // };
        
        // // Add buttons to controls container
        // controlsContainer.appendChild(dragToggle);
        // controlsContainer.appendChild(resizeToggle);
        
        // // Insert controls before the widgets root
        // this.widgetsRoot.parentNode.insertBefore(controlsContainer, this.widgetsRoot);
    }

    async loadWidget(widgetId, config) {
        // Create grid stack item wrapper
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-stack-item';
        gridItem.setAttribute('gs-w', '3'); // Default width of 3 columns
        gridItem.setAttribute('gs-h', '2'); // Default height of 2 rows
        
        // Create grid stack item content
        const gridItemContent = document.createElement('div');
        gridItemContent.className = 'grid-stack-item-content';
        
        // Create container
        const container = document.createElement('div');
        container.className = 'widget-container';
        
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = `widgets/${widgetId}/index.html`;
        iframe.className = 'widget-frame';
        iframe.allowTransparency = 'true';
        iframe.style.backgroundColor = 'transparent';
        
        // Build DOM hierarchy
        container.appendChild(iframe);
        gridItemContent.appendChild(container);
        gridItem.appendChild(gridItemContent);
        
        // Add the item using GridStack's API instead of direct DOM manipulation
        this.grid.makeWidget(gridItem);

        // Create bridge and register handlers
        const bridge = new WidgetBridge(iframe);
        
        this.widgets.set(widgetId, { iframe, bridge, container, gridItem });
        
        // Initialize widget once iframe loads
        iframe.onload = async () => {
            // Inject default styles
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