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
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.textContent = item.label;
            menuItem.onclick = () => {
                item.action();
                hide();
            };
            menuElement.appendChild(menuItem);
        });

        menuElement.style.display = 'block';
        menuElement.style.left = `${x}px`;
        menuElement.style.top = `${y}px`;
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