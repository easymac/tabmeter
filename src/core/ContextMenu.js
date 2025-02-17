export function createContextMenu() {
    const menuElement = createMenuElement();
    document.body.appendChild(menuElement);
    
    function createMenuElement() {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.display = 'none';
        return menu;
    }

    function show(x, y, items) {
        menuElement.innerHTML = '';
        
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
            menuItem.textContent = item.label;

            if (item.submenu) {
                menuItem.classList.add('has-submenu');
                const submenu = document.createElement('div');
                submenu.className = 'context-submenu';
                
                item.submenu.forEach(subItem => {
                    const submenuItem = document.createElement('div');
                    submenuItem.className = 'context-menu-item';
                    submenuItem.textContent = subItem.label;
                    submenuItem.onclick = (e) => {
                        e.stopPropagation();
                        subItem.action();
                        hide();
                    };
                    submenu.appendChild(submenuItem);
                });

                menuItem.appendChild(submenu);
            } else {
                menuItem.onclick = () => {
                    item.action();
                    hide();
                };
            }
            
            menuElement.appendChild(menuItem);
        });

        menuElement.style.display = 'block';
        menuElement.style.left = `${x}px`;
        menuElement.style.top = `${y}px`;

        // Ensure menu stays within viewport
        const rect = menuElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (rect.right > viewportWidth) {
            menuElement.style.left = `${viewportWidth - rect.width}px`;
        }
        if (rect.bottom > viewportHeight) {
            menuElement.style.top = `${viewportHeight - rect.height}px`;
        }
    }

    function hide() {
        menuElement.style.display = 'none';
    }

    // Add global click listener to hide menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuElement.contains(e.target)) {
            hide();
        }
    });

    return {
        show,
        hide
    };
}