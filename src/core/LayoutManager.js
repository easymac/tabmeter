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

const V_ALIGNS = ['top', 'middle', 'bottom'];
const H_ALIGNS = ['left', 'center', 'right'];
const ALIGNMENT_STORAGE_KEY = 'widgetAlignments';

// Helper function to setup iframe content (alignment and click listeners)
async function setupIndexFrame(iframe, widgetId, gridItemElement, fnLoadWidgetAlignment, fnApplyAlignmentToWidget) {
    if (!iframe || !iframe.contentWindow || !iframe.contentWindow.document) {
        console.warn(`Cannot setup frame for ${widgetId}: iframe or its document not accessible.`);
        return;
    }

    // 1. Apply Alignment
    try {
        const alignment = await fnLoadWidgetAlignment(widgetId);
        if (alignment) {
            fnApplyAlignmentToWidget(widgetId, alignment.vertical, alignment.horizontal, gridItemElement);
        }
    } catch (error) {
        console.warn(`Error loading or applying alignment for ${widgetId} in setupIndexFrame:`, error);
    }

    // 2. Setup Click Listener for event propagation
    try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document; // Already checked above, but good for clarity
        if (iframeDocument) {
            // It's generally safer to ensure no duplicate listeners if this could be called multiple times
            // on the same document instance, but new src means new document, so direct add is usually fine.
            iframeDocument.addEventListener('click', (iframeEvent) => {
                const iframeRect = iframe.getBoundingClientRect();
                const parentClientX = iframeRect.left + iframeEvent.clientX;
                const parentClientY = iframeRect.top + iframeEvent.clientY;
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
        console.warn(`Error setting up click listener for iframe ${widgetId}:`, error);
    }
}

export function createLayoutManager(rootElement) {
    const widgetsRoot = rootElement;
    let isDraggable = false;
    let isResizable = false;
    let currentSettingsWidget = null;
    let widgetSelector = null;
    let currentContextMenuWidgetElement = null;
    
    // Crosshairs elements for viewport center guides
    let crosshairsContainer = null;
    let horizontalCrosshair = null;
    let verticalCrosshair = null;
    
    // Calculate initial cell height
    let currentCellHeight = Math.round(window.innerHeight / 12);

    // Initialize GridStack
    const grid = GridStack.init({
        column: 24,
        cellHeight: currentCellHeight,
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

    function createCrosshairs() {
        // Create container for crosshairs
        crosshairsContainer = document.createElement('div');
        crosshairsContainer.className = 'viewport-crosshairs';
        
        // Create horizontal crosshair
        horizontalCrosshair = document.createElement('div');
        horizontalCrosshair.className = 'crosshair crosshair-horizontal';
        
        // Create vertical crosshair
        verticalCrosshair = document.createElement('div');
        verticalCrosshair.className = 'crosshair crosshair-vertical';
        
        crosshairsContainer.appendChild(horizontalCrosshair);
        crosshairsContainer.appendChild(verticalCrosshair);
        
        // Add to document body so it covers the entire viewport
        document.body.appendChild(crosshairsContainer);
        
        // Position crosshairs initially
        updateCrosshairsPosition();
    }
    
    function updateCrosshairsPosition() {
        if (!crosshairsContainer) return;
        
        // Calculate exact center with proper rounding
        const centerX = Math.round(window.innerWidth / 2);
        const centerY = Math.round(window.innerHeight / 2);
        
        // Position horizontal crosshair (full width, 1px height, centered vertically)
        horizontalCrosshair.style.left = '0px';
        horizontalCrosshair.style.top = `${centerY}px`;
        horizontalCrosshair.style.width = '100vw';
        
        // Position vertical crosshair (1px width, full height, centered horizontally)
        verticalCrosshair.style.left = `${centerX}px`;
        verticalCrosshair.style.top = '0px';
        verticalCrosshair.style.height = '100vh';
    }
    
    function showCrosshairs() {
        if (!crosshairsContainer) {
            createCrosshairs();
        }
        crosshairsContainer.style.display = 'block';
        updateCrosshairsPosition();
    }
    
    function hideCrosshairs() {
        if (crosshairsContainer) {
            crosshairsContainer.style.display = 'none';
        }
    }

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
        
        // Assuming widget.container contains the iframe, or is the iframe itself
        // For consistency with current querying, let's assume iframe is inside widget.container
        const iframe = widget.container.querySelector('iframe') || (widget.container.tagName === 'IFRAME' ? widget.container : null);

        if (iframe) {
            const onInitialLoad = async () => {
                // Call the shared setup function
                // setupIndexFrame needs access to loadWidgetAlignment and applyAlignmentToWidget
                // which are within createLayoutManager's scope.
                // To solve this, setupIndexFrame was defined outside createLayoutManager,
                // but it needs those functions or they need to be passed/accessible globally.
                // For now, let's assume loadWidgetAlignment and applyAlignmentToWidget are accessible
                // because setupIndexFrame is defined in the same module scope.
                
                // We need to ensure that `loadWidgetAlignment` and `applyAlignmentToWidget` are
                // accessible to `setupIndexFrame`. Let's move `setupIndexFrame` inside `createLayoutManager`
                // or ensure it gets references to these functions.
                // For simplicity of this diff, I'm assuming they are found via scope.
                // This will be handled in the next step by moving setupIndexFrame inside.
                await _setupIndexFrame(iframe, widget.id, gridItem, loadWidgetAlignment, applyAlignmentToWidget);


                // Remove listener after first successful setup to avoid multiple executions if not desired.
                // However, if index.html itself can trigger 'load' events multiple times without src change,
                // this might need to be more nuanced. For typical src-based loads, once is fine.
                iframe.removeEventListener('load', onInitialLoad);
            };
            iframe.addEventListener('load', onInitialLoad);

            // If the iframe might have already loaded its content before this listener was attached
            if (iframe.contentDocument && (iframe.contentDocument.readyState === 'complete' || iframe.contentDocument.readyState === 'interactive')) {
                if (iframe.src && iframe.src !== 'about:blank') { // Ensure it has a meaningful src
                     // console.log(`Iframe for ${widget.id} already loaded, attempting setup.`);
                     // await onInitialLoad(); // This could lead to double execution if load also fires.
                                           // It's safer to rely on the 'load' event.
                }
            }
        }
        
        await restoreWidgetPosition(widget.id, gridItem);
        grid.makeWidget(gridItem);

        // Restore alignment
        const alignment = await loadWidgetAlignment(widget.id);
        if (alignment) {
            applyAlignmentToWidget(widget.id, alignment.vertical, alignment.horizontal, gridItem);
        }
        
        // If editing is already enabled, show controls for this new widget
        if (isDraggable) { // isDraggable indicates editing mode
             createAlignmentControlsForWidget(gridItem, widget.id);
        }

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

        // Clear previous active context menu widget state
        if (currentContextMenuWidgetElement) {
            currentContextMenuWidgetElement.classList.remove('widget-context-active');
            currentContextMenuWidgetElement = null;
        }

        const gridItem = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (gridItem) {
            gridItem.classList.add('widget-context-active');
            currentContextMenuWidgetElement = gridItem;
        }
        
        contextMenu.show(x, y, menuItems, () => {
            if (currentContextMenuWidgetElement) {
                currentContextMenuWidgetElement.classList.remove('widget-context-active');
                currentContextMenuWidgetElement = null;
            }
        });
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

        // Clear active context menu widget state if any
        if (currentContextMenuWidgetElement) {
            currentContextMenuWidgetElement.classList.remove('widget-context-active');
            currentContextMenuWidgetElement = null;
        }

        contextMenu.show(x, y, menuItems, () => {
            // Ensure it's cleared if for some reason it was set by another flow
            if (currentContextMenuWidgetElement) {
                currentContextMenuWidgetElement.classList.remove('widget-context-active');
                currentContextMenuWidgetElement = null;
            }
        });
    }

    function toggleEditing() {
        const enable = !isDraggable;
        toggleDragging(enable);
        toggleResizing(enable);
        widgetsRoot.classList.toggle('editing-enabled', enable);

        if (enable) {
            showAlignmentControlsForAllWidgets();
            showCrosshairs();
        } else {
            hideAlignmentControlsForAllWidgets();
            hideCrosshairs();
        }
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
        const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (!widgetElement) return;
        
        const iframe = widgetElement.querySelector('.grid-stack-item-content iframe'); // Corrected selector
        if (!iframe) return;
        
        const onIndexFrameLoadAfterSettings = async () => {
            iframe.removeEventListener('load', onIndexFrameLoadAfterSettings);
            // Call the shared setup function, ensuring it has access to necessary functions
            await _setupIndexFrame(iframe, widgetId, widgetElement, loadWidgetAlignment, applyAlignmentToWidget);
        };
        iframe.addEventListener('load', onIndexFrameLoadAfterSettings);
        
        const currentSrc = iframe.src;
        iframe.src = currentSrc.replace('settings.html', 'index.html');
        
        // Remove settings mode indicator
        widgetElement.classList.remove('settings-mode');
        
        // Remove done button
        const doneButton = widgetElement.querySelector('.settings-done-button');
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

        // Clean up storage for widget data
        const keys = await chrome.storage.local.get(null);
        const widgetPrefix = `widget_${widgetId}_`;
        const keysToRemove = Object.keys(keys).filter(key => key.startsWith(widgetPrefix));
        
        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
        }

        // Remove from layout
        let layoutResult = await chrome.storage.local.get('widgetLayout');
        if (layoutResult.widgetLayout && layoutResult.widgetLayout[widgetId]) {
            delete layoutResult.widgetLayout[widgetId];
            await chrome.storage.local.set({ widgetLayout: layoutResult.widgetLayout });
        }

        // Remove alignment settings
        const alignResult = await chrome.storage.local.get(ALIGNMENT_STORAGE_KEY);
        if (alignResult[ALIGNMENT_STORAGE_KEY] && alignResult[ALIGNMENT_STORAGE_KEY][widgetId]) {
            delete alignResult[ALIGNMENT_STORAGE_KEY][widgetId];
            await chrome.storage.local.set({ [ALIGNMENT_STORAGE_KEY]: alignResult[ALIGNMENT_STORAGE_KEY] });
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

    // Handle window resize to adjust cell height
    window.addEventListener('resize', () => {
        const newCellHeight = Math.round(window.innerHeight / 12);
        if (newCellHeight !== currentCellHeight) {
            currentCellHeight = newCellHeight;
            grid.cellHeight(currentCellHeight, true); // true to update existing items
        }
        
        // Update crosshairs position on resize
        updateCrosshairsPosition();
    });

    async function saveWidgetAlignment(widgetId, vAlign, hAlign) {
        try {
            const result = await chrome.storage.local.get(ALIGNMENT_STORAGE_KEY);
            const alignments = result[ALIGNMENT_STORAGE_KEY] || {};
            alignments[widgetId] = { vertical: vAlign, horizontal: hAlign };
            await chrome.storage.local.set({ [ALIGNMENT_STORAGE_KEY]: alignments });
        } catch (error) {
            console.warn('Failed to save widget alignment:', error);
        }
    }

    async function loadWidgetAlignment(widgetId) {
        try {
            const result = await chrome.storage.local.get(ALIGNMENT_STORAGE_KEY);
            const alignments = result[ALIGNMENT_STORAGE_KEY] || {};
            return alignments[widgetId] || null;
        } catch (error) {
            console.warn('Failed to load widget alignment:', error);
            return null;
        }
    }

    function applyAlignmentToWidget(widgetId, vAlign, hAlign, widgetEl) {
        const iframe = widgetEl.querySelector('.grid-stack-item-content iframe'); // Corrected selector
        if (iframe && iframe.contentWindow && iframe.contentWindow.document) {
            try {
                const body = iframe.contentDocument.body;
                if (body) {
                    body.className = body.className.replace(/\balign-(top|middle|bottom|left|center|right)\b/g, '').trim();
                    body.className = body.className.replace(/\balign-[^-]+-[^-]+\b/g, '').trim();
                    body.classList.add(`align-${vAlign}`);
                    body.classList.add(`align-${hAlign}`);
                } else {
                    console.warn(`Body not found in iframe for widget ${widgetId} during alignment.`);
                    attemptReapply(widgetId, vAlign, hAlign, widgetEl); // Pass widgetEl
                }
            } catch (e) {
                console.warn(`Error accessing iframe body for alignment on widget ${widgetId}:`, e);
                attemptReapply(widgetId, vAlign, hAlign, widgetEl); // Pass widgetEl
            }
        } else {
            console.warn(`Could not access iframe contentDocument for widget ${widgetId}. Attempting reapply.`);
            attemptReapply(widgetId, vAlign, hAlign, widgetEl); // Pass widgetEl
        }

        const controlsContainer = widgetEl.querySelector('.alignment-controls-container');
        if (controlsContainer) {
            const cells = controlsContainer.querySelectorAll('.alignment-cell');
            cells.forEach(cell => {
                cell.classList.remove('selected');
                if (cell.dataset.v === vAlign && cell.dataset.h === hAlign) {
                    cell.classList.add('selected');
                }
            });
        }
    }

    function attemptReapply(widgetId, vAlign, hAlign, widgetEl) { // Added widgetEl parameter
         setTimeout(() => {
            const currentIframe = widgetEl.querySelector('.grid-stack-item-content iframe'); // Corrected selector
            if (currentIframe && currentIframe.contentWindow && currentIframe.contentWindow.document) {
                try {
                    const body = currentIframe.contentDocument.body;
                    body.className = body.className.replace(/\balign-(top|middle|bottom|left|center|right)\b/g, '').trim();
                    body.className = body.className.replace(/\balign-[^-]+-[^-]+\b/g, '').trim();
                    body.classList.add(`align-${vAlign}`);
                    body.classList.add(`align-${hAlign}`);
                } catch (e) {
                    console.warn(`Error accessing iframe body for alignment on widget ${widgetId}:`, e);
                }
            } else {
                console.warn(`Could not access iframe contentDocument for widget ${widgetId} during reapply.`);
            }
        }, 500); // Wait for iframe to potentially load
    }

    function createAlignmentControlsForWidget(widgetEl, widgetId) {
        let controlsContainer = widgetEl.querySelector('.alignment-controls-container');
        if (controlsContainer) {
            controlsContainer.style.display = 'grid'; // Ensure visible
            return; // Already exists
        }

        controlsContainer = document.createElement('div');
        controlsContainer.className = 'alignment-controls-container';

        V_ALIGNS.forEach(v => {
            H_ALIGNS.forEach(h => {
                const cell = document.createElement('div');
                cell.className = 'alignment-cell';
                cell.dataset.v = v;
                cell.dataset.h = h;
                cell.setAttribute('role', 'button');
                cell.setAttribute('tabindex', '0');
                cell.setAttribute('aria-label', `Align ${v} ${h}`);
                cell.onclick = async () => {
                    applyAlignmentToWidget(widgetId, v, h, widgetEl);
                    await saveWidgetAlignment(widgetId, v, h);
                };
                cell.onkeydown = (e) => { // Basic keyboard accessibility
                    if (e.key === 'Enter' || e.key === ' ') {
                        cell.click();
                    }
                };
                controlsContainer.appendChild(cell);
            });
        });
        
        // Prepend to grid-stack-item-content to ensure it's within the flow,
        // or append to widgetEl for absolute positioning relative to the whole item.
        // Appending to widgetEl for absolute positioning is better based on CSS.
        widgetEl.appendChild(controlsContainer);

        // Set initial selected state
        loadWidgetAlignment(widgetId).then(alignment => {
            if (alignment) {
                const selectedCell = controlsContainer.querySelector(`.alignment-cell[data-v="${alignment.vertical}"][data-h="${alignment.horizontal}"]`);
                if (selectedCell) {
                    selectedCell.classList.add('selected');
                }
            }
        });
    }

    function showAlignmentControlsForAllWidgets() {
        const items = grid.el.children;
        for (const item of items) {
            if (item.classList.contains('grid-stack-item')) {
                const widgetId = item.getAttribute('data-widget-id');
                if (widgetId) {
                    createAlignmentControlsForWidget(item, widgetId);
                }
            }
        }
    }

    function hideAlignmentControlsForAllWidgets() {
        const controls = document.querySelectorAll('.grid-stack-item .alignment-controls-container');
        controls.forEach(control => {
            // Instead of removing, just hide. This preserves them if editing is toggled quickly.
            // control.remove();
            control.style.display = 'none'; 
        });
    }

    // Define _setupIndexFrame inside createLayoutManager to give it access to other helpers
    // like loadWidgetAlignment and applyAlignmentToWidget from its lexical scope.
    async function _setupIndexFrame(iframe, widgetId, gridItemElement, fnLoadWidgetAlignment, fnApplyAlignmentToWidget) {
        if (!iframe || !iframe.contentWindow || !iframe.contentWindow.document) {
            console.warn(`Cannot setup frame for ${widgetId}: iframe or its document not accessible.`);
            return;
        }

        // 1. Apply Alignment
        try {
            const alignment = await fnLoadWidgetAlignment(widgetId);
            if (alignment) {
                fnApplyAlignmentToWidget(widgetId, alignment.vertical, alignment.horizontal, gridItemElement);
            }
        } catch (error) {
            console.warn(`Error loading or applying alignment for ${widgetId} in _setupIndexFrame:`, error);
        }

        // 2. Setup Click Listener for event propagation
        try {
            const iframeDocument = iframe.contentDocument; // Already checked above
            if (iframeDocument) {
                iframeDocument.addEventListener('click', (iframeEvent) => {
                    const iframeRect = iframe.getBoundingClientRect();
                    const parentClientX = iframeRect.left + iframeEvent.clientX;
                    const parentClientY = iframeRect.top + iframeEvent.clientY;
                    const parentClickEvent = new MouseEvent('click', {
                        bubbles: true, cancelable: true, clientX: parentClientX, clientY: parentClientY, view: window
                    });
                    document.dispatchEvent(parentClickEvent);
                });
            }
        } catch (error) {
            console.warn(`Error setting up click listener for iframe ${widgetId} in _setupIndexFrame:`, error);
        }
    }

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
