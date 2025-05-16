export function createContextMenu() {
    const contextMenuWrapper = createContextMenuWrapper();
    const menuElement = createMenuElement();
    const anchorElement = createAnchorElement();
    let currentOnHideCallback = null;
    
    // Append anchor and menu to the wrapper, then wrapper to body
    contextMenuWrapper.appendChild(anchorElement);
    contextMenuWrapper.appendChild(menuElement);
    document.body.appendChild(contextMenuWrapper);

    function createContextMenuWrapper() {
        const wrapper = document.createElement('div');
        wrapper.id = 'context-menu';
        // This wrapper div will contain the anchor and all menus/submenus.
        // It does not need specific styles itself for positioning, 
        // as its children will be positioned.
        return wrapper;
    }
    
    function createMenuElement() {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.display = 'none';
        return menu;
    }

    function createAnchorElement() {
        const anchor = document.createElement('div');
        anchor.id = 'context-menu-anchor';
        anchor.style.position = 'fixed';
        anchor.style.width = '1px';
        anchor.style.height = '1px';
        anchor.style.pointerEvents = 'none';
        return anchor;
    }

    function show(x, y, items, onHideCallback) {
        menuElement.innerHTML = '';
        currentOnHideCallback = onHideCallback || null;
        
        // Clear any existing submenus from the wrapper
        const existingSubmenus = contextMenuWrapper.querySelectorAll('.context-submenu');
        existingSubmenus.forEach(submenu => submenu.remove());

        items.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                menuElement.appendChild(separator);
                return;
            }

            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            if (item.className) {
                menuItem.classList.add(item.className);
            }

            // Create and append label element first
            const labelElement = document.createElement('span');
            // It's good practice to add a class for styling, though not explicitly requested
            // labelElement.className = 'context-menu-item-label'; 
            labelElement.textContent = item.label;
            menuItem.appendChild(labelElement);

            if (item.icon) {
                const iconElement = document.createElement('iconify-icon');
                iconElement.setAttribute('icon', item.icon);
                iconElement.setAttribute('noobserver', '');
                menuItem.appendChild(iconElement); // Appends after the labelElement
            }

            if (item.submenu) {
                const uniqueAnchorId = `submenu-anchor-${Math.random().toString(36).substring(2, 9)}`;
                menuItem.style.anchorName = `--${uniqueAnchorId}`;
                menuItem.classList.add('has-submenu');
                
                const submenuElement = createSubMenuElement(item.submenu, uniqueAnchorId);
                contextMenuWrapper.appendChild(submenuElement);

                // Show/hide submenu on hover
                menuItem.addEventListener('mouseenter', () => {
                    submenuElement.style.display = 'block';
                });
                menuItem.addEventListener('mouseleave', (e) => {
                    if (!submenuElement.contains(e.relatedTarget)) {
                        submenuElement.style.display = 'none';
                    }
                });
                submenuElement.addEventListener('mouseleave', (e) => {
                    if (!menuItem.contains(e.relatedTarget)) {
                        submenuElement.style.display = 'none';
                    }
                });

            } else {
                menuItem.onclick = (e) => {
                    e.stopPropagation();
                    item.action();
                    hide();
                };
            }
            
            menuElement.appendChild(menuItem);
        });

        anchorElement.style.left = `${x}px`;
        anchorElement.style.top = `${y}px`;

        menuElement.style.display = 'block';
    }

    function hide() {
        menuElement.style.display = 'none';
        // Also hide all submenus
        const existingSubmenus = contextMenuWrapper.querySelectorAll('.context-submenu');
        existingSubmenus.forEach(submenu => submenu.style.display = 'none');

        if (currentOnHideCallback) {
            currentOnHideCallback();
            currentOnHideCallback = null;
        }
    }

    document.addEventListener('click', (e) => {
        if (!contextMenuWrapper.contains(e.target) && e.target !== anchorElement) {
            hide();
        }
    });

    // Helper function to create a submenu element
    function createSubMenuElement(submenuItems, anchorId) {
        const submenu = document.createElement('div');
        submenu.className = 'context-submenu';
        submenu.style.positionAnchor = `--${anchorId}`;
        submenu.style.display = 'none';

        submenuItems.forEach(subItem => {
            const submenuItemElement = document.createElement('div');
            submenuItemElement.className = 'context-menu-item';
            if (subItem.className) {
                submenuItemElement.classList.add(subItem.className);
            }
            submenuItemElement.textContent = subItem.label;
            submenuItemElement.onclick = (e) => {
                e.stopPropagation();
                subItem.action();
                hide();
            };
            submenu.appendChild(submenuItemElement);
        });
        return submenu;
    }

    return {
        show,
        hide
    };
}