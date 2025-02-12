import { createContextMenu } from './ContextMenu.js';

export function createLayoutManager(rootElement) {
    const widgetsRoot = rootElement;
    let isDraggable = false;
    let isResizable = false;
    
    // Initialize GridStack
    const grid = GridStack.init({
        column: 12,
        cellHeight: 200,
        margin: 10,
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
        
        // Create and add alignment controls
        const alignmentControls = createAlignmentControls();
        gridItemContent.appendChild(alignmentControls);
        gridItemContent.appendChild(widget.container);
        gridItem.appendChild(gridItemContent);
        
        await restoreWidgetPosition(widget.id, gridItem);
        grid.makeWidget(gridItem);

        return gridItem;
    }

    function createAlignmentControls() {
        // Create alignment controls container
        const alignmentControls = document.createElement('div');
        alignmentControls.className = 'widget-alignment-controls';
        
        // Horizontal alignment controls
        const horizontalControls = document.createElement('div');
        horizontalControls.className = 'alignment-group horizontal';
        
        ['left', 'center', 'right'].forEach(align => {
            const button = document.createElement('button');
            button.className = `align-btn align-h-${align}`;
            button.setAttribute('data-align', align);
            button.innerHTML = `<img src="assets/icons/align-${align}.svg" alt="${align} align">`;
            horizontalControls.appendChild(button);
        });
        
        // Vertical alignment controls
        const verticalControls = document.createElement('div');
        verticalControls.className = 'alignment-group vertical';
        
        [
            ['top', 'align-top'],
            ['middle', 'align-middle'],
            ['bottom', 'align-bottom']
        ].forEach(([align]) => {
            const button = document.createElement('button');
            button.className = `align-btn align-v-${align}`;
            button.setAttribute('data-align', align);
            button.innerHTML = `<img src="assets/icons/align-${align}.svg" alt="${align} align">`;
            verticalControls.appendChild(button);
        });
        
        alignmentControls.appendChild(horizontalControls);
        alignmentControls.appendChild(verticalControls);
        
        // Add event listeners for alignment buttons
        alignmentControls.addEventListener('click', (e) => {
            const button = e.target.closest('.align-btn');
            if (!button) return;
            
            const group = button.closest('.alignment-group');
            group.querySelectorAll('.align-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // TODO: Implement actual alignment logic
        });

        return alignmentControls;
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
        contextMenu.show(x, y, [
            {
                label: `${isDraggable ? 'Disable' : 'Enable'} Editing`,
                action: () => toggleEditing()
            },
            {
                label: 'Widget Settings',
                action: () => openWidgetSettings(widgetId)
            }
        ]);
    }

    function showGlobalContextMenu(x, y) {
        contextMenu.show(x, y, [
            {
                label: `${isDraggable ? 'Disable' : 'Enable'} Editing`,
                action: () => toggleEditing()
            }
        ]);
    }

    function toggleEditing() {
        const enable = !isDraggable;
        toggleDragging(enable);
        toggleResizing(enable);
        widgetsRoot.classList.toggle('editing-enabled', enable);
    }

    function openWidgetSettings(widgetId) {
        console.log(`Opening settings for widget: ${widgetId}`);
    }

    // Set up initial state
    setupContextMenu();

    return {
        addWidget,
        toggleDragging,
        toggleResizing,
        toggleEditing,
        saveGridLayout
    };
}
