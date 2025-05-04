export function createContextMenu() {
    const menuElement = createMenuElement();
    const anchorElement = createAnchorElement();
    document.body.appendChild(anchorElement);
    document.body.appendChild(menuElement);
    
    function createMenuElement() {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'context-menu';
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

        anchorElement.style.left = `${x}px`;
        anchorElement.style.top = `${y}px`;

        menuElement.style.display = 'block';
    }

    function hide() {
        menuElement.style.display = 'none';
    }

    document.addEventListener('click', (e) => {
        if (!menuElement.contains(e.target) && e.target !== anchorElement) {
            hide();
        }
    });

    return {
        show,
        hide
    };
}