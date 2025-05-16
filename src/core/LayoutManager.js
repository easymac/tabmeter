import { createContextMenu } from './ContextMenu.js';

const AVAILABLE_WIDGETS = {
    clock: { name: 'Clock', config: { timezone: 'UTC' }, hasSettings: false },
    date: { name: 'Date', config: {}, hasSettings: false },
    countdown: { name: 'Countdown', config: {}, hasSettings: false },
    'us-weather': { name: 'Weather', config: {}, hasSettings: true },
    links: { name: 'Links', config: {}, hasSettings: true },
    countdowns: { name: 'Countdowns', config: {}, hasSettings: true },
    'photo-gallery': { name: 'Photo Gallery', config: {}, hasSettings: false },
    'github-heatmap': { name: 'Github Heatmap', config: {}, hasSettings: true },
    'horoscope': { name: 'Horoscope', config: {}, hasSettings: true },
    'lunar-phase': { name: 'Lunar Phase', config: {}, hasSettings: true },
    'weather-forecast': { name: 'Weather Forecast', config: {}, hasSettings: true },
    'btc_usd': { name: 'BTC/USD', config: {}, hasSettings: false },
    'sunrise-sunset': { name: 'Sunrise/Sunset', config: {}, hasSettings: true },
};

export function createLayoutManager(rootElement) {
    const widgetsRoot = rootElement;
    let isDraggable = false;
    let isResizable = false;
    let currentSettingsWidget = null;
    let widgetSelector = null;
    
    // Initialize GridStack
    const grid = GridStack.init({
        column: 24,
        cellHeight: 104,
        margin: 0,
        animate: true,
        draggable: {
            handle: '.widget-container'
        },
        resizable: {
            handles: 'e,se,s,sw,w'
        },
        disableDrag: true,
        disableResize: true,
        float: true,
        staticGrid: false,
        disableOneColumnMode: true
    }, widgetsRoot);

    // Initialize context menu
    const contextMenu = createContextMenu();

    // Save layout when changes occur
    grid.on('change', (event, items) => {
        saveGridLayout();
    });

    function toggleDragging(enable) {
        isDraggable = enable;
        grid.enableMove(enable);
    }

    function toggleResizing(enable) {
        isResizable = enable;
        grid.enableResize(enable);
    }

    async function addWidget(widget) {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-stack-item';
        gridItem.setAttribute('gs-w', '3');
        gridItem.setAttribute('gs-h', '2');
        gridItem.setAttribute('data-widget-id', widget.id);
        
        const gridItemContent = document.createElement('div');
        gridItemContent.className = 'grid-stack-item-content';
        
        gridItemContent.appendChild(widget.container);
        gridItem.appendChild(gridItemContent);
        
        // Add remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'widget-remove-button';
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeWidget(widget.id);
        gridItem.appendChild(removeButton);
        
        // Attach click listener to iframe after it loads
        const iframe = widget.container.querySelector('iframe');
        if (iframe) {
            iframe.addEventListener('load', () => {
                try {
                    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDocument) {
                        iframeDocument.addEventListener('click', (iframeEvent) => {
                            // Calculate coordinates relative to the parent document
                            const iframeRect = iframe.getBoundingClientRect();
                            const parentClientX = iframeRect.left + iframeEvent.clientX;
                            const parentClientY = iframeRect.top + iframeEvent.clientY;

                            // Create and dispatch a new click event in the parent document
                            const parentClickEvent = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                clientX: parentClientX,
                                clientY: parentClientY,
                                view: window
                            });
                            document.dispatchEvent(parentClickEvent);
                        });
                    }
                } catch (error) {
                    // Log error if accessing iframe content fails (e.g., cross-origin)
                    // In this application, iframes are same-origin, but good practice.
                    console.warn('Error attaching click listener to iframe:', error);
                }
            });
        }
        
        await restoreWidgetPosition(widget.id, gridItem);
        grid.makeWidget(gridItem);

        return gridItem;
    }

    async function saveGridLayout() {
        const layout = {};
        const items = grid.el.children;
        
        for (const item of items) {
            const widgetId = item.getAttribute('data-widget-id');
            if (widgetId) {
                layout[widgetId] = {
                    x: item.getAttribute('gs-x'),
                    y: item.getAttribute('gs-y'),
                    w: item.getAttribute('gs-w'),
                    h: item.getAttribute('gs-h')
                };
            }
        }

        await chrome.storage.local.set({ widgetLayout: layout });
    }

    async function restoreWidgetPosition(widgetId, gridItem) {
        try {
            const result = await chrome.storage.local.get('widgetLayout');
            const layout = result.widgetLayout || {};
            
            if (layout[widgetId]) {
                const pos = layout[widgetId];
                gridItem.setAttribute('gs-x', pos.x);
                gridItem.setAttribute('gs-y', pos.y);
                gridItem.setAttribute('gs-w', pos.w);
                gridItem.setAttribute('gs-h', pos.h);
            }
        } catch (error) {
            console.warn('Failed to restore widget position:', error);
        }
    }

    function setupContextMenu() {
        widgetsRoot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            let x = e.clientX;
            let y = e.clientY;
            
            // Check if click originated from within an iframe
            const iframe = e.relatedTarget;
            if (iframe) {
                // Get iframe's position relative to viewport
                const iframeRect = iframe.getBoundingClientRect();

                // Adjust coordinates by adding iframe's offset
                x += iframeRect.left;
                y += iframeRect.top;
            }
            
            const gridItem = e.target.closest('.grid-stack-item');
            if (gridItem) {
                const widgetId = gridItem.getAttribute('data-widget-id');
                showWidgetContextMenu(x, y, widgetId);
            } else {
                showGlobalContextMenu(x, y);
            }
        });
    }

    function showWidgetContextMenu(x, y, widgetId) {
        const menuItems = [
            {
                label: `${isDraggable ? 'Disable' : 'Enable'} Editing`,
                action: () => toggleEditing(),
                icon: 'mynaui:grid'
            },
            { type: 'separator' },
            {
                label: 'Add Widget',
                icon: 'mynaui:chevron-right',
                submenu: Object.entries(AVAILABLE_WIDGETS).map(([id, widget]) => ({
                    label: widget.name,
                    action: () => {
                        window.postMessage({
                            type: 'ADD_WIDGET',
                            widgetId: id,
                            config: widget.config
                        }, '*');
                    }
                }))
            },
            { type: 'separator' }
        ];

        // Conditionally add Widget Settings
        const widgetInfo = AVAILABLE_WIDGETS[widgetId];
        if (widgetInfo && widgetInfo.hasSettings) {
            menuItems.push({
                label: 'Widget Settings',
                action: () => openWidgetSettings(widgetId),
                icon: 'mynaui:cog-four'
            });
        }

        menuItems.push({
            label: 'Remove Widget',
            action: () => removeWidget(widgetId),
            icon: 'mynaui:trash-one',
            className: 'danger'
        });
        
        contextMenu.show(x, y, menuItems);
    }

    function showGlobalContextMenu(x, y) {
        const menuItems = [
            {
                label: `${isDraggable ? 'Disable' : 'Enable'} Editing`,
                action: () => toggleEditing(),
                icon: 'mynaui:grid'
            },
            { type: 'separator' },
            {
                label: 'Add Widget',
                icon: 'mynaui:chevron-right',
                submenu: Object.entries(AVAILABLE_WIDGETS).map(([id, widget]) => ({
                    label: widget.name,
                    action: () => {
                        window.postMessage({
                            type: 'ADD_WIDGET',
                            widgetId: id,
                            config: widget.config
                        }, '*');
                    }
                }))
            }
        ];

        contextMenu.show(x, y, menuItems);
    }

    function toggleEditing() {
        const enable = !isDraggable;
        toggleDragging(enable);
        toggleResizing(enable);
        widgetsRoot.classList.toggle('editing-enabled', enable);
    }

    function openWidgetSettings(widgetId) {
        const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (!widget) return;
        
        const iframe = widget.querySelector('iframe');
        if (!iframe) return;
        
        // Store current widget being configured
        currentSettingsWidget = widgetId;
        
        // Switch to settings view
        const currentSrc = iframe.src;
        iframe.src = currentSrc.replace('index.html', 'settings.html');
        
        // Add settings mode indicator
        widget.classList.add('settings-mode');
        
        // Add done button
        const doneButton = document.createElement('button');
        doneButton.className = 'settings-done-button';
        doneButton.textContent = 'Done';
        doneButton.onclick = () => closeWidgetSettings(widgetId);
        widget.appendChild(doneButton);
    }

    function closeWidgetSettings(widgetId) {
        const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (!widget) return;
        
        const iframe = widget.querySelector('iframe');
        if (!iframe) return;
        
        // Switch back to main view
        const currentSrc = iframe.src;
        iframe.src = currentSrc.replace('settings.html', 'index.html');
        
        // Remove settings mode indicator
        widget.classList.remove('settings-mode');
        
        // Remove done button
        const doneButton = widget.querySelector('.settings-done-button');
        if (doneButton) {
            doneButton.remove();
        }
        
        currentSettingsWidget = null;
    }

    // Add event listener for settings messages
    window.addEventListener('message', (event) => {
        if (event.data.type === 'SETTINGS_SAVED' && currentSettingsWidget) {
            closeWidgetSettings(currentSettingsWidget);
        }
    });

    // Set up initial state
    setupContextMenu();

    async function removeWidget(widgetId) {
        const gridItem = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (!gridItem) return;

        // Remove from grid
        grid.removeWidget(gridItem);

        // Clean up storage
        const keys = await chrome.storage.local.get(null);
        const widgetPrefix = `widget_${widgetId}_`;
        const keysToRemove = Object.keys(keys).filter(key => key.startsWith(widgetPrefix));
        
        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
        }

        // Remove from layout
        const layout = await chrome.storage.local.get('widgetLayout');
        if (layout.widgetLayout) {
            delete layout.widgetLayout[widgetId];
            await chrome.storage.local.set({ widgetLayout: layout.widgetLayout });
        }

        // Remove from active widgets list
        const result = await chrome.storage.local.get('activeWidgets');
        if (result.activeWidgets) {
            const activeWidgets = result.activeWidgets.filter(w => w.id !== widgetId);
            await chrome.storage.local.set({ activeWidgets });
        }

        // Post message to trigger runtime cleanup
        window.postMessage({
            type: 'WIDGET_REMOVED',
            widgetId
        }, '*');
    }

    function createWidgetSelector() {
        const selector = document.createElement('div');
        selector.className = 'widget-selector';
        
        Object.entries(AVAILABLE_WIDGETS).forEach(([id, widget]) => {
            const item = document.createElement('div');
            item.className = 'widget-selector-item';
            item.textContent = widget.name;
            item.onclick = () => {
                window.postMessage({
                    type: 'ADD_WIDGET',
                    widgetId: id,
                    config: widget.config
                }, '*');
                hideWidgetSelector();
            };
            selector.appendChild(item);
        });
        
        document.body.appendChild(selector);
        return selector;
    }

    function showWidgetSelector(x, y) {
        if (!widgetSelector) {
            widgetSelector = createWidgetSelector();
        }
        widgetSelector.style.display = 'block';
        widgetSelector.style.left = `${x}px`;
        widgetSelector.style.top = `${y}px`;
    }

    function hideWidgetSelector() {
        if (widgetSelector) {
            widgetSelector.style.display = 'none';
        }
    }

    function createAddWidgetButton() {
        const button = document.createElement('button');
        button.className = 'add-widget-button';
        button.textContent = 'Add Widget';
        button.onclick = (e) => {
            const rect = button.getBoundingClientRect();
            showWidgetSelector(rect.left, rect.top - 200); // Show above the button
        };
        widgetsRoot.appendChild(button);
    }

    // Add to document click handler
    document.addEventListener('click', (e) => {
        if (!e.target.closest ||
            !e.target.closest('.widget-selector') && 
            !e.target.closest('.add-widget-button')) {
            hideWidgetSelector();
        }
    });

    // Add to initial setup
    createAddWidgetButton();

    return {
        addWidget,
        removeWidget,
        toggleDragging,
        toggleResizing,
        toggleEditing,
        saveGridLayout,
        closeWidgetSettings
    };
}
